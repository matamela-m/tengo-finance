import { addDays, dayNumber, dayOfMonth, sameDayNextMonth, sameMonthDay } from './dates';
import { median } from './stats';
import type { Category, ISODate, RecurringBill, Transaction, UpcomingBill } from './types';

/** Lower case, digits and punctuation removed, so "VODACOM 0821234567" and "Vodacom" match. */
export function descriptionKey(description: string): string {
  return description
    .toLowerCase()
    .replace(/[0-9]/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Rule for a recurring bill: the same description, a similar amount, roughly a month apart. */
export const RECURRING_RULE = {
  minOccurrences: 2,
  minGapDays: 24,
  maxGapDays: 36,
  /** Every amount within this share of the group's median. */
  amountTolerance: 0.2,
} as const;

interface Row {
  date: ISODate;
  description: string;
  amount: number;
}

function groupOutflows<T extends Row>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    if (r.amount >= 0) continue;
    const key = descriptionKey(r.description);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  for (const list of groups.values()) list.sort((a, b) => (a.date < b.date ? -1 : 1));
  return groups;
}

function isRecurringGroup(rows: Row[]): boolean {
  if (rows.length < RECURRING_RULE.minOccurrences) return false;
  const amounts = rows.map((r) => -r.amount);
  const mid = median(amounts);
  if (amounts.some((a) => Math.abs(a - mid) > mid * RECURRING_RULE.amountTolerance)) return false;
  for (let i = 1; i < rows.length; i++) {
    const gap = dayNumber(rows[i]!.date) - dayNumber(rows[i - 1]!.date);
    if (gap < RECURRING_RULE.minGapDays || gap > RECURRING_RULE.maxGapDays) return false;
  }
  return true;
}

/** Keys of outflow groups that match the recurring bill rule. */
export function recurringKeys(rows: Row[]): Set<string> {
  const keys = new Set<string>();
  for (const [key, list] of groupOutflows(rows)) if (isRecurringGroup(list)) keys.add(key);
  return keys;
}

/** Income for money in, recurring bill when the rule matches, everyday spend otherwise. */
export function classifyRows(rows: Row[]): Category[] {
  const keys = recurringKeys(rows);
  return rows.map((r) => (r.amount > 0 ? 'income' : keys.has(descriptionKey(r.description)) ? 'bill' : 'spend'));
}

/** Next due date for a monthly bill last paid on `last`, on or after `from`. */
function nextDue(last: ISODate, dom: number, from: ISODate): ISODate {
  let candidate = sameMonthDay(last, dom);
  const minDate = addDays(last, 20);
  while (candidate <= minDate || candidate < from) candidate = sameDayNextMonth(candidate, dom);
  return candidate;
}

/** Groups transactions marked as bills and works out amount, due day and next due date. */
export function recurringBills(transactions: Transaction[], today: ISODate): RecurringBill[] {
  const bills = transactions.filter((t) => t.category === 'bill' && t.amount < 0);
  const out: RecurringBill[] = [];
  for (const [key, list] of groupOutflows(bills)) {
    const last = list[list.length - 1]!;
    const recent = list.slice(-3);
    const dom = Math.round(median(recent.map((r) => dayOfMonth(r.date))));
    out.push({
      key,
      description: last.description,
      amount: Math.round(median(recent.map((r) => -r.amount)) * 100) / 100,
      dayOfMonth: dom,
      occurrences: list.length,
      lastDate: last.date,
      nextDate: nextDue(last.date, dom, today),
    });
  }
  return out.sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1));
}

/** Every bill occurrence from `today` up to and including `until`. */
export function projectBills(bills: RecurringBill[], today: ISODate, until: ISODate): UpcomingBill[] {
  const out: UpcomingBill[] = [];
  for (const b of bills) {
    let date = b.nextDate;
    while (date <= until) {
      if (date >= today) out.push({ description: b.description, date, amount: b.amount });
      date = sameDayNextMonth(date, b.dayOfMonth);
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}
