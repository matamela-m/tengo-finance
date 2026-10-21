// Fails if anything that looks like a secret is in client code or committed config: a Supabase service role
// key, a secret API key or a signed token. Only the public anon key may reach the browser, and it lives in
// an environment variable, never in the repo. CI also runs gitleaks over the whole history.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const roots = ['src', 'public', 'index.html', '.env.example', 'vercel.json', 'supabase'];
const exts = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.html', '.sql', '.example', '']);
const patterns = [
  [/service_role/i, 'service role'],
  [/sb_secret_[A-Za-z0-9]/, 'Supabase secret key'],
  [/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'signed token'],
  [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
];
const hits = [];
function walk(p) {
  if (!existsSync(p)) return;
  const st = statSync(p);
  if (st.isDirectory()) return readdirSync(p).forEach((f) => walk(join(p, f)));
  if (!exts.has(extname(p)) && !p.endsWith('.env.example')) return;
  readFileSync(p, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      // Comments that explain the rule are allowed.
      if (/^\s*(\/\/|--|#|\*)/.test(line)) return;
      for (const [re, what] of patterns) if (re.test(line)) hits.push(`${p}:${i + 1} looks like a ${what}`);
    });
}
roots.forEach(walk);
if (hits.length) {
  console.error(hits.join('\n'));
  process.exit(1);
}
console.log('No secrets found in client code or config.');
