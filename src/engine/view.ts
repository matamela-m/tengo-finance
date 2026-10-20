import { addDays, daysBetween } from './dates';
import type { Forecast, ISODate, MissedBillInfo, Status, UpcomingBill } from './types';

/**
 * The Home view model. One rule: the status decides every word and number on Home.
 * Every Home element (headline, chip, gauge, daily budget, next money, chart readout, notices, messages)
 * reads from this object, never from the forecast directly, so they cannot disagree.
 */

export type HeadlineLabel = 'enoughUntil' | 'enoughBeyond' | 'tightUntil' | 'shortFrom' | 'unclear';

export type BudgetView =
  | {
      kind: 'amount';
      /** Rands per day, rounded down to R5. */
      amount: number;
      /** Usual everyday spend per day, shown beside the budget so it can be compared. */
      usual: number;
      bills: number;
      reserve: number;
      reserveBills: UpcomingBill[];
    }
  | {
      /** Enough or Tight, but everything left is needed for bills and the reserve. */
      kind: 'nothingSpare';
      usual: number;
      reserve: number;
      reserveBills: UpcomingBill[];
    }
  | {
      kind: 'notAdvised';
      usual: number;
      /** Days between running out and the typical next money, or null when no money is expected. */
      gapDays: number | null;
      overdrawn: number;
    }
  /** The usual payment is due today and is not in yet: the budget waits for it. */
  | { kind: 'pending' }
  | { kind: 'unclear' };

export interface NextMoneyView {
  /** The one next-money date shown on Home: the typical date. The range lives in the Why drawer. */
  date: ISODate;
  amountLow: number;
  amountHigh: number;
  amountTypical: number;
  pendingToday: boolean;
}

export type Notice =
  | { kind: 'overdrawn'; amount: number }
  /** The balance is from the end of a statement, not today. */
  | { kind: 'asOf'; statementEnd: ISODate; daysAgo: number }
  /** The history ends on this date, before the balance date. */
  | { kind: 'historyEnds'; date: ISODate }
  | { kind: 'paused'; lastDate: ISODate | null }
  | { kind: 'irregular' }
  | { kind: 'pendingToday' }
  | { kind: 'missedBill'; bill: MissedBillInfo }
  | { kind: 'oneOffs'; count: number }
  /** Some of the history is estimated from setup answers. */
  | { kind: 'estimated' }
  /** A large spend in a short history: still counted, the person can mark it as a one-off. */
  | { kind: 'askOneOff'; id: string; description: string; amount: number; date: ISODate };

export type SummaryKey =
  | 'enough'
  | 'tight'
  | 'short'
  | 'tightReserve'
  | 'enoughHorizon'
  | 'tightHorizon'
  | 'shortHorizon'
  | 'enoughDaily'
  | 'tightDaily'
  | 'shortDaily'
  | 'unclearThin'
  | 'unclearNoIncome'
  | 'unclearStale';

export interface HomeView {
  status: Status;
  headline: { label: HeadlineLabel; date: ISODate | null };
  /** 1 lit segment for Short, 2 for Tight, 3 for Enough, 0 when it is not clear. */
  gauge: 0 | 1 | 2 | 3;
  /** Key under stateCard for the one plain line under the chip. */
  summaryKey: SummaryKey;
  /** Values for the summary line. */
  summary: { count: number; amount: number; date: ISODate | null; days: number };
  gapDays: number;
  budget: BudgetView;
  nextMoney: NextMoneyView | null;
  /** The chart always shows the case where money lands as usual, against the same next-money date. */
  chart: { assumption: 'ifUsual'; nextMoneyDate: ISODate | null };
  confidence: Forecast['confidence'];
  /** Plain notices above the fold, most urgent first. */
  notices: Notice[];
  /** Money comes in most days: the next-money tile says so instead of a date. */
  dailyIncome: boolean;
}

const GAUGE: Record<Status, 0 | 1 | 2 | 3> = { unclear: 0, short: 1, tight: 2, enough: 3 };

export function headlineLabel(f: Pick<Forecast, 'status' | 'beyondHorizon'>): HeadlineLabel {
  if (f.status === 'unclear') return 'unclear';
  if (f.status === 'short') return 'shortFrom';
  if (f.status === 'tight') return 'tightUntil';
  return f.beyondHorizon ? 'enoughBeyond' : 'enoughUntil';
}

