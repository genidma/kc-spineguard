import { describe, expect, it } from 'vitest';
import { dueReminders } from './reminders';
import { DEFAULT_SETTINGS, type Medication } from './types';

describe('dueReminders', () => {
  const med: Medication = {
    id: 'm1',
    name: 'Gabapentin',
    kind: 'Gabapentinoid',
    unit: 'mg',
    typicalDose: 300,
    scheduleTimes: ['09:00'],
    active: true,
  };

  it('triggers med & stretch reminders in their 5-minute window and skips quiet hours', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      quietStart: '22:00',
      quietEnd: '07:00',
      reminders: { meds: true, stretchTimes: ['09:00'], postureIntervalMin: 0 },
    };

    const due = dueReminders(new Date('2026-11-13T09:02:00'), settings, [med], new Set(), null);
    expect(due.map((d) => d.title)).toEqual(['💊 Time for Gabapentin', '🧘 Stretch break']);

    // Already fired today
    const fired = new Set(due.map((d) => d.key));
    expect(dueReminders(new Date('2026-11-13T09:03:00'), settings, [med], fired, null)).toHaveLength(0);

    // Quiet hours (midnight crossover) mutes reminders
    const quietSettings = {
      ...settings,
      reminders: { meds: true, stretchTimes: ['23:00'], postureIntervalMin: 30 },
    };
    expect(dueReminders(new Date('2026-11-13T23:01:00'), quietSettings, [med], new Set(), null)).toHaveLength(0);
  });
});
