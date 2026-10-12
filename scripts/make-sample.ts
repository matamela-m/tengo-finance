// Writes public/sample-statement.csv ending on a fixed date. The app also generates a fresh one on demand.
import { writeFileSync } from 'node:fs';
import { sampleStatementCsv } from '../src/lib/sampleStatement';

writeFileSync('public/sample-statement.csv', sampleStatementCsv('2026-10-11'));
console.log('Wrote public/sample-statement.csv');
