import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnyLog, Medication, Settings, Stretch } from '../lib/types';
import { DEFAULT_SETTINGS } from '../lib/types';
import {
  subscribeCustomStretches,
  subscribeLogs,
  subscribeMedications,
  subscribeSettings,
  updateSettings,
} from '../lib/db';
import { BUILT_IN_STRETCHES } from '../lib/stretches';
import { daysAgoIso, isInWindow } from '../lib/time';
import { dueReminders, loadFired, prefs, saveFired, sendNotification } from '../lib/reminders';

interface AppData {
  uid: string;
  settings: Settings;
  saveSettings: (patch: Partial<Settings>) => void;
  logs: AnyLog[];
  /** How many days of history the live listener currently covers. */
  rangeDays: number;
  ensureRange: (days: number) => void;
  meds: Medication[];
  stretches: Stretch[];
  customStretches: Stretch[];
  effectiveTheme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Ctx = createContext<AppData | null>(null);
const THEME_CACHE = 'kc-spineguard-theme';

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_CACHE, theme);
}
export function cachedTheme(): 'light' | 'dark' {
  return localStorage.getItem(THEME_CACHE) === 'dark' ? 'dark' : 'light';
}

export function AppDataProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<AnyLog[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [customStretches, setCustomStretches] = useState<Stretch[]>([]);
  // Default to 30 days to keep reads low; Trends can widen to 90.
  const [rangeDays, setRangeDays] = useState(30);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => subscribeSettings(uid, setSettings), [uid]);
  useEffect(() => subscribeMedications(uid, setMeds), [uid]);
  useEffect(() => subscribeCustomStretches(uid, setCustomStretches), [uid]);
  useEffect(() => subscribeLogs(uid, daysAgoIso(rangeDays), setLogs), [uid, rangeDays]);

  // Minute tick drives theme schedule + reminders.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const effectiveTheme: 'light' | 'dark' = settings.themeSchedule
    ? isInWindow(now, settings.quietStart, settings.quietEnd)
      ? 'dark'
      : 'light'
    : settings.theme;

  useEffect(() => applyTheme(effectiveTheme), [effectiveTheme]);

  // ---- Reminders ----
  const firedRef = useRef<Set<string>>(loadFired());
  const lastPostureNudge = useRef<number>(Date.now());
  useEffect(() => {
    if (!prefs.alerts) return;
    const lastPostureLog = logs.find((l) => l.type === 'posture');
    const lastPosture = Math.max(lastPostureLog ? new Date(lastPostureLog.at).getTime() : 0, lastPostureNudge.current);
    const due = dueReminders(now, settings, meds, firedRef.current, lastPosture);
    for (const r of due) {
      if (r.key.startsWith('posture|')) lastPostureNudge.current = now.getTime();
      else firedRef.current.add(r.key);
      void sendNotification(r.title, r.body);
    }
    if (due.length) saveFired(firedRef.current);
  }, [now, settings, meds, logs]);

  const value = useMemo<AppData>(
    () => ({
      uid,
      settings,
      saveSettings: (patch) => {
        setSettings((s) => ({ ...s, ...patch }));
        void updateSettings(uid, patch);
      },
      logs,
      rangeDays,
      ensureRange: (d) => setRangeDays((r) => Math.max(r, d)),
      meds,
      customStretches,
      stretches: [...BUILT_IN_STRETCHES, ...customStretches],
      effectiveTheme,
      toggleTheme: () => {
        const next = effectiveTheme === 'dark' ? 'light' : 'dark';
        setSettings((s) => ({ ...s, theme: next, themeSchedule: false }));
        void updateSettings(uid, { theme: next, themeSchedule: false });
      },
    }),
    [uid, settings, logs, rangeDays, meds, customStretches, effectiveTheme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAppData must be used within AppDataProvider');
  return c;
}
