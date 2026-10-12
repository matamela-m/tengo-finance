// Dev helper: copies any key missing from a locale file over from en.json and drops extra keys.
// Existing translations are kept. Run after adding English strings.
import { readFileSync, writeFileSync } from 'node:fs';

const dir = 'src/i18n/locales';
const codes = ['af', 've', 'ts', 'zu', 'st'];
const en = JSON.parse(readFileSync(`${dir}/en.json`, 'utf8'));

function merge(base, existing) {
  if (typeof base !== 'object' || base === null) {
    return typeof existing === typeof base ? existing : base;
  }
  const out = {};
  for (const k of Object.keys(base)) out[k] = merge(base[k], existing ? existing[k] : undefined);
  return out;
}

for (const code of codes) {
  let existing = {};
  try {
    existing = JSON.parse(readFileSync(`${dir}/${code}.json`, 'utf8'));
  } catch {
    existing = {};
  }
  writeFileSync(`${dir}/${code}.json`, JSON.stringify(merge(en, existing), null, 2) + '\n');
}
console.log('Locales synced from en.json');
