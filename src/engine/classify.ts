import { addDays, dayNumber, dayOfMonth, sameDayNextMonth, sameMonthDay } from './dates';
import { median } from './stats';
import type { Category, ISODate, Obligation, RecurringBill, Transaction, UpcomingBill } from './types';

/** Lower case, digits and punctuation removed, so "VODACOM 0821234567" and "Vodacom" match. */
export function descriptionKey(description: string): string {
  return description
    .toLowerCase()
    .replace(/[0-9]/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Rule for a recurring bill: the same description, a similar amount, roughly a month apart.
 * One skipped month (a gap of about two months) still counts, so a missed payment does not
 * turn rent into everyday spend.
 */
export const RECURRING_RULE = {
  minOccurrences: 2,
  minGapDays: 24,
  maxGapDays: 36,
  /** A gap in this range is one skipped month. */
  skippedMinDays: 52,
  skippedMaxDays: 70,
  /** Every amount within this share of the group's median, so a price rise of up to a third still matches. */
  amountTolerance: 0.35,
} as const;

/** Days after a due date before a bill that did not appear is reported as looking unpaid. */
export const MISSED_GRACE_DAYS = 3;

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
    const normal = gap >= RECURRING_RULE.minGapDays && gap <= RECURRING_RULE.maxGapDays;
    const skipped = gap >= RECURRING_RULE.skippedMinDays && gap <= RECURRING_RULE.skippedMaxDays;
    if (!normal && !skipped) return false;
  }
  // Two payments two months apart are treated as monthly with one skipped: projecting it monthly is the safer error.
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
    // A rising bill is projected at its latest level: the larger of the last two amounts.
    const latestTwo = list.slice(-2).map((r) => -r.amount);
    out.push({
      key,
      description: last.description,
      amount: Math.round(Math.max(...latestTwo) * 100) / 100,
      dayOfMonth: dom,
      occurrences: list.length,
      lastDate: last.date,
      nextDate: nextDue(last.date, dom, today),
    });
  }
  return out.sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1));
}

/** A recurring bill whose due date passed without a payment. The person confirms what happened. */
export interface MissedBill {
  /** Stable id for the person's answer: bill key and the due date that was missed. */
  id: string;
  key: string;
  description: string;
  amount: number;
  dueDate: ISODate;
}

/**
 * Bills whose last expected payment is more than MISSED_GRACE_DAYS overdue as of `dataEnd`
 * (the day after the last day of history). Only the first missed due date is reported.
 */
export function missedBills(bills: RecurringBill[], dataEnd: ISODate): MissedBill[] {
  const out: MissedBill[] = [];
  for (const b of bills) {
    const due = nextDue(b.lastDate, b.dayOfMonth, addDays(b.lastDate, 1));
    if (addDays(due, MISSED_GRACE_DAYS) < dataEnd) {
      out.push({ id: `${b.key}@${due}`, key: b.key, description: b.description, amount: b.amount, dueDate: due });
    }
  }
  return out;
}

/** Every bill occurrence from `today` up to and including `until`. */
export function projectBills(bills: RecurringBill[], today: ISODate, until: ISODate): UpcomingBill[] {
  const out: UpcomingBill[] = [];
  for (const b of bills) {
    let date = b.nextDate;
    while (date <= until) {
      if (date >= today) out.push({ description: b.description, date, amount: b.amount, key: b.key });
      date = sameDayNextMonth(date, b.dayOfMonth);
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Every occurrence of the informal obligations from `today` up to and including `until`, as bills. */
export function projectObligations(obligations: Obligation[], today: ISODate, until: ISODate): UpcomingBill[] {
  const out: UpcomingBill[] = [];
  for (const o of obligations) {
    if (!(o.amount > 0)) continue;
    let date = o.nextDate;
    const dom = dayOfMonth(o.nextDate);
    // Catch up a next date in the past, so an obligation is never silently dropped.
    while (date < today) date = o.every === 'week' ? addDays(date, 7) : sameDayNextMonth(date, dom);
    while (date <= until) {
      out.push({ description: o.name, date, amount: o.amount, key: `ob:${o.id}` });
      date = o.every === 'week' ? addDays(date, 7) : sameDayNextMonth(date, dom);
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}
