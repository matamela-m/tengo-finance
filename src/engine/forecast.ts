import { descriptionKey, missedBills as findMissedBills, projectBills, recurringBills } from './classify';
import { addDays, dayNumber, dayOfMonth, daysBetween, maxDate, minDate, weekday } from './dates';
import { median, percentile, sum } from './stats';
import type {
  Confidence,
  CoverState,
  DayProjection,
  Forecast,
  ForecastInput,
  IncomeInfo,
  ISODate,
  NextMoney,
  OneOff,
  SpendRates,
  Status,
  Transaction,
  UnclearReason,
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
/** When no money is expected, the state is judged against this many days ahead. */
export const UNKNOWN_INCOME_DAYS = 30;
/** Bills due up to this many days after the latest next money are kept back from the daily budget. */
export const RESERVE_DAYS_AFTER = 7;
/** A balance older than this many days lowers confidence; older than STALE_HIDE_DAYS hides the state. */
export const STALE_LOWER_DAYS = 3;
export const STALE_HIDE_DAYS = 14;
/** Under this many days of history there is not enough to tell. */
export const MIN_HISTORY_DAYS = 14;
/** Under this many days of history Enough is not shown: the best is Tight. */
export const ENOUGH_MIN_HISTORY_DAYS = 28;
/** Income counts as paused when nothing significant has landed for more than this many usual gaps. */
export const PAUSED_AFTER_GAPS = 2;
/** Automatic one-off detection needs this much history; with less, a big spend may be a habit. */
export const ONE_OFF_MIN_HISTORY_DAYS = 45;
/** A spend this many times the median spending day, seen only once, is a one-off. */
export const ONE_OFF_SPEND_FACTOR = 5;
export const ONE_OFF_MIN_AMOUNT = 500;
/** A deposit this many times the median income day, not repeated, is a windfall. */
export const WINDFALL_FACTOR = 4;
export const WINDFALL_MIN_AMOUNT = 1000;
/** Money in whose description contains one of these words is not income. Configurable. */
export const NOT_INCOME_WORDS = ['loan', 'refund', 'reversal', 'advance', 'credit facility', 'transfer from savings'];
/** Month end starts on this day of the month. */
export const MONTH_END_FROM_DAY = 25;
/**
 * Share of small daily income (card sales, tips) counted on each path, in the headline and the chart alike.
 * Conservative because these amounts are the least reliable.
 */
export const BACKGROUND_SHARE = { optimistic: 1, central: 0.5, pessimistic: 0.25 } as const;
/** Month-end spend must be at least this much above other days to count as a pattern. */
export const MONTH_END_MIN_UPLIFT = 1.3;
/** Without enough history for a month-end pattern, the heavy path is this much heavier near month end. */
export const MONTH_END_WIDEN = 1.25;
/**
 * Band calibration. The likely range is at least `base + perLead * lead` days either side of the date,
 * by confidence, and at most `maxShare * lead + 2`. Calibrated on the synthetic backtest to cover the actual
 * date about 80 percent of the time at every lead time up to 20 days (it was 54 percent within 6 days);
 * see docs/review/after/COMPARISON.md and the README.
 */
export const BAND_CALIBRATION = {
  base: { high: 1, medium: 1, low: 3 },
  perLead: 0.15,
  /** Never wider than this share of the lead on either side, plus two days. */
  maxShare: 0.5,
} as const;

export function confidenceFor(historyDays: number): Confidence {
  if (historyDays >= 60) return 'high';
  if (historyDays >= 28) return 'medium';
  return 'low';
}

function historyDaysOf(transactions: Transaction[], end: ISODate): number {
  if (transactions.length === 0) return 0;
  let first = end;
  for (const t of transactions) if (t.date < first) first = t.date;
  return Math.max(0, daysBetween(first, end));
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

const spendOf = (t: Transaction) => (t.category === 'spend' && t.amount < 0 ? -t.amount : 0);

/**
 * Everyday spend per day. Median of rolling 7 day spend for the central path,
 * 80th percentile for the pessimistic path, 20th for the optimistic one, all divided by 7.
 * `end` is the day after the last day of history.
 */
export function estimateSpendRates(transactions: Transaction[], end: ISODate, windowDays: number, confidence: Confidence): SpendRates {
  if (windowDays <= 0) return { optimistic: 0, central: 0, pessimistic: 0 };
  const daily = dailyTotals(transactions, addDays(end, -windowDays), end, spendOf);
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

/**
 * With under SHORT_HISTORY_DAYS of history a monthly bill may have shown up once and not yet be known as a bill,
 * so the usual spend is never below the plain average of every outflow in the window. A naive average
 * beat the percentile rule on short histories in the review's backtest (DATA-04).
 */
export const SHORT_HISTORY_DAYS = 45;
function shortHistoryFloor(rates: SpendRates, transactions: Transaction[], end: ISODate, windowDays: number, historyDays: number): SpendRates {
  if (historyDays >= SHORT_HISTORY_DAYS || windowDays <= 0) return rates;
  const from = addDays(end, -windowDays);
  const out = sum(transactions.filter((t) => t.amount < 0 && t.date >= from && t.date < end).map((t) => -t.amount)) / windowDays;
  if (out <= rates.central) return rates;
  const lift = out - rates.central;
  return { optimistic: rates.optimistic + lift, central: out, pessimistic: rates.pessimistic + lift };
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

function keyCounts(transactions: Transaction[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of transactions) {
    const k = descriptionKey(t.description);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/**
 * One-offs left out of usual spend and of the income pattern: anything the person marked, money in that
 * reads as a loan or refund, and very large amounts that are not repeated. They stay in the history and
 * in the balance; they just do not set the daily rate or the income rhythm. Under 45 days of history a big
 * spend may be a habit, so it still counts and is returned with why 'ask' for the person to decide.
 */
export function findOneOffs(transactions: Transaction[], end: ISODate, historyDays = ONE_OFF_MIN_HISTORY_DAYS): OneOff[] {
  const counts = keyCounts(transactions);
  const auto = historyDays >= ONE_OFF_MIN_HISTORY_DAYS;
  const spendDays = dailyTotals(transactions, addDays(end, -400), end, spendOf).filter((v) => v > 0);
  const spendCap = Math.max(ONE_OFF_MIN_AMOUNT, ONE_OFF_SPEND_FACTOR * median(spendDays));
  const incomeDays = dailyTotals(transactions, addDays(end, -400), end, (t) => (t.category === 'income' && t.amount > 0 ? t.amount : 0)).filter(
    (v) => v > 0,
  );
  const incomeCap = Math.max(WINDFALL_MIN_AMOUNT, WINDFALL_FACTOR * median(incomeDays));
  const out: OneOff[] = [];
  for (const t of transactions) {
    if (t.date >= end) continue;
    const seen = counts.get(descriptionKey(t.description)) ?? 0;
    let why: OneOff['why'] | null = null;
    if (t.oneOff && t.category !== 'bill') why = 'marked';
    else if (t.category === 'income' && t.amount > 0) {
      const d = t.description.toLowerCase();
      if (NOT_INCOME_WORDS.some((w) => d.includes(w))) why = 'listed';
      // Leaving a windfall out of income is the cautious direction, so twice is still rare.
      else if (seen <= 2 && t.amount > incomeCap) why = 'large';
    } else if (t.category === 'spend' && t.amount < 0 && seen === 1 && -t.amount > spendCap) why = auto ? 'large' : 'ask';
    if (why) out.push({ id: t.id, date: t.date, description: t.description, amount: t.amount, why });
  }
  return out;
}

interface IncomeModel {
  next: NextMoney | null;
  info: IncomeInfo;
}

/**
 * Finds the deposits that matter (at least 10% of typical monthly income) and their rhythm.
 * Weekday pattern: most of them land on the same weekday. Interval pattern: gaps between them.
 * Payments that landed before the end of history are already in the balance, so next money is after them.
 * Paused: nothing significant for more than two usual gaps. Pending today: the usual payment is due today
 * and has not landed, so it is still expected rather than pushed to the next cycle.
 */
export function estimateIncome(transactions: Transaction[], today: ISODate, historyDays: number, end: ISODate = today): IncomeModel {
  const tomorrow = addDays(today, 1);
  const none = (status: IncomeInfo['status'], backgroundPerDay = 0, extra: Partial<IncomeInfo> = {}): IncomeModel => ({
    next: null,
    info: { status, lastDate: null, daysSinceLast: null, usualGapDays: null, backgroundPerDay, ...extra },
  });
  if (historyDays <= 0) return none('none');

  const byDay = new Map<ISODate, number>();
  for (const t of transactions) {
    if (t.category !== 'income' || t.amount <= 0 || t.date >= end) continue;
    byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const total = sum(days.map(([, v]) => v));
  if (total <= 0) return none('none');
  const monthly = (total / historyDays) * 30;
  const threshold = monthly * SIGNIFICANT_INCOME_SHARE;
  const significant = days.filter(([, v]) => v >= threshold);
  const background = days.filter(([, v]) => v < threshold);
  const windowDays = Math.min(historyDays, SPEND_WINDOW_DAYS);
  const windowStart = addDays(end, -windowDays);
  const backgroundPerDay = sum(background.filter(([d]) => d >= windowStart).map(([, v]) => v)) / windowDays;

  if (significant.length < 2) return none('irregular', backgroundPerDay);

  const amounts = significant.map(([, v]) => v);
  const amountLow = roundTo(percentile(amounts, 0.2), 10);
  const amountTypical = roundTo(median(amounts), 10);
  const amountHigh = roundTo(percentile(amounts, 0.8), 10);
  const last = significant[significant.length - 1]![0];
  const daysSinceLast = daysBetween(last, end);
  // A payment dated today is already in the balance.
  const landedToday = transactions.some((t) => t.category === 'income' && t.date === today && t.amount >= threshold);

  // Weekday pattern: at least 3 deposits and 60% of them on one weekday.
  const counts = new Array<number>(7).fill(0);
  for (const [d] of significant) counts[weekday(d)] = (counts[weekday(d)] ?? 0) + 1;
  const topWeekday = counts.indexOf(Math.max(...counts));
  if (significant.length >= 3 && (counts[topWeekday] ?? 0) / significant.length >= 0.6) {
    const info: IncomeInfo = { status: 'regular', lastDate: last, daysSinceLast, usualGapDays: 7, backgroundPerDay };
    if (daysSinceLast > PAUSED_AFTER_GAPS * 7) return { next: null, info: { ...info, status: 'paused' } };
    const pending = weekday(today) === topWeekday && !landedToday && today >= end;
    let typical = pending ? today : tomorrow;
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
      info: { ...info, status: pending ? 'pendingToday' : 'regular' },
    };
  }

  // Interval pattern: gaps between significant deposits. A wider 10th to 90th percentile window,
  // because lumpy deposits are often a few days early or late.
  const gaps: number[] = [];
  for (let i = 1; i < significant.length; i++) gaps.push(daysBetween(significant[i - 1]![0], significant[i]![0]));
  const gEarly = Math.max(1, Math.round(percentile(gaps, 0.1)));
  const gTyp = Math.max(gEarly, Math.round(median(gaps)));
  const gLate = Math.max(gTyp, Math.round(percentile(gaps, 0.9)));
  const info: IncomeInfo = { status: 'regular', lastDate: last, daysSinceLast, usualGapDays: gTyp, backgroundPerDay };
  if (daysSinceLast > PAUSED_AFTER_GAPS * gTyp) return { next: null, info: { ...info, status: 'paused' } };
  let earliest = addDays(last, gEarly);
  let typical = addDays(last, gTyp);
  let latest = addDays(last, gLate);
  const pending = typical === today && !landedToday;
  if (pending) {
    earliest = today;
  } else if (latest < tomorrow) {
    // Overdue but not yet paused: keep the same spread but start from tomorrow.
    earliest = tomorrow;
    typical = addDays(tomorrow, gTyp - gEarly);
    latest = addDays(tomorrow, gLate - gEarly);
  } else {
    earliest = maxDate(earliest, tomorrow);
    typical = maxDate(typical, earliest);
  }
  return {
    next: { earliest, typical, latest, amountLow, amountTypical, amountHigh, pattern: 'interval', typicalGapDays: gTyp },
    info: { ...info, status: pending ? 'pendingToday' : 'regular' },
  };
}

/** Month-end effect from history: spend on the 25th onwards against other days. */
function monthEndEffect(transactions: Transaction[], end: ISODate, historyDays: number): Forecast['monthEnd'] {
  const from = addDays(end, -Math.min(historyDays, 120));
  const daily = dailyTotals(transactions, from, end, spendOf);
  const monthsSeen = new Set<string>();
  let me = 0;
  let meDays = 0;
  let other = 0;
  let otherDays = 0;
  daily.forEach((v, i) => {
    const date = addDays(from, i);
    if (dayOfMonth(date) >= MONTH_END_FROM_DAY) {
      me += v;
      meDays += 1;
      monthsSeen.add(date.slice(0, 7));
    } else {
      other += v;
      otherDays += 1;
    }
  });
  if (monthsSeen.size < 2 || meDays < 8 || otherDays < 20) return { mode: 'widened', factor: MONTH_END_WIDEN };
  const meAvg = me / meDays;
  const otherAvg = other / otherDays;
  // The central rate is a median, close to an ordinary day, so the uplift is measured against ordinary days.
  if (otherAvg > 0 && meAvg / otherAvg >= MONTH_END_MIN_UPLIFT) return { mode: 'pattern', factor: meAvg / otherAvg };
  return { mode: 'none', factor: 1 };
}

type Dated = { date: ISODate; amount: number };

interface PathRates {
  /** Spend on a given day. */
  rate: (date: ISODate) => number;
  /** Small daily income counted on this path. */
  background: number;
}

function pathRates(base: number, background: number, monthEnd: Forecast['monthEnd'], heavy: boolean): PathRates {
  return {
    rate: (date) => {
      if (dayOfMonth(date) < MONTH_END_FROM_DAY) return base;
      if (monthEnd.mode === 'pattern') return base * monthEnd.factor;
      if (monthEnd.mode === 'widened' && heavy) return base * monthEnd.factor;
      return base;
    },
    background,
  };
}

/** First day the balance reaches zero or below, or null if it lasts the whole horizon. */
function zeroDate(balance: number, path: PathRates, today: ISODate, bills: UpcomingBill[], extras: Dated[]): ISODate | null {
  const billBy = new Map<ISODate, number>();
  for (const b of bills) billBy.set(b.date, (billBy.get(b.date) ?? 0) + b.amount);
  const extraBy = new Map<ISODate, number>();
  for (const e of extras) extraBy.set(e.date, (extraBy.get(e.date) ?? 0) + e.amount);
  let bal = balance;
  if (bal <= 0) return today;
  for (let d = 0; d < HORIZON_DAYS; d++) {
    const date = addDays(today, d);
    bal += (extraBy.get(date) ?? 0) + path.background;
    bal -= billBy.get(date) ?? 0;
    bal -= path.rate(date);
    if (bal <= 0) return date;
  }
  return null;
}

function covers(zero: ISODate | null, date: ISODate): boolean {
  return zero === null || zero >= date;
}

export function coverState(runway: { central: ISODate | null; pessimistic: ISODate | null }, target: { typical: ISODate; latest: ISODate }): CoverState {
  if (covers(runway.pessimistic, target.latest)) return 'enough';
  if (covers(runway.central, target.typical)) return 'tight';
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
  paths: { optimistic: PathRates; central: PathRates; pessimistic: PathRates },
  next: NextMoney | null,
  bills: UpcomingBill[],
  extras: Dated[],
): DayProjection[] {
  const until = addDays(today, TIMELINE_DAYS - 1);
  const gap = next?.typicalGapDays ?? 0;
  const centralIncome = new Set(next ? incomeDates(next.typical, gap, today, until) : []);
  const optimisticIncome = new Set(next ? incomeDates(next.earliest, gap, today, until) : []);
  const pessimisticIncome = new Set(next ? incomeDates(next.latest, gap, today, until) : []);

  const out: DayProjection[] = [];
  let opt = balance;
  let mid = balance;
  let pes = balance;
  for (let d = 0; d < TIMELINE_DAYS; d++) {
    const date = addDays(today, d);
    const billsToday = bills.filter((b) => b.date === date);
    const billTotal = sum(billsToday.map((b) => b.amount));
    const extra = sum(extras.filter((e) => e.date === date).map((e) => e.amount));
    const incomeToday = next && centralIncome.has(date) ? next.amountTypical : 0;
    opt += extra - billTotal - paths.optimistic.rate(date) + paths.optimistic.background + (next && optimisticIncome.has(date) ? next.amountHigh : 0);
    mid += extra - billTotal - paths.central.rate(date) + paths.central.background + incomeToday;
    pes += extra - billTotal - paths.pessimistic.rate(date) + paths.pessimistic.background + (next && pessimisticIncome.has(date) ? next.amountLow : 0);
    const state: CoverState = pes > 0 ? 'enough' : mid > 0 ? 'tight' : 'short';
    out.push({ date, optimistic: opt, central: mid, pessimistic: pes, state, billsToday, incomeToday });
  }
  return out;
}

/** The likely range for the date, widened to a calibrated minimum and capped far out. */
function calibratedBand(
  central: ISODate | null,
  pessimistic: ISODate | null,
  optimistic: ISODate | null,
  today: ISODate,
  horizonEnd: ISODate,
  confidence: Confidence,
): { from: ISODate; to: ISODate } {
  const rawFrom = pessimistic ?? horizonEnd;
  const rawTo = optimistic ?? horizonEnd;
  if (!central) return { from: rawFrom, to: horizonEnd };
  const lead = daysBetween(today, central);
  const minHalf = Math.ceil(BAND_CALIBRATION.base[confidence] + BAND_CALIBRATION.perLead * lead);
  const maxHalf = Math.max(minHalf, Math.round(BAND_CALIBRATION.maxShare * lead) + 2);
  const from = maxDate(today, minDate(rawFrom, addDays(central, -minHalf)));
  const to = minDate(horizonEnd, maxDate(rawTo, addDays(central, minHalf)));
  return { from: maxDate(from, addDays(central, -maxHalf)), to: minDate(to, addDays(central, maxHalf)) };
}

export function forecast(input: ForecastInput): Forecast {
  const { transactions, balance, today } = input;
  const dataEnd = minDate(input.dataEnd ?? today, today);
  const extras: Dated[] = (input.extras ?? []).map((e) => ({ date: maxDate(e.date, today), amount: e.amount }));
  const historyDays = historyDaysOf(transactions, dataEnd);
  const oneOffs = findOneOffs(transactions, dataEnd, historyDays);
  // One-offs are left out. With a short history a large spend still counts and the person is asked instead,
  // because leaving out a habit would make the date too late.
  const skip = new Set(oneOffs.filter((o) => o.why !== 'ask').map((o) => o.id));
  const clean = skip.size ? transactions.filter((t) => !skip.has(t.id)) : transactions;

  let confidence = confidenceFor(historyDays);
  const windowDays = Math.min(historyDays, SPEND_WINDOW_DAYS);
  const model = estimateIncome(clean, today, historyDays, dataEnd);
  const next = model.next;
  const income = model.info;
  // No usable rhythm means the outer paths are less certain too.
  if (income.status === 'paused' || income.status === 'irregular') confidence = 'low';
  const asOfDaysAgo = input.now ? Math.max(0, daysBetween(today, input.now)) : 0;
  if (asOfDaysAgo > STALE_LOWER_DAYS) confidence = confidence === 'high' ? 'medium' : 'low';
  const rates = shortHistoryFloor(estimateSpendRates(clean, dataEnd, windowDays, confidence), clean, dataEnd, windowDays, historyDays);
  const monthEnd = monthEndEffect(clean, dataEnd, historyDays);
  // Small daily income only counts alongside a known rhythm and four weeks of history. Without them it may
  // be most of the income, or bills may not have shown up yet, and counting it would be false reassurance.
  const bg = (income.status === 'regular' || income.status === 'pendingToday') && historyDays >= ENOUGH_MIN_HISTORY_DAYS ? income.backgroundPerDay : 0;
  const paths = {
    optimistic: pathRates(rates.optimistic, bg * BACKGROUND_SHARE.optimistic, monthEnd, false),
    central: pathRates(rates.central, bg * BACKGROUND_SHARE.central, monthEnd, false),
    pessimistic: pathRates(rates.pessimistic, bg * BACKGROUND_SHARE.pessimistic, monthEnd, true),
  };

  const horizonEnd = addDays(today, HORIZON_DAYS - 1);
  const recurring = recurringBills(clean, today);
  const decisions = input.billDecisions ?? {};
  const missedAll = findMissedBills(recurring, dataEnd);
  const owedBills: UpcomingBill[] = missedAll.filter((m) => decisions[m.id] === 'owed').map((m) => ({ description: m.description, date: today, amount: m.amount }));
  const missedBills = missedAll.filter((m) => !decisions[m.id]).map(({ id, description, amount, dueDate }) => ({ id, description, amount, dueDate }));
  const upcomingBills = [...owedBills, ...projectBills(recurring, today, horizonEnd)].sort((a, b) => (a.date < b.date ? -1 : 1));

  const coverTarget: Forecast['coverTarget'] = next
    ? { kind: 'nextMoney', typical: next.typical, latest: next.latest }
    : { kind: 'horizon', typical: addDays(today, UNKNOWN_INCOME_DAYS), latest: addDays(today, UNKNOWN_INCOME_DAYS) };

  const runway = {
    optimistic: zeroDate(balance, paths.optimistic, today, upcomingBills, extras),
    central: zeroDate(balance, paths.central, today, upcomingBills, extras),
    pessimistic: zeroDate(balance, paths.pessimistic, today, upcomingBills, extras),
  };

  const billsBeforeNextMoney = upcomingBills.filter((b) => b.date < coverTarget.latest);
  const billsTotalBeforeNextMoney = sum(billsBeforeNextMoney.map((b) => b.amount));
  const reserveEnd = addDays(coverTarget.latest, RESERVE_DAYS_AFTER);
  const reserveBills = next ? upcomingBills.filter((b) => b.date >= coverTarget.latest && b.date <= reserveEnd) : [];
  // Keep back only the part of those bills that a low next payment would not cover on its own.
  const reserve = next ? Math.max(0, Math.round(sum(reserveBills.map((b) => b.amount)) - next.amountLow)) : 0;

  let state = coverState(runway, coverTarget);
  // Enough means a heavy week still reaches next money with the reserve untouched. If the reserve
  // would be eaten into, it is Tight, with the reserve named as the reason.
  let reserveLimited = false;
  if (state === 'enough' && reserve > 0 && !covers(zeroDate(balance - reserve, paths.pessimistic, today, upcomingBills, extras), coverTarget.latest)) {
    state = 'tight';
    reserveLimited = true;
  }
  // Short history: the best it can say is Tight.
  if (state === 'enough' && historyDays < ENOUGH_MIN_HISTORY_DAYS) state = 'tight';

  let unclearReason: UnclearReason | null = null;
  if (asOfDaysAgo > STALE_HIDE_DAYS) unclearReason = 'stale';
  else if (historyDays < MIN_HISTORY_DAYS) unclearReason = 'thin';
  else if (income.status === 'none') unclearReason = 'noIncome';
  const status: Status = unclearReason ? 'unclear' : state;

  const headlineDate = runway.central ?? horizonEnd;
  const runwayDays = daysBetween(today, headlineDate);

  const extrasBefore = sum(extras.filter((e) => e.date < coverTarget.latest).map((e) => e.amount));
  const daysToLatest = Math.max(1, daysBetween(today, coverTarget.latest));
  const perDay = (balance + extrasBefore - billsTotalBeforeNextMoney - reserve) / daysToLatest;
  const dailyBudget = Math.max(0, Math.floor(perDay / 5) * 5);

  return {
    today,
    dataEnd,
    asOfDaysAgo,
    balance,
    state,
    status,
    unclearReason,
    income,
    coverTarget,
    overdrawn: balance < 0 ? -balance : 0,
    missedBills,
    owedBills,
    oneOffs,
    monthEnd,
    headlineDate,
    beyondHorizon: runway.central === null,
    runway,
    band: calibratedBand(runway.central, runway.pessimistic, runway.optimistic, today, horizonEnd, confidence),
    runwayDays,
    gapDays: state === 'short' ? Math.max(0, daysBetween(headlineDate, coverTarget.typical)) : 0,
    dailyBudget,
    reserve,
    reserveBills,
    reserveLimited,
    nextMoney: next,
    rates,
    confidence,
    historyDays,
    windowDays,
    billsBeforeNextMoney,
    billsTotalBeforeNextMoney,
    upcomingBills,
    recurringBills: recurring,
    timeline: buildTimeline(balance, today, paths, next, upcomingBills, extras),
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
  /** Largest amount, in R10 steps, that keeps the current cover state and the reserve. Zero when already Short. */
  roomToLend: number;
}

export function loanCheck(input: ForecastInput, amount: number): LoanCheckResult {
  const before = forecast(input);
  const after = forecast({ ...input, balance: input.balance - Math.max(0, amount) });
  return {
    before,
    after,
    daysOff: Math.max(0, before.runwayDays - after.runwayDays),
    roomToLend: roomToLend(input, before.state),
  };
}

/**
 * Room to lend or give: the largest amount, in R10 steps, that keeps the current cover state
 * while the reserve for bills just after next money stays untouched. It is the same room as
 * setting money aside, not an extra amount. It says nothing about whether the money comes back.
 * Zero whenever Tengo cannot be sure: Short, not enough to tell, income paused or irregular, or low confidence.
 */
export function roomToLend(input: ForecastInput, current?: CoverState): number {
  const base = forecast(input);
  const state = current ?? base.state;
  if (state === 'short' || input.balance <= 0 || base.status === 'unclear' || base.confidence === 'low' || base.income.status !== 'regular') return 0;
  // The state already protects the reserve for Enough; a budget above zero protects it for Tight.
  const keeps = (x: number) => {
    const after = forecast({ ...input, balance: input.balance - x });
    return RANK[after.state] >= RANK[state] && after.dailyBudget > 0;
  };
  if (!keeps(0)) return 0;
  let lo = 0;
  let hi = Math.floor(input.balance / 10);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (keeps(mid * 10)) lo = mid;
    else hi = mid - 1;
  }
  return lo * 10;
}
