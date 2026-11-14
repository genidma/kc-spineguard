// Pure medication-safety helpers (unit tested in meds.test.ts).
import type { AnyLog, Medication } from './types';

export interface DoseCheck {
  takenLast24h: number;
  remaining: number | null; // null when no max set
  wouldExceedMax: boolean;
  lastDoseAt: string | null;
  hoursSinceLast: number | null;
  tooSoon: boolean;
  nextAllowedAt: string | null;
  warnings: string[];
}

/**
 * Checks a proposed dose against the user's own limits for that medication,
 * using a rolling 24h window ending at `atIso`.
 */
export function checkDose(med: Medication, dose: number, atIso: string, logs: AnyLog[], excludeLogId?: string): DoseCheck {
  const at = new Date(atIso).getTime();
  const dayAgo = at - 24 * 3600 * 1000;

  const doses = logs
    .filter((l) => l.type === 'med' && l.data.medicationId === med.id && l.id !== excludeLogId)
    .map((l) => ({ t: new Date(l.at).getTime(), dose: (l.data as { dose: number }).dose || 0 }))
    .filter((d) => d.t <= at);

  const takenLast24h = doses.filter((d) => d.t > dayAgo).reduce((s, d) => s + d.dose, 0);
  const last = doses.reduce<number | null>((m, d) => (m === null || d.t > m ? d.t : m), null);

  const max = med.maxDailyDose ?? null;
  const remaining = max != null ? Math.max(0, max - takenLast24h) : null;
  const wouldExceedMax = max != null && takenLast24h + dose > max + 1e-9;

  const hoursSinceLast = last != null ? (at - last) / 3600000 : null;
  const minH = med.minHoursBetween ?? null;
  const tooSoon = minH != null && hoursSinceLast != null && hoursSinceLast < minH;
  const nextAllowedAt = minH != null && last != null ? new Date(last + minH * 3600000).toISOString() : null;

  const warnings: string[] = [];
  if (wouldExceedMax) {
    warnings.push(
      `This dose would bring you to ${round(takenLast24h + dose)} ${med.unit} in 24h, above your max of ${max} ${med.unit}.`,
    );
  }
  if (tooSoon) {
    warnings.push(
      `Only ${round(hoursSinceLast!)}h since your last dose; your minimum gap is ${minH}h (next at ${new Date(nextAllowedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
    );
  }

  return {
    takenLast24h,
    remaining,
    wouldExceedMax,
    lastDoseAt: last != null ? new Date(last).toISOString() : null,
    hoursSinceLast,
    tooSoon,
    nextAllowedAt,
    warnings,
  };
}

const round = (n: number) => Math.round(n * 10) / 10;
