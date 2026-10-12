import { describe, expect, it } from 'vitest';
import { classifyRows, descriptionKey, recurringBills } from './classify';

describe('descriptionKey', () => {
  it('ignores case, digits and punctuation', () => {
    expect(descriptionKey('VODACOM 0821234567')).toBe('vodacom');
    expect(descriptionKey('Rent - Unit 4B')).toBe('rent unit b');
  });
});

describe('classifyRows', () => {
  it('marks money in as income', () => {
    expect(classifyRows([{ date: '2026-10-01', description: 'Salary', amount: 500 }])).toEqual(['income']);
  });

  it('marks a monthly repeat of the same description and similar amount as a bill', () => {
    const rows = [
      { date: '2026-07-01', description: 'Rent', amount: -2800 },
      { date: '2026-08-01', description: 'RENT', amount: -2800 },
      { date: '2026-09-01', description: 'Rent', amount: -2900 },
      { date: '2026-09-02', description: 'Bread', amount: -20 },
    ];
    expect(classifyRows(rows)).toEqual(['bill', 'bill', 'bill', 'spend']);
  });

  it('does not mark frequent purchases as bills', () => {
    const rows = [
      { date: '2026-09-01', description: 'Fuel', amount: -300 },
      { date: '2026-09-04', description: 'Fuel', amount: -310 },
      { date: '2026-09-07', description: 'Fuel', amount: -290 },
    ];
    expect(classifyRows(rows)).toEqual(['spend', 'spend', 'spend']);
  });

  it('does not mark monthly payments with very different amounts as bills', () => {
    const rows = [
      { date: '2026-08-01', description: 'Stock', amount: -1000 },
      { date: '2026-09-01', description: 'Stock', amount: -3000 },
    ];
    expect(classifyRows(rows)).toEqual(['spend', 'spend']);
  });
});

describe('recurringBills', () => {
  it('works out the next due date after today', () => {
    const bills = recurringBills(
      [
        { id: '1', date: '2026-08-25', description: 'Car instalment', amount: -3450, category: 'bill' },
        { id: '2', date: '2026-09-25', description: 'Car instalment', amount: -3450, category: 'bill' },
      ],
      '2026-10-12',
    );
    expect(bills).toHaveLength(1);
    expect(bills[0]).toMatchObject({ amount: 3450, dayOfMonth: 25, nextDate: '2026-10-25', occurrences: 2 });
  });

  it('clamps the due day to short months', () => {
    const bills = recurringBills(
      [
        { id: '1', date: '2026-12-31', description: 'Insurance', amount: -500, category: 'bill' },
        { id: '2', date: '2027-01-31', description: 'Insurance', amount: -500, category: 'bill' },
      ],
      '2027-02-02',
    );
    expect(bills[0]?.nextDate).toBe('2027-02-28');
  });
});
