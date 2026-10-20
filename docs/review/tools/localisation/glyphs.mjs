// Checks Tshivenda (and other SA language) characters against the bundled Inter and Figtree files.
import { readdirSync } from 'node:fs';
import * as fontkit from 'fontkit';
const FONTS = { Inter: 'node_modules/@fontsource-variable/inter/files', Figtree: 'node_modules/@fontsource-variable/figtree/files' };
const cps = { 'ḓ':0x1E13,'Ḓ':0x1E12,'ḽ':0x1E3D,'Ḽ':0x1E3C,'ṅ':0x1E45,'Ṅ':0x1E44,'ṋ':0x1E4B,'Ṋ':0x1E4A,'ṱ':0x1E71,'Ṱ':0x1E70,'comb circumflex below U+032D':0x032D,'comb dot above U+0307':0x0307,'š':0x0161,'ê':0xEA,'ô':0xF4,'ë':0xEB,'ŉ':0x0149 };
for (const [name, folder] of Object.entries(FONTS)) {
  const files = readdirSync(folder).filter((f) => f.endsWith('-wght-normal.woff2'));
  const per = {};
  for (const f of files) { const s = new Set(fontkit.openSync(`${folder}/${f}`).characterSet); per[f]=s; }
  for (const [label, cp] of Object.entries(cps)) {
    const where = Object.entries(per).filter(([, s]) => s.has(cp)).map(([f]) => f.replace(/^.*?-(\w[\w-]*?)-wght-normal.woff2$/, '$1'));
    console.log(`${name}\t${label}\t${where.length ? where.join(',') : 'MISSING'}`);
  }
}
