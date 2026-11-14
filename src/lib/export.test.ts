import { describe, expect, it } from 'vitest';
import { buildCsv } from './export';
import type { AnyLog } from './types';

describe('buildCsv', () => {
  it('flattens log types and escapes commas/quotes', () => {
    const logs: AnyLog[] = [
      {
        id: '1',
        type: 'pain',
        at: '2026-11-13T10:30:00Z',
        data: { intensity: 7, painType: 'flare', locations: ['lowerBack:left', 'calf:left'], qualities: ['shooting'] },
        notes: 'After "long" walk, stairs',
      },
      {
        id: '2',
        type: 'stretch',
        at: '2026-11-13T11:00:00Z',
        data: { stretchId: 'piriformis', stretchName: 'Supine piriformis stretch', durationSec: 180 },
      },
    ];
    const csv = buildCsv(logs);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('date,time,type,notes,intensity');
    expect(lines[0]).toContain('stretchName');
    expect(lines[1]).toContain('"After ""long"" walk, stairs"');
    expect(lines[1]).toContain('lowerBack:left; calf:left');
    expect(lines[2]).toContain('Supine piriformis stretch');
  });
});
