import { describe, expect, it } from 'vitest';
import { buildImport, detectMapping, parseAmount, parseCsv, parseDate } from './csv';
import { sampleStatementCsv } from './sampleStatement';

describe('parseDate', () => {
  it('reads common statement formats, day first', () => {
    expect(parseDate('2026-10-12')).toBe('2026-10-12');
    expect(parseDate('2026/10/12')).toBe('2026-10-12');
    expect(parseDate('12/10/2026')).toBe('2026-10-12');
    expect(parseDate('12-10-2026')).toBe('2026-10-12');
    expect(parseDate('12 Oct 2026')).toBe('2026-10-12');
    expect(parseDate('31/02/2026')).toBeNull();
    expect(parseDate('yesterday')).toBeNull();
  });
});

describe('parseAmount', () => {
  it('reads rand amounts in several styles', () => {
    expect(parseAmount('R1 250.50')).toBe(1250.5);
    expect(parseAmount('-1,250.50')).toBe(-1250.5);
    expect(parseAmount('1 250,50')).toBe(1250.5);
    expect(parseAmount('(300)')).toBe(-300);
    expect(parseAmount('300-')).toBe(-300);
    expect(parseAmount('n/a')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});

describe('detectMapping', () => {
  it('finds signed amount columns', () => {
    expect(detectMapping(['Date', 'Description', 'Amount', 'Balance'])).toEqual({
      date: 'Date',
      description: 'Description',
      amount: 'Amount',
      debit: '',
      credit: '',
      balance: 'Balance',
    });
  });
  it('finds debit and credit columns', () => {
    const m = detectMapping(['Transaction Date', 'Narrative', 'Debit', 'Credit', 'Running Balance']);
    expect(m).toMatchObject({ date: 'Transaction Date', description: 'Narrative', debit: 'Debit', credit: 'Credit', balance: 'Running Balance', amount: '' });
  });
});

describe('buildImport', () => {
  const today = '2026-10-12';

  it('imports the sample statement, skips bad rows and finds bills', () => {
    const file = parseCsv(sampleStatementCsv('2026-10-11'));
    const r = buildImport(file, detectMapping(file.headers), today);
    expect(r.error).toBeNull();
    expect(r.skipped).toBe(2);
    expect(r.days).toBe(45);
    expect(r.shiftedDays).toBe(0);
    expect(r.lastDate).toBe('2026-10-11');
    expect(r.lastBalance).not.toBeNull();
    expect(r.transactions.some((t) => t.category === 'bill' && t.description === 'Room rent')).toBe(true);
    expect(r.transactions.filter((t) => t.category === 'income').length).toBeGreaterThan(5);
  });

  it('combines debit and credit columns', () => {
    const csv = 'Date,Details,Debit,Credit\n2026-09-01,Pay,,500\n2026-09-20,Shop,120,\n';
    const file = parseCsv(csv);
    const r = buildImport(file, detectMapping(file.headers), today);
    expect(r.transactions.map((t) => t.amount)).toEqual([500, -120]);
  });

  it('rejects fewer than 14 days and warns under 28', () => {
    const short = parseCsv('Date,Description,Amount\n2026-10-01,A,-10\n2026-10-10,B,-10\n');
    expect(buildImport(short, detectMapping(short.headers), today).error).toBe('tooShort');
    const mid = parseCsv('Date,Description,Amount\n2026-09-20,A,-10\n2026-10-10,B,-10\n');
    const r = buildImport(mid, detectMapping(mid.headers), today);
    expect(r.error).toBeNull();
    expect(r.warning).toBe('wideRange');
  });

  it('moves an old statement forward so it ends yesterday', () => {
    const old = parseCsv('Date,Description,Amount\n2026-01-01,A,-10\n2026-02-10,B,-10\n');
    const r = buildImport(old, detectMapping(old.headers), today);
    expect(r.lastDate).toBe('2026-10-11');
    expect(r.shiftedDays).toBeGreaterThan(200);
  });

  it('reports a missing mapping', () => {
    const f = parseCsv('Foo,Bar\n1,2\n');
    expect(buildImport(f, detectMapping(f.headers), today).error).toBe('noMapping');
  });
});
