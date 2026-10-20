import type { CoverState, Forecast, ISODate, UpcomingBill } from './types';

/**
 * The Home view model. One rule: the cover state decides every word and number on Home.
 * Every Home element (headline, chip, gauge, daily budget, next money, chart readout, messages)
 * reads from this object, never from the forecast directly, so they cannot disagree.
 */

export type HeadlineLabel = 'enoughUntil' | 'enoughBeyond' | 'tightUntil' | 'shortFrom';

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
      /** Days between running out and the typical next money. */
      gapDays: number;
    };

export interface NextMoneyView {
  /** The one next-money date shown on Home: the typical date. The range lives in the Why drawer. */
  date: ISODate;
  amountLow: number;
  amountHigh: number;
  amountTypical: number;
}

export interface HomeView {
  state: CoverState;
  headline: { label: HeadlineLabel; date: ISODate };
  /** 1 lit segment for Short, 2 for Tight, 3 for Enough. */
  gauge: 1 | 2 | 3;
  /** Key under stateCard for the one plain line under the chip. */
  summaryKey: CoverState | 'tightReserve';
  gapDays: number;
  budget: BudgetView;
  nextMoney: NextMoneyView | null;
  /** The chart always shows the case where money lands as usual, against the same next-money date. */
  chart: { assumption: 'ifUsual'; nextMoneyDate: ISODate | null };
  confidence: Forecast['confidence'];
}

const GAUGE: Record<CoverState, 1 | 2 | 3> = { short: 1, tight: 2, enough: 3 };

export function headlineLabel(f: Pick<Forecast, 'state' | 'beyondHorizon'>): HeadlineLabel {
  if (f.state === 'short') return 'shortFrom';
  if (f.state === 'tight') return 'tightUntil';
  return f.beyondHorizon ? 'enoughBeyond' : 'enoughUntil';
}

/** Locale key for the headline label, for screens that show a forecast outside Home. */
export function headlineKey(f: Pick<Forecast, 'state' | 'beyondHorizon'>): string {
  return `hero.${headlineLabel(f)}`;
}

export function homeView(f: Forecast): HomeView {
  const n = f.nextMoney && f.nextMoney.pattern !== 'unknown' ? f.nextMoney : null;
  const usual = Math.round(f.rates.central);
  const budget: BudgetView =
    f.state === 'short'
      ? { kind: 'notAdvised', usual, gapDays: f.gapDays }
      : f.dailyBudget <= 0
        ? { kind: 'nothingSpare', usual, reserve: f.reserve, reserveBills: f.reserveBills }
        : { kind: 'amount', amount: f.dailyBudget, usual, bills: f.billsTotalBeforeNextMoney, reserve: f.reserve, reserveBills: f.reserveBills };
  return {
    state: f.state,
    headline: { label: headlineLabel(f), date: f.headlineDate },
    gauge: GAUGE[f.state],
    summaryKey: f.reserveLimited ? 'tightReserve' : f.state,
    gapDays: f.state === 'short' ? f.gapDays : 0,
    budget,
    nextMoney: n ? { date: n.typical, amountLow: n.amountLow, amountHigh: n.amountHigh, amountTypical: n.amountTypical } : null,
    chart: { assumption: 'ifUsual', nextMoneyDate: n ? n.typical : null },
    confidence: f.confidence,
  };
}
