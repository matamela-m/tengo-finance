import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { confidenceFor, estimateSpendRates, forecast, loanCheck, safeToLend, whatIf } from './forecast';
import { steadyHistory, txn } from './testUtils';

// Monday. Pay lands on Fridays, so typical next money is Fri 16 Oct and the latest is Sat 17 Oct.
const today = '2026-10-12';
const history = steadyHistory(today, 90);

describe('spend rates', () => {
  it('uses the median and the 20th and 80th percentiles of rolling 7 day spend', () => {
    const r = estimateSpendRates(history, today, 60, 'high');
    expect(r.central).toBeCloseTo(107.14, 1);
    expect(r.pessimistic).toBeCloseTo(135.71, 1);
    expect(r.optimistic).toBeCloseTo(78.57, 1);
  });

  it('widens the spread by 1.5 when confidence is low', () => {
    const normal = estimateSpendRates(history, today, 60, 'medium');
    const low = estimateSpendRates(history, today, 60, 'low');
    expect(low.central).toBeCloseTo(normal.central, 6);
    expect(low.pessimistic - low.central).toBeCloseTo((normal.pessimistic - normal.central) * 1.5, 6);
    expect(low.central - low.optimistic).toBeCloseTo((normal.central - normal.optimistic) * 1.5, 6);
  });
});

describe('next money', () => {
  it('finds a weekday pattern and a date range after today', () => {
    const f = forecast({ transactions: history, balance: 500, today });
    expect(f.nextMoney?.pattern).toBe('weekday');
    expect(f.nextMoney?.typical).toBe('2026-10-16');
    expect(f.nextMoney?.latest).toBe('2026-10-17');
    expect(f.nextMoney?.amountTypical).toBe(3000);
  });

  it('finds an interval pattern for lumpy deposits', () => {
    const lumpy = [
      ...steadyHistory(today, 60, { pay: 0 }).filter((t) => t.amount < 0),
      txn('2026-08-20', 5000, 'Cash deposit', 'income'),
      txn('2026-08-27', 5200, 'Cash deposit', 'income'),
      txn('2026-09-05', 4800, 'Cash deposit', 'income'),
      txn('2026-09-12', 5100, 'Cash deposit', 'income'),
      txn('2026-09-20', 5000, 'Cash deposit', 'income'),
      txn('2026-09-28', 4900, 'Cash deposit', 'income'),
      txn('2026-10-06', 5300, 'Cash deposit', 'income'),
    ];
    const f = forecast({ transactions: lumpy, balance: 2000, today });
    expect(f.nextMoney?.pattern).toBe('interval');
    expect(f.nextMoney!.earliest <= f.nextMoney!.typical).toBe(true);
    expect(f.nextMoney!.typical <= f.nextMoney!.latest).toBe(true);
    expect(f.nextMoney!.typical).toBe(addDays('2026-10-06', 8));
  });

  it('falls back to a 30 day plan when there is no income', () => {
    const f = forecast({ transactions: history.filter((t) => t.amount < 0), balance: 5000, today });
    expect(f.nextMoney?.pattern).toBe('unknown');
    expect(f.nextMoney?.typical).toBe(addDays(today, 30));
  });
});

describe('cover state', () => {
  it('is Enough when the pessimistic runway reaches the latest next money', () => {
    const f = forecast({ transactions: history, balance: 700, today });
    expect(f.runway.pessimistic! >= '2026-10-17').toBe(true);
    expect(f.state).toBe('enough');
  });

  it('is Tight when only the central runway reaches the typical next money', () => {
    const f = forecast({ transactions: history, balance: 500, today });
    expect(f.runway.central).toBe('2026-10-16');
    expect(f.runway.pessimistic).toBe('2026-10-15');
    expect(f.state).toBe('tight');
  });

  it('is Short when the central runway ends before the typical next money, with the gap in days', () => {
    const f = forecast({ transactions: history, balance: 300, today });
    expect(f.state).toBe('short');
    expect(f.headlineDate).toBe('2026-10-14');
    expect(f.gapDays).toBe(2);
  });

  it('is Short from today with no money left', () => {
    const f = forecast({ transactions: history, balance: 0, today });
    expect(f.state).toBe('short');
    expect(f.headlineDate).toBe(today);
    expect(f.safeToSpendToday).toBe(0);
  });

  it('band runs from the pessimistic to the optimistic zero date', () => {
    const f = forecast({ transactions: history, balance: 500, today });
    expect(f.band.from).toBe(f.runway.pessimistic);
    expect(f.band.to).toBe(f.runway.optimistic);
    expect(f.band.from <= f.headlineDate && f.headlineDate <= f.band.to).toBe(true);
  });
});

describe('thin data', () => {
  it('sets confidence by history length', () => {
    expect(confidenceFor(90)).toBe('high');
    expect(confidenceFor(60)).toBe('high');
    expect(confidenceFor(59)).toBe('medium');
    expect(confidenceFor(28)).toBe('medium');
    expect(confidenceFor(27)).toBe('low');
  });

  it('marks 20 days of history as low confidence and widens the band', () => {
    const thin = steadyHistory(today, 20);
    const f = forecast({ transactions: thin, balance: 1500, today });
    expect(f.confidence).toBe('low');
    expect(f.historyDays).toBe(20);
    expect(f.windowDays).toBe(20);
    const normal = estimateSpendRates(thin, today, 20, 'medium');
    expect(f.rates.pessimistic - f.rates.central).toBeCloseTo((normal.pessimistic - normal.central) * 1.5, 6);
  });

  it('copes with no history at all', () => {
    const f = forecast({ transactions: [], balance: 1000, today });
    expect(f.historyDays).toBe(0);
    expect(f.rates.central).toBe(0);
    expect(f.beyondHorizon).toBe(true);
    expect(f.state).toBe('enough');
  });
});