/** Locale key for the headline label, for screens that show a forecast outside Home. */
export function headlineKey(f: Pick<Forecast, 'status' | 'beyondHorizon'>): string {
  return `hero.${headlineLabel(f)}`;
}

function summaryKey(f: Forecast): SummaryKey {
  if (f.status === 'unclear') return f.unclearReason === 'noIncome' ? 'unclearNoIncome' : f.unclearReason === 'stale' ? 'unclearStale' : 'unclearThin';
  if (f.coverTarget.kind === 'horizon') return `${f.status}${f.income.status === 'daily' ? 'Daily' : 'Horizon'}` as SummaryKey;
  if (f.reserveLimited) return 'tightReserve';
  return f.status;
}

export function homeView(f: Forecast): HomeView {
  const unclear = f.status === 'unclear';
  const n = !unclear && f.nextMoney ? f.nextMoney : null;
  const pendingToday = f.income.status === 'pendingToday' && !unclear;
  const usual = Math.round(f.rates.central);
  let budget: BudgetView;
  if (unclear) budget = { kind: 'unclear' };
  else if (f.status === 'short')
    budget = { kind: 'notAdvised', usual, gapDays: f.coverTarget.kind === 'nextMoney' ? f.gapDays : null, overdrawn: f.overdrawn };
  else if (pendingToday) budget = { kind: 'pending' };
  else if (f.dailyBudget <= 0) budget = { kind: 'nothingSpare', usual, reserve: f.reserve, reserveBills: f.reserveBills };
  else budget = { kind: 'amount', amount: f.dailyBudget, usual, bills: f.billsTotalBeforeNextMoney, reserve: f.reserve, reserveBills: f.reserveBills };

  const notices: Notice[] = [];
  if (f.overdrawn > 0) notices.push({ kind: 'overdrawn', amount: f.overdrawn });
  if (f.asOfDaysAgo > 0) notices.push({ kind: 'asOf', statementEnd: addDays(f.today, -1), daysAgo: f.asOfDaysAgo });
  else if (f.dataEnd < f.today) notices.push({ kind: 'historyEnds', date: addDays(f.dataEnd, -1) });
  // When it is not clear, the headline already says why; income notices would only repeat it.
  if (f.income.status === 'paused' && !unclear) notices.push({ kind: 'paused', lastDate: f.income.lastDate });
  if (f.income.status === 'irregular' && !unclear) notices.push({ kind: 'irregular' });
  if (pendingToday) notices.push({ kind: 'pendingToday' });
  for (const bill of f.missedBills) notices.push({ kind: 'missedBill', bill });
  if (f.estimated) notices.push({ kind: 'estimated' });
  const left = f.oneOffs.filter((o) => o.why !== 'ask');
  if (left.length > 0) notices.push({ kind: 'oneOffs', count: left.length });
  for (const o of f.oneOffs.filter((x) => x.why === 'ask')) notices.push({ kind: 'askOneOff', id: o.id, description: o.description, amount: -o.amount, date: o.date });

  return {
    status: f.status,
    headline: { label: headlineLabel(f), date: unclear ? null : f.headlineDate },
    gauge: GAUGE[f.status],
    summaryKey: summaryKey(f),
    summary: {
      count: f.status === 'short' ? f.gapDays : 0,
      amount: f.reserve,
      // With no income, the runway itself is still a useful fact.
      date: f.unclearReason === 'noIncome' && !f.beyondHorizon ? f.headlineDate : null,
      days: Math.max(0, daysBetween(f.today, f.coverTarget.typical)),
    },
    gapDays: f.status === 'short' && f.coverTarget.kind === 'nextMoney' ? f.gapDays : 0,
    budget,
    nextMoney: n ? { date: n.typical, amountLow: n.amountLow, amountHigh: n.amountHigh, amountTypical: n.amountTypical, pendingToday } : null,
    chart: { assumption: 'ifUsual', nextMoneyDate: n ? n.typical : null },
    confidence: f.confidence,
    notices,
    dailyIncome: f.income.status === 'daily' && !unclear,
  };
}
