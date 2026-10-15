// Keeps every locale file in step with en.json.
// Pending languages get a fresh copy of the English text. Machine or reviewed languages keep their
// translations, except where the English source changed since translation: those fall back to English
// until `npm run i18n:translate` (or a translator) updates them.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const dir = 'src/i18n/locales';
const statusPath = 'src/i18n/status.json';
const sourcePath = 'src/i18n/translated-from.json';
const en = JSON.parse(readFileSync(`${dir}/en.json`, 'utf8'));
const status = JSON.parse(readFileSync(statusPath, 'utf8'));
const source = existsSync(sourcePath) ? JSON.parse(readFileSync(sourcePath, 'utf8')) : {};
const codes = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace('.json', ''));

function merge(base, existing, from, prefix = '') {
  if (typeof base !== 'object' || base === null) {
    const fresh = typeof existing === 'string' && from[prefix] === base;
    return fresh ? existing : base;
  }
  const out = {};
  for (const k of Object.keys(base)) {
    out[k] = merge(base[k], existing?.[k], from, prefix ? `${prefix}.${k}` : k);
  }
  return out;
}

for (const code of codes) {
  const existing = JSON.parse(readFileSync(`${dir}/${code}.json`, 'utf8'));
  const st = status[code] ?? 'pending';
  status[code] = st;
  const next = st === 'pending' ? en : merge(en, existing, source[code] ?? {});
  writeFileSync(`${dir}/${code}.json`, JSON.stringify(next, null, 2) + '\n');
}
writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
console.log('Locales synced from en.json');
