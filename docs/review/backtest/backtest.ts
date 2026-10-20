/**
 * Tengo forecast backtest.
 *
 * Run from the repository root:
 *   npx vite-node docs/review/backtest/backtest.ts
 *
 * Writes CSV files to docs/review/backtest/results/. Read-only with respect to the app:
 * it imports the real engine and the real seed generator and changes nothing in src/.
 *
 * Design (see README.md in this folder and docs/review/data-scientist.md for definitions):
 *  - For each persona and each of 24 cut-off dates, build a history that ends the day before the
 *    cut-off and a 30 day hold-out that starts on the cut-off.
 *  - Source "shipped": the app's own generateHistory(persona, cutoff + 30), split at the cut-off.
 *    That gives 60 days of history and 30 days of hold-out.
 *  - Source "seedK": a line-for-line copy of the generator's persona rules (verified to reproduce
 *    generateHistory exactly for the shipped seed), run with other seeds and 120 days, so the
 *    sample is not one random path per weekday and 90 day histories can be tested.
 *  - History is truncated to 14, 28, 60 (and 90 for seedK) days and reclassified on the
 *    history alone, so no bill classification leaks from the future.
 *  - Six balances per case: three chosen by the app's startingBalance (enough, tight, short) and
 *    three engine-independent ones (7, 14, 21 days of the history's mean daily outflow).
 *  - Optional perturbations change only the hold-out (the future), never the history.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyRows } from '../../../src/engine/classify';
import { addDays, dayOfMonth, daysBetween, weekday } from '../../../src/engine/dates';
import { forecast } from '../../../src/engine/forecast';
import type { CoverState, ISODate, Transaction } from '../../../src/engine/types';
import { generateHistory, SEED_DAYS, startingBalance } from '../../../src/data/seed/generate';
import { createRng, type Rng } from '../../../src/data/seed/prng';
import type { PersonaId } from '../../../src/data/seed/personas';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'results');
mkdirSync(OUT, { recursive: true });

const PERSONAS: PersonaId[] = ['thabo', 'lerato', 'ayanda'];
const HOLDOUT = 30;
const N_CUTOFFS = 24;
const CUTOFF_START = '2025-10-06';
const CUTOFF_STEP = 15; // 15 days moves the weekday by one each step and walks through 12 months.
const SEEDS = 5;
const ENGINE_HORIZON = 180;

type Row = { date: ISODate; description: string; amount: number };

// ---------------------------------------------------------------------------------------------
// Copy of the persona rules in src/data/seed/generate.ts (lines 22 to 98), with seed and length
// as parameters. Verified below to reproduce generateHistory exactly for the shipped seed.
// ---------------------------------------------------------------------------------------------
type DayFn = (date: ISODate, i: number, rng: Rng, out: Row[]) => void;
function monthly(date: ISODate, dom: number, description: string, amount: number, out: Row[]) {
  if (dayOfMonth(date) === dom) out.push({ date, description, amount: -amount });
}
const thaboFn: DayFn = (date, _i, rng, out) => {
  const wd = weekday(date);
  if (wd !== 0 && rng.chance(0.85)) out.push({ date, description: 'Cash fares', amount: rng.amount(120, 340) });
  if (wd === 1) out.push({ date, description: 'Ride app weekly payout', amount: rng.amount(2300, 3300) });
  if (rng.chance(0.42)) out.push({ date, description: 'Fuel', amount: -rng.amount(260, 480) });
  if (rng.chance(0.7)) out.push({ date, description: rng.pick(['Food, taxi rank', 'Kota and cooldrink', 'Spaza snacks']), amount: -rng.amount(35, 95) });
  if (wd === 6) out.push({ date, description: 'Groceries', amount: -rng.amount(380, 720) });
  if (rng.chance(0.12)) out.push({ date, description: 'Data bundle', amount: -rng.pick([49, 99, 149]) });
  if (rng.chance(0.05)) out.push({ date, description: 'Car wash', amount: -rng.amount(60, 120) });
  monthly(date, 25, 'Car instalment', 3450, out);
  monthly(date, 7, 'Phone contract', 399, out);
  monthly(date, 15, 'Car insurance', 690, out);
};
const leratoFn: DayFn = (date, i, rng, out) => {
  const wd = weekday(date);
  if (wd === 6) out.push({ date, description: 'Salon takings', amount: rng.amount(1500, 2300) });
  if (wd === 0) out.push({ date, description: 'Salon takings', amount: rng.amount(450, 850) });
  if (wd === 5 && rng.chance(0.7)) out.push({ date, description: 'Salon takings', amount: rng.amount(250, 600) });
  if (wd >= 2 && wd <= 4 && rng.chance(0.3)) out.push({ date, description: 'Braiding client', amount: rng.amount(150, 320) });
  if (i % 14 === 3) out.push({ date, description: 'Hair products restock', amount: -rng.amount(850, 1350) });
  if (wd !== 0 && rng.chance(0.75)) out.push({ date, description: 'Taxi fare', amount: -rng.pick([22, 26, 30]) });
  if (rng.chance(0.55)) out.push({ date, description: rng.pick(['Lunch', 'Bread and milk', 'Airtime']), amount: -rng.amount(25, 80) });
  if (wd === 1) out.push({ date, description: 'Groceries', amount: -rng.amount(320, 560) });
  monthly(date, 1, 'Rent', 2800, out);
  monthly(date, 20, 'Phone contract', 199, out);
};
function ayandaFn(rng: Rng, days: number): DayFn {
  const deposits = new Set<number>();
  let i = days - 2;
  while (i >= 0) {
    deposits.add(i);
    i -= rng.int(4, 9);
  }
  const stock = new Set<number>();
  let s = days - 4;
  while (s >= 0) {
    stock.add(s);
    s -= rng.int(6, 11);
  }
  return (date, idx, r, out) => {
    if (deposits.has(idx)) out.push({ date, description: 'Cash deposit, shop takings', amount: r.amount(4200, 7600) });
    if (r.chance(0.6)) out.push({ date, description: 'Card machine sales', amount: r.amount(60, 210) });
    if (stock.has(idx)) out.push({ date, description: 'Wholesale stock', amount: -r.amount(2600, 4800) });
    if (r.chance(0.16)) out.push({ date, description: 'Prepaid electricity', amount: -r.pick([150, 200, 250, 300]) });
    if (r.chance(0.6)) out.push({ date, description: r.pick(['Taxi to wholesaler', 'Bread and milk', 'Airtime', 'Paraffin']), amount: -r.amount(25, 110) });
    if (r.chance(0.08)) out.push({ date, description: 'School shoes', amount: -r.amount(180, 320) });
    monthly(date, 5, 'Funeral policy', 185, out);
    monthly(date, 12, 'Phone contract', 149, out);
  };
}
/** Rows for `days` days ending the day before `end`, with any seed string. */
function generateRows(persona: PersonaId, seed: string, end: ISODate, days: number): Row[] {
  const rng = createRng(seed);
  const fn = persona === 'thabo' ? thaboFn : persona === 'lerato' ? leratoFn : ayandaFn(rng, days);
  const rows: Row[] = [];
  for (let i = 0; i < days; i++) fn(addDays(end, i - days), i, rng, rows);
  return rows;
}

