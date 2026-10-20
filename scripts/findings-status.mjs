// Writes the status and resolution of every review finding into docs/review/findings.csv.
// Source of truth: docs/review/after/resolutions.json, keyed by finding id.
// Allowed statuses: Open, Fixed, Partly fixed, Prepared for human action, Not fixing.
// Run with --check to fail when any finding is still Open or has no resolution.
import { readFileSync, writeFileSync } from 'node:fs';

const CSV = 'docs/review/findings.csv';
const RES = 'docs/review/after/resolutions.json';
const ALLOWED = new Set(['Open', 'Fixed', 'Partly fixed', 'Prepared for human action', 'Not fixing']);

function parse(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const [header, ...rows] = parse(readFileSync(CSV, 'utf8'));
let res = {};
try {
  res = JSON.parse(readFileSync(RES, 'utf8'));
} catch {
  // No resolutions yet.
}
const cols = header.includes('resolution') ? header : [...header, 'resolution'];
const idx = Object.fromEntries(cols.map((c, i) => [c, i]));
const problems = [];
const out = rows.map((r) => {
  const cells = [...r];
  while (cells.length < cols.length) cells.push('');
  const id = cells[idx.id];
  const entry = res[id];
  if (entry) {
    if (!ALLOWED.has(entry.status)) problems.push(`${id}: unknown status "${entry.status}"`);
    cells[idx.status] = entry.status;
    cells[idx.resolution] = entry.resolution ?? '';
  } else {
    cells[idx.status] = 'Open';
    cells[idx.resolution] = '';
  }
  if (cells[idx.status] === 'Open' || !cells[idx.resolution]) problems.push(`${id}: open`);
  return cells;
});
for (const id of Object.keys(res)) if (!rows.some((r) => r[idx.id] === id)) problems.push(`${id}: not in findings.csv`);
writeFileSync(CSV, [cols, ...out].map((r) => r.map(esc).join(',')).join('\n') + '\n');

const counts = {};
for (const r of out) counts[r[idx.status]] = (counts[r[idx.status]] ?? 0) + 1;
console.log(`${out.length} findings:`, counts);
if (process.argv.includes('--check') && problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
