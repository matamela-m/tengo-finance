import { addDays, dayOfMonth, weekday } from '../engine/dates';
import type { ISODate } from '../engine/types';
import { createRng } from '../data/seed/prng';
import { toCsv } from './csv';

export const SAMPLE_DAYS = 45;
export const SAMPLE_FILENAME = 'sample-statement.csv';

function dmy(iso: ISODate): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/**
 * A fictional 45 day statement for a domestic worker paid by several clients.
 * Ends on `end`. Includes two broken rows so the skipped count shows.
 */
export function sampleStatementCsv(end: ISODate): string {
  const rng = createRng('tengo:sample-statement');
  const rows: (string | number)[][] = [['Date', 'Description', 'Amount', 'Balance']];
  let balance = 1840;
  const push = (date: ISODate, description: string, amount: number) => {
    balance = Math.round((balance + amount) * 100) / 100;
    rows.push([dmy(date), description, amount.toFixed(2), balance.toFixed(2)]);
  };
  for (let i = SAMPLE_DAYS - 1; i >= 0; i--) {
    const date = addDays(end, -i);
    const wd = weekday(date);
    if (wd === 2) push(date, 'Client payment, Mrs K', rng.amount(380, 420));
    if (wd === 5) push(date, 'Client payment, Waterkloof', rng.amount(450, 520));
    if (wd === 4 && rng.chance(0.5)) push(date, 'Ironing, piece job', rng.amount(150, 250));
    if (dayOfMonth(date) === 2) push(date, 'Room rent', -1500);
    if (dayOfMonth(date) === 15) push(date, 'Phone contract', -99);
    if (i === 0 || i === SAMPLE_DAYS - 1 || rng.chance(0.6)) push(date, rng.pick(['Taxi fare', 'Taxi fare', 'Bread and milk', 'Airtime']), -rng.amount(20, 60));
    if (wd === 6) push(date, 'Groceries', -rng.amount(250, 420));
    if (i === 30) rows.push(['not a date', 'Broken row', '12.00', '']);
    if (i === 12) rows.push([dmy(date), 'Card fee', 'n/a', '']);
  }
  return toCsv(rows) + '\n';
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
