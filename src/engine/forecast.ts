import { projectBills, recurringBills } from './classify';
import { addDays, dayNumber, daysBetween, maxDate, weekday } from './dates';
import { median, percentile, sum } from './stats';
import type {
  Confidence,
  CoverState,
  DayProjection,
  Forecast,
  ForecastInput,
  ISODate,
  NextMoney,
  SpendRates,
  Transaction,
  UpcomingBill,
} from './types';

/** How far ahead the runway is projected. */
export const HORIZON_DAYS = 180;
/** Everyday spend is estimated from at most this many recent days. */
export const SPEND_WINDOW_DAYS = 60;
/** Scrubber length. */
export const TIMELINE_DAYS = 30;
/** A deposit counts as "next money" when it is at least this share of typical monthly income. */
export const SIGNIFICANT_INCOME_SHARE = 0.1;
/** Low confidence widens the gap between the central path and the outer paths by this factor. */
export const LOW_CONFIDENCE_SPREAD = 1.5;
/** When no income pattern is found, plan to this many days ahead. */
export const UNKNOWN_INCOME_DAYS = 30;

export function confidenceFor(historyDays: number): Confidence {
  if (historyDays >= 60) return 'high';
  if (historyDays >= 28) return 'medium';
  return 'low';
}

function historyDaysOf(transactions: Transaction[], today: ISODate): number {
  if (transactions.length === 0) return 0;
  let first = today;
  for (const t of transactions) if (t.date < first) first = t.date;
  return Math.max(0, daysBetween(first, today));
}

/** Totals per calendar day for the days in [from, to). */
function dailyTotals(transactions: Transaction[], from: ISODate, to: ISODate, pick: (t: Transaction) => number): number[] {
  const start = dayNumber(from);
  const len = Math.max(0, dayNumber(to) - start);
  const out = new Array<number>(len).fill(0);
  for (const t of transactions) {
    const i = dayNumber(t.date) - start;
    if (i >= 0 && i < len) out[i] = (out[i] ?? 0) + pick(t);
  }
  return out;
}

/**
 * Everyday spend per day. Median of rolling 7 day spend for the central path,
 * 80th percentile for the pessimistic path, 20th for the optimistic one, all divided by 7.
 */
