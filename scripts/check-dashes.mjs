// Fails if any tracked source file contains an em dash or en dash.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const banned = [String.fromCharCode(0x2014), String.fromCharCode(0x2013)];
const roots = ['src', 'scripts', 'tests', 'public', 'docs', 'README.md', 'index.html', 'BRIEF.md', 'vercel.json'];
const exts = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.html', '.md', '.csv', '.webmanifest']);
const skipFiles = new Set(['BRIEF.md']);
const hits = [];

function walk(p) {
  let st;
  try {
    st = statSync(p);
  } catch {
    return;
  }
  if (st.isDirectory()) {
    for (const f of readdirSync(p)) walk(join(p, f));
    return;
  }
  if (!exts.has(extname(p)) || skipFiles.has(p)) return;
  const lines = readFileSync(p, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (banned.some((c) => line.includes(c))) hits.push(`${p}:${i + 1}`);
  });
}

roots.forEach(walk);
if (hits.length) {
  console.error('Dash characters found:\n' + hits.join('\n'));
  process.exit(1);
}
console.log('No em or en dashes found.');
