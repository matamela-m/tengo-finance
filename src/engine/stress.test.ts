// Permanent regression tests for the credit-risk stress cases (docs/review/tools/credit-risk/results.md)
// and the three seeded personas. Each case states the outcome the build 2 engine must keep.
import { describe, expect, it } from 'vitest';
import { seedRecord } from '../data/localRepository';
import { forecast, roomToLend } from './forecast';
import { helpPlan } from './help';
import { stressCases, STRESS_TODAY } from './testing/stressCases';
import type { Forecast, ForecastInput } from './types';
import { homeView } from './view';

const cases = Object.fromEntries(stressCases().map((c) => [c.id, c.input]));
const run = (id: string) => {
  const input = cases[id]!;
  return { input, f: forecast(input), room: roomToLend(input) };
};

/** Things that must hold in every case: no Enough with high confidence when money is not expected, no figures when unclear. */
function invariants(id: string, f: Forecast, room: number) {
  if (f.income.status === 'paused' || f.income.status === 'irregular') expect(f.confidence, id).toBe('low');
  if (f.status === 'unclear' || f.status === 'short' || f.confidence === 'low') expect(room, id).toBe(0);
  if (!f.beyondHorizon) expect(f.band.from < f.band.to, id).toBe(true);
  const v = homeView(f);
  if (f.status === 'short') expect(v.budget.kind, id).toBe('notAdvised');
  if (f.status === 'unclear') expect(v.headline.date, id).toBeNull();
}