export function estimateSpendRates(
  transactions: Transaction[],
  today: ISODate,
  windowDays: number,
  confidence: Confidence,
): SpendRates {
  if (windowDays <= 0) return { optimistic: 0, central: 0, pessimistic: 0 };
  const daily = dailyTotals(transactions, addDays(today, -windowDays), today, (t) =>
    t.category === 'spend' && t.amount < 0 ? -t.amount : 0,
  );
  const rolling: number[] = [];
  if (daily.length < 7) {
    rolling.push((sum(daily) / daily.length) * 7);
  } else {
    let acc = sum(daily.slice(0, 7));
    rolling.push(acc);
    for (let i = 7; i < daily.length; i++) {
      acc += (daily[i] ?? 0) - (daily[i - 7] ?? 0);
      rolling.push(acc);
    }
  }
  const central = median(rolling) / 7;
  let pessimistic = percentile(rolling, 0.8) / 7;
  let optimistic = percentile(rolling, 0.2) / 7;
  if (confidence === 'low') {
    pessimistic = central + (pessimistic - central) * LOW_CONFIDENCE_SPREAD;
    optimistic = Math.max(0, central - (central - optimistic) * LOW_CONFIDENCE_SPREAD);
  }
  return { optimistic, central, pessimistic };
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

interface IncomeModel {
  next: NextMoney;
  /** Typical small income per day that is not counted as next money. Used only in the scrubber. */
  backgroundPerDay: number;
}

/**
 * Finds the deposits that matter (at least 10% of typical monthly income) and their rhythm.
 * Weekday pattern: most of them land on the same weekday. Interval pattern: gaps between them.
 * Next money is always after today, since anything that landed today is already in the balance.
 */
export function estimateIncome(transactions: Transaction[], today: ISODate, historyDays: number): IncomeModel {
  const tomorrow = addDays(today, 1);
  const fallback: IncomeModel = {
    next: {
      earliest: addDays(today, UNKNOWN_INCOME_DAYS),
      typical: addDays(today, UNKNOWN_INCOME_DAYS),
      latest: addDays(today, UNKNOWN_INCOME_DAYS),
      amountLow: 0,
      amountTypical: 0,
      amountHigh: 0,
      pattern: 'unknown',
      typicalGapDays: UNKNOWN_INCOME_DAYS,
    },
    backgroundPerDay: 0,
  };
  if (historyDays <= 0) return fallback;

  const byDay = new Map<ISODate, number>();
  for (const t of transactions) {
    if (t.category !== 'income' || t.amount <= 0 || t.date >= today) continue;
    byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const total = sum(days.map(([, v]) => v));
  const monthly = (total / historyDays) * 30;
  const threshold = monthly * SIGNIFICANT_INCOME_SHARE;
  const significant = days.filter(([, v]) => v >= threshold);
  const background = days.filter(([, v]) => v < threshold);
  const windowDays = Math.min(historyDays, SPEND_WINDOW_DAYS);
  const windowStart = addDays(today, -windowDays);
  const backgroundPerDay = sum(background.filter(([d]) => d >= windowStart).map(([, v]) => v)) / windowDays;

  if (significant.length < 2) return { ...fallback, backgroundPerDay };

  const amounts = significant.map(([, v]) => v);
  const amountLow = roundTo(percentile(amounts, 0.2), 10);
  const amountTypical = roundTo(median(amounts), 10);
  const amountHigh = roundTo(percentile(amounts, 0.8), 10);

  // Weekday pattern: at least 3 deposits and 60% of them on one weekday.
  const counts = new Array<number>(7).fill(0);
  for (const [d] of significant) counts[weekday(d)] = (counts[weekday(d)] ?? 0) + 1;
  const topWeekday = counts.indexOf(Math.max(...counts));
  if (significant.length >= 3 && (counts[topWeekday] ?? 0) / significant.length >= 0.6) {
    let typical = tomorrow;
    while (weekday(typical) !== topWeekday) typical = addDays(typical, 1);
    return {
      next: {
        earliest: typical,
        typical,
        // Payouts sometimes clear a day late.
        latest: addDays(typical, 1),
        amountLow,
        amountTypical,
        amountHigh,
        pattern: 'weekday',
        weekday: topWeekday,
        typicalGapDays: 7,
      },
      backgroundPerDay,
    };
  }

  // Interval pattern: gaps between significant deposits.
  const gaps: number[] = [];
  for (let i = 1; i < significant.length; i++) gaps.push(daysBetween(significant[i - 1]![0], significant[i]![0]));
  const last = significant[significant.length - 1]![0];
  const gEarly = Math.max(1, Math.round(percentile(gaps, 0.2)));
  const gTyp = Math.max(gEarly, Math.round(median(gaps)));
  const gLate = Math.max(gTyp, Math.round(percentile(gaps, 0.8)));
  let earliest = addDays(last, gEarly);
  let typical = addDays(last, gTyp);
  let latest = addDays(last, gLate);
  if (latest < tomorrow) {
    // Overdue: keep the same spread but start from tomorrow.
    earliest = tomorrow;
    typical = addDays(tomorrow, gTyp - gEarly);
    latest = addDays(tomorrow, gLate - gEarly);
  } else {
    earliest = maxDate(earliest, tomorrow);
    typical = maxDate(typical, earliest);
  }
  return {
    next: { earliest, typical, latest, amountLow, amountTypical, amountHigh, pattern: 'interval', typicalGapDays: gTyp },
    backgroundPerDay,
  };
}

type Dated = { date: ISODate; amount: number };

/** First day the balance reaches zero or below, or null if it lasts the whole horizon. */
function zeroDate(balance: number, rate: number, today: ISODate, bills: UpcomingBill[], extras: Dated[]): ISODate | null {
  const billBy = new Map<ISODate, number>();
  for (const b of bills) billBy.set(b.date, (billBy.get(b.date) ?? 0) + b.amount);
  const extraBy = new Map<ISODate, number>();
  for (const e of extras) extraBy.set(e.date, (extraBy.get(e.date) ?? 0) + e.amount);
  let bal = balance;
  if (bal <= 0) return today;
  for (let d = 0; d < HORIZON_DAYS; d++) {
    const date = addDays(today, d);
    bal += extraBy.get(date) ?? 0;
    bal -= billBy.get(date) ?? 0;
    bal -= rate;
    if (bal <= 0) return date;
  }
  return null;
}

function covers(zero: ISODate | null, date: ISODate): boolean {
  return zero === null || zero >= date;
}

export function coverState(runway: { central: ISODate | null; pessimistic: ISODate | null }, next: NextMoney): CoverState {
  if (covers(runway.pessimistic, next.latest)) return 'enough';
  if (covers(runway.central, next.typical)) return 'tight';
  return 'short';
}

/** Income dates from `first`, repeating every `gap` days, inside [today, until]. */
function incomeDates(first: ISODate, gap: number, today: ISODate, until: ISODate): ISODate[] {
  const out: ISODate[] = [];
  let d = first;
  while (d <= until) {
    if (d >= today) out.push(d);
    d = addDays(d, Math.max(1, gap));
  }
  return out;
}

function buildTimeline(
  balance: number,
  today: ISODate,
  rates: SpendRates,
  model: IncomeModel,
  bills: UpcomingBill[],
  extras: Dated[],
): DayProjection[] {
  const until = addDays(today, TIMELINE_DAYS - 1);
  const next = model.next;
  const hasIncome = next.pattern !== 'unknown';
  const gap = next.typicalGapDays;
  const centralIncome = new Set(hasIncome ? incomeDates(next.typical, gap, today, until) : []);
  const optimisticIncome = new Set(hasIncome ? incomeDates(next.earliest, gap, today, until) : []);
  const pessimisticIncome = new Set(hasIncome ? incomeDates(next.latest, gap, today, until) : []);

  const out: DayProjection[] = [];
  let opt = balance;
  let mid = balance;
  let pes = balance;
  for (let d = 0; d < TIMELINE_DAYS; d++) {
    const date = addDays(today, d);
    const billsToday = bills.filter((b) => b.date === date);
    const billTotal = sum(billsToday.map((b) => b.amount));
    const extra = sum(extras.filter((e) => e.date === date).map((e) => e.amount));
    const incomeToday = centralIncome.has(date) ? next.amountTypical : 0;
    opt += extra - billTotal - rates.optimistic + model.backgroundPerDay + (optimisticIncome.has(date) ? next.amountHigh : 0);
    mid += extra - billTotal - rates.central + model.backgroundPerDay + incomeToday;
    pes += extra - billTotal - rates.pessimistic + model.backgroundPerDay * 0.5 + (pessimisticIncome.has(date) ? next.amountLow : 0);
    const state: CoverState = pes > 0 ? 'enough' : mid > 0 ? 'tight' : 'short';
    out.push({ date, optimistic: opt, central: mid, pessimistic: pes, state, billsToday, incomeToday });
  }
  return out;
}

export function forecast(input: ForecastInput): Forecast {
  const { transactions, balance, today } = input;
  const extras: Dated[] = (input.extras ?? []).map((e) => ({ date: maxDate(e.date, today), amount: e.amount }));
  const historyDays = historyDaysOf(transactions, today);
  const confidence = confidenceFor(historyDays);
  const windowDays = Math.min(historyDays, SPEND_WINDOW_DAYS);
  const rates = estimateSpendRates(transactions, today, windowDays, confidence);
  const model = estimateIncome(transactions, today, historyDays);
  const next = model.next;
  const horizonEnd = addDays(today, HORIZON_DAYS - 1);
  const recurring = recurringBills(transactions, today);
  const upcomingBills = projectBills(recurring, today, horizonEnd);

  const runway = {
    optimistic: zeroDate(balance, rates.optimistic, today, upcomingBills, extras),
    central: zeroDate(balance, rates.central, today, upcomingBills, extras),
    pessimistic: zeroDate(balance, rates.pessimistic, today, upcomingBills, extras),
  };
  const state = coverState(runway, next);
  const headlineDate = runway.central ?? horizonEnd;
  const runwayDays = daysBetween(today, headlineDate);

  const billsBeforeNextMoney = upcomingBills.filter((b) => b.date < next.latest);
  const billsTotalBeforeNextMoney = sum(billsBeforeNextMoney.map((b) => b.amount));
  const extrasBefore = sum(extras.filter((e) => e.date < next.latest).map((e) => e.amount));
  const daysToLatest = Math.max(1, daysBetween(today, next.latest));
  const perDay = (balance + extrasBefore - billsTotalBeforeNextMoney) / daysToLatest;
  const safeToSpendToday = Math.max(0, Math.floor(perDay / 5) * 5);

  return {
    today,
    balance,
    state,
    headlineDate,
    beyondHorizon: runway.central === null,
    runway,
    band: { from: runway.pessimistic ?? horizonEnd, to: runway.optimistic ?? horizonEnd },
    runwayDays,
    gapDays: state === 'short' ? Math.max(0, daysBetween(headlineDate, next.typical)) : 0,
    safeToSpendToday,
    nextMoney: next,
    rates,
    confidence,
    historyDays,
    windowDays,
    billsBeforeNextMoney,
    billsTotalBeforeNextMoney,
    upcomingBills,
    recurringBills: recurring,
    timeline: buildTimeline(balance, today, rates, model, upcomingBills, extras),
  };
}

const RANK: Record<CoverState, number> = { short: 0, tight: 1, enough: 2 };

export interface WhatIfResult {
  before: Forecast;
  after: Forecast;
  /** Positive means more days of cover. */
  deltaDays: number;
}

export function whatIf(input: ForecastInput, items: NonNullable<ForecastInput['extras']>): WhatIfResult {
  const before = forecast(input);
  const after = forecast({ ...input, extras: [...(input.extras ?? []), ...items] });
  return { before, after, deltaDays: after.runwayDays - before.runwayDays };
}

export interface LoanCheckResult {
  before: Forecast;
  after: Forecast;
  /** Days of cover the loan removes. Zero or positive. */
  daysOff: number;
  /** Largest amount, in R10 steps, that keeps the current cover state. Zero when already Short. */
  safeToLend: number;
}

export function loanCheck(input: ForecastInput, amount: number): LoanCheckResult {
  const before = forecast(input);
  const after = forecast({ ...input, balance: input.balance - Math.max(0, amount) });
  return {
    before,
    after,
    daysOff: Math.max(0, before.runwayDays - after.runwayDays),
    safeToLend: safeToLend(input, before.state),
  };
}

export function safeToLend(input: ForecastInput, current: CoverState = forecast(input).state): number {
  if (current === 'short' || input.balance <= 0) return 0;
  const keeps = (x: number) => RANK[forecast({ ...input, balance: input.balance - x }).state] >= RANK[current];
  let lo = 0;
  let hi = Math.floor(input.balance / 10);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (keeps(mid * 10)) lo = mid;
    else hi = mid - 1;
  }
  return lo * 10;
}
