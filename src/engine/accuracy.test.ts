// Fast accuracy regression check, run with the unit tests. A small, fixed slice of the backtest in
// docs/review/after/backtest: the shipped generator, 60 days of history, a 30 day hold-out and three
// engine-independent balances. Fails if headline metrics get worse than the stated thresholds.
// These are numbers on synthetic data from the same author as the engine: a guard against
// regressions, not evidence of real-world accuracy.
import { describe, expect, it } from 'vitest';
import { generateHistory } from '../data/seed/generate';
import { PERSONAS } from '../data/seed/personas';
import { classifyRows } from './classify';
import { addDays, daysBetween } from './dates';
import { forecast } from './forecast';

/** Thresholds, set a little worse than the build 2 measurement so noise does not fail the build. */
export const ACCURACY_THRESHOLDS = { maeDays: 3.5, bandCoveragePct: 78, falseReassurancePct: 5 } as const;

function measure() {
  let errSum = 0;
  let errN = 0;
  let covered = 0;
  let decidable = 0;
  let falseReassure = 0;
  let n = 0;
  for (const p of PERSONAS) {
    for (let k = 0; k < 12; k++) {
      const cutoff = addDays('2025-11-03', k * 17);
      const all = generateHistory(p.id, addDays(cutoff, 30)).map((t) => ({ date: t.date, description: t.description, amount: t.amount }));
      const hist = all.filter((r) => r.date < cutoff && r.date >= addDays(cutoff, -60));
      const hold = all.filter((r) => r.date >= cutoff);
      const cats = classifyRows(hist);
      const tx = hist.map((r, i) => ({ id: `a${i}`, ...r, category: cats[i]! }));
      const incomeTotal = hist.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0);
      const threshold = (incomeTotal / 60) * 30 * 0.1;
      const meanOut = -hist.filter((r) => r.amount < 0).reduce((a, r) => a + r.amount, 0) / 60;
      for (const cover of [7, 14, 21]) {
        const balance = Math.round(meanOut * cover);
        const f = forecast({ transactions: tx, balance, today: cutoff });
        // Actual: outflows less the small income that really arrived, and next money from the hold-out.
        const out = new Array<number>(30).fill(0);
        const inc = new Array<number>(30).fill(0);
        for (const r of hold) {
          const d = daysBetween(cutoff, r.date);
          if (d < 30) (r.amount < 0 ? out : inc)[d]! += Math.abs(r.amount);
        }
        let bal = balance;
        let actual = -1;
        for (let d = 0; d < 30 && actual < 0; d++) {
          bal += (inc[d]! < threshold ? inc[d]! : 0) - out[d]!;
          if (bal <= 0) actual = d;
        }
        const central = f.runway.central ? daysBetween(cutoff, f.runway.central) : 180;
        if (actual >= 0) {
          errSum += Math.abs(central - actual);
          errN += 1;
          decidable += 1;
          if (actual >= daysBetween(cutoff, f.band.from) && actual <= daysBetween(cutoff, f.band.to)) covered += 1;
        }
        const nextIdx = inc.findIndex((v) => v >= threshold);
        const A = nextIdx < 0 ? 30 : nextIdx;
        const spent = out.slice(0, A).reduce((a, b) => a + b, 0);
        if (f.status !== 'unclear') {
          n += 1;
          if (f.status !== 'short' && balance - spent <= 0 && A > 0) falseReassure += 1;
        }
      }
    }
  }
  return { mae: errSum / errN, coverage: (100 * covered) / decidable, falseReassurance: (100 * falseReassure) / n, n };
}

describe('forecast accuracy on synthetic data (regression guard)', () => {
  it('stays within the stated thresholds', () => {
    const m = measure();
    expect(m.n).toBeGreaterThan(90);
    expect(m.mae).toBeLessThanOrEqual(ACCURACY_THRESHOLDS.maeDays);
    expect(m.coverage).toBeGreaterThanOrEqual(ACCURACY_THRESHOLDS.bandCoveragePct);
    expect(m.falseReassurance).toBeLessThanOrEqual(ACCURACY_THRESHOLDS.falseReassurancePct);
    console.log(`accuracy: MAE ${m.mae.toFixed(2)} days, band coverage ${m.coverage.toFixed(1)}%, false reassurance ${m.falseReassurance.toFixed(1)}%, n ${m.n}`);
  });
});
