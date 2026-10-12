import { classifyRows } from '../../engine/classify';
import { addDays, dayOfMonth, weekday } from '../../engine/dates';
import { forecast } from '../../engine/forecast';
import type { CoverState, ISODate, Transaction } from '../../engine/types';
import { createRng, type Rng } from './prng';
import type { PersonaId } from './personas';

export const SEED_DAYS = 90;

interface RawRow {
  date: ISODate;
  description: string;
  amount: number;
}

type DayFn = (date: ISODate, i: number, rng: Rng, out: RawRow[]) => void;

function monthly(date: ISODate, dom: number, description: string, amount: number, out: RawRow[]) {
  if (dayOfMonth(date) === dom) out.push({ date, description, amount: -amount });
}

/** Thabo: e-hailing driver. Cash fares most days, an app payout every Monday, fuel every few days. */
const thabo: DayFn = (date, _i, rng, out) => {
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

/** Lerato: hairdresser. Saturdays carry the week, Sundays and Fridays help, rent on the 1st. */
const lerato: DayFn = (date, i, rng, out) => {
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

/** Ayanda: spaza shop owner. Lumpy cash deposits, big stock runs, prepaid electricity top ups. */
function ayandaFactory(depositDays: Set<number>, stockDays: Set<number>): DayFn {
  return (date, i, rng, out) => {
    if (depositDays.has(i)) out.push({ date, description: 'Cash deposit, shop takings', amount: rng.amount(4200, 7600) });
    if (rng.chance(0.6)) out.push({ date, description: 'Card machine sales', amount: rng.amount(60, 210) });
    if (stockDays.has(i)) out.push({ date, description: 'Wholesale stock', amount: -rng.amount(2600, 4800) });
    if (rng.chance(0.16)) out.push({ date, description: 'Prepaid electricity', amount: -rng.pick([150, 200, 250, 300]) });
    if (rng.chance(0.6)) out.push({ date, description: rng.pick(['Taxi to wholesaler', 'Bread and milk', 'Airtime', 'Paraffin']), amount: -rng.amount(25, 110) });
    if (rng.chance(0.08)) out.push({ date, description: 'School shoes', amount: -rng.amount(180, 320) });
    monthly(date, 5, 'Funeral policy', 185, out);
    monthly(date, 12, 'Phone contract', 149, out);
  };
}

/**
 * Ayanda's deposits are placed backwards from two days ago at 4 to 9 day gaps,
 * so the next deposit is still a few days out on any demo date.
 */
function ayandaSchedule(rng: Rng): { deposits: Set<number>; stock: Set<number> } {
  const deposits = new Set<number>();
  let i = SEED_DAYS - 2;
  while (i >= 0) {
    deposits.add(i);
    i -= rng.int(4, 9);
  }
  const stock = new Set<number>();
  let s = SEED_DAYS - 4;
  while (s >= 0) {
    stock.add(s);
    s -= rng.int(6, 11);
  }
  return { deposits, stock };
}

const DAY_FNS: Record<PersonaId, (rng: Rng) => DayFn> = {
  thabo: () => thabo,
  lerato: () => lerato,
  ayanda: (rng) => {
    const { deposits, stock } = ayandaSchedule(rng);
    return ayandaFactory(deposits, stock);
  },
};

/** The same 90 days for a persona every time, ending yesterday. */
export function generateHistory(personaId: PersonaId, today: ISODate): Transaction[] {
  const rng = createRng(`tengo:${personaId}`);
  const dayFn = DAY_FNS[personaId](rng);
  const rows: RawRow[] = [];
  for (let i = 0; i < SEED_DAYS; i++) {
    dayFn(addDays(today, i - SEED_DAYS), i, rng, rows);
  }
  const categories = classifyRows(rows);
  return rows.map((r, idx) => ({
    id: `${personaId}-${String(idx).padStart(4, '0')}`,
    date: r.date,
    description: r.description,
    amount: r.amount,
    category: categories[idx]!,
  }));
}

function stateFor(transactions: Transaction[], balance: number, today: ISODate): CoverState {
  return forecast({ transactions, balance, today }).state;
}

/** Smallest whole-rand balance whose cover state is at least `target`, by bisection. */
function minBalanceFor(transactions: Transaction[], today: ISODate, target: CoverState): number {
  const rank: Record<CoverState, number> = { short: 0, tight: 1, enough: 2 };
  let lo = 1;
  let hi = 200_000;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (rank[stateFor(transactions, mid, today)] >= rank[target]) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/**
 * Picks a current balance that puts the persona in its intended starting state.
 * Enough sits a little above the Enough line, Tight sits inside the Tight range,
 * Short sits a few days short of the next money.
 */
export function startingBalance(transactions: Transaction[], today: ISODate, target: CoverState): number {
  const tightMin = minBalanceFor(transactions, today, 'tight');
  const enoughMin = minBalanceFor(transactions, today, 'enough');
  let balance: number;
  if (target === 'enough') balance = enoughMin * 1.18;
  else if (target === 'tight') balance = tightMin + (enoughMin - tightMin) * 0.45;
  else balance = tightMin * 0.6;
  balance = Math.max(10, Math.round(balance / 10) * 10 + 7);
  // Nudge if rounding moved it across a line.
  for (let k = 0; k < 50 && stateFor(transactions, balance, today) !== target; k++) {
    balance += target === 'short' ? -10 : 10;
    if (balance <= 0) break;
  }
  return Math.max(0, balance);
}
