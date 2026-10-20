// Prints each persona's forecast for today using the real engine and seed data. Read only.
import { writeFileSync } from 'node:fs';
import { seedRecord } from '../../../src/data/localRepository';
import { PERSONAS } from '../../../src/data/seed/personas';
import { localToday } from '../../../src/engine/dates';
import { forecast } from '../../../src/engine/forecast';
import { helpPlan } from '../../../src/engine/help';
import { spendingBreakdown } from '../../../src/engine/spending';

const today = localToday();
const rows = PERSONAS.map((p) => {
  const r = seedRecord(p.id, today);
  const f = forecast({ transactions: r.transactions, balance: r.balance, today });
  const h = helpPlan({ transactions: r.transactions, balance: r.balance, today });
  return {
    persona: p.id,
    today,
    transactions: r.transactions.length,
    balance: r.balance,
    state: f.state,
    headlineDate: f.headlineDate,
    band: `${f.band.from} to ${f.band.to}`,
    safeToSpend: f.safeToSpendToday,
    nextMoneyTypical: f.nextMoney?.typical,
    nextMoneyWindow: `${f.nextMoney?.earliest} to ${f.nextMoney?.latest}`,
    nextMoneyAmount: `${f.nextMoney?.amountLow} to ${f.nextMoney?.amountHigh}`,
    pattern: f.nextMoney?.pattern,
    dailySpend: Object.fromEntries(Object.entries(f.rates).map(([k, v]) => [k, Math.round(v)])),
    billsBeforeNext: f.billsTotalBeforeNextMoney,
    recurringBills: f.recurringBills.map((b) => `${b.description} R${b.amount} day ${b.dayOfMonth}`),
    confidence: f.confidence,
    gapDays: f.gapDays,
    help: { target: h.target, extraNeeded: h.extraNeeded, dailyCut: h.dailyCut, billToMove: h.billToMove?.description ?? null, canSetAside: h.canSetAside },
    topSpend: spendingBreakdown(r.transactions, today).slice(0, 3).map((s) => `${s.group} R${s.total}`),
  };
});
writeFileSync('docs/review/prep/persona-snapshot.json', JSON.stringify(rows, null, 2));
console.log(JSON.stringify(rows, null, 1));