function verifyCopy(): void {
  for (const p of PERSONAS) {
    for (const today of ['2026-10-20', '2026-03-03', '2025-12-31']) {
      const a = generateHistory(p, today).map((t) => `${t.date}|${t.description}|${t.amount}`);
      const b = generateRows(p, `tengo:${p}`, today, SEED_DAYS).map((t) => `${t.date}|${t.description}|${t.amount}`);
      if (a.join('\n') !== b.join('\n')) throw new Error(`Generator copy diverges for ${p} on ${today}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------
function toTransactions(rows: Row[], tag: string): Transaction[] {
  const cats = classifyRows(rows);
  return rows.map((r, i) => ({ id: `${tag}-${i}`, date: r.date, description: r.description, amount: r.amount, category: cats[i]! }));
}
function idx(date: ISODate | null, cutoff: ISODate): number {
  return date === null ? ENGINE_HORIZON : daysBetween(cutoff, date);
}
function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
}
function pct(n: number, d: number): number {
  return d ? (100 * n) / d : NaN;
}
function r1(x: number): number {
  return Math.round(x * 10) / 10;
}
/** Deterministic random numbers for perturbations, independent of the generator stream. */
function pRng(key: string): Rng {
  return createRng(`backtest-perturb:${key}`);
}
function gauss(r: Rng): number {
  const u = Math.max(1e-12, r.next());
  const v = r.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------------------------------------------------------------------------------------------
// Perturbations of the hold-out only
// ---------------------------------------------------------------------------------------------
type Perturb = 'none' | 'shock2000' | 'spend+25pct' | 'noise35' | 'income_late3' | 'income_missed' | 'new_bill800';
const PERTURBS: Perturb[] = ['none', 'shock2000', 'spend+25pct', 'noise35', 'income_late3', 'income_missed', 'new_bill800'];

function perturb(hold: Row[], kind: Perturb, cutoff: ISODate, threshold: number, key: string): Row[] {
  const r = pRng(`${key}:${kind}`);
  switch (kind) {
    case 'none':
      return hold;
    case 'shock2000': {
      // One emergency (funeral contribution, car repair) the generator never produces.
      const d = r.int(2, 12);
      return [...hold, { date: addDays(cutoff, d), description: 'Emergency', amount: -2000 }];
    }
    case 'spend+25pct':
      // Prices rise: every everyday outflow is 25 percent bigger. Fixed monthly debits unchanged.
      return hold.map((t) => (t.amount < 0 && !isFixedBill(t.description) ? { ...t, amount: t.amount * 1.25 } : t));
    case 'noise35': {
      // Heavier day-to-day volatility: log-normal noise, sigma 0.35, mean preserving.
      const s = 0.35;
      return hold.map((t) => (t.amount < 0 && !isFixedBill(t.description) ? { ...t, amount: t.amount * Math.exp(s * gauss(r) - (s * s) / 2) } : t));
    }
    case 'income_late3':
      return hold.map((t) => (t.amount >= threshold ? { ...t, date: addDays(t.date, 3) } : t));
    case 'income_missed': {
      const first = hold.filter((t) => t.amount >= threshold).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
      return first ? hold.filter((t) => t !== first) : hold;
    }
    case 'new_bill800':
      // A new debit order (a loan repayment taken last week) that is not in the history yet.
      return [...hold, { date: addDays(cutoff, 4), description: 'New loan repayment', amount: -800 }];
  }
}
const FIXED = new Set(['Car instalment', 'Phone contract', 'Car insurance', 'Rent', 'Funeral policy']);
function isFixedBill(d: string): boolean {
  return FIXED.has(d);
}

// ---------------------------------------------------------------------------------------------
// One case
// ---------------------------------------------------------------------------------------------
interface CaseRow {
  source: string;
  persona: PersonaId;
  cutoff: ISODate;
  cutoffWeekday: number;
  cutoffMonth: number;
  historyLen: number;
  scenario: string;
  perturb: Perturb;
  balance: number;
  confidence: string;
  engineState: CoverState;
  hindState: CoverState;
  hindState10: CoverState;
  hindState30: CoverState;
  engineCovered: number;
  hindCovered: number;
  fcCentral: number; // day index of forecast central zero date (180 = beyond horizon)
  fcBandFrom: number;
  fcBandTo: number;
  bandWidth: number;
  actualRunway: number; // day index, or -1 when censored (did not run out within the hold-out)
  censored: number;
  err: number | ''; // fcCentral - actualRunway, only when observed
  errCapped: number; // both capped at HOLDOUT
  baselineErr: number | '';
  bandCovered: number | ''; // 1, 0, or '' when undecidable
  bandMiss: string; // 'early' (actual before band), 'late', '' otherwise
  ranOutWithIncome: number; // day index or -1
  nmTypical: number;
  nmEarliest: number;
  nmLatest: number;
  nmActual: number; // -1 when no significant income in hold-out
  nmErr: number | '';
  nmInWindow: number | '';
  nmPattern: string;
  billsDetected: number;
  actualBucket: string;
  realShort: number; // 1 when the real balance, with all real income, hit zero before the next money
}

function runCase(
  source: string,
  persona: PersonaId,
  cutoff: ISODate,
  allRows: Row[],
  historyLen: number,
  scenario: string,
  kind: Perturb,
): CaseRow | null {
  const histRows = allRows.filter((r) => r.date < cutoff && r.date >= addDays(cutoff, -historyLen));
  const holdBase = allRows.filter((r) => r.date >= cutoff && r.date < addDays(cutoff, HOLDOUT));
  if (histRows.length === 0) return null;
  const tx = toTransactions(histRows, `${source}-${persona}-${cutoff}`);

  // Engine's own significance threshold for "next money", computed from the history only.
  const first = histRows.reduce((m, r) => (r.date < m ? r.date : m), cutoff);
  const historyDays = daysBetween(first, cutoff);
  const incomeTotal = histRows.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0);
  const threshold = (incomeTotal / historyDays) * 30 * 0.1;

  // Balance scenario.
  const meanOutflow = -histRows.filter((r) => r.amount < 0).reduce((a, r) => a + r.amount, 0) / historyDays;
  let balance: number;
  if (scenario.startsWith('target_')) balance = startingBalance(tx, cutoff, scenario.slice(7) as CoverState);
  else balance = Math.round(meanOutflow * Number(scenario.replace('cover', '')));
  if (balance <= 0) return null;

  const hold = perturb(holdBase, kind, cutoff, threshold, `${source}:${persona}:${cutoff}:${historyLen}:${scenario}`);

  const f = forecast({ transactions: tx, balance, today: cutoff });

  // Actual daily flows in the hold-out.
  const out = new Array<number>(HOLDOUT).fill(0);
  const inc = new Array<number>(HOLDOUT).fill(0);
  const sig = new Array<number>(HOLDOUT).fill(0);
  for (const r of hold) {
    const d = daysBetween(cutoff, r.date);
    if (d < 0 || d >= HOLDOUT) continue;
    if (r.amount < 0) out[d]! += -r.amount;
    else inc[d]! += r.amount;
  }
  // The engine treats money that lands on the cut-off day as already in the balance and looks for
  // next money from tomorrow, so day 0 income is excluded from "next money" and from the
  // with-income path. Day 0 outflows count, as the engine subtracts a day of spend on day 0.
  for (let d = 1; d < HOLDOUT; d++) sig[d] = inc[d]! >= threshold ? 1 : 0;
  inc[0] = 0;

  // Actual runway: money held minus actual outflows, ignoring new income (the engine's definition).
  let bal = balance;
  let actualRunway = -1;
  for (let d = 0; d < HOLDOUT; d++) {
    bal -= out[d]!;
    if (bal <= 0) {
      actualRunway = d;
      break;
    }
  }
  // Actual run-out including real income.
  let balI = balance;
  let ranOut = -1;
  for (let d = 0; d < HOLDOUT; d++) {
    balI += inc[d]! - out[d]!;
    if (balI <= 0) {
      ranOut = d;
      break;
    }
  }
  // Actual next money.
  const nmActual = sig.indexOf(1);

  // Hindsight state. Covered means the balance stayed above zero through the day before the next
  // money actually arrived (same convention as the engine: running out on the arrival day counts
  // as covered). Enough additionally needs a buffer of at least 20 percent of the outflows of that
  // period left over; 10 and 30 percent are sensitivity variants.
  const A = nmActual === -1 ? HOLDOUT : nmActual;
  let periodOut = 0;
  for (let d = 0; d < A; d++) periodOut += out[d]!;
  const left = balance - periodOut;
  const hs = (buf: number): CoverState => (left <= 0 && A > 0 ? 'short' : left >= buf * periodOut ? 'enough' : 'tight');
  const hindState = hs(0.2);

  const fcCentral = idx(f.runway.central, cutoff);
  const fcFrom = idx(f.runway.pessimistic, cutoff);
  const fcTo = idx(f.runway.optimistic, cutoff);
  const censored = actualRunway === -1 ? 1 : 0;

  let bandCovered: number | '' = '';
  let bandMiss = '';
  if (!censored) {
    bandCovered = actualRunway >= fcFrom && actualRunway <= fcTo ? 1 : 0;
    if (actualRunway < fcFrom) bandMiss = 'early';
    else if (actualRunway > fcTo) bandMiss = 'late';
  } else if (fcTo < HOLDOUT) {
    bandCovered = 0;
    bandMiss = 'late';
  }

  // Naive baseline: balance divided by mean daily outflow (spend and bills) of the last 28 days.
  const last28 = histRows.filter((r) => r.date >= addDays(cutoff, -Math.min(28, historyDays)) && r.amount < 0);
  const rate28 = -last28.reduce((a, r) => a + r.amount, 0) / Math.min(28, historyDays);
  const baseIdx = rate28 > 0 ? Math.max(0, Math.ceil(balance / rate28) - 1) : ENGINE_HORIZON;

  const nmTypical = f.nextMoney ? idx(f.nextMoney.typical, cutoff) : -1;
  const nmEarliest = f.nextMoney ? idx(f.nextMoney.earliest, cutoff) : -1;
  const nmLatest = f.nextMoney ? idx(f.nextMoney.latest, cutoff) : -1;

  return {
    source,
    persona,
    cutoff,
    cutoffWeekday: weekday(cutoff),
    cutoffMonth: Number(cutoff.slice(5, 7)),
    historyLen,
    scenario,
    perturb: kind,
    balance,
    confidence: f.confidence,
    engineState: f.state,
    hindState,
    hindState10: hs(0.1),
    hindState30: hs(0.3),
    engineCovered: f.state === 'short' ? 0 : 1,
    hindCovered: hindState === 'short' ? 0 : 1,
    fcCentral,
    fcBandFrom: fcFrom,
    fcBandTo: fcTo,
    bandWidth: fcTo - fcFrom,
    actualRunway,
    censored,
    err: censored ? '' : fcCentral - actualRunway,
    errCapped: Math.min(fcCentral, HOLDOUT) - (censored ? HOLDOUT : actualRunway),
    baselineErr: censored ? '' : Math.min(baseIdx, ENGINE_HORIZON) - actualRunway,
    bandCovered,
    bandMiss,
    ranOutWithIncome: ranOut,
    nmTypical,
    nmEarliest,
    nmLatest,
    nmActual,
    nmErr: nmActual === -1 ? '' : nmTypical - nmActual,
    nmInWindow: nmActual === -1 ? '' : nmActual >= nmEarliest && nmActual <= nmLatest ? 1 : 0,
    nmPattern: f.nextMoney?.pattern ?? 'none',
    billsDetected: f.recurringBills.length,
    realShort: ranOut !== -1 && ranOut < A ? 1 : 0,
    actualBucket: censored ? 'not within 30' : actualRunway <= 6 ? '0 to 6' : actualRunway <= 13 ? '7 to 13' : actualRunway <= 20 ? '14 to 20' : '21 to 29',
  };
}

// ---------------------------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------------------------
verifyCopy();
const cutoffs: ISODate[] = Array.from({ length: N_CUTOFFS }, (_, k) => addDays(CUTOFF_START, k * CUTOFF_STEP));
const SCENARIOS = ['target_enough', 'target_tight', 'target_short', 'cover7', 'cover14', 'cover21'];
const rows: CaseRow[] = [];

// Generator diversity check: how many distinct random paths does the shipped generator produce?
const fingerprints = new Map<PersonaId, Set<string>>();

for (const p of PERSONAS) {
  fingerprints.set(p, new Set());
  for (const cutoff of cutoffs) {
    // Shipped generator: 90 days ending cutoff + 29, so 60 days history and 30 days hold-out.
    const shipped: Row[] = generateHistory(p, addDays(cutoff, HOLDOUT));
    fingerprints.get(p)!.add(shipped.filter((r) => !FIXED.has(r.description)).map((r) => r.amount).join(','));
    for (const h of [14, 28, 60]) {
      for (const sc of SCENARIOS) {
        for (const kind of h === 60 ? PERTURBS : (['none'] as Perturb[])) {
          const row = runCase('shipped', p, cutoff, shipped, h, sc, kind);
          if (row) rows.push(row);
        }
      }
    }
    // Other seeds through the verified copy: 120 days, 90 history and 30 hold-out.
    for (let k = 1; k <= SEEDS; k++) {
      // The seed includes the cut-off so every (cut-off, seed) pair is an independent path.
      const seeded = generateRows(p, `tengo:${p}:backtest${k}:${cutoff}`, addDays(cutoff, HOLDOUT), 90 + HOLDOUT);
      for (const h of [14, 28, 60, 90]) {
        for (const sc of SCENARIOS) {
          const row = runCase(`seed${k}`, p, cutoff, seeded, h, sc, 'none');
          if (row) rows.push(row);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------------------------
function toCsv(objs: Record<string, unknown>[]): string {
  if (!objs.length) return '';
  const cols = Object.keys(objs[0]!);
  const esc = (v: unknown) => {
    const s = typeof v === 'number' ? (Number.isFinite(v) ? String(Math.round(v * 1000) / 1000) : '') : String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...objs.map((o) => cols.map((c) => esc(o[c])).join(','))].join('\n') + '\n';
}

function summarise(group: CaseRow[]): Record<string, number> {
  const obs = group.filter((r) => r.err !== '');
  const errs = obs.map((r) => r.err as number);
  const base = obs.map((r) => r.baselineErr as number);
  const dec = group.filter((r) => r.bandCovered !== '');
  const nm = group.filter((r) => r.nmErr !== '');
  const covAgree = group.filter((r) => r.engineCovered === r.hindCovered).length;
  const falseReassure = group.filter((r) => r.engineCovered === 1 && r.hindCovered === 0).length;
  const hindShort = group.filter((r) => r.hindCovered === 0).length;
  const engShort = group.filter((r) => r.engineCovered === 0).length;
  const falseAlarm = group.filter((r) => r.engineCovered === 0 && r.hindCovered === 1).length;
  return {
    n: group.length,
    n_observed: obs.length,
    censored_pct: pct(group.length - obs.length, group.length),
    mae_days: mean(errs.map(Math.abs)),
    bias_days: mean(errs),
    median_abs_err: errs.length ? [...errs.map(Math.abs)].sort((a, b) => a - b)[Math.floor(errs.length / 2)]! : NaN,
    within1_pct: pct(errs.filter((e) => Math.abs(e) <= 1).length, errs.length),
    within3_pct: pct(errs.filter((e) => Math.abs(e) <= 3).length, errs.length),
    mae_capped_all: mean(group.map((r) => Math.abs(r.errCapped))),
    baseline_mae_days: mean(base.map(Math.abs)),
    band_n_decidable: dec.length,
    band_coverage_pct: pct(dec.filter((r) => r.bandCovered === 1).length, dec.length),
    band_miss_early_pct: pct(dec.filter((r) => r.bandMiss === 'early').length, dec.length),
    band_miss_late_pct: pct(dec.filter((r) => r.bandMiss === 'late').length, dec.length),
    band_width_mean: mean(group.filter((r) => r.fcBandTo < ENGINE_HORIZON).map((r) => r.bandWidth)),
    state_acc_pct: pct(group.filter((r) => r.engineState === r.hindState).length, group.length),
    state_acc_buf10_pct: pct(group.filter((r) => r.engineState === r.hindState10).length, group.length),
    state_acc_buf30_pct: pct(group.filter((r) => r.engineState === r.hindState30).length, group.length),
    covered_acc_pct: pct(covAgree, group.length),
    false_reassurance_pct: pct(falseReassure, group.length),
    short_recall_pct: pct(group.filter((r) => r.engineCovered === 0 && r.hindCovered === 0).length, hindShort),
    false_alarm_share_of_short_pct: pct(falseAlarm, engShort),
    real_short_pct: pct(group.filter((r) => r.realShort === 1).length, group.length),
    engine_short_precision_vs_real_pct: pct(group.filter((r) => r.engineCovered === 0 && r.realShort === 1).length, engShort),
    engine_covered_but_real_short_pct: pct(group.filter((r) => r.engineCovered === 1 && r.realShort === 1).length, group.length),
    ran_out_with_income_pct: pct(group.filter((r) => r.ranOutWithIncome !== -1).length, group.length),
    nm_n: nm.length,
    nm_mae_days: mean(nm.map((r) => Math.abs(r.nmErr as number))),
    nm_exact_pct: pct(nm.filter((r) => r.nmErr === 0).length, nm.length),
    nm_in_window_pct: pct(nm.filter((r) => r.nmInWindow === 1).length, nm.length),
  };
}

function groupBy(rs: CaseRow[], keys: (keyof CaseRow)[]): Record<string, unknown>[] {
  const m = new Map<string, CaseRow[]>();
  for (const r of rs) {
    const k = keys.map((key) => String(r[key])).join('|');
    const l = m.get(k) ?? [];
    l.push(r);
    m.set(k, l);
  }
  return [...m.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, g]) => {
      const parts = k.split('|');
      const head: Record<string, unknown> = {};
      keys.forEach((key, i) => (head[key] = parts[i]));
      return { ...head, ...summarise(g) };
    });
}

const base = rows.filter((r) => r.perturb === 'none');
const shipped60 = base.filter((r) => r.source === 'shipped' && r.historyLen === 60);
const seeded = base.filter((r) => r.source !== 'shipped');

writeFileSync(join(OUT, 'cases.csv'), toCsv(rows as unknown as Record<string, unknown>[]));
writeFileSync(join(OUT, 'summary_headline.csv'), toCsv([
  { slice: 'shipped generator, 60 day history, all balances', ...summarise(shipped60) },
  { slice: 'other seeds, 90 day history, all balances', ...summarise(seeded.filter((r) => r.historyLen === 90)) },
  { slice: 'other seeds, 60 day history, all balances', ...summarise(seeded.filter((r) => r.historyLen === 60)) },
  { slice: 'shipped, 60 day, engine-independent balances only', ...summarise(shipped60.filter((r) => r.scenario.startsWith('cover'))) },
  { slice: 'shipped, 60 day, startingBalance targets only', ...summarise(shipped60.filter((r) => r.scenario.startsWith('target'))) },
]));
writeFileSync(join(OUT, 'summary_by_persona.csv'), toCsv(groupBy(shipped60, ['persona'])));
writeFileSync(join(OUT, 'summary_by_persona_seeded90.csv'), toCsv(groupBy(seeded.filter((r) => r.historyLen === 90), ['persona'])));
writeFileSync(join(OUT, 'summary_by_history.csv'), toCsv([
  ...groupBy(base.filter((r) => r.source === 'shipped'), ['source', 'historyLen']).map((o) => ({ ...o, source: 'shipped' })),
  ...groupBy(seeded.map((r) => ({ ...r, source: 'seeds' })), ['source', 'historyLen']),
]));
writeFileSync(join(OUT, 'summary_by_persona_history.csv'), toCsv(groupBy(base.filter((r) => r.source === 'shipped'), ['persona', 'historyLen'])));
writeFileSync(join(OUT, 'summary_by_lead_time.csv'), toCsv(groupBy(seeded.filter((r) => r.historyLen === 90), ['actualBucket'])));
writeFileSync(join(OUT, 'summary_by_persona_history_seeds.csv'), toCsv(groupBy(seeded, ['persona', 'historyLen'])));
writeFileSync(join(OUT, 'summary_by_scenario_seeds90.csv'), toCsv(groupBy(seeded.filter((r) => r.historyLen === 90), ['scenario'])));
writeFileSync(join(OUT, 'summary_by_scenario.csv'), toCsv(groupBy(shipped60, ['scenario'])));
writeFileSync(join(OUT, 'summary_by_weekday.csv'), toCsv(groupBy(shipped60, ['persona', 'cutoffWeekday'])));
writeFileSync(join(OUT, 'perturbation.csv'), toCsv(groupBy(rows.filter((r) => r.source === 'shipped' && r.historyLen === 60), ['perturb'])));
writeFileSync(join(OUT, 'perturbation_by_persona.csv'), toCsv(groupBy(rows.filter((r) => r.source === 'shipped' && r.historyLen === 60), ['perturb', 'persona'])));

// Confusion matrices.
const conf: Record<string, unknown>[] = [];
for (const [label, set] of [
  ['shipped60', shipped60],
  ['seeds90', seeded.filter((r) => r.historyLen === 90)],
  ['shipped14', base.filter((r) => r.source === 'shipped' && r.historyLen === 14)],
] as const) {
  for (const e of ['enough', 'tight', 'short'] as CoverState[]) {
    const g = set.filter((r) => r.engineState === e);
    conf.push({
      slice: label,
      engine_state: e,
      n: g.length,
      hind_enough: g.filter((r) => r.hindState === 'enough').length,
      hind_tight: g.filter((r) => r.hindState === 'tight').length,
      hind_short: g.filter((r) => r.hindState === 'short').length,
    });
  }
}
writeFileSync(join(OUT, 'state_confusion.csv'), toCsv(conf));

// Calibration: where does the actual date fall relative to the band? Position 0 = pessimistic
// edge, 1 = optimistic edge, observed cases only, plus signed errors for histograms.
writeFileSync(
  join(OUT, 'calibration_points.csv'),
  toCsv(
    base
      .filter((r) => r.censored === 0)
      .map((r) => ({
        source: r.source === 'shipped' ? 'shipped' : 'seeds',
        persona: r.persona,
        historyLen: r.historyLen,
        scenario: r.scenario,
        err: r.err,
        baselineErr: r.baselineErr,
        fcBandFrom: r.fcBandFrom,
        fcBandTo: r.fcBandTo,
        fcCentral: r.fcCentral,
        actual: r.actualRunway,
        position: r.fcBandTo === r.fcBandFrom ? (r.actualRunway < r.fcBandFrom ? -0.5 : r.actualRunway > r.fcBandTo ? 1.5 : 0.5) : (r.actualRunway - r.fcBandFrom) / (r.fcBandTo - r.fcBandFrom),
      })),
  ),
);

// Diversity of the shipped generator.
writeFileSync(
  join(OUT, 'generator_diversity.csv'),
  toCsv(PERSONAS.map((p) => ({ persona: p, cutoffs: N_CUTOFFS, distinct_random_paths: fingerprints.get(p)!.size }))),
);

// Console headline.
const h = summarise(shipped60);
console.log(`cases: ${rows.length} (no perturbation: ${base.length})`);
console.log('generator diversity', PERSONAS.map((p) => `${p}=${fingerprints.get(p)!.size}`).join(' '));
console.log('shipped 60d headline', Object.fromEntries(Object.entries(h).map(([k, v]) => [k, r1(v)])));
for (const o of groupBy(base.filter((r) => r.source === 'shipped'), ['historyLen'])) console.log('history', o.historyLen, 'mae', r1(o.mae_days as number), 'cov', r1(o.band_coverage_pct as number), 'state', r1(o.state_acc_pct as number), 'falseReassure', r1(o.false_reassurance_pct as number));