describe('credit-risk stress cases', () => {
  it('S01 baseline stays Enough with a sensible budget', () => {
    const { f, room } = run('S01');
    expect(f.status).toBe('enough');
    expect(f.dailyBudget).toBeGreaterThan(0);
    expect(room).toBeGreaterThan(0);
    invariants('S01', f, room);
  });

  it('S02 and S02b: no income is Not enough to tell, never Enough, nothing to lend', () => {
    for (const id of ['S02', 'S02b']) {
      const { f, room } = run(id);
      expect(f.status, id).toBe('unclear');
      expect(f.unclearReason, id).toBe('noIncome');
      expect(f.nextMoney, id).toBeNull();
      expect(room, id).toBe(0);
      invariants(id, f, room);
    }
  });

  it('S03 overdrawn: shows the overdraft and is Short from today', () => {
    const { f, room } = run('S03');
    expect(f.overdrawn).toBe(800);
    expect(f.status).toBe('short');
    expect(homeView(f).notices[0]).toEqual({ kind: 'overdrawn', amount: 800 });
    invariants('S03', f, room);
  });

  it('S04 and S04b: a windfall or a loan is left out of income and the weekly pattern holds', () => {
    for (const [id, why] of [
      ['S04', 'large'],
      ['S04b', 'listed'],
    ] as const) {
      const { f, room } = run(id);
      expect(f.oneOffs.map((o) => o.why), id).toEqual([why]);
      expect(f.nextMoney?.pattern, id).toBe('weekday');
      expect(f.nextMoney?.amountTypical, id).toBe(2000);
      invariants(id, f, room);
    }
  });

  it('S05: unpaid October rent is surfaced for the person to confirm', () => {
    const { f, input } = run('S05');
    expect(f.missedBills.map((m) => [m.description, m.dueDate])).toEqual([['Rent', '2026-10-01']]);
    const owed = forecast({ ...input, billDecisions: { [f.missedBills[0]!.id]: 'owed' } });
    expect(owed.owedBills[0]).toMatchObject({ description: 'Rent', amount: 2500, date: STRESS_TODAY });
    expect(owed.status).toBe('short');
  });

  it('S05b: a skipped month keeps rent as a bill and projects November', () => {
    const { f } = run('S05b');
    expect(f.recurringBills.find((b) => b.description === 'Rent')?.nextDate).toBe('2026-11-01');
  });

  it('S06: the month-end spike is used, so the date is no longer mid November', () => {
    const { f, room } = run('S06');
    expect(f.monthEnd.mode).toBe('pattern');
    // Before build 2 the headline was 2026-11-16 and the state Enough.
    expect(f.headlineDate <= '2026-10-31').toBe(true);
    expect(f.status).not.toBe('enough');
    invariants('S06', f, room);
  });

  it('S07: 5 and 7 days are Not enough to tell; 14 and 20 days are low confidence with a wide band, never Enough', () => {
    for (const id of ['S07-5', 'S07-7']) {
      const { f, room } = run(id);
      expect(f.unclearReason, id).toBe('thin');
      invariants(id, f, room);
    }
    for (const id of ['S07-14', 'S07-20']) {
      const { f, room } = run(id);
      expect(f.confidence, id).toBe('low');
      expect(f.status, id).not.toBe('enough');
      expect(room, id).toBe(0);
      invariants(id, f, room);
    }
  });

  it('S08 and S08b: one-off repairs do not set the heavy daily rate', () => {
    const { f, room } = run('S08');
    expect(f.oneOffs).toHaveLength(2);
    // Before build 2 the heavy rate was R1 393 a day.
    expect(f.rates.pessimistic).toBeLessThan(200);
    invariants('S08', f, room);
    const thin = run('S08b');
    // With 20 days of history the repair could be a habit, so it still counts and the person is asked.
    expect(thin.f.oneOffs.map((o) => [o.description, o.why])).toEqual([['Car repair', 'ask']]);
    expect(homeView(thin.f).notices.some((n) => n.kind === 'askOneOff')).toBe(true);
    // Once marked as a one-off it no longer sets the heavy rate (R1 381 a day before build 2).
    const input = cases['S08b']!;
    const marked = forecast({ ...input, transactions: input.transactions.map((t) => (t.description === 'Car repair' ? { ...t, oneOff: true } : t)) });
    expect(marked.rates.pessimistic).toBeLessThan(200);
  });

  it('S09, S11 and S11b: stopped income is paused, not counted on, nothing to lend', () => {
    for (const id of ['S09', 'S11', 'S11b']) {
      const { f, room } = run(id);
      expect(f.income.status, id).toBe('paused');
      expect(f.nextMoney, id).toBeNull();
      expect(f.status, id).not.toBe('enough');
      expect(room, id).toBe(0);
      expect(homeView(f).notices.some((n) => n.kind === 'paused'), id).toBe(true);
      invariants(id, f, room);
    }
  });

  it('S10 and S10b: a rising rent is projected at its new amount', () => {
    expect(run('S10').f.recurringBills.find((b) => b.description === 'Rent')?.amount).toBe(2600);
    expect(run('S10b').f.recurringBills.find((b) => b.description === 'Rent')?.amount).toBe(2300);
  });

  it('S12: payday morning is pending, not Short; S12b with the payment in moves to next week', () => {
    const { f, room } = run('S12');
    expect(f.income.status).toBe('pendingToday');
    expect(f.status).not.toBe('short');
    expect(homeView(f).budget.kind).toBe('pending');
    invariants('S12', f, room);
    const input = cases['S12b']!;
    const paid: ForecastInput = { ...input, transactions: [...input.transactions, { id: 'paid', date: STRESS_TODAY, description: 'Weekly payout', amount: 2000, category: 'income' }] };
    const after = forecast(paid);
    expect(after.income.status).toBe('regular');
    expect(after.nextMoney?.typical).toBe('2026-10-27');
  });

  it('S13: rent the day after payday is kept back and lending is capped', () => {
    const { f, room } = run('S13');
    // Before build 2: budget R400 and R1 090 to lend with R3 000 rent due the next day.
    expect(f.reserve).toBe(1000);
    expect(f.reserveBills.map((b) => b.description)).toEqual(['Rent']);
    expect(f.dailyBudget).toBeLessThanOrEqual(150);
    expect(room).toBeLessThan(200);
    invariants('S13', f, room);
  });
});

describe('seeded personas', () => {
  for (const [id, state] of [
    ['thabo', 'tight'],
    ['lerato', 'enough'],
    ['ayanda', 'short'],
  ] as const) {
    it(`${id} is ${state} with a consistent Home and no harmful help`, () => {
      const r = seedRecord(id, STRESS_TODAY);
      const input = { transactions: r.transactions, balance: r.balance, today: STRESS_TODAY };
      const f = forecast(input);
      const room = roomToLend(input);
      expect(f.status).toBe(state);
      expect(f.income.status).toBe('regular');
      invariants(id, f, room);
      const plan = helpPlan(input);
      expect(plan.current).toBe(state);
    });
  }
});
