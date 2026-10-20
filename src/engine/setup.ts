import { addDays, dayOfMonth, daysInMonth, weekday } from './dates';
import type { ISODate, Transaction } from './types';

/** How money usually arrives, in the person's own words. */
export type Arrival = 'daily' | 'weekly' | 'monthly' | 'irregular';

/** Answers from the manual setup, for people without a statement. */
export interface SetupAnswers {
  arrives: Arrival;
  /** Typical amount each time money arrives, in rands. */
  amount: number;
  /** For weekly: 0 is Sunday. */
  weekday?: number;
  /** For monthly. */
  dayOfMonth?: number;
  /** For irregular: roughly every this many days. */
  everyDays?: number;
  /** Typical everyday spend per day, in rands. */
  dailySpend: number;
  /** Regular bills, each on a day of the month. */
  bills: { name: string; amount: number; dayOfMonth: number }[];
}

/** Days of estimated history made from the answers: enough for a pattern, at low confidence. */
export const ESTIMATED_DAYS = 60;

/**
 * A starting history estimated from the answers, ending yesterday. Every entry is marked `estimated`,
 * which keeps confidence low, and the screens label it "estimated from your answers". Spend alternates
 * a little around the stated amount so a light and a heavy week exist.
 */
export function estimatedHistory(a: SetupAnswers, today: ISODate, days = ESTIMATED_DAYS): Transaction[] {
  const out: Transaction[] = [];
  const add = (date: ISODate, amount: number, description: string, category: Transaction['category']) =>
    out.push({ id: `est-${date}-${out.length}`, date, amount: Math.round(amount * 100) / 100, description, category, estimated: true });
  const every = Math.max(2, Math.round(a.everyDays ?? 7));
  for (let i = days; i >= 1; i--) {
    const date = addDays(today, -i);
    const wd = weekday(date);
    const dom = dayOfMonth(date);
    const lastDom = daysInMonth(Number(date.slice(0, 4)), Number(date.slice(5, 7)));
    let paid = false;
    if (a.arrives === 'daily') paid = wd !== 0;
    else if (a.arrives === 'weekly') paid = wd === (a.weekday ?? 5);
    else if (a.arrives === 'monthly') paid = dom === Math.min(a.dayOfMonth ?? 25, lastDom);
    // Irregular: every N days, sometimes a day early or late, the same way every time.
    else paid = i % every === 0 || (i % (every * 3) === 1 && every > 3);
    if (paid && a.amount > 0) add(date, a.amount, 'Money in (estimated from your answers)', 'income');
    if (a.dailySpend > 0) {
      const week = Math.floor(i / 7);
      add(date, -a.dailySpend * (week % 2 === 0 ? 0.85 : 1.15), 'Everyday spending (estimated from your answers)', 'spend');
    }
    for (const b of a.bills) if (b.amount > 0 && dom === Math.min(b.dayOfMonth, lastDom)) add(date, -b.amount, b.name, 'bill');
  }
  return out;
}

/**
 * Real entries replace estimated ones: once a real entry exists, estimated entries on or after the first
 * real day are dropped. Estimated history before that day stays until it ages out.
 */
export function mergeEstimated(transactions: Transaction[]): Transaction[] {
  const real = transactions.filter((t) => !t.estimated);
  if (real.length === 0 || real.length === transactions.length) return transactions;
  const firstReal = real.reduce((m, t) => (t.date < m ? t.date : m), real[0]!.date);
  return transactions.filter((t) => !t.estimated || t.date < firstReal);
}
