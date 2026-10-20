import { describe, expect, it } from 'vitest';
import { generateHistory, startingBalance } from '../data/seed/generate';
import { PERSONAS } from '../data/seed/personas';
import { addDays } from './dates';
import { forecast } from './forecast';
import { steadyHistory, txn } from './testUtils';
import type { Forecast, ForecastInput } from './types';
import { homeView, type HomeView } from './view';

/** Every check the Home rule promises. Fails with the case name so a broken case is easy to find. */
function expectConsistent(name: string, f: Forecast, v: HomeView) {
  const at = `${name} (${f.today})`;
  expect(v.state, at).toBe(f.state);
  expect(v.gauge, at).toBe({ short: 1, tight: 2, enough: 3 }[f.state]);
  expect(v.summaryKey, at).toBe(f.reserveLimited ? 'tightReserve' : f.state);
  if (f.reserveLimited) expect(f.state, at).toBe('tight');
  const labels = { short: ['shortFrom'], tight: ['tightUntil'], enough: ['enoughUntil', 'enoughBeyond'] }[f.state];
  expect(labels, at).toContain(v.headline.label);
  expect(v.headline.date, at).toBe(f.headlineDate);

  // The daily budget never shows a number when Short.
  if (f.state === 'short') {
    expect(v.budget.kind, at).toBe('notAdvised');
    expect(v.gapDays, at).toBeGreaterThanOrEqual(0);
  } else {
    // Enough always leaves something to spend; Tight may have nothing spare, said in words, never R0.
    if (f.state === 'enough') expect(v.budget.kind, at).toBe('amount');
    else expect(['amount', 'nothingSpare'], at).toContain(v.budget.kind);
    if (v.budget.kind === 'amount') {
      expect(v.budget.amount, at).toBeGreaterThan(0);
      expect(v.budget.amount % 5, at).toBe(0);
      expect(v.budget.amount, at).toBeGreaterThanOrEqual(0);
    }
    expect(v.gapDays, at).toBe(0);
  }

  // Exactly one next-money date, shared by the stat tile and the chart.
  expect(v.chart.assumption, at).toBe('ifUsual');
  expect(v.chart.nextMoneyDate, at).toBe(v.nextMoney?.date ?? null);
  if (v.nextMoney) {
    const firstIncome = f.timeline.find((d) => d.incomeToday > 0);
    if (firstIncome) expect(firstIncome.date, at).toBe(v.nextMoney.date);
    // The headline date agrees with the state: Short runs out before next money, the others reach it.
    if (f.state === 'short') expect(v.headline.date <= v.nextMoney.date, at).toBe(true);
    else expect(f.beyondHorizon || v.headline.date >= v.nextMoney.date, at).toBe(true);
  }
}

function check(name: string, input: ForecastInput) {
  const f = forecast(input);
  expectConsistent(name, f, homeView(f));
  return f;
}

describe('Home view model', () => {
  it('is consistent for every persona on 60 different days', () => {
    const seen = new Set<string>();
    for (const p of PERSONAS) {
      for (let k = 0; k < 60; k++) {
        const today = addDays('2026-09-01', k);
        const transactions = generateHistory(p.id, today);
        const balance = startingBalance(transactions, today, p.startState);
        const f = check(p.id, { transactions, balance, today });
        seen.add(f.state);
      }
    }
    expect([...seen].sort()).toEqual(['enough', 'short', 'tight']);
  });

  it('is consistent across a sweep of balances for each persona', () => {
    const today = '2026-10-20';
    for (const p of PERSONAS) {
      const transactions = generateHistory(p.id, today);
      for (const balance of [0, 50, 200, 500, 1000, 2000, 5000, 20000, 200000]) check(`${p.id} R${balance}`, { transactions, balance, today });
    }
  });

  const today = '2026-10-12';
  const cases: [string, ForecastInput][] = [
    ['no history', { transactions: [], balance: 1000, today }],
    ['zero balance', { transactions: steadyHistory(today, 90), balance: 0, today }],
    ['overdrawn', { transactions: steadyHistory(today, 90), balance: -400, today }],
    ['never runs out', { transactions: steadyHistory(today, 90), balance: 1_000_000, today }],
    ['thin data, 10 days', { transactions: steadyHistory(today, 10), balance: 600, today }],
    ['thin data, 20 days', { transactions: steadyHistory(today, 20), balance: 600, today }],
    ['spend only, no income', { transactions: [txn('2026-09-01', -50, 'Bread', 'spend'), txn('2026-10-01', -60, 'Bread', 'spend')], balance: 900, today }],
    [
      'big bill tomorrow',
      {
        transactions: [...steadyHistory(today, 90), txn('2026-08-13', -900, 'Rent', 'bill'), txn('2026-09-13', -900, 'Rent', 'bill')],
        balance: 1000,
        today,
      },
    ],
    ['with a what-if extra', { transactions: steadyHistory(today, 90), balance: 400, today, extras: [{ date: '2026-10-13', amount: 600, description: 'Side job' }] }],
  ];
  for (const [name, input] of cases) {
    it(`is consistent: ${name}`, () => {
      check(name, input);
    });
  }

  it('shows Not advised with the usual spend when Short', () => {
    const f = forecast({ transactions: steadyHistory(today, 90), balance: 300, today });
    const v = homeView(f);
    expect(v.state).toBe('short');
    expect(v.budget).toMatchObject({ kind: 'notAdvised', usual: Math.round(f.rates.central) });
    expect(v.headline.label).toBe('shortFrom');
  });

  it('uses Tight until for Tight, never Enough until', () => {
    const transactions = steadyHistory(today, 90);
    let found = false;
    for (let b = 300; b < 1200 && !found; b += 10) {
      const f = forecast({ transactions, balance: b, today });
      if (f.state === 'tight') {
        expect(homeView(f).headline.label).toBe('tightUntil');
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});
