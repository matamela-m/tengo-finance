// The credit-risk stress scenarios from docs/review/tools/credit-risk/stress.ts, as reusable inputs.
// Used by the regression tests in src/engine/stress.test.ts and by docs/review/after/stress.ts.
// Not imported by the app.
import { classifyRows } from '../classify';
import { addDays, dayOfMonth, weekday } from '../dates';
import type { ForecastInput, ISODate, Transaction } from '../types';

export const STRESS_TODAY: ISODate = '2026-10-20'; // Tuesday

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Row = { date: ISODate; description: string; amount: number };

interface GenOpts {
  days: number;
  today?: ISODate;
  /** Weekly pay weekday (0 Sunday) or null for none. */
  payWeekday?: number | null;
  pay?: number;
  incomeStopsDaysAgo?: number;
  holiday?: [number, number];
  spend?: [number, number];
  monthEndExtra?: number;
  rent?: number;
  rentDay?: number;
  seed?: number;
}

/** Identical to the review's generator, so results compare like for like. */
export function gen(o: GenOpts): Row[] {
  const today = o.today ?? STRESS_TODAY;
  const r = rng(o.seed ?? 7);
  const [lo, hi] = o.spend ?? [60, 160];
  const rows: Row[] = [];
  for (let i = o.days; i >= 1; i--) {
    const date = addDays(today, -i);
    rows.push({ date, description: 'Groceries and taxi', amount: -Math.round(lo + (hi - lo) * r()) });
    if (o.monthEndExtra && dayOfMonth(date) >= 25) rows.push({ date, description: 'Month end shopping', amount: -o.monthEndExtra });
    const stopped = o.incomeStopsDaysAgo !== undefined && i <= o.incomeStopsDaysAgo;
    const onHoliday = o.holiday !== undefined && i <= o.holiday[0] && i >= o.holiday[1];
    if (o.payWeekday !== null && o.payWeekday !== undefined && weekday(date) === o.payWeekday && !stopped && !onHoliday) {
      rows.push({ date, description: 'Weekly payout', amount: o.pay ?? 2000 });
    }
    if (o.rent && dayOfMonth(date) === (o.rentDay ?? 1)) rows.push({ date, description: 'Rent', amount: -o.rent });
  }
  return rows;
}

export function classify(rows: Row[]): Transaction[] {
  const cats = classifyRows(rows);
  return rows.map((r, i) => ({ id: `s${i}`, ...r, category: cats[i]! }));
}

export interface StressCase {
  id: string;
  scenario: string;
  input: ForecastInput;
}

const T = STRESS_TODAY;
const at = (transactions: Transaction[], balance: number, today: ISODate = T): ForecastInput => ({ transactions, balance, today });

