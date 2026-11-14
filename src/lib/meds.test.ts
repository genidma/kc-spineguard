import { describe, expect, it } from 'vitest';
import { checkDose } from './meds';
import type { AnyLog, Medication } from './types';

const ibuprofen: Medication = {
  id: 'med1',
  name: 'Ibuprofen',
  kind: 'NSAID',
  unit: 'mg',
  typicalDose: 400,
  maxDailyDose: 1200,
  minHoursBetween: 6,
  active: true,
};

const medLog = (id: string, at: string, dose: number): AnyLog => ({
  id,
  type: 'med',
  at,
  data: { medicationId: 'med1', medicationName: 'Ibuprofen', kind: 'NSAID', dose, unit: 'mg' },
});

describe('checkDose', () => {
  it('allows a dose within daily max and min gap', () => {
    const logs = [medLog('1', '2026-11-13T08:00:00Z', 400)];
    const res = checkDose(ibuprofen, 400, '2026-11-13T15:00:00Z', logs);
    expect(res.wouldExceedMax).toBe(false);
    expect(res.tooSoon).toBe(false);
    expect(res.takenLast24h).toBe(400);
    expect(res.remaining).toBe(800);
    expect(res.warnings).toHaveLength(0);
  });

  it('warns when rolling 24h max would be exceeded', () => {
    const logs = [
      medLog('1', '2026-11-13T00:00:00Z', 600),
      medLog('2', '2026-11-13T08:00:00Z', 400),
    ];
    const res = checkDose(ibuprofen, 400, '2026-11-13T15:00:00Z', logs);
    expect(res.wouldExceedMax).toBe(true);
    expect(res.tooSoon).toBe(false);
    expect(res.warnings[0]).toContain('above your max of 1200 mg');
  });

  it('warns when dose is too soon after previous dose', () => {
    const logs = [medLog('1', '2026-11-13T12:00:00Z', 400)];
    const res = checkDose(ibuprofen, 400, '2026-11-13T15:00:00Z', logs);
    expect(res.tooSoon).toBe(true);
    expect(res.wouldExceedMax).toBe(false);
    expect(res.warnings[0]).toContain('minimum gap is 6h');
  });

  it('excludes the log being edited', () => {
    const logs = [medLog('1', '2026-11-13T12:00:00Z', 800)];
    const res = checkDose(ibuprofen, 600, '2026-11-13T12:00:00Z', logs, '1');
    expect(res.takenLast24h).toBe(0);
    expect(res.wouldExceedMax).toBe(false);
  });
});
