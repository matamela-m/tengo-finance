import { describe, expect, it } from 'vitest';
import { addDays } from '../../engine/dates';
import { forecast } from '../../engine/forecast';
import { generateHistory, SEED_DAYS, startingBalance } from './generate';
import { PERSONAS } from './personas';

describe('seed data', () => {
  it('is deterministic and ends yesterday', () => {
    const a = generateHistory('thabo', '2026-10-12');
    const b = generateHistory('thabo', '2026-10-12');
    expect(a).toEqual(b);
    const dates = a.map((t) => t.date).sort();
    expect(dates[dates.length - 1]).toBe('2026-10-11');
    expect(dates[0]! >= addDays('2026-10-12', -SEED_DAYS)).toBe(true);
  });

  // Run across three weeks of start dates so every weekday and month boundary is covered.
  for (const p of PERSONAS) {
    it(`${p.name} starts in ${p.startState} on any day`, () => {
      for (let k = 0; k < 40; k++) {
        const today = addDays('2026-10-01', k);
        const tx = generateHistory(p.id, today);
        const balance = startingBalance(tx, today, p.startState);
        const f = forecast({ transactions: tx, balance, today });
        expect(f.state, `${p.id} on ${today} with R${balance}`).toBe(p.startState);
        expect(f.confidence).toBe('high');
        expect(balance).toBeGreaterThan(0);
      }
    });
  }

  it('detects the recurring bills each persona was given', () => {
    const today = '2026-10-12';
    const keys = (id: 'thabo' | 'lerato' | 'ayanda') =>
      forecast({ transactions: generateHistory(id, today), balance: 1000, today }).recurringBills.map((b) => b.description).sort();
    expect(keys('thabo')).toEqual(['Car instalment', 'Car insurance', 'Phone contract']);
    expect(keys('lerato')).toEqual(['Phone contract', 'Rent']);
    expect(keys('ayanda')).toEqual(['Funeral policy', 'Phone contract']);
  });

  it('gives each persona its income pattern', () => {
    const today = '2026-10-12';
    const pattern = (id: 'thabo' | 'lerato' | 'ayanda') =>
      forecast({ transactions: generateHistory(id, today), balance: 1000, today }).nextMoney?.pattern;
    expect(pattern('thabo')).toBe('weekday');
    expect(pattern('lerato')).toBe('weekday');
    expect(pattern('ayanda')).toBe('interval');
  });
});
