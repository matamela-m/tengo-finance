import { describe, expect, it } from 'vitest';
import { addDays, daysBetween } from './dates';
import { BACKGROUND_SHARE, forecast, MIN_HISTORY_DAYS, roomToLend } from './forecast';
import { steadyHistory, txn } from './testUtils';
import type { Transaction } from './types';

// Monday. Pay of R3 000 lands on Fridays; spend alternates R50 and R150 a day.
const today = '2026-10-12';
const history = steadyHistory(today, 90);
const withoutPayFrom = (days: number): Transaction[] => history.filter((t) => !(t.category === 'income' && t.date >= addDays(today, -days)));

describe('paused income', () => {
  it('marks weekly income paused after more than two missed paydays and stops counting on it', () => {
    const f = forecast({ transactions: withoutPayFrom(17), balance: 2500, today });
    expect(f.income.status).toBe('paused');
    expect(f.nextMoney).toBeNull();
    expect(f.coverTarget.kind).toBe('horizon');
    expect(f.confidence).toBe('low');
    expect(roomToLend({ transactions: withoutPayFrom(17), balance: 2500, today })).toBe(0);
  });

  it('is not paused after one missed payday', () => {
    const f = forecast({ transactions: withoutPayFrom(5), balance: 2500, today });
    expect(f.income.status).toBe('regular');
    expect(f.nextMoney).not.toBeNull();
  });

  it('never shows Enough with high confidence while paused, even with a large balance', () => {
    const f = forecast({ transactions: withoutPayFrom(30), balance: 50_000, today });
    expect(f.income.status).toBe('paused');
    expect(f.status).toBe('enough');
    expect(f.confidence).not.toBe('high');
  });
});

describe('no income and thin data', () => {
  it('says not enough to tell with no income, and still knows the runway', () => {
    const f = forecast({ transactions: history.filter((t) => t.amount < 0), balance: 2000, today });
    expect(f.status).toBe('unclear');
    expect(f.unclearReason).toBe('noIncome');
    expect(f.nextMoney).toBeNull();
    expect(f.runway.central).not.toBeNull();
    expect(roomToLend({ transactions: history.filter((t) => t.amount < 0), balance: 2000, today })).toBe(0);
  });

  it(`says not enough to tell under ${MIN_HISTORY_DAYS} days of history`, () => {
    for (const days of [0, 5, 13]) {
      const f = forecast({ transactions: steadyHistory(today, days), balance: 1500, today });
      expect(f.status, `${days} days`).toBe('unclear');
      expect(f.unclearReason, `${days} days`).toBe('thin');
    }
  });

  it('gives low confidence, a wide band and at best Tight for 14 to 27 days', () => {
    for (const days of [14, 20, 27]) {
      const f = forecast({ transactions: steadyHistory(today, days), balance: 5000, today });
      expect(f.status, `${days} days`).not.toBe('unclear');
      expect(f.status, `${days} days`).not.toBe('enough');
      expect(f.confidence, `${days} days`).toBe('low');
      if (!f.beyondHorizon) expect(daysBetween(f.band.from, f.band.to), `${days} days`).toBeGreaterThanOrEqual(6);
    }
  });

  it('never gives a zero width band', () => {
    for (const balance of [200, 500, 800, 1500, 3000]) {
      const f = forecast({ transactions: history, balance, today });
      if (!f.beyondHorizon) expect(f.band.from < f.band.to, `R${balance}`).toBe(true);
    }
  });
});

describe('payday today', () => {
  const friday = '2026-10-16';
  const before = steadyHistory(friday, 90);

  it('treats an expected payment due today as pending, not as Short', () => {
    const f = forecast({ transactions: before, balance: 200, today: friday });
    expect(f.income.status).toBe('pendingToday');
    expect(f.nextMoney?.typical).toBe(friday);
    expect(f.status).not.toBe('short');
  });

  it('moves on to next week once the payment is in', () => {
    const paid = [...before, txn(friday, 3000, 'Wages', 'income')];
    const f = forecast({ transactions: paid, balance: 3200, today: friday });
    expect(f.income.status).toBe('regular');
    expect(f.nextMoney?.typical).toBe('2026-10-23');
  });
});

describe('bills', () => {
  const rent = (dates: string[], amounts: number[]) => dates.map((d, i) => txn(d, -amounts[i]!, 'Rent', 'bill'));

  it('reports a bill that did not appear when expected, and the answer changes the forecast', () => {
    const tx = [...history, ...rent(['2026-08-01', '2026-09-01'], [900, 900])];
    const f = forecast({ transactions: tx, balance: 2000, today });
    expect(f.missedBills).toEqual([{ id: 'rent@2026-10-01', description: 'Rent', amount: 900, dueDate: '2026-10-01' }]);

    const owed = forecast({ transactions: tx, balance: 2000, today, billDecisions: { 'rent@2026-10-01': 'owed' } });
    expect(owed.missedBills).toHaveLength(0);
    expect(owed.owedBills).toEqual([{ description: 'Rent', date: today, amount: 900 }]);
    expect(owed.runwayDays).toBeLessThan(f.runwayDays);

    const settled = forecast({ transactions: tx, balance: 2000, today, billDecisions: { 'rent@2026-10-01': 'settled' } });
    expect(settled.missedBills).toHaveLength(0);
    expect(settled.owedBills).toHaveLength(0);
  });

  it('projects a rising bill at its latest amount', () => {
    const f = forecast({ transactions: [...history, ...rent(['2026-08-05', '2026-09-05', '2026-10-05'], [2000, 2000, 2600])], balance: 3000, today });
    expect(f.recurringBills.find((b) => b.description === 'Rent')?.amount).toBe(2600);
  });

  it('keeps a bill with one skipped month as a bill', () => {
    const f = forecast({ transactions: [...history, ...rent(['2026-08-05', '2026-10-05'], [900, 900])], balance: 3000, today });
    expect(f.recurringBills.map((b) => b.description)).toContain('Rent');
  });
});

