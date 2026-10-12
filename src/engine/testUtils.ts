import { addDays, weekday } from './dates';
import type { Category, ISODate, Transaction } from './types';

let counter = 0;

export function txn(date: ISODate, amount: number, description: string, category: Category): Transaction {
  counter += 1;
  return { id: `t${counter}`, date, amount, description, category };
}

/**
 * History of `days` days ending yesterday.
 * Spend alternates between a calm week (R50 a day) and a busy week (R150 a day),
 * and R3 000 lands every Friday.
 */
export function steadyHistory(today: ISODate, days: number, opts: { payday?: number; pay?: number } = {}): Transaction[] {
  const payday = opts.payday ?? 5;
  const pay = opts.pay ?? 3000;
  const out: Transaction[] = [];
  for (let i = days; i >= 1; i--) {
    const date = addDays(today, -i);
    const week = Math.floor(i / 7);
    out.push(txn(date, week % 2 === 0 ? -50 : -150, 'Groceries', 'spend'));
    if (weekday(date) === payday) out.push(txn(date, pay, 'Wages', 'income'));
  }
  return out;
}
