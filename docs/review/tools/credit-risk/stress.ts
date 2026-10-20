// Credit risk stress test for the Tengo forecast engine. Read only: imports src/engine, writes results here.
// Run from the repo root: npx vite-node docs/review/tools/credit-risk/stress.ts
import { writeFileSync } from 'node:fs';
import { classifyRows } from '../../../../src/engine/classify';
import { addDays, dayOfMonth, daysBetween, weekday } from '../../../../src/engine/dates';
import { estimateIncome, forecast, loanCheck, safeToLend } from '../../../../src/engine/forecast';
import { helpPlan } from '../../../../src/engine/help';
import type { ForecastInput, ISODate, Transaction } from '../../../../src/engine/types';
import { seedRecord } from '../../../../src/data/localRepository';

const OUT = 'docs/review/tools/credit-risk';
const TODAY: ISODate = '2026-10-20'; // Tuesday

// Small seeded RNG so every run is identical.
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
  /** Stop income this many days before today. */
  incomeStopsDaysAgo?: number;
  /** No income between these offsets (days before today), inclusive. */
  holiday?: [number, number];
  /** Daily spend range. */
  spend?: [number, number];
  /** Extra spend per day on day of month >= 25 (month-end spike). */
  monthEndExtra?: number;
  rent?: number;
  rentDay?: number;
  seed?: number;
}

