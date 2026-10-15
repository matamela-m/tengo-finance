import { addDays } from './dates';
import type { ISODate, Transaction } from './types';

export type SpendGroup = 'food' | 'transport' | 'airtime' | 'stock' | 'energy' | 'other';

/** Simple, visible keyword rules. The first group whose words appear in the description wins. */
export const SPEND_RULES: { group: SpendGroup; words: string[] }[] = [
  { group: 'transport', words: ['fuel', 'petrol', 'diesel', 'taxi', 'bus', 'uber', 'bolt', 'car wash', 'toll', 'parking'] },
  { group: 'airtime', words: ['airtime', 'data', 'bundle', 'wifi'] },
  { group: 'energy', words: ['electricity', 'prepaid', 'paraffin', 'gas', 'water'] },
  { group: 'stock', words: ['stock', 'restock', 'wholesale', 'supplies', 'products'] },
  { group: 'food', words: ['grocer', 'food', 'bread', 'milk', 'lunch', 'kota', 'snack', 'cooldrink', 'meat', 'spaza'] },
];

export function spendGroup(description: string): SpendGroup {
  const d = description.toLowerCase();
  return SPEND_RULES.find((r) => r.words.some((w) => d.includes(w)))?.group ?? 'other';
}

export interface SpendSlice {
  group: SpendGroup;
  total: number;
  share: number;
  count: number;
}

/** Everyday spend (not bills) over the last `days` days, largest group first. */
export function spendingBreakdown(transactions: Transaction[], today: ISODate, days = 30): SpendSlice[] {
  const from = addDays(today, -days);
  const totals = new Map<SpendGroup, { total: number; count: number }>();
  let all = 0;
  for (const t of transactions) {
    if (t.category !== 'spend' || t.amount >= 0 || t.date < from || t.date >= today) continue;
    const g = spendGroup(t.description);
    const cur = totals.get(g) ?? { total: 0, count: 0 };
    cur.total += -t.amount;
    cur.count += 1;
    totals.set(g, cur);
    all += -t.amount;
  }
  return [...totals.entries()]
    .map(([group, v]) => ({ group, total: Math.round(v.total), count: v.count, share: all ? v.total / all : 0 }))
    .sort((a, b) => b.total - a.total);
}
