import type { ISODate, Transaction } from '../../engine/types';

export const RETENTION_MONTHS = 12;

/** Oldest record and the day it reaches 12 months and is removed. */
export function retention(transactions: Transaction[]): { oldest: ISODate | null; next: ISODate | null } {
  if (transactions.length === 0) return { oldest: null, next: null };
  const oldest = transactions.reduce((m, t) => (t.date < m ? t.date : m), transactions[0]!.date);
  const [y, m, d] = oldest.split('-').map(Number);
  const next = new Date(Date.UTC((y ?? 0) + RETENTION_MONTHS / 12, (m ?? 1) - 1, d ?? 1)).toISOString().slice(0, 10);
  return { oldest, next };
}
