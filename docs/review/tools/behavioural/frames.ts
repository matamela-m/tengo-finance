// Behavioural review probes. Read only. Uses the real engine and seed data.
// 1. Follow "safe to spend" every day until the latest next money: what state results?
// 2. Lend the "safe to lend" amount and also spend "safe to spend" today: what state results?
// 3. Compare the Short daily target implied by safe to spend with the "What helps most" daily cut.
import { seedRecord } from '../../../../src/data/localRepository';
import { PERSONAS } from '../../../../src/data/seed/personas';
import { addDays, daysBetween } from '../../../../src/engine/dates';
import { forecast, safeToLend } from '../../../../src/engine/forecast';
import { helpPlan } from '../../../../src/engine/help';

const today = '2026-10-20';
for (const p of PERSONAS) {
  const r = seedRecord(p.id, today);
  const input = { transactions: r.transactions, balance: r.balance, today };
  const f = forecast(input);
  const h = helpPlan(input);
  const sts = f.safeToSpendToday;
  const latest = f.nextMoney.latest;
  const days = Math.max(1, daysBetween(today, latest));
  // Extra spend above the usual (central) rate, every day until the latest next money.
  const excess = sts - f.rates.central;
  const extras = Array.from({ length: days }, (_, i) => ({ date: addDays(today, i), amount: -Math.max(0, excess), description: 'sts' }));
  const followSts = forecast({ ...input, extras });
  const lend = safeToLend(input);
  const both = forecast({ ...input, extras: [{ date: today, amount: -lend - Math.max(0, excess), description: 'lend+sts' }] });
  console.log(JSON.stringify({
    persona: p.id, state: f.state, headline: f.headlineDate, sts, central: Math.round(f.rates.central), pessimistic: Math.round(f.rates.pessimistic),
    latestNext: latest, typicalNext: f.nextMoney.typical, daysToLatest: days,
    followStsEveryDay: { state: followSts.state, headline: followSts.headlineDate },
    safeToLend: lend, lendAndSpendStsToday: { state: both.state, headline: both.headlineDate },
    helpDailyCut: h.dailyCut, impliedDailyAfterCut: Math.round(f.rates.central - h.dailyCut), helpUntil: h.until,
    upcomingBills30: f.upcomingBills.filter((b) => b.date <= addDays(today, 30)).map((b) => `${b.description} R${b.amount} ${b.date}`),
  }));
}
