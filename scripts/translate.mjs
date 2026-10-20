// Machine translates the locale files with the Google Cloud Translation API (v2).
// Runs at build time only. The app never calls Google while it runs.
//
//   GOOGLE_TRANSLATE_API_KEY=... npm run i18n:translate            all languages, new or changed strings
//   GOOGLE_TRANSLATE_API_KEY=... npm run i18n:translate -- zu xh   only these languages
//   add --force to translate every string again
//
// Placeholders such as {{name}}, *bold* markers and brand names are protected. Output is checked
// for the house rules (no em or en dashes, no exclamation marks) and for lost placeholders.
//
// Rules from the review (L10N-02, L10N-03, L10N-04):
// - Never runs without an API key the founder provides. Nothing is translated by default.
// - Tshivenda (ve) is not supported by Google Cloud Translation and is never sent. It needs a person.
// - Money strings (keys under MONEY_PREFIXES) are not machine translated unless --include-money is passed,
//   because a wrong money word misleads. Translators use src/i18n/glossary.json for them.
// - Output is marked "machine" per string in src/i18n/review-status.json and per language in status.json.
//   This script never marks anything "reviewed"; only a first-language speaker does that, by hand.
// - Status and source files are saved after every language, so a failed run leaves them consistent.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const dir = 'src/i18n/locales';
const statusPath = 'src/i18n/status.json';
const sourcePath = 'src/i18n/translated-from.json';
const reviewPath = 'src/i18n/review-status.json';
/** Every language Google Cloud Translation supports among South Africa's official languages. Not Tshivenda. */
const ALL = ['af', 'nr', 'xh', 'zu', 'nso', 'st', 'tn', 'ss', 'ts'];
const UNSUPPORTED = ['ve'];
const MONEY_PREFIXES = ['sts.', 'help.', 'messages.', 'plan.roomToLend', 'plan.lendCaution'];
/** Keys that must stay exactly as written in every language. */
const KEEP = new Set(['common.demoChip']);
/** Words never translated. */
const PROTECT = ['Tengo', 'WhatsApp', 'SMS', 'CSV', 'JSON', 'PDF', 'Google Translate', 'Information Regulator'];
const BATCH = 100;

const args = process.argv.slice(2);
const force = args.includes('--force');
const includeMoney = args.includes('--include-money');
const targets = args.filter((a) => !a.startsWith('--'));
const skipped = targets.filter((l) => UNSUPPORTED.includes(l));
if (skipped.length) console.warn(`Skipping ${skipped.join(', ')}: not supported by Google Cloud Translation. Needs a first-language translator.`);
const langs = (targets.length ? targets : ALL).filter((l) => !UNSUPPORTED.includes(l));

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

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decode = (s) =>
  s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** Wraps parts that must not change in notranslate spans, and *bold* in <b>. */
function protect(text) {
  let s = escapeHtml(text);
  s = s.replace(/\{\{[^}]+\}\}/g, (m) => `<span translate="no">${m}</span>`);
  for (const word of PROTECT) s = s.split(word).join(`<span translate="no">${word}</span>`);
  s = s.replace(/\*([^*]+)\*/g, '<b>$1</b>');
  return s;
}

function unprotect(html) {
  let s = html.replace(/<span translate="no">(.*?)<\/span>/g, '$1');
  s = s.replace(/<b>\s*(.*?)\s*<\/b>/g, '*$1*');
  s = decode(s).replace(/\s+/g, ' ').trim();
  // House rules: no em or en dashes, no exclamation marks.
  s = s.replace(/\s*[\u2013\u2014]\s*/g, ', ').replace(/!/g, '.');
  return s;
}

const vars = (s) => (s.match(/\{\{[^}]+\}\}/g) ?? []).sort().join('|');

async function translateBatch(texts, target) {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts.map(protect), source: 'en', target, format: 'html' }),
  });
  if (!res.ok) throw new Error(`Google Translate ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return body.data.translations.map((t) => unprotect(t.translatedText));
}

const en = JSON.parse(readFileSync(`${dir}/en.json`, 'utf8'));
const enFlat = flatten(en);
const status = JSON.parse(readFileSync(statusPath, 'utf8'));
const source = existsSync(sourcePath) ? JSON.parse(readFileSync(sourcePath, 'utf8')) : {};
const review = existsSync(reviewPath) ? JSON.parse(readFileSync(reviewPath, 'utf8')) : {};
const isMoney = (k) => MONEY_PREFIXES.some((p) => k.startsWith(p));

const chars = enFlat.reduce((n, [, v]) => n + v.length, 0);
if (!KEY) {
  console.error(
    [
      'Set GOOGLE_TRANSLATE_API_KEY to run this script.',
      `About ${chars.toLocaleString()} characters per language, ${(chars * langs.length).toLocaleString()} for ${langs.length} languages.`,
      'The Cloud Translation API free tier covers 500,000 characters a month.',
    ].join('\n'),
  );
  process.exit(1);
}

let sent = 0;
for (const lang of langs) {
  const current = Object.fromEntries(flatten(JSON.parse(readFileSync(`${dir}/${lang}.json`, 'utf8'))));
  const from = (source[lang] ??= {});
  const marks = (review[lang] ??= {});
  // A string a person has reviewed is never overwritten by a machine.
  const todo = enFlat.filter(([k, v]) => !KEEP.has(k) && marks[k] !== 'reviewed' && (includeMoney || !isMoney(k)) && (force || from[k] !== v || current[k] === undefined));
  const out = structuredClone(en);
  for (const [k] of enFlat) if (current[k] !== undefined && !todo.some(([t]) => t === k)) setPath(out, k, current[k]);
  let lost = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    const translated = await translateBatch(chunk.map(([, v]) => v), lang);
    chunk.forEach(([k, v], j) => {
      const tr = translated[j];
      if (!tr || vars(tr) !== vars(v)) {
        lost++;
        setPath(out, k, v);
        delete from[k];
        return;
      }
      setPath(out, k, tr);
      from[k] = v;
      marks[k] = 'machine';
    });
    sent += chunk.reduce((n, [, v]) => n + v.length, 0);
  }
  for (const k of KEEP) setPath(out, k, enFlat.find(([key]) => key === k)[1]);
  writeFileSync(`${dir}/${lang}.json`, JSON.stringify(out, null, 2) + '\n');
  // A language is only "reviewed" when a person has reviewed every string; a machine run makes it "machine".
  status[lang] = 'machine';
  // Saved after every language, so a failure later leaves everything consistent.
  writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
  writeFileSync(sourcePath, JSON.stringify(source, null, 2) + '\n');
  writeFileSync(reviewPath, JSON.stringify(review, null, 2) + '\n');
  console.log(`${lang}: ${todo.length} strings translated${lost ? `, ${lost} kept in English (placeholders changed)` : ''}${includeMoney ? '' : ', money strings left for a translator'}`);
}
console.log(`Done. ${sent.toLocaleString()} characters sent.`);
