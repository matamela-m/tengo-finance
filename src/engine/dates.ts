import type { ISODate } from './types';

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for a calendar date. Time zones never shift the result. */
export function dayNumber(iso: ISODate): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / DAY_MS);
}

export function fromDayNumber(n: number): ISODate {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNumber(dayNumber(iso) + days);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return dayNumber(to) - dayNumber(from);
}

/** 0 is Sunday. */
export function weekday(iso: ISODate): number {
  return (dayNumber(iso) + 4) % 7;
}

export function dayOfMonth(iso: ISODate): number {
  return Number(iso.slice(8, 10));
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** The given day of month in the month after `iso`, clamped to that month's length. */
export function sameDayNextMonth(iso: ISODate, dom: number): ISODate {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const d = Math.min(dom, daysInMonth(ny, nm));
  return `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** The given day of month in the same month as `iso`, clamped. */
export function sameMonthDay(iso: ISODate, dom: number): ISODate {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const d = Math.min(dom, daysInMonth(y, m));
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Today's calendar date in the viewer's local time zone. */
export function localToday(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a >= b ? a : b;
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a <= b ? a : b;
}
