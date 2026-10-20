// Fails if the JavaScript a first visit downloads (the entry chunk and its static imports) is over budget,
// gzipped. Run after `npm run build`. The budget is the review's measured 142 KB, which build 2 must not exceed.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 142;
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const entry = Object.values(manifest).find((c) => c.isEntry);
const seen = new Set();
const walk = (chunk) => {
  if (!chunk || seen.has(chunk.file)) return;
  seen.add(chunk.file);
  for (const imp of chunk.imports ?? []) walk(manifest[imp]);
};
walk(entry);
const files = [...seen].filter((f) => f.endsWith('.js'));
const sizes = files.map((f) => [f, gzipSync(readFileSync(`dist/${f}`)).length / 1024]);
const total = sizes.reduce((a, [, s]) => a + s, 0);
for (const [f, s] of sizes) console.log(`${s.toFixed(1).padStart(7)} KB  ${f}`);
console.log(`Initial JavaScript: ${total.toFixed(1)} KB gzipped, budget ${BUDGET_KB} KB.`);
if (total > BUDGET_KB) {
  console.error('Over budget.');
  process.exit(1);
}
