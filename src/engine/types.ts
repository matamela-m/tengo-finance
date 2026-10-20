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
  /** Marked by the person as a one-off: left out of usual spend and of the income pattern. */
  oneOff?: boolean;
}

export type CoverState = 'enough' | 'tight' | 'short';
/** The cover state, or 'unclear' when there is not enough to tell (thin history or no income at all). */
export type Status = CoverState | 'unclear';
export type UnclearReason = 'thin' | 'noIncome' | 'stale';
/**
 * regular: a pattern and the next payment is still due.
 * pendingToday: the usual payment is due today and is not in the balance yet.
 * paused: payments stopped for more than about two usual gaps.
 * irregular: money comes in, but with no pattern Tengo can use.
 * none: no money in at all in the history.
 */
export type IncomeStatus = 'regular' | 'pendingToday' | 'paused' | 'irregular' | 'none';
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

export interface IncomeInfo {
  status: IncomeStatus;
  /** Last significant payment in the history. */
  lastDate: ISODate | null;
  /** Days from the last significant payment to the end of the history. */
  daysSinceLast: number | null;
  /** Usual days between significant payments. */
  usualGapDays: number | null;
  /** Small daily income (card sales, tips) counted in every path at this rate per day. */
  backgroundPerDay: number;
}

export interface OneOff {
  id: string;
  date: ISODate;
  description: string;
  amount: number;
  /**
   * marked: the person said so. large: much bigger than usual and not repeated. listed: matches the
   * not-income words. ask: short history, so a large spend still counts and the person is asked.
   */
  why: 'marked' | 'large' | 'listed' | 'ask';
}

export interface Forecast {
  today: ISODate;
  /** Day after the last day of history. Equal to today unless the history is older than the balance. */
  dataEnd: ISODate;
  /** Days between the balance date (today) and the real date, when the balance is old. */
  asOfDaysAgo: number;
  balance: number;
  /** What the cover rule says about the numbers. When status is 'unclear' this is only shown in the Why drawer. */
  state: CoverState;
  status: Status;
  unclearReason: UnclearReason | null;
  income: IncomeInfo;
  /** What the state is judged against: the next money, or a 30 day planning horizon when none is expected. */
  coverTarget: { kind: 'nextMoney' | 'horizon'; typical: ISODate; latest: ISODate };
  /** Rands overdrawn, zero when the balance is not negative. */
  overdrawn: number;
  /** Recurring bills that did not appear when expected and have no answer yet. */
  missedBills: MissedBillInfo[];
  /** Missed bills the person said they still owe. Counted as due today. */
  owedBills: UpcomingBill[];
  /** Transactions left out of usual spend or of the income pattern. */
  oneOffs: OneOff[];
  /** Day-of-month effect on spending: a month-end uplift from history, or a wider heavy path near month end. */
  monthEnd: { mode: 'pattern' | 'widened' | 'none'; factor: number };
  /** The headline date: central zero date, or horizon end when it never runs out. */
  headlineDate: ISODate;
  /** True when the central path never reaches zero inside the horizon. */
  beyondHorizon: boolean;
  runway: Runway;
  /** Likely range for the date: pessimistic to optimistic zero dates, widened to a calibrated minimum. */
  band: { from: ISODate; to: ISODate };
  /** Days from today to the central zero date. */
  runwayDays: number;
  /** For Short: days between running out and the typical next money. */
  gapDays: number;
  /**
   * Even spread of what is left after bills and the reserve, per day until the latest likely next money.
   * Rounded down to R5. Only shown when the state is Enough or Tight.
   */
  dailyBudget: number;
  /**
   * Kept back before the daily budget is worked out: bills due within a week after the latest next money,
   * less what a low next payment would cover.
   */
  reserve: number;
  reserveBills: UpcomingBill[];
  /** True when the state is Tight only because the reserve would otherwise be eaten into. */
  reserveLimited: boolean;
  /** Null when no money is expected: income paused, irregular or absent. */
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

export interface MissedBillInfo {
  id: string;
  description: string;
  amount: number;
  dueDate: ISODate;
}

export type BillDecision = 'owed' | 'settled';

export interface ForecastInput {
  transactions: Transaction[];
  balance: number;
  today: ISODate;
  /** Day after the last day of history, when the history is older than the balance. Defaults to today. */
  dataEnd?: ISODate;
  /**
   * The real date, when the balance (and so `today`) is older: an imported statement nobody has updated.
   * The forecast then runs as of `today`, confidence drops after 3 days and the state is hidden after 14.
   */
  now?: ISODate;
  /** The person's answers about missed bills, keyed by MissedBillInfo.id. */
  billDecisions?: Record<string, BillDecision>;
  /** One-off future items for what-if checks. Money already in the account is in `balance`. */
  extras?: Pick<Transaction, 'date' | 'amount' | 'description'>[];
}
