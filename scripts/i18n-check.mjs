// Fails if any locale file is missing a key from en.json or has keys en.json does not have.
import { readdirSync, readFileSync } from 'node:fs';

const dir = 'src/i18n/locales';
const codes = ['en', ...readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'en.json').map((f) => f.replace('.json', ''))];
const expected = ['en', 'af', 'nr', 'xh', 'zu', 'nso', 'st', 'tn', 'ss', 've', 'ts'];
const missingFiles = expected.filter((c) => !codes.includes(c));
if (missingFiles.length) {
  console.error(`Missing locale files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const sets = Object.fromEntries(
  codes.map((c) => [c, new Set(flatten(JSON.parse(readFileSync(`${dir}/${c}.json`, 'utf8'))))]),
);
const base = sets.en;
let problems = 0;
for (const code of codes.slice(1)) {
  const missing = [...base].filter((k) => !sets[code].has(k));
  const extra = [...sets[code]].filter((k) => !base.has(k));
  if (missing.length) console.error(`${code}: missing ${missing.length} key(s): ${missing.slice(0, 10).join(', ')}`);
  if (extra.length) console.error(`${code}: ${extra.length} extra key(s): ${extra.slice(0, 10).join(', ')}`);
  problems += missing.length + extra.length;
}
// UI copy rule: no exclamation marks.
function values(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? values(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)]],
  );
}
for (const code of codes) {
  for (const [key, value] of values(JSON.parse(readFileSync(`${dir}/${code}.json`, 'utf8')))) {
    if (value.includes('!')) {
      console.error(`${code}: exclamation mark in ${key}`);
      problems++;
    }
  }
}
if (problems) process.exit(1);
console.log(`All ${codes.length} locales have the same ${base.size} keys.`);
