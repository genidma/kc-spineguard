// Small date/time helpers.

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local YYYY-MM-DD for a Date or ISO string. */
export function dayKey(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}

/** Value for <input type="datetime-local"> in local time. */
export function toLocalInput(d: Date | string = new Date()): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${dayKey(x)}T${pad2(x.getHours())}:${pad2(x.getMinutes())}`;
}

export function fromLocalInput(v: string): string {
  return new Date(v).toISOString();
}

export function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** True if `now` falls in [start, end), handling windows that cross midnight. */
export function isInWindow(now: Date, start: string, end: string): boolean {
  const n = now.getHours() * 60 + now.getMinutes();
  const s = minutesOfDay(start);
  const e = minutesOfDay(end);
  if (s === e) return false;
  return s < e ? n >= s && n < e : n >= s || n < e;
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
