// Imports draft translations into a locale file. A draft is a flat JSON file mapping keys of en.json to text,
// for example written with an AI model or by a translator working outside the code.
//
//   node scripts/import-drafts.mjs zu drafts/zu-1.json drafts/zu-2.json
//
// Every string is checked before it is written: the key exists in English, placeholders and *bold* markers
// match, protected words are kept, no em or en dashes, no exclamation marks, no Greek or Cyrillic look-alike
// letters, NFC text. A string that fails is
// reported and left in English. Imported strings are marked "machine" (an unchecked draft) in
// review-status.json; this script never marks anything "reviewed", and never overwrites a reviewed string.
// When every string of a language is drafted, the language status becomes "machine".
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const dir = 'src/i18n/locales';
const statusPath = 'src/i18n/status.json';
const sourcePath = 'src/i18n/translated-from.json';
const reviewPath = 'src/i18n/review-status.json';
/** Kept exactly as written in every language. */
const KEEP = new Set(['common.demoChip']);
/** Words that must survive translation when the English has them. STOP is the keyword a reply service reads. */
const PROTECT = ['Tengo', 'WhatsApp', 'SMS', 'CSV', 'JSON', 'PDF', 'STOP', 'Supabase', 'POPIA', 'FNB'];

const [lang, ...files] = process.argv.slice(2);
if (!lang || lang === 'en' || !files.length || !existsSync(`${dir}/${lang}.json`)) {
  console.error('Usage: node scripts/import-drafts.mjs <language code> <draft.json> [more.json]');
  process.exit(1);
}

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)]],
  );
}
function setPath(obj, path, value) {
  const parts = path.split('.');
  let o = obj;
  for (const p of parts.slice(0, -1)) o = o[p] ??= {};
  o[parts[parts.length - 1]] = value;
}
const marks = (v) => [...(v.match(/\{\{[^}]+\}\}/g) ?? []), ...(v.match(/\*[^*]+\*/g) ?? []).map(() => '*bold*')].sort().join('|');

const en = JSON.parse(readFileSync(`${dir}/en.json`, 'utf8'));
const enFlat = Object.fromEntries(flatten(en));
const current = Object.fromEntries(flatten(JSON.parse(readFileSync(`${dir}/${lang}.json`, 'utf8'))));
const status = JSON.parse(readFileSync(statusPath, 'utf8'));
const source = existsSync(sourcePath) ? JSON.parse(readFileSync(sourcePath, 'utf8')) : {};
const review = existsSync(reviewPath) ? JSON.parse(readFileSync(reviewPath, 'utf8')) : {};
const from = (source[lang] ??= {});
const reviewed = (review[lang] ??= {});

const draft = Object.assign({}, ...files.map((f) => JSON.parse(readFileSync(f, 'utf8'))));
const problems = [];
let imported = 0;
for (const [key, raw] of Object.entries(draft)) {
  const text = String(raw).normalize('NFC').trim();
  const english = enFlat[key];
  const fail = (why) => problems.push(`${key}: ${why}`);
  if (english === undefined) fail('not a key in en.json');
  else if (KEEP.has(key)) fail('kept in English on purpose');
  else if (reviewed[key] === 'reviewed') fail('already reviewed by a person; not overwritten');
  else if (!text) fail('empty');
  else if (marks(text) !== marks(english)) fail(`placeholders or bold differ (${marks(english) || 'none'})`);
  else if (/[\u2013\u2014]/.test(text)) fail('em or en dash');
  else if (text.includes('!')) fail('exclamation mark');
  else if (/[\u0370-\u04ff]/.test(text)) fail('Greek or Cyrillic letter, likely a look-alike of a Latin one');
  else if (PROTECT.some((w) => english.includes(w) && !text.includes(w))) fail(`lost a protected word (${PROTECT.filter((w) => english.includes(w) && !text.includes(w)).join(', ')})`);
  else {
    current[key] = text;
    from[key] = english;
    reviewed[key] = 'machine';
    imported++;
  }
}

// Rebuild the file in English key order, so every locale keeps the same shape.
const out = {};
for (const key of Object.keys(enFlat)) setPath(out, key, current[key] ?? enFlat[key]);
writeFileSync(`${dir}/${lang}.json`, JSON.stringify(out, null, 2) + '\n');

const drafted = Object.keys(enFlat).filter((k) => KEEP.has(k) || reviewed[k] === 'machine' || reviewed[k] === 'reviewed').length;
const total = Object.keys(enFlat).length;
if (drafted === total && status[lang] !== 'reviewed') status[lang] = 'machine';
writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
writeFileSync(sourcePath, JSON.stringify(source, null, 1) + '\n');
writeFileSync(reviewPath, JSON.stringify(review, null, 1) + '\n');

console.log(`${lang}: imported ${imported}, ${drafted} of ${total} strings drafted, status ${status[lang]}.`);
if (problems.length) {
  console.error(`${problems.length} string(s) left in English:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
