// CSV export (pure builder + browser download helper).
import type { AnyLog } from './types';

const BASE_COLS = ['date', 'time', 'type', 'notes'] as const;

function escape(v: unknown): string {
  if (v === undefined || v === null) return '';
  const s = Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds a CSV where type-specific fields become columns (union across all rows). */
export function buildCsv(logs: AnyLog[]): string {
  const dataKeys: string[] = [];
  for (const l of logs) {
    for (const k of Object.keys(l.data ?? {})) if (!dataKeys.includes(k)) dataKeys.push(k);
  }
  const header = [...BASE_COLS, ...dataKeys];
  const rows = logs.map((l) => {
    const d = new Date(l.at);
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const data = l.data as unknown as Record<string, unknown>;
    return [date, time, l.type, l.notes ?? '', ...dataKeys.map((k) => data[k])].map(escape).join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

const pad = (n: number) => String(n).padStart(2, '0');

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