describe('one-offs', () => {
  it('leaves a large unrepeated spend out of the daily rate', () => {
    const base = forecast({ transactions: history, balance: 3000, today });
    const f = forecast({ transactions: [...history, txn('2026-10-01', -9000, 'Car repair', 'spend')], balance: 3000, today });
    expect(f.oneOffs.map((o) => [o.description, o.why])).toEqual([['Car repair', 'large']]);
    expect(f.rates.pessimistic).toBeCloseTo(base.rates.pessimistic, 6);
  });

  it('leaves out anything the person marked as a one-off', () => {
    const marked = { ...txn('2026-10-05', -400, 'Party', 'spend'), oneOff: true };
    const f = forecast({ transactions: [...history, marked], balance: 3000, today });
    expect(f.oneOffs.map((o) => o.why)).toEqual(['marked']);
  });

  it('does not count loans, refunds or a windfall as income', () => {
    const f = forecast({
      transactions: [...history, txn('2026-09-20', 15000, 'Loan disbursement', 'income'), txn('2026-09-25', 40000, 'Stokvel payout', 'income')],
      balance: 1200,
      today,
    });
    expect(f.oneOffs.map((o) => [o.description, o.why])).toEqual([
      ['Loan disbursement', 'listed'],
      ['Stokvel payout', 'large'],
    ]);
    expect(f.nextMoney?.pattern).toBe('weekday');
    expect(f.nextMoney?.amountTypical).toBe(3000);
  });

  it('keeps large spends that repeat, like stock runs', () => {
    const stock = [5, 15, 25, 35, 45].map((k) => txn(addDays(today, -k), -3000, 'Wholesale stock', 'spend'));
    const f = forecast({ transactions: [...history, ...stock], balance: 5000, today });
    expect(f.oneOffs).toHaveLength(0);
  });
});

describe('month end, overdraft, stale balance, background income', () => {
  it('uses a month-end pattern when history shows one', () => {
    const spikes: Transaction[] = [];
    for (let k = 1; k <= 90; k++) {
      const d = addDays(today, -k);
      if (Number(d.slice(8)) >= 25) spikes.push(txn(d, -400, 'Month end shopping', 'spend'));
    }
    const plain = forecast({ transactions: history, balance: 3000, today: '2026-10-22' });
    const f = forecast({ transactions: [...history, ...spikes], balance: 3000, today: '2026-10-22' });
    expect(f.monthEnd.mode).toBe('pattern');
    expect(f.monthEnd.factor).toBeGreaterThan(1.3);
    expect(f.headlineDate < plain.headlineDate).toBe(true);
  });

  it('shows how far overdrawn and is Short from today', () => {
    const f = forecast({ transactions: history, balance: -800, today });
    expect(f.overdrawn).toBe(800);
    expect(f.status).toBe('short');
    expect(f.headlineDate).toBe(today);
  });

  it('lowers confidence for an old balance and hides the state after two weeks', () => {
    const asOf = forecast({ transactions: history, balance: 1500, today, now: addDays(today, 5) });
    expect(asOf.asOfDaysAgo).toBe(5);
    expect(asOf.confidence).toBe('medium');
    const old = forecast({ transactions: history, balance: 1500, today, now: addDays(today, 20) });
    expect(old.status).toBe('unclear');
    expect(old.unclearReason).toBe('stale');
  });

  it('counts small daily income in the headline the same way as in the chart', () => {
    // Pay of R3 000 on Fridays plus R20 a day that is too small to be next money.
    const extra = Array.from({ length: 60 }, (_, k) => txn(addDays(today, -1 - k), 20, 'Tips', 'income'));
    const tx = [...history, ...extra];
    const f = forecast({ transactions: tx, balance: 600, today });
    // Tips that land on a payday are part of that day's pay, so the daily rate is a little under R20.
    const bg = f.income.backgroundPerDay;
    expect(bg).toBeGreaterThan(15);
    expect(bg).toBeLessThan(20);
    // Day 2 of the chart, before any payday: balance less three days of spend plus the central share of tips.
    const day2 = f.timeline[2]!;
    const spent = 3 * f.rates.central - 3 * bg * BACKGROUND_SHARE.central;
    expect(day2.central).toBeCloseTo(600 - spent, 6);
    const without = forecast({ transactions: history, balance: 600, today });
    expect(f.runwayDays).toBeGreaterThanOrEqual(without.runwayDays);
  });
});