export function stressCases(): StressCase[] {
  const base = classify(gen({ days: 90, payWeekday: 5, rent: 2500 }));
  const zero = classify(gen({ days: 90, payWeekday: null, rent: 2500 }));
  const windfallRows = gen({ days: 90, payWeekday: 5, rent: 2500 });
  windfallRows.push({ date: addDays(T, -20), description: 'Stokvel payout', amount: 40000 });
  const loanRows = gen({ days: 90, payWeekday: 5, rent: 2500 });
  loanRows.push({ date: addDays(T, -20), description: 'Loan disbursement', amount: 15000 });
  const missedRows = gen({ days: 90, payWeekday: 5 });
  for (const d of ['2026-08-01', '2026-09-01']) missedRows.push({ date: d, description: 'Rent', amount: -2500 });
  const gapRows = gen({ days: 90, payWeekday: 5 });
  for (const d of ['2026-08-01', '2026-10-01']) gapRows.push({ date: d, description: 'Rent', amount: -2500 });
  const spikeToday = '2026-10-24';
  const outRows = gen({ days: 90, payWeekday: 5, rent: 2500 });
  outRows.push({ date: addDays(T, -12), description: 'Car repair', amount: -9000 });
  outRows.push({ date: addDays(T, -40), description: 'Funeral contribution', amount: -9000 });
  const outThin = gen({ days: 20, payWeekday: 5, seed: 11 });
  outThin.push({ date: addDays(T, -5), description: 'Car repair', amount: -6000 });
  const billUp = gen({ days: 90, payWeekday: 5 });
  billUp.push({ date: '2026-08-01', description: 'Rent', amount: -2000 }, { date: '2026-09-01', description: 'Rent', amount: -2000 }, { date: '2026-10-01', description: 'Rent', amount: -2600 });
  const billUp15 = gen({ days: 90, payWeekday: 5 });
  billUp15.push({ date: '2026-08-01', description: 'Rent', amount: -2000 }, { date: '2026-09-01', description: 'Rent', amount: -2000 }, { date: '2026-10-01', description: 'Rent', amount: -2300 });
  const stopInt = gen({ days: 90, payWeekday: null, rent: 2500 });
  for (const off of [88, 80, 73, 64, 57, 50, 40]) stopInt.push({ date: addDays(T, -off), description: 'Cash deposit', amount: 5000 });
  const payToday = classify(gen({ days: 90, payWeekday: 2, rent: 2500 }));

  return [
    { id: 'S01', scenario: 'Baseline: weekly Friday pay, steady spend, rent on 1st, 90 days', input: at(base, 1200) },
    { id: 'S02', scenario: 'Zero income for 90 days, R4000 balance', input: at(zero, 4000) },
    { id: 'S02b', scenario: 'Zero income for 90 days, R9000 balance', input: at(zero, 9000) },
    { id: 'S03', scenario: 'Overdrawn: balance -R800', input: at(base, -800) },
    { id: 'S04', scenario: 'Windfall R40000 twenty days ago on top of weekly R2000 pay', input: at(classify(windfallRows), 1200) },
    { id: 'S04b', scenario: 'Loan disbursement R15000 twenty days ago', input: at(classify(loanRows), 1200) },
    { id: 'S05', scenario: 'Missed bill: rent paid Aug and Sep, October rent unpaid', input: at(classify(missedRows), 1200) },
    { id: 'S05b', scenario: 'Missed bill mid history: rent Aug and Oct, September skipped', input: at(classify(gapRows), 1200) },
    { id: 'S06', scenario: 'Month-end spike: R600 a day extra from the 25th, today 24 Oct', input: at(classify(gen({ days: 90, today: spikeToday, payWeekday: 5, monthEndExtra: 600 })), 3000, spikeToday) },
    ...[5, 7, 14, 20].map((d) => ({ id: `S07-${d}`, scenario: `Thin data: ${d} days of history`, input: at(classify(gen({ days: d, payWeekday: 5, seed: 11 })), 1500) })),
    { id: 'S08', scenario: 'Outliers: two R9000 one-off spends in the last 60 days', input: at(classify(outRows), 3000) },
    { id: 'S08b', scenario: 'Outlier in thin data: R6000 repair with 20 days of history', input: at(classify(outThin), 3000) },
    { id: 'S09', scenario: 'Holiday: no income for the last 21 days, weekly pattern before', input: at(classify(gen({ days: 90, payWeekday: 5, holiday: [21, 1], rent: 2500 })), 1500) },
    { id: 'S10', scenario: 'Bill rises 30%: rent R2000, R2000, then R2600', input: at(classify(billUp), 3000) },
    { id: 'S10b', scenario: 'Bill rises 15%: rent R2000, R2000, then R2300', input: at(classify(billUp15), 3000) },
    { id: 'S11', scenario: 'Income stopped 35 days ago (weekly pay before that)', input: at(classify(gen({ days: 90, payWeekday: 5, incomeStopsDaysAgo: 35, rent: 2500 })), 2500) },
    { id: 'S11b', scenario: 'Lumpy deposits every 7 to 9 days, none in the last 40 days', input: at(classify(stopInt), 2500) },
    { id: 'S12', scenario: 'Payday is today (Tuesday), payout not yet in balance', input: at(payToday, 400) },
    { id: 'S12b', scenario: 'Payday is today, payout already in balance (R400 + R2000)', input: at(payToday, 2400) },
    { id: 'S13', scenario: 'Rent R3000 due 25 Oct, the day after the latest next money (24 Oct)', input: at(classify(gen({ days: 90, payWeekday: 5, rent: 3000, rentDay: 25 })), 1600) },
  ];
}
