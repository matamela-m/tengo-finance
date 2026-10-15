import { describe, expect, it } from 'vitest';
import { spendGroup, spendingBreakdown } from './spending';
import { txn } from './testUtils';

describe('spendGroup', () => {
  it('groups by keyword', () => {
    expect(spendGroup('Fuel')).toBe('transport');
    expect(spendGroup('Taxi fare')).toBe('transport');
    expect(spendGroup('Data bundle')).toBe('airtime');
    expect(spendGroup('Prepaid electricity')).toBe('energy');
    expect(spendGroup('Wholesale stock')).toBe('stock');
    expect(spendGroup('Bread and milk')).toBe('food');
    expect(spendGroup('School shoes')).toBe('other');
  });
});

describe('spendingBreakdown', () => {
  it('sums the last 30 days of everyday spend, largest first, ignoring bills and income', () => {
    const today = '2026-10-12';
    const rows = [
      txn('2026-10-10', -300, 'Fuel', 'spend'),
      txn('2026-10-09', -100, 'Groceries', 'spend'),
      txn('2026-10-08', -50, 'Taxi fare', 'spend'),
      txn('2026-10-01', -2800, 'Rent', 'bill'),
      txn('2026-10-05', 900, 'Salon takings', 'income'),
      txn('2026-08-01', -999, 'Fuel', 'spend'),
    ];
    const b = spendingBreakdown(rows, today);
    expect(b.map((s) => s.group)).toEqual(['transport', 'food']);
    expect(b[0]).toMatchObject({ total: 350, count: 2 });
    expect(b[0]!.share + b[1]!.share).toBeCloseTo(1, 6);
  });
});
