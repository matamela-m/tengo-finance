import { describe, expect, it } from 'vitest';
import { forecast } from './forecast';
import { canMarkMovable, extraToReach, helpPlan, isProtectedBill } from './help';
import { steadyHistory, txn } from './testUtils';

const today = '2026-10-12';
const history = steadyHistory(today, 90);

describe('helpPlan', () => {
  it('for Short, finds the smallest extra amount that reaches Tight', () => {
    const input = { transactions: history, balance: 300, today };
    const plan = helpPlan(input);
    expect(plan.current).toBe('short');
    expect(plan.target).toBe('tight');
    expect(plan.extraNeeded % 10).toBe(0);
    expect(forecast({ ...input, balance: 300 + plan.extraNeeded }).state).toBe('tight');
    expect(forecast({ ...input, balance: 300 + plan.extraNeeded - 10 }).state).toBe('short');
  });

  it('spreads the gap as a daily cut until the typical next money, rounded up to R5', () => {
    const plan = helpPlan({ transactions: history, balance: 300, today });
    expect(plan.until).toBe('2026-10-16');
    expect(plan.dailyCut).toBe(Math.ceil(plan.extraNeeded / 4 / 5) * 5);
    expect(plan.dailyCut % 5).toBe(0);
  });

  it('for Tight, aims for Enough', () => {
    const plan = helpPlan({ transactions: history, balance: 500, today });
    expect(plan.current).toBe('tight');
    expect(plan.target).toBe('enough');
    expect(plan.extraNeeded).toBeGreaterThan(0);
  });

  // Changed in build 2: a bill is only suggested for moving when the person marked it movable.
  it('suggests moving a bill only when the person marked it movable', () => {
    const withBill = [
      ...history,
      txn('2026-08-14', -400, 'Phone contract', 'bill'),
      txn('2026-09-14', -400, 'Phone contract', 'bill'),
    ];
    const input = { transactions: withBill, balance: 800, today };
    expect(forecast(input).state).not.toBe('enough');
    expect(helpPlan(input).billToMove).toBeNull();
    const plan = helpPlan(input, { movableBills: ['phone contract'] });
    expect(plan.billToMove?.description).toBe('Phone contract');
    expect(plan.suggestions.some((s) => s.kind === 'moveBill')).toBe(true);
  });

  it('never moves credit, insurance, rent or school fees, even when marked movable', () => {
    for (const name of ['Car instalment', 'Personal loan', 'Car insurance', 'Funeral policy', 'Rent', 'School fees', 'Home loan repayment', 'Life assurance premium']) {
      expect(isProtectedBill(name), name).toBe(true);
      expect(canMarkMovable({ description: name }), name).toBe(false);
      const tx = [...history, txn('2026-08-14', -400, name, 'bill'), txn('2026-09-14', -400, name, 'bill')];
      const key = name.toLowerCase();
      const plan = helpPlan({ transactions: tx, balance: 800, today }, { movableBills: [key] });
      expect(plan.billToMove, name).toBeNull();
      expect(plan.suggestions.every((s) => s.kind !== 'moveBill'), name).toBe(true);
    }
    expect(isProtectedBill('Phone contract')).toBe(false);
  });

  it('only trims spending the person marked flexible, and never stock or transport', () => {
    const tx = [
      ...history,
      ...Array.from({ length: 30 }, (_, k) => txn(`2026-09-${String(13 + (k % 17)).padStart(2, '0')}`, -60, k % 2 ? 'Wholesale stock' : 'Fuel', 'spend')),
    ];
    const input = { transactions: tx, balance: 300, today };
    const none = helpPlan(input);
    expect(none.needsFlexible).toBe(true);
    expect(none.suggestions.map((s) => s.kind)).toEqual(['earn']);
    const work = helpPlan(input, { flexibleGroups: ['stock', 'transport'] });
    expect(work.suggestions.map((s) => s.kind)).toEqual(['earn']);
    const food = helpPlan(input, { flexibleGroups: ['food'] });
    const trim = food.suggestions.find((s) => s.kind === 'trim');
    expect(trim).toBeDefined();
    if (trim?.kind === 'trim') expect(trim.groups).toEqual(['food']);
  });

  it('caps a trim at what the flexible groups usually cost', () => {
    const input = { transactions: history, balance: 100, today };
    const plan = helpPlan(input, { flexibleGroups: ['food'] });
    const trim = plan.suggestions.find((s) => s.kind === 'trim');
    if (trim?.kind === 'trim') {
      // Groceries average R100 a day in the last 30 days.
      expect(trim.perDay).toBeLessThanOrEqual(100);
      expect(trim.covers).toBe(trim.perDay >= plan.dailyCut);
    }
  });

  it('never suggests anything when there is not enough to tell', () => {
    const plan = helpPlan({ transactions: steadyHistory(today, 5), balance: 100, today });
    expect(plan.target).toBeNull();
    expect(plan.suggestions).toEqual([]);
  });

  it('for Enough, says how much could be set aside', () => {
    const plan = helpPlan({ transactions: history, balance: 1200, today });
    expect(plan.current).toBe('enough');
    expect(plan.target).toBeNull();
    expect(plan.canSetAside).toBeGreaterThan(0);
  });

  it('extraToReach is zero when already there', () => {
    expect(extraToReach({ transactions: history, balance: 1200, today }, 'enough')).toBe(0);
  });
});
