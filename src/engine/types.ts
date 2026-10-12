/** Calendar day as "YYYY-MM-DD". */
export type ISODate = string;

export type Category = 'income' | 'spend' | 'bill';

export interface Transaction {
  id: string;
  date: ISODate;
  description: string;
  /** Rands. Positive is money in, negative is money out. */
  amount: number;
  category: Category;
}

export type CoverState = 'enough' | 'tight' | 'short';
export type Confidence = 'high' | 'medium' | 'low';
export type IncomePattern = 'weekday' | 'interval' | 'unknown';

export interface SpendRates {
  /** Rands per day. */
  optimistic: number;
  central: number;
  pessimistic: number;
}

export interface NextMoney {
  earliest: ISODate;
  typical: ISODate;
  latest: ISODate;
  amountLow: number;
  amountTypical: number;
  amountHigh: number;
  pattern: IncomePattern;
  /** For weekday patterns, 0 is Sunday. */
  weekday?: number;
  /** Median days between significant deposits. */
  typicalGapDays: number;
}

export interface UpcomingBill {
  description: string;
  date: ISODate;
  amount: number;
}

export interface RecurringBill {
  key: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  occurrences: number;
  lastDate: ISODate;
  nextDate: ISODate;
}

export interface Runway {
  /** Day the path first reaches zero, or null if it stays above zero for the whole horizon. */
  optimistic: ISODate | null;
  central: ISODate | null;
  pessimistic: ISODate | null;
}

export interface DayProjection {
  date: ISODate;
  optimistic: number;
  central: number;
  pessimistic: number;
  state: CoverState;
  billsToday: UpcomingBill[];
  incomeToday: number;
}

export interface Forecast {
  today: ISODate;
  balance: number;
  state: CoverState;
  /** The headline date: central zero date, or horizon end when it never runs out. */
  headlineDate: ISODate;
  /** True when the central path never reaches zero inside the horizon. */
  beyondHorizon: boolean;
  runway: Runway;
  /** Range band, pessimistic to optimistic zero dates. */
  band: { from: ISODate; to: ISODate };
  /** Days from today to the central zero date. */
  runwayDays: number;
  /** For Short: days between running out and the typical next money. */
  gapDays: number;
  safeToSpendToday: number;
  nextMoney: NextMoney | null;
  rates: SpendRates;
  confidence: Confidence;
  historyDays: number;
  windowDays: number;
  billsBeforeNextMoney: UpcomingBill[];
  billsTotalBeforeNextMoney: number;
  upcomingBills: UpcomingBill[];
  recurringBills: RecurringBill[];
  timeline: DayProjection[];
}

export interface ForecastInput {
  transactions: Transaction[];
  balance: number;
  today: ISODate;
  /** One-off future items for what-if checks. Money already in the account is in `balance`. */
  extras?: Pick<Transaction, 'date' | 'amount' | 'description'>[];
}
