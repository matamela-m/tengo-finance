// Serves dist/ with the headers and rewrites from vercel.json, so tests check the real hosting rules. Like Vercel,
// a real file wins; otherwise the first matching rewrite applies; otherwise 404.
// Usage: node scripts/serve-dist.mjs [port] [folder, default dist]
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const port = Number(process.argv[2] ?? 4190);
const root = process.argv[3] ?? 'dist';
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.csv': 'text/csv' };

/** vercel.json sources are path patterns with (.*) and (a|b) groups. */
const matches = (source, path) => new RegExp(`^${source.replace(/\./g, '\\.').replace(/\(\\\.\*\)/g, '(.*)')}$`).test(path);

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  for (const rule of config.headers) if (matches(rule.source, path)) for (const h of rule.headers) res.setHeader(h.key, h.value);
  let file = normalize(join(root, path));
  if (!file.startsWith(normalize(root)) || !existsSync(file) || statSync(file).isDirectory()) {
    const rewrite = (config.rewrites ?? []).find((r) => new RegExp(`^${r.source}$`).test(path));
    if (!rewrite) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Not found');
      return;
    }
    file = join(root, rewrite.destination);
  }
  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
}).listen(port, () => console.log(`serving dist with vercel.json headers on ${port}`));