describe('bills', () => {
  const withBill = [
    ...history,
    txn('2026-07-14', -400, 'Phone contract', 'bill'),
    txn('2026-08-14', -400, 'Phone contract', 'bill'),
    txn('2026-09-14', -400, 'Phone contract', 'bill'),
  ];

  it('projects a bill landing inside the window and shortens the runway', () => {
    const base = forecast({ transactions: history, balance: 1200, today });
    const f = forecast({ transactions: withBill, balance: 1200, today });
    expect(f.recurringBills[0]?.nextDate).toBe('2026-10-14');
    expect(f.billsBeforeNextMoney).toEqual([{ description: 'Phone contract', date: '2026-10-14', amount: 400 }]);
    expect(f.billsTotalBeforeNextMoney).toBe(400);
    expect(f.runwayDays).toBeLessThan(base.runwayDays);
  });

  it('takes bills off safe to spend', () => {
    const f = forecast({ transactions: withBill, balance: 1200, today });
    // (1200 - 400) / 5 days = 160
    expect(f.safeToSpendToday).toBe(160);
  });

  it('does not count bills that land after the latest next money', () => {
    const late = [
      ...history,
      txn('2026-08-25', -900, 'Rent', 'bill'),
      txn('2026-09-25', -900, 'Rent', 'bill'),
    ];
    const f = forecast({ transactions: late, balance: 1200, today });
    expect(f.billsBeforeNextMoney).toHaveLength(0);
    expect(f.upcomingBills.some((b) => b.date === '2026-10-25')).toBe(true);
  });
});

describe('safe to spend', () => {
  it('rounds down to the nearest R5', () => {
    // 619 / 5 days = 123.8, rounds down to 120
    expect(forecast({ transactions: history, balance: 619, today }).safeToSpendToday).toBe(120);
    // 624 / 5 = 124.8, still 120
    expect(forecast({ transactions: history, balance: 624, today }).safeToSpendToday).toBe(120);
    // 625 / 5 = 125
    expect(forecast({ transactions: history, balance: 625, today }).safeToSpendToday).toBe(125);
  });

  it('floors at zero when bills are bigger than the balance', () => {
    const withBill = [
      ...history,
      txn('2026-08-13', -900, 'Rent', 'bill'),
      txn('2026-09-13', -900, 'Rent', 'bill'),
    ];
    expect(forecast({ transactions: withBill, balance: 500, today }).safeToSpendToday).toBe(0);
  });
});

describe('what-if and loan check', () => {
  it('adds a one-off income and moves the date later', () => {
    const r = whatIf({ transactions: history, balance: 500, today }, [{ date: '2026-10-13', amount: 300, description: 'Side job' }]);
    expect(r.after.runwayDays).toBeGreaterThan(r.before.runwayDays);
    expect(r.deltaDays).toBe(r.after.runwayDays - r.before.runwayDays);
    expect(r.after.state).toBe('enough');
  });

  it('a one-off expense moves the date earlier', () => {
    const r = whatIf({ transactions: history, balance: 700, today }, [{ date: '2026-10-13', amount: -300, description: 'School trip' }]);
    expect(r.deltaDays).toBeLessThan(0);
  });

  it('reports days taken off cover by a loan', () => {
    const input = { transactions: history, balance: 700, today };
    const r = loanCheck(input, 300);
    // 700 lasts until day 6 (Sun 18), 400 lasts until day 3 (Thu 15)
    expect(r.before.headlineDate).toBe('2026-10-18');
    expect(r.after.headlineDate).toBe('2026-10-15');
    expect(r.daysOff).toBe(3);
    expect(r.after.state).toBe('short');
  });

  it('safe to lend keeps the current state, and R10 more does not', () => {
    const input = { transactions: history, balance: 900, today };
    const safe = safeToLend(input);
    expect(safe).toBeGreaterThan(0);
    expect(safe % 10).toBe(0);
    expect(forecast({ ...input, balance: 900 - safe }).state).toBe('enough');
    expect(forecast({ ...input, balance: 900 - safe - 10 }).state).not.toBe('enough');
  });

  it('safe to lend is zero when already Short', () => {
    expect(safeToLend({ transactions: history, balance: 300, today })).toBe(0);
  });
});

describe('timeline', () => {
  it('covers 30 days and includes expected income at its typical timing', () => {
    const f = forecast({ transactions: history, balance: 500, today });
    expect(f.timeline).toHaveLength(30);
    const friday = f.timeline.find((d) => d.date === '2026-10-16')!;
    expect(friday.incomeToday).toBe(3000);
    expect(friday.central).toBeGreaterThan(f.timeline[3]!.central);
    for (const d of f.timeline) {
      expect(d.optimistic).toBeGreaterThanOrEqual(d.central);
      expect(d.central).toBeGreaterThanOrEqual(d.pessimistic);
    }
  });
});
