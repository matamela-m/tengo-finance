import { addDays, daysBetween } from './dates';
import { forecast, safeToLend } from './forecast';
import type { CoverState, ForecastInput, ISODate, UpcomingBill } from './types';

const RANK: Record<CoverState, number> = { short: 0, tight: 1, enough: 2 };
const MAX_SEARCH = 200_000;

export interface HelpPlan {
  current: CoverState;
  /** The next state up, or null when already Enough. */
  target: CoverState | null;
  /** Smallest extra amount today, in R10 steps, that reaches the target. */
  extraNeeded: number;
  /** The same gap spread over the days to the typical next money, rounded up to R5. */
  dailyCut: number;
  /** Day the daily cut runs until. */
  until: ISODate | null;
  /** A bill before next money that, moved to after it, reaches the target on its own. */
  billToMove: UpcomingBill | null;
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

/**
 * Concrete ways to move up one cover state, worked out with the same engine as the date.
 * Short aims for Tight (reach the usual next money); Tight aims for Enough.
 */
export function helpPlan(input: ForecastInput): HelpPlan {
  const base = forecast(input);
  const current = base.state;
  if (current === 'enough') {
    return { current, target: null, extraNeeded: 0, dailyCut: 0, until: null, billToMove: null, canSetAside: safeToLend(input, current) };
  }
  const target: CoverState = current === 'short' ? 'tight' : 'enough';
  const extraNeeded = extraToReach(input, target);
  const next = base.nextMoney;
  const until = next ? (target === 'enough' ? next.latest : next.typical) : null;
  const days = until ? Math.max(1, daysBetween(input.today, until)) : 1;
  const dailyCut = Math.ceil(extraNeeded / days / 5) * 5;

  // Moving a bill: pay it the day after the latest next money instead.
  let billToMove: UpcomingBill | null = null;
  if (next) {
    const after = addDays(next.latest, 1);
    const candidates = [...base.billsBeforeNextMoney].sort((a, b) => a.amount - b.amount);
    for (const bill of candidates) {
      const shifted = [
        ...(input.extras ?? []),
        { date: bill.date, amount: bill.amount, description: 'moved' },
        { date: after, amount: -bill.amount, description: 'moved' },
      ];
      if (reaches(input, target, 0, shifted)) {
        billToMove = bill;
        break;
      }
    }
  }
  return { current, target, extraNeeded, dailyCut, until, billToMove, canSetAside: 0 };
}
