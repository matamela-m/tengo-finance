import { describe, expect, it } from 'vitest';
import { forecast } from './forecast';
import { extraToReach, helpPlan } from './help';
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

  it('suggests moving a bill when that alone is enough', () => {
    const withBill = [
      ...history,
      txn('2026-08-14', -400, 'Phone contract', 'bill'),
      txn('2026-09-14', -400, 'Phone contract', 'bill'),
    ];
    const input = { transactions: withBill, balance: 800, today };
    expect(forecast(input).state).not.toBe('enough');
    const plan = helpPlan(input);
    expect(plan.billToMove?.description).toBe('Phone contract');
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
