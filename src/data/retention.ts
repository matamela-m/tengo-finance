import type { ISODate, Transaction } from '../engine/types';

export const RETENTION_MONTHS = 12;

/** The same calendar day `months` months earlier, clamped to the end of a shorter month. */
export function monthsBefore(iso: ISODate, months: number): ISODate {
  const [y, m, d] = iso.split('-').map(Number);
  const total = (y ?? 1970) * 12 + ((m ?? 1) - 1) - months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${String(nm).padStart(2, '0')}-${String(Math.min(d ?? 1, last)).padStart(2, '0')}`;
}

/** Transactions dated before this day are removed when the record is next opened. */
export function retentionCutoff(today: ISODate): ISODate {
  return monthsBefore(today, RETENTION_MONTHS);
}

/** Drops transactions older than the retention period. Returns the kept list and how many went. */
export function applyRetention(transactions: Transaction[], today: ISODate): { kept: Transaction[]; removed: number } {
  const cutoff = retentionCutoff(today);
  const kept = transactions.filter((t) => t.date >= cutoff);
  return { kept, removed: transactions.length - kept.length };
}

/** Oldest record and the day it reaches 12 months and is removed. */
export function retention(transactions: Transaction[]): { oldest: ISODate | null; next: ISODate | null } {
  if (transactions.length === 0) return { oldest: null, next: null };
  const oldest = transactions.reduce((m, t) => (t.date < m ? t.date : m), transactions[0]!.date);
  return { oldest, next: monthsBefore(oldest, -RETENTION_MONTHS) };
}
