import { describe, expect, it } from 'vitest';
import { monthsBefore, retention, retentionCutoff } from './retention';

describe('retention', () => {
  it('counts back whole months and clamps short months', () => {
    expect(monthsBefore('2026-10-12', 12)).toBe('2025-10-12');
    expect(monthsBefore('2026-03-31', 1)).toBe('2026-02-28');
    expect(monthsBefore('2026-01-15', 2)).toBe('2025-11-15');
    expect(retentionCutoff('2026-10-20')).toBe('2025-10-20');
  });

  it('reports the next removal 12 months after the oldest record', () => {
    expect(retention([])).toEqual({ oldest: null, next: null });
    const r = retention([{ id: 'a', date: '2026-02-03', description: 'x', amount: -1, category: 'spend' }]);
    expect(r).toEqual({ oldest: '2026-02-03', next: '2027-02-03' });
  });
});
