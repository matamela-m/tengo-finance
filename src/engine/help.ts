import { addDays, daysBetween } from './dates';
import { forecast, roomToLend } from './forecast';
import { spendGroup, type SpendGroup } from './spending';
import type { CoverState, ForecastInput, ISODate, RecurringBill, Transaction, UpcomingBill } from './types';

const RANK: Record<CoverState, number> = { short: 0, tight: 1, enough: 2 };
const MAX_SEARCH = 200_000;

/**
 * Bills that are never suggested as movable, whatever the person says: paying them late can mean
 * default and repossession (credit), a lapsed policy (insurance and funeral cover), eviction (rent)
 * or penalties (school fees, levies, maintenance). Matched on the description, lower case.
 */
export const PROTECTED_BILL_WORDS = [
  'instalment',
  'installment',
  'loan',
  'finance',
  'credit',
  'repayment',
  'insurance',
  'insure',
  'policy',
  'premium',
  'funeral',
  'burial',
  'assurance',
  'rent',
  'bond',
  'mortgage',
  'school',
  'fees',
  'levy',
  'maintenance',
  'creche',
];

/** Spending groups that are work costs for the people Tengo is built for, so never trimmed: stock and transport or fuel. */
export const WORK_COST_GROUPS: SpendGroup[] = ['stock', 'transport'];

export function isProtectedBill(description: string): boolean {
  const d = description.toLowerCase();
  return PROTECTED_BILL_WORDS.some((w) => d.includes(w));
}

/** Can this bill be marked movable at all? */
export function canMarkMovable(bill: Pick<RecurringBill, 'description'>): boolean {
  return !isProtectedBill(bill.description);
}

export interface HelpOptions {
  /** Spending groups the person marked as able to bend. Work costs are ignored even if marked. */
  flexibleGroups?: SpendGroup[];
  /** Keys of recurring bills the person marked as movable without a fee. Protected bills are ignored. */
  movableBills?: string[];
}

export type Suggestion =
  /** Earn or receive this much more before the date. Never borrow: the copy says so. */
  | { kind: 'earn'; amount: number; until: ISODate | null }
  /** Trim the flexible groups by this much a day. `covers` says whether that alone reaches the target. */
  | { kind: 'trim'; perDay: number; groups: SpendGroup[]; until: ISODate | null; covers: boolean }
  /** Pay a movable bill after next money instead of before. */
  | { kind: 'moveBill'; bill: UpcomingBill; until: ISODate };

export interface HelpPlan {
  current: CoverState;
  /** The next state up, or null when already Enough. */
  target: CoverState | null;
  /** Smallest extra amount today, in R10 steps, that reaches the target. */
  extraNeeded: number;
  /** The same gap spread over the days to the typical next money, rounded up to R5. */
  dailyCut: number;
  /** Day the suggestions run until: the typical next money. */
  until: ISODate | null;
  /** A movable bill that, paid after next money, reaches the target on its own. Never a protected bill. */
  billToMove: UpcomingBill | null;
  /** What to show, in order. Every suggestion is only one of these three kinds. */
  suggestions: Suggestion[];
  /** True when no flexible spending is marked yet, so Tengo can only suggest earning more. */
  needsFlexible: boolean;
  /** For Enough: how much could be set aside today and still be Enough. */
  canSetAside: number;
}

function reaches(input: ForecastInput, target: CoverState, extra = 0, extras = input.extras ?? []): boolean {
  return RANK[forecast({ ...input, balance: input.balance + extra, extras }).state] >= RANK[target];
}

/** Smallest R10 step amount that lifts the state to `target`. */
export function extraToReach(input: ForecastInput, target: CoverState): number {
  if (reaches(input, target)) return 0;
  let lo = 1;
  let hi = MAX_SEARCH / 10;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (reaches(input, target, mid * 10)) hi = mid;
    else lo = mid + 1;
  }
  return lo * 10;
}

/** Average daily spend in the given groups over the last 30 days. */
function groupsPerDay(transactions: Transaction[], today: ISODate, groups: SpendGroup[]): number {
  const from = addDays(today, -30);
  let total = 0;
  for (const t of transactions) {
    if (t.category !== 'spend' || t.amount >= 0 || t.date < from || t.date >= today || t.oneOff) continue;
    if (groups.includes(spendGroup(t.description))) total += -t.amount;
  }
  return total / 30;
}

/**
 * Ways to move up one cover state, worked out with the same engine as the date. Only three kinds, so
 * nothing can suggest skipping credit, insurance, rent or school fees, cutting stock or borrowing:
 * earn or receive more, trim spending the person marked as flexible, or move a bill the person marked
 * as movable. Short aims for Tight (reach the usual next money); Tight aims for Enough.
 */
export function helpPlan(input: ForecastInput, options: HelpOptions = {}): HelpPlan {
  const base = forecast(input);
  const current = base.state;
  const flexible = (options.flexibleGroups ?? []).filter((g) => !WORK_COST_GROUPS.includes(g));
  const movable = new Set(options.movableBills ?? []);
  const empty = { extraNeeded: 0, dailyCut: 0, until: null, billToMove: null, suggestions: [], needsFlexible: flexible.length === 0 };
  if (base.status === 'unclear') return { current, target: null, ...empty, canSetAside: 0 };
  if (current === 'enough') return { current, target: null, ...empty, canSetAside: roomToLend(input, current) };

  const target: CoverState = current === 'short' ? 'tight' : 'enough';
  const extraNeeded = extraToReach(input, target);
  const next = base.nextMoney;
  const until = next ? next.typical : null;
  const days = until ? Math.max(1, daysBetween(input.today, until)) : 1;
  const dailyCut = Math.ceil(extraNeeded / days / 5) * 5;

  const suggestions: Suggestion[] = [];
  if (flexible.length > 0) {
    const available = Math.floor(groupsPerDay(input.transactions, input.today, flexible) / 5) * 5;
    if (available > 0) suggestions.push({ kind: 'trim', perDay: Math.min(dailyCut, available), groups: flexible, until, covers: available >= dailyCut });
  }

  // Moving a bill: only one the person marked movable, never a protected one, paid the day after the latest next money.
  let billToMove: UpcomingBill | null = null;
  if (next) {
    const after = addDays(next.latest, 1);
    const keyOf = new Map(base.recurringBills.map((b) => [b.description, b.key]));
    const candidates = base.billsBeforeNextMoney
      .filter((b) => !isProtectedBill(b.description) && movable.has(keyOf.get(b.description) ?? ''))
      .sort((a, b) => a.amount - b.amount);
    for (const bill of candidates) {
      const shifted = [
        ...(input.extras ?? []),
        { date: bill.date, amount: bill.amount, description: 'moved' },
        { date: after, amount: -bill.amount, description: 'moved' },
      ];
      if (reaches(input, target, 0, shifted)) {
        billToMove = bill;
        suggestions.push({ kind: 'moveBill', bill, until: next.typical });
        break;
      }
    }
  }
  if (extraNeeded > 0) suggestions.push({ kind: 'earn', amount: extraNeeded, until });
  // A full trim leads; otherwise earning more leads and a partial trim follows.
  suggestions.sort((a, b) => order(a) - order(b));
  return { current, target, extraNeeded, dailyCut, until, billToMove, suggestions, needsFlexible: flexible.length === 0, canSetAside: 0 };
}

function order(s: Suggestion): number {
  if (s.kind === 'trim') return s.covers ? 0 : 3;
  if (s.kind === 'moveBill') return 1;
  return 2;
}