function gen(o: GenOpts): Row[] {
  const today = o.today ?? TODAY;
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

function classify(rows: Row[]): Transaction[] {
  const cats = classifyRows(rows);
  return rows.map((r, i) => ({ id: `s${i}`, ...r, category: cats[i]! }));
}

const R = (n: number) => Math.round(n);

/** Heavy-path balance left on the latest next money date, after a given starting balance. */
function heavyLeftAtLatest(input: ForecastInput): number {
  const f = forecast(input);
  const latest = f.nextMoney!.latest;
  const days = daysBetween(input.today, latest);
  const bills = f.upcomingBills.filter((b) => b.date < latest).reduce((a, b) => a + b.amount, 0);
  return input.balance - bills - f.rates.pessimistic * days;
}

interface Result {
  id: string;
  scenario: string;
  balance: number;
  historyDays: number;
  confidence: string;
  pattern: string;
  nextTypical: string;
  nextLatest: string;
  nextAmount: string;
  spendOptCentralPes: string;
  bandWidthDays: number;
  state: string;
  headline: string;
  band: string;
  gapDays: number;
  safeToSpend: number;
  stsVsUsual: string;
  safeToLend: number;
  heavyLeftAfterLending: number;
  help: string;
  bills: string;
  observation: string;
}

const results: Result[] = [];

function run(id: string, scenario: string, transactions: Transaction[], balance: number, observation: (f: ReturnType<typeof forecast>) => string, today: ISODate = TODAY) {
  const input: ForecastInput = { transactions, balance, today };
  const f = forecast(input);
  const stl = safeToLend(input);
  const lc = loanCheck(input, stl);
  const h = helpPlan(input);
  const n = f.nextMoney!;
  const helpText =
    h.target === null
      ? `covered, set aside up to R${h.canSetAside}`
      : `to ${h.target}: extra R${h.extraNeeded} or cut R${h.dailyCut}/day until ${h.until}${h.billToMove ? `, or move ${h.billToMove.description} R${h.billToMove.amount}` : ''}`;
  results.push({
    id,
    scenario,
    balance,
    historyDays: f.historyDays,
    confidence: f.confidence,
    pattern: n.pattern,
    nextTypical: n.typical,
    nextLatest: n.latest,
    nextAmount: `${n.amountLow} to ${n.amountHigh}`,
    spendOptCentralPes: `${R(f.rates.optimistic)} / ${R(f.rates.central)} / ${R(f.rates.pessimistic)}`,
    bandWidthDays: daysBetween(f.band.from, f.band.to),
    state: f.state,
    headline: `${f.state === 'short' ? 'Short from' : 'Enough until'} ${f.headlineDate}${f.beyondHorizon ? ' (beyond horizon)' : ''}`,
    band: `${f.band.from} to ${f.band.to}`,
    gapDays: f.gapDays,
    safeToSpend: f.safeToSpendToday,
    stsVsUsual: f.rates.central > 0 ? `${R((f.safeToSpendToday / f.rates.central) * 100)}%` : 'n/a',
    safeToLend: lc.safeToLend,
    heavyLeftAfterLending: stl > 0 ? R(heavyLeftAtLatest({ ...input, balance: balance - stl })) : NaN,
    help: helpText,
    bills: f.recurringBills.map((b) => `${b.description} R${R(b.amount)} next ${b.nextDate}`).join('; ') || 'none',
    observation: observation(f),
  });
}

// S01 Baseline: weekly Friday pay R2000, spend R60 to R160 a day, rent R2500 on the 1st, 90 days.
const base = classify(gen({ days: 90, payWeekday: 5, rent: 2500 }));
run('S01', 'Baseline: weekly Friday pay, steady spend, rent on 1st, 90 days', base, 1200, () => 'Reference case.');

// S02 Zero income, R4000 in the account.
const zero = classify(gen({ days: 90, payWeekday: null, rent: 2500 }));
run('S02', 'Zero income for 90 days, R4000 balance', zero, 4000, (f) =>
  `No income at all, yet next money is assumed on ${f.nextMoney!.typical} and the state is ${f.state}. Safe to spend spreads the balance over 30 days.`);
run('S02b', 'Zero income for 90 days, R9000 balance', zero, 9000, (f) =>
  `With no income and rent due, the app says ${f.state} and offers R${safeToLend({ transactions: zero, balance: 9000, today: TODAY })} as safe to lend.`);

// S03 Negative balance (overdrawn).
run('S03', 'Overdrawn: balance -R800', base, -800, (f) => `State ${f.state}, safe to spend R${f.safeToSpendToday}. Overdraft depth is not shown and the help plan target is ${helpPlan({ transactions: base, balance: -800, today: TODAY }).target}.`);

// S04 Single large windfall 20 days ago (e.g. a payout, loan disbursement or stokvel pot).
const windfallRows = gen({ days: 90, payWeekday: 5, rent: 2500 });
windfallRows.push({ date: addDays(TODAY, -20), description: 'Stokvel payout', amount: 40000 });
const windfall = classify(windfallRows);
run('S04', 'Windfall R40000 twenty days ago on top of weekly R2000 pay', windfall, 1200, (f) =>
  `Monthly income is inflated so the 10% threshold rises above the weekly pay. Pattern becomes ${f.nextMoney!.pattern}, next money ${f.nextMoney!.typical}, amount ${f.nextMoney!.amountTypical}.`);
const windfallSmall = gen({ days: 90, payWeekday: 5, rent: 2500 });
windfallSmall.push({ date: addDays(TODAY, -20), description: 'Loan disbursement', amount: 15000 });
run('S04b', 'Loan disbursement R15000 twenty days ago, counted as income', classify(windfallSmall), 1200, (f) =>
  `A loan is treated as income. Next money high amount R${f.nextMoney!.amountHigh}; the repayment is unknown to the engine.`);

// S05 Missed bill: rent paid in July, Aug, Sep, not in October (arrears).
const missedRows = gen({ days: 90, payWeekday: 5 }).filter(() => true);
for (const d of ['2026-08-01', '2026-09-01']) missedRows.push({ date: d, description: 'Rent', amount: -2500 });
run('S05', 'Missed bill: rent paid Aug and Sep, October rent unpaid (arrears)', classify(missedRows), 1200, (f) =>
  `Next rent assumed ${f.recurringBills.find((b) => b.description === 'Rent')?.nextDate}. The unpaid October rent (R2500 owed now) is invisible; bills before next money R${f.billsTotalBeforeNextMoney}.`);
// S05b Missed bill in the middle of history: Aug paid, Sep skipped, Oct paid. Gap of 61 days breaks the rule.
const gapRows = gen({ days: 90, payWeekday: 5 });
for (const d of ['2026-08-01', '2026-10-01']) gapRows.push({ date: d, description: 'Rent', amount: -2500 });
const gapTx = classify(gapRows);
run('S05b', 'Missed bill mid history: rent Aug and Oct, September skipped', gapTx, 1200, (f) =>
  `Rent no longer meets the 24 to 36 day rule, so it becomes everyday spend: ${gapTx.filter((t) => t.description === 'Rent').map((t) => t.category).join(', ')}. No November rent is projected; heavy daily spend ${R(f.rates.pessimistic)}.`);

// S06 Month-end spikes: R600 a day extra from the 25th, today is 24 Oct, monthly income on the 1st replaced by weekly.
const spikeToday = '2026-10-24';
const spike = classify(gen({ days: 90, today: spikeToday, payWeekday: 5, monthEndExtra: 600 }));
run('S06', 'Month-end spike: R600 a day extra from the 25th, today 24 Oct', spike, 3000, (f) => {
  const truth = 3000 - (110 + 600) * 6; // rough true path over 25 to 30 Oct, before Friday pay is counted
  return `Central rate ${R(f.rates.central)} a day ignores the known spike; over the next 7 days true spend is about R${(110 + 600) * 6 + 110}. Engine headline ${f.headlineDate}; a realistic path is below zero by about R${-truth} before the 31st.`;
}, spikeToday);

// S07 Thin data.
for (const d of [5, 7, 14, 20]) {
  const thin = classify(gen({ days: d, payWeekday: 5, seed: 11 }));
  run(`S07-${d}`, `Thin data: ${d} days of history`, thin, 1500, (f) =>
    `Band width ${daysBetween(f.band.from, f.band.to)} days at ${f.confidence} confidence. Pattern ${f.nextMoney!.pattern}.`);
}

// S08 Extreme outliers: two R9000 spends (car repair, funeral) in the last 60 days.
const outRows = gen({ days: 90, payWeekday: 5, rent: 2500 });
outRows.push({ date: addDays(TODAY, -12), description: 'Car repair', amount: -9000 });
outRows.push({ date: addDays(TODAY, -40), description: 'Funeral contribution', amount: -9000 });
run('S08', 'Outliers: two R9000 one-off spends in the last 60 days', classify(outRows), 3000, (f) =>
  `Heavy daily spend ${R(f.rates.pessimistic)} versus baseline; one-offs are treated as habitual and drive state.`);
const outThin = gen({ days: 20, payWeekday: 5, seed: 11 });
outThin.push({ date: addDays(TODAY, -5), description: 'Car repair', amount: -6000 });
run('S08b', 'Outlier in thin data: R6000 repair with 20 days of history', classify(outThin), 3000, (f) =>
  `Central daily spend ${R(f.rates.central)}: one repair dominates the median of 14 rolling windows.`);

// S09 Holiday with no income: last 3 weeks of weekly pay missing (salon closed).
const holiday = classify(gen({ days: 90, payWeekday: 5, holiday: [21, 1], rent: 2500 }));
run('S09', 'Holiday: no income for the last 21 days, weekly pattern before', holiday, 1500, (f) =>
  `Engine still expects pay on ${f.nextMoney!.typical} (pattern ${f.nextMoney!.pattern}). Nothing warns that three paydays were missed.`);

// S10 Bill that changes amount.
const billUp = gen({ days: 90, payWeekday: 5 });
billUp.push({ date: '2026-08-01', description: 'Rent', amount: -2000 }, { date: '2026-09-01', description: 'Rent', amount: -2000 }, { date: '2026-10-01', description: 'Rent', amount: -2600 });
const billUpTx = classify(billUp);
run('S10', 'Bill rises 30%: rent R2000, R2000, then R2600', billUpTx, 3000, (f) =>
  `Rent rows classified as ${billUpTx.filter((t) => t.description === 'Rent').map((t) => t.category).join(', ')}. Projected rent: ${f.recurringBills.find((b) => b.description === 'Rent')?.amount ?? 'none'}.`);
const billUp15 = gen({ days: 90, payWeekday: 5 });
billUp15.push({ date: '2026-08-01', description: 'Rent', amount: -2000 }, { date: '2026-09-01', description: 'Rent', amount: -2000 }, { date: '2026-10-01', description: 'Rent', amount: -2300 });
run('S10b', 'Bill rises 15%: rent R2000, R2000, then R2300', classify(billUp15), 3000, (f) =>
  `Projected rent R${f.recurringBills.find((b) => b.description === 'Rent')?.amount}: the median of the last three lags the new R2300.`);

// S11 Income that stops (lost platform access 35 days ago).
const stop = classify(gen({ days: 90, payWeekday: 5, incomeStopsDaysAgo: 35, rent: 2500 }));
run('S11', 'Income stopped 35 days ago (weekly pay before that)', stop, 2500, (f) =>
  `Five missed paydays, still pattern ${f.nextMoney!.pattern} with next money ${f.nextMoney!.typical}, amount ${f.nextMoney!.amountTypical}.`);
// Interval version: lumpy deposits that stopped 40 days ago.
const stopInt = gen({ days: 90, payWeekday: null, rent: 2500 });
for (const off of [88, 80, 73, 64, 57, 50, 40]) stopInt.push({ date: addDays(TODAY, -off), description: 'Cash deposit', amount: 5000 });
run('S11b', 'Lumpy deposits every 7 to 9 days, none in the last 40 days', classify(stopInt), 2500, (f) =>
  `Overdue rule restarts the window from tomorrow: next money ${f.nextMoney!.earliest} to ${f.nextMoney!.latest}.`);

// S12 Usual payday is today and the payout has not landed yet.
const payToday = classify(gen({ days: 90, payWeekday: 2, rent: 2500 })); // Tuesday pay; today is Tuesday
run('S12', 'Payday is today (Tuesday), payout not yet in balance', payToday, 400, (f) =>
  `Next money pushed a week to ${f.nextMoney!.typical}; state ${f.state} on a normal payday morning.`);
run('S12b', 'Payday is today, payout already in balance (R400 + R2000)', payToday, 2400, (f) => `With the pay in the balance the state is ${f.state}.`);

// S13 Big bill the day after next money (safe to spend ignores it).
const rentAfter = classify(gen({ days: 90, payWeekday: 5, rent: 3000, rentDay: 25 }));
run('S13', 'Rent R3000 due 25 Oct, the day after the latest next money (24 Oct)', rentAfter, 1600, (f) =>
  `Safe to spend R${f.safeToSpendToday} empties the account by the 24th, while rent of R3000 is due on the 25th and weekly pay is only about R2000.`);

// S14 Persona check: Ayanda as seeded today.
for (const p of ['thabo', 'lerato', 'ayanda'] as const) {
  const rec = seedRecord(p, TODAY);
  run(`P-${p}`, `Persona ${p} as seeded`, rec.transactions, rec.balance, (f) => {
    const daysToLatest = daysBetween(TODAY, f.nextMoney!.latest);
    const leftIfStsFollowed = rec.balance - f.billsTotalBeforeNextMoney - f.safeToSpendToday * daysToLatest;
    const bg = estimateIncome(rec.transactions, TODAY, f.historyDays).backgroundPerDay;
    return `Safe to spend is ${R((f.safeToSpendToday / f.rates.central) * 100)}% of usual spend. Following it every day leaves R${R(leftIfStsFollowed)} on ${f.nextMoney!.latest}. Small daily income ignored by the headline: R${R(bg)} a day.`;
  });
}

// Write outputs.
const cols = Object.keys(results[0]!) as (keyof Result)[];
const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
writeFileSync(`${OUT}/results.csv`, [cols.join(','), ...results.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');
const md = [
  '# Credit risk stress test results',
  '',
  `Generated by \`docs/review/tools/credit-risk/stress.ts\` with the real engine. Today is ${TODAY} (a Tuesday) unless the scenario says otherwise. Spend rates are rands a day (light / usual / heavy). "Heavy left after lending" is the heavy-week balance on the latest next money date after lending the safe-to-lend amount.`,
  '',
  '| id | scenario | balance | history | conf | pattern | next typical | next latest | spend L/U/H | band days | state | headline | gap | safe to spend | sts vs usual | safe to lend | heavy left after lending | help | observation |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...results.map((r) =>
    `| ${r.id} | ${r.scenario} | ${r.balance} | ${r.historyDays} | ${r.confidence} | ${r.pattern} | ${r.nextTypical} | ${r.nextLatest} | ${r.spendOptCentralPes} | ${r.bandWidthDays} | ${r.state} | ${r.headline} | ${r.gapDays} | ${r.safeToSpend} | ${r.stsVsUsual} | ${r.safeToLend} | ${Number.isNaN(r.heavyLeftAfterLending) ? '' : r.heavyLeftAfterLending} | ${r.help} | ${r.observation} |`,
  ),
  '',
  '## Recurring bills detected per scenario',
  '',
  ...results.map((r) => `- ${r.id}: ${r.bills}`),
  '',
];
writeFileSync(`${OUT}/results.md`, md.join('\n'));
for (const r of results) console.log(`${r.id.padEnd(8)} ${r.state.padEnd(6)} pat=${r.pattern.padEnd(8)} next=${r.nextTypical} sts=${r.safeToSpend} stl=${r.safeToLend} heavyLeft=${r.heavyLeftAfterLending} band=${r.bandWidthDays} rates=${r.spendOptCentralPes} | ${r.help} | ${r.observation}`);
