// Checks every string in every locale file against the self-hosted fonts.
// Fails if the body font (Inter) lacks any character. Heading font (Figtree) gaps are warnings,
// since headings fall back to Inter, and Tshivenda switches headings to Inter entirely.
import { readdirSync, readFileSync } from 'node:fs';
import * as fontkit from 'fontkit';

const dir = 'src/i18n/locales';
const FONTS = {
  Inter: 'node_modules/@fontsource-variable/inter/files',
  Figtree: 'node_modules/@fontsource-variable/figtree/files',
};

function coverage(folder) {
  const set = new Set();
  for (const file of readdirSync(folder).filter((f) => f.endsWith('-wght-normal.woff2'))) {
    for (const cp of fontkit.openSync(`${folder}/${file}`).characterSet) set.add(cp);
  }
  return set;
}

function strings(obj) {
  return Object.values(obj).flatMap((v) => (typeof v === 'object' && v !== null ? strings(v) : [String(v)]));
}

const cover = Object.fromEntries(Object.entries(FONTS).map(([name, folder]) => [name, coverage(folder)]));
// Whitespace and joiners have no glyph to draw.
const ignore = (cp) => cp <= 0x20 || (cp >= 0x200b && cp <= 0x200f);

let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const lang = file.replace('.json', '');
  const used = new Set();
  for (const s of strings(JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')))) {
    for (const ch of s.replace(/\{\{[^}]+\}\}/g, '')) used.add(ch.codePointAt(0));
  }
  for (const [name, set] of Object.entries(cover)) {
    const missing = [...used].filter((cp) => !ignore(cp) && !set.has(cp));
    if (!missing.length) continue;
    const list = missing.map((cp) => `${String.fromCodePoint(cp)} U+${cp.toString(16).toUpperCase().padStart(4, '0')}`).join(', ');
    if (name === 'Inter') {
      failed = true;
      console.error(`FAIL ${lang}: body font Inter lacks ${list}`);
    } else {
      console.warn(`warn ${lang}: heading font ${name} lacks ${list}${lang === 've' ? ' (headings use Inter for Tshivenda)' : ' (falls back to Inter)'}`);
    }
  }
}
if (failed) process.exit(1);
console.log(`Fonts cover every locale string. Inter: ${cover.Inter.size} characters, Figtree: ${cover.Figtree.size}.`);
