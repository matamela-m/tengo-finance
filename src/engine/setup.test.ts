import { describe, expect, it } from 'vitest';
import { forecast } from './forecast';
import { estimatedHistory, mergeEstimated, type SetupAnswers } from './setup';
import type { Obligation } from './types';
import { homeView } from './view';

const today = '2026-10-20';
const base: SetupAnswers = { arrives: 'weekly', amount: 2000, weekday: 5, dailySpend: 180, bills: [{ name: 'Rent', amount: 1500, dayOfMonth: 1 }] };

describe('manual setup', () => {
  it('builds a labelled, estimated history that gives a low-confidence forecast', () => {
    const tx = estimatedHistory(base, today);
    expect(tx.every((t) => t.estimated)).toBe(true);
    expect(tx.some((t) => /estimated from your answers/.test(t.description))).toBe(true);
    const f = forecast({ transactions: tx, balance: 1500, today });
    expect(f.status).not.toBe('unclear');
    expect(f.confidence).toBe('low');
    expect(f.nextMoney?.typical).toBe('2026-10-23');
    expect(f.recurringBills.map((b) => b.description)).toContain('Rent');
  });

  it('works for every way money arrives', () => {
    for (const arrives of ['daily', 'weekly', 'monthly', 'irregular'] as const) {
      const tx = estimatedHistory({ ...base, arrives, amount: arrives === 'daily' ? 300 : 3000, dayOfMonth: 25, everyDays: 9 }, today);
      const f = forecast({ transactions: tx, balance: 2000, today });
      expect(f.status, arrives).not.toBe('unclear');
      expect(['regular', 'pendingToday', 'daily'], arrives).toContain(f.income.status);
      expect(f.confidence, arrives).toBe('low');
      expect(homeView(f).status, arrives).toBe(f.status);
    }
  });

  it('daily earners get a daily rhythm, not Short from tomorrow', () => {
    const tx = estimatedHistory({ ...base, arrives: 'daily', amount: 250, dailySpend: 200 }, today);
    const f = forecast({ transactions: tx, balance: 1500, today });
    expect(f.income.status).toBe('daily');
    expect(f.nextMoney).toBeNull();
    expect(homeView(f).dailyIncome).toBe(true);
  });

  it('drops estimated entries once real ones arrive', () => {
    const tx = estimatedHistory(base, today);
    const real = { id: 'r1', date: '2026-10-10', description: 'Groceries', amount: -90, category: 'spend' as const };
    const merged = mergeEstimated([...tx, real]);
    expect(merged.some((t) => t.estimated && t.date >= '2026-10-10')).toBe(false);
    expect(merged.some((t) => t.estimated && t.date < '2026-10-10')).toBe(true);
    expect(merged).toContain(real);
    expect(mergeEstimated(tx)).toBe(tx);
  });
});

describe('informal obligations', () => {
  const stokvel: Obligation = { id: 's1', kind: 'stokvel', name: 'Stokvel', amount: 400, every: 'month', nextDate: '2026-10-22', movable: false };

  it('behave like bills: they shorten the runway and count before next money', () => {
    const tx = estimatedHistory({ ...base, bills: [] }, today);
    const without = forecast({ transactions: tx, balance: 1500, today });
    const f = forecast({ transactions: tx, balance: 1500, today, obligations: [stokvel] });
    expect(f.billsBeforeNextMoney).toContainEqual({ description: 'Stokvel', date: '2026-10-22', amount: 400, key: 'ob:s1' });
    expect(f.runwayDays).toBeLessThanOrEqual(without.runwayDays);
  });

  it('repeat weekly or monthly and catch up a past date', () => {
    const weekly: Obligation = { ...stokvel, every: 'week', nextDate: '2026-10-01' };
    const f = forecast({ transactions: estimatedHistory(base, today), balance: 9000, today, obligations: [weekly] });
    const dates = f.upcomingBills.filter((b) => b.key === 'ob:s1').map((b) => b.date);
    expect(dates.slice(0, 3)).toEqual(['2026-10-22', '2026-10-29', '2026-11-05']);
  });
});
