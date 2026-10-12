import Papa from 'papaparse';
import { classifyRows } from '../engine/classify';
import { addDays, daysBetween } from '../engine/dates';
import type { ISODate, Transaction } from '../engine/types';

export const MIN_DAYS = 14;
export const WIDE_RANGE_DAYS = 28;
/** Statements that end longer ago than this are moved forward to end yesterday. */
export const REBASE_AFTER_DAYS = 3;

export interface ColumnMapping {
  date: string;
  description: string;
  /** Either a signed amount column, or debit and credit columns. */
  amount: string;
  debit: string;
  credit: string;
  balance: string;
}

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ImportResult {
  transactions: Transaction[];
  skipped: number;
  total: number;
  firstDate: ISODate | null;
  lastDate: ISODate | null;
  days: number;
  /** Balance on the last row, when the file has a balance column. */
  lastBalance: number | null;
  /** Days added to every date so the statement ends yesterday. */
  shiftedDays: number;
  error: 'noRows' | 'tooShort' | 'noMapping' | null;
  warning: 'wideRange' | null;
}

export function parseCsv(text: string): ParsedFile {
  const out = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: 'greedy', transformHeader: (h) => h.trim() });
  return { headers: (out.meta.fields ?? []).filter(Boolean), rows: out.data };
}

const PATTERNS: Record<keyof ColumnMapping, RegExp> = {
  date: /^(transaction\s*)?date$|^posted|^value\s*date|^date/i,
  description: /desc|narrat|details|reference|memo|particulars|payee/i,
  amount: /^amount|^value$|^amount\s*\(r\)|^zar/i,
  debit: /debit|money\s*out|withdraw|paid\s*out/i,
  credit: /credit|money\s*in|deposit|paid\s*in/i,
  balance: /balance/i,
};

/** Guesses the column mapping from common header names. Empty string means not found. */
export function detectMapping(headers: string[]): ColumnMapping {
  const used = new Set<string>();
  const find = (key: keyof ColumnMapping) => {
    const h = headers.find((x) => !used.has(x) && PATTERNS[key].test(x));
    if (h) used.add(h);
    return h ?? '';
  };
  const date = find('date');
  const balance = find('balance');
  const description = find('description');
  const debit = find('debit');
  const credit = find('credit');
  const amount = find('amount');
  return { date, description, amount, debit, credit, balance };
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function iso(y: number, m: number, d: number): ISODate | null {
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return dt.toISOString().slice(0, 10);
}

/** Accepts 2026-10-12, 2026/10/12, 12/10/2026, 12-10-2026 and 12 Oct 2026. Day first, as on South African statements. */
export function parseDate(raw: string): ISODate | null {
  const s = (raw ?? '').trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) return iso(Number(m[3]), Number(m[2]), Number(m[1]));
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})/);
  if (m) return iso(Number(m[3]), MONTHS[m[2]!.toLowerCase()] ?? 0, Number(m[1]));
  return null;
}

/** Accepts "R1 250.50", "-1,250.50", "1 250,50" and "(300)". Returns null when not a number. */
export function parseAmount(raw: string | undefined): number | null {
  let s = (raw ?? '').trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[Rr]|ZAR|\s/g, '');
  if (s.endsWith('-')) {
    negative = !negative;
    s = s.slice(0, -1);
  }
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else if (/,\d{1,2}$/.test(s)) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  if (!/^[-+]?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Math.round((negative ? -n : n) * 100) / 100;
}

export function mappingReady(m: ColumnMapping): boolean {
  return Boolean(m.date && m.description && (m.amount || m.debit || m.credit));
}

export function buildImport(file: ParsedFile, mapping: ColumnMapping, today: ISODate): ImportResult {
  const empty: ImportResult = {
    transactions: [],
    skipped: 0,
    total: file.rows.length,
    firstDate: null,
    lastDate: null,
    days: 0,
    lastBalance: null,
    shiftedDays: 0,
    error: null,
    warning: null,
  };
  if (!mappingReady(mapping)) return { ...empty, error: 'noMapping' };

  const good: { date: ISODate; description: string; amount: number; balance: number | null }[] = [];
  let skipped = 0;
  for (const row of file.rows) {
    const date = parseDate(row[mapping.date] ?? '');
    const description = (row[mapping.description] ?? '').trim();
    let amount: number | null;
    if (mapping.amount) {
      amount = parseAmount(row[mapping.amount]);
    } else {
      const debit = parseAmount(row[mapping.debit]) ?? 0;
      const credit = parseAmount(row[mapping.credit]) ?? 0;
      const any = (row[mapping.debit] ?? '').trim() || (row[mapping.credit] ?? '').trim();
      amount = any ? Math.round((Math.abs(credit) - Math.abs(debit)) * 100) / 100 : null;
    }
    if (!date || !description || amount === null || amount === 0) {
      skipped++;
      continue;
    }
    good.push({ date, description, amount, balance: mapping.balance ? parseAmount(row[mapping.balance]) : null });
  }
  if (good.length === 0) return { ...empty, skipped, error: 'noRows' };

  // Keep file order for rows on the same day so the last balance is the true closing balance.
  const ordered = good.map((g, i) => ({ ...g, i })).sort((a, b) => (a.date === b.date ? a.i - b.i : a.date < b.date ? -1 : 1));
  const first = ordered[0]!.date;
  const last = ordered[ordered.length - 1]!.date;
  const yesterday = addDays(today, -1);
  const gap = daysBetween(last, yesterday);
  const shiftedDays = gap > REBASE_AFTER_DAYS ? gap : 0;
  const days = daysBetween(first, last) + 1;

  const categories = classifyRows(ordered);
  const transactions: Transaction[] = ordered.map((r, idx) => ({
    id: `imp-${String(idx).padStart(4, '0')}`,
    date: addDays(r.date, shiftedDays),
    description: r.description,
    amount: r.amount,
    category: categories[idx]!,
  }));
  const lastBalance = ordered[ordered.length - 1]!.balance;

  return {
    transactions,
    skipped,
    total: file.rows.length,
    firstDate: addDays(first, shiftedDays),
    lastDate: addDays(last, shiftedDays),
    days,
    lastBalance,
    shiftedDays,
    error: days < MIN_DAYS ? 'tooShort' : null,
    warning: days < WIDE_RANGE_DAYS ? 'wideRange' : null,
  };
}

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\n');
}
