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
// Translation quality gates (L10N-09, L10N-11): placeholders and *bold* markers match English,
// every string is NFC so decomposed Tshivenda letters render in the right font.
const enValues = Object.fromEntries(values(JSON.parse(readFileSync(`${dir}/en.json`, 'utf8'))));
const marks = (v) => [...(v.match(/\{\{[^}]+\}\}/g) ?? []), ...(v.match(/\*[^*]+\*/g) ? ['*bold*'] : [])].sort().join('|');
for (const code of codes) {
  for (const [key, value] of values(JSON.parse(readFileSync(`${dir}/${code}.json`, 'utf8')))) {
    if (value !== value.normalize('NFC')) {
      console.error(`${code}: ${key} is not NFC normalised`);
      problems++;
    }
    if (code !== 'en' && enValues[key] !== undefined && marks(value) !== marks(enValues[key])) {
      console.error(`${code}: ${key} placeholders or bold markers differ from English`);
      problems++;
    }
  }
}

// Status rules (L10N-02, L10N-04): known values only; Tshivenda is never machine translated;
// a language is "reviewed" only when every key is marked reviewed in review-status.json.
const STATUSES = new Set(['pending', 'machine', 'reviewed', 'needsTranslator']);
const status = JSON.parse(readFileSync('src/i18n/status.json', 'utf8'));
const review = JSON.parse(readFileSync('src/i18n/review-status.json', 'utf8'));
for (const [code, st] of Object.entries(status)) {
  if (!STATUSES.has(st)) {
    console.error(`${code}: unknown status "${st}" in status.json`);
    problems++;
  }
  if (code === 've' && st === 'machine') {
    console.error('ve: Tshivenda cannot be machine translated; use needsTranslator, pending or reviewed');
    problems++;
  }
  if (st === 'reviewed') {
    const notReviewed = [...base].filter((k) => review[code]?.[k] !== 'reviewed');
    if (notReviewed.length) {
      console.error(`${code}: marked reviewed but ${notReviewed.length} key(s) are not, for example ${notReviewed.slice(0, 3).join(', ')}`);
      problems++;
    }
  }
}

// Plurals (L10N-10): every key used with a count has every plural form that language's rules need,
// from Intl.PluralRules, so 0, 1 and 2 always find a string. English _one and _other are the floor.
for (const code of codes) {
  const keys = new Set(flatten(JSON.parse(readFileSync(`${dir}/${code}.json`, 'utf8'))));
  const bases = new Set([...keys].filter((k) => /_(zero|one|two|few|many|other)$/.test(k)).map((k) => k.replace(/_(zero|one|two|few|many|other)$/, '')));
  let rules;
  try {
    rules = new Intl.PluralRules(code === 'nso' ? 'nso' : code);
  } catch {
    rules = new Intl.PluralRules('en');
  }
  const needed = new Set([0, 1, 2, 5, 21].map((n) => rules.select(n)));
  for (const b of bases) {
    for (const cat of needed) {
      if (!keys.has(`${b}_${cat}`) && !keys.has(`${b}_other`)) {
        console.error(`${code}: ${b} has no ${cat} or other form`);
        problems++;
      }
    }
    if (!keys.has(`${b}_other`)) {
      console.error(`${code}: ${b} has no _other form`);
      problems++;
    }
  }
}

if (problems) process.exit(1);
console.log(`All ${codes.length} locales have the same ${base.size} keys, matching placeholders and valid review status.`);
