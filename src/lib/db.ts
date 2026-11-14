// Firestore data layer for kc-spineguard.
// All user data lives under users/{uid}/... so rules stay simple and reads stay cheap.
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  startAfter,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/index';
import type { AnyLog, LogEntry, LogType, LogDataMap, Medication, Settings, Stretch } from './types';
import { DEFAULT_SETTINGS } from './types';

export const newId = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, '');

const nowIso = () => new Date().toISOString();

/** Firestore rejects `undefined`; strip it recursively. */
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = clean(v);
    }
    return out as T;
  }
  return value;
}

const logsCol = (uid: string) => collection(db, 'users', uid, 'logs');
const medsCol = (uid: string) => collection(db, 'users', uid, 'medications');
const stretchesCol = (uid: string) => collection(db, 'users', uid, 'stretches');

// ---------- Sync status (pending local writes) ----------
export type SyncState = 'idle' | 'syncing';
const syncListeners = new Set<(s: SyncState) => void>();
let syncState: SyncState = 'idle';
function setSync(s: SyncState) {
  if (s === syncState) return;
  syncState = s;
  syncListeners.forEach((l) => l(s));
}
export function subscribeToSyncStatus(cb: (s: SyncState) => void) {
  syncListeners.add(cb);
  cb(syncState);
  return () => {
    syncListeners.delete(cb);
  };
}

// ---------- Logs ----------
/**
 * Live subscription to logs since `sinceIso` (newest first).
 * One listener powers Today, History and Trends, so we pay for each doc read once
 * and then only for changes.
 */
export function subscribeLogs(uid: string, sinceIso: string, cb: (logs: AnyLog[]) => void) {
  const q = query(logsCol(uid), where('at', '>=', sinceIso), orderBy('at', 'desc'));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      setSync(snap.metadata.hasPendingWrites ? 'syncing' : 'idle');
      cb(snap.docs.map((d) => d.data() as AnyLog));
    },
    (err) => console.error('[db] logs subscription failed', err),
  );
}

export async function saveLog<T extends LogType>(
  uid: string,
  entry: { id?: string; type: T; at: string; data: LogDataMap[T]; notes?: string; createdAt?: string },
): Promise<LogEntry<T>> {
  const id = entry.id ?? newId();
  const full: LogEntry<T> = clean({
    ...entry,
    id,
    notes: entry.notes?.trim() ? entry.notes.trim() : undefined,
    createdAt: entry.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  });
  // Don't await the server round-trip: offline writes resolve when synced.
  setSync('syncing');
  setDoc(doc(logsCol(uid), id), full).catch((e) => console.error('[db] saveLog failed', e));
  return full;
}

export async function deleteLog(uid: string, id: string) {
  setSync('syncing');
  deleteDoc(doc(logsCol(uid), id)).catch((e) => console.error('[db] deleteLog failed', e));
}

/** Paged fetch of all logs (used by export so we don't hold everything in memory/listeners). */
export async function fetchAllLogs(uid: string, opts: { type?: LogType; fromIso?: string; toIso?: string } = {}) {
  const out: AnyLog[] = [];
  let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
  const PAGE = 500;
  for (;;) {
    const parts: QueryConstraint[] = [
      ...(opts.fromIso ? [where('at', '>=', opts.fromIso)] : []),
      ...(opts.toIso ? [where('at', '<=', opts.toIso)] : []),
      orderBy('at', 'asc'),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(PAGE),
    ];
    const snap: QuerySnapshot<DocumentData> = await getDocs(query(logsCol(uid), ...parts));
    snap.docs.forEach((d) => {
      const l = d.data() as AnyLog;
      if (!opts.type || l.type === opts.type) out.push(l);
    });
    if (snap.docs.length < PAGE) break;
    cursor = snap.docs[snap.docs.length - 1];
  }
  return out;
}

// ---------- Medications ----------
export function subscribeMedications(uid: string, cb: (meds: Medication[]) => void) {
  return onSnapshot(
    query(medsCol(uid), orderBy('name')),
    (snap) => cb(snap.docs.map((d) => d.data() as Medication)),
    (err) => console.error('[db] meds subscription failed', err),
  );
}

export async function saveMedication(uid: string, med: Omit<Medication, 'id'> & { id?: string }) {
  const id = med.id ?? newId();
  const full: Medication = clean({ ...med, id, createdAt: med.createdAt ?? nowIso(), updatedAt: nowIso() });
  setDoc(doc(medsCol(uid), id), full).catch((e) => console.error('[db] saveMedication failed', e));
  return full;
}

export async function deleteMedication(uid: string, id: string) {
  deleteDoc(doc(medsCol(uid), id)).catch((e) => console.error('[db] deleteMedication failed', e));
}

// ---------- Custom stretches ----------
export function subscribeCustomStretches(uid: string, cb: (s: Stretch[]) => void) {
  return onSnapshot(
    query(stretchesCol(uid), orderBy('name')),
    (snap) => cb(snap.docs.map((d) => d.data() as Stretch)),
    (err) => console.error('[db] stretches subscription failed', err),
  );
}

export async function saveCustomStretch(uid: string, s: Omit<Stretch, 'id' | 'builtIn'> & { id?: string }) {
  const id = s.id ?? newId();
  const full = clean({ ...s, id, updatedAt: nowIso() });
  setDoc(doc(stretchesCol(uid), id), full).catch((e) => console.error('[db] saveCustomStretch failed', e));
  return full as Stretch;
}

export async function deleteCustomStretch(uid: string, id: string) {
  deleteDoc(doc(stretchesCol(uid), id)).catch((e) => console.error('[db] deleteCustomStretch failed', e));
}

// ---------- Settings ----------
export function mergeSettings(raw: Partial<Settings> | undefined): Settings {
  const r = raw ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...r,
    goals: { ...DEFAULT_SETTINGS.goals, ...(r.goals ?? {}) },
    medical: { ...DEFAULT_SETTINGS.medical, ...(r.medical ?? {}) },
    reminders: { ...DEFAULT_SETTINGS.reminders, ...(r.reminders ?? {}) },
  };
}

export function subscribeSettings(uid: string, cb: (s: Settings) => void) {
  return onSnapshot(
    doc(db, 'settings', uid),
    (snap) => cb(mergeSettings(snap.exists() ? (snap.data() as Partial<Settings>) : undefined)),
    (err) => console.error('[db] settings subscription failed', err),
  );
}

export async function updateSettings(uid: string, patch: Partial<Settings>) {
  setDoc(doc(db, 'settings', uid), clean(patch), { merge: true }).catch((e) =>
    console.error('[db] updateSettings failed', e),
  );
}

// ---------- Security log (read on demand, paged) ----------
export async function fetchSecurityLog(uid: string, after?: QueryDocumentSnapshot<DocumentData> | null) {
  const col = collection(db, 'users', uid, 'security_log');
  const q = after
    ? query(col, orderBy('timestamp', 'desc'), startAfter(after), limit(20))
    : query(col, orderBy('timestamp', 'desc'), limit(20));
  return getDocs(q);
}
