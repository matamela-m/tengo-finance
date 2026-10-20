// Technology review: engine timing on large histories, storage size, and stale-data drift.
// Run: npx vite-node docs/review/tools/technology/engine-bench.ts
import { performance } from 'node:perf_hooks';
import { forecast, loanCheck, whatIf } from '../../../../src/engine/forecast';
import { helpPlan } from '../../../../src/engine/help';
import { classifyRows } from '../../../../src/engine/classify';
import { addDays } from '../../../../src/engine/dates';
import { buildImport, parseCsv, detectMapping, toCsv } from '../../../../src/lib/csv';
import { seedRecord } from '../../../../src/data/localRepository';
import type { Transaction } from '../../../../src/engine/types';

const TODAY = '2026-10-20';
let s = 42;
const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);

function synth(n: number, days: number): Transaction[] {
  const rows: { date: string; description: string; amount: number }[] = [];
  const perDay = n / days;
  for (let d = days; d >= 1; d--) {
    const date = addDays(TODAY, -d);
    const k = Math.round(perDay + (rnd() - 0.5));
    for (let j = 0; j < k; j++) {
      const r = rnd();
      if (r < 0.15) rows.push({ date, description: 'Cash fares', amount: Math.round(100 + rnd() * 400) });
      else rows.push({ date, description: ['Fuel', 'Groceries', 'Taxi', 'Airtime', 'Spaza'][Math.floor(rnd() * 5)]!, amount: -Math.round(20 + rnd() * 250) });
    }
    if (d % 7 === 0) rows.push({ date, description: 'Weekly payout', amount: 2800 });
    if (Number(date.slice(8)) === 1) rows.push({ date, description: 'Rent', amount: -2500 });
  }
  const cats = classifyRows(rows);
  return rows.map((r, i) => ({ id: `t${i}`, ...r, category: cats[i]! }));
}

function time(label: string, fn: () => unknown, reps = 20) {
  fn();
  const t0 = performance.now();
  for (let i = 0; i < reps; i++) fn();
  const ms = (performance.now() - t0) / reps;
  console.log(`${label.padEnd(44)} ${ms.toFixed(2)} ms`);
  return ms;
}

console.log('## Engine timing (Node on dev laptop; multiply by roughly 4 to 10 for a low-end Android)');
for (const [n, days] of [[270, 90], [2000, 180], [2000, 365], [10000, 365]] as const) {
  const tx = synth(n, days);
  const input = { transactions: tx, balance: 3000, today: TODAY };
  console.log(`\n${tx.length} transactions over ${days} days`);
  time('forecast()', () => forecast(input));
  time('helpPlan() (Home card)', () => helpPlan(input), 5);
  time('loanCheck(R300) (Plan, per keystroke)', () => loanCheck(input, 300), 5);
  time('whatIf(1 item) (Plan, per keystroke)', () => whatIf(input, [{ date: addDays(TODAY, 1), amount: -500, description: 'x' }]), 5);
  const json = JSON.stringify({ personas: { a: { record: { transactions: tx } } } });
  console.log(`${'JSON size in localStorage'.padEnd(44)} ${(json.length / 1024).toFixed(0)} KB (UTF-16 in most browsers: ~${((json.length * 2) / 1024).toFixed(0)} KB)`);
  const csv = toCsv([['Date', 'Description', 'Amount'], ...tx.map((t) => [t.date, t.description, t.amount])]);
  time('parseCsv + buildImport', () => buildImport(parseCsv(csv), detectMapping(parseCsv(csv).headers), TODAY), 5);
}

console.log('\n## Stale data drift: an imported or edited record is never re-dated');
for (const id of ['thabo', 'lerato', 'ayanda'] as const) {
  const rec = seedRecord(id, TODAY);
  for (const lag of [0, 7, 14, 30]) {
    const f = forecast({ transactions: rec.transactions, balance: rec.balance, today: addDays(TODAY, lag) });
    console.log(`${id.padEnd(7)} viewed ${String(lag).padStart(2)} days later: state=${f.state.padEnd(6)} date=${f.headlineDate} safe=R${f.safeToSpendToday} central/day=R${f.rates.central.toFixed(0)} confidence=${f.confidence}`);
  }
}
