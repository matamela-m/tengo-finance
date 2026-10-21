// Lighthouse mobile runs on the built app (vite preview on 4173), including Home and onboarding, which
// need storage set first. Playwright writes the storage into a fresh browser profile, then Lighthouse
// starts its own Chrome on that profile. Usage: node docs/review/after/lighthouse/run.mjs
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = 'http://localhost:4173';
const OUT = 'docs/review/after/lighthouse';
const runs = [
  ['landing', '/', null],
  ['picker', '/start', null],
  ['home', '/app', 'thabo'],
  ['onboarding', '/welcome', 'own'],
];
const summary = [];
for (const [name, path, persona] of runs) {
  const dir = mkdtempSync(join(tmpdir(), 'tengo-lh-'));
  const ctx = await chromium.launchPersistentContext(dir);
  const page = await ctx.newPage();
  await page.goto(BASE + '/404-prime');
  await page.evaluate((p) => {
    localStorage.clear();
    if (!p) return;
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: 'light', activePersonaId: p }, version: 0 }));
    if (p === 'thabo')
      localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { thabo: { consent: { core: true, messages: false, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }));
  }, persona);
  await ctx.close();
  execFileSync(
    'npx',
    ['lighthouse', BASE + path, '--disable-storage-reset', '--form-factor=mobile', `--chrome-flags=--headless=new --user-data-dir=${dir}`, '--only-categories=performance,accessibility,best-practices,seo', '--output=json', `--output-path=${OUT}/${name}.json`, '--quiet'],
    { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chromium.executablePath() } },
  );
  const r = JSON.parse(readFileSync(`${OUT}/${name}.json`, 'utf8'));
  const c = r.categories;
  summary.push(`| ${name} | ${r.finalDisplayedUrl.replace(BASE, '')} | ${Math.round(c.performance.score * 100)} | ${Math.round(c.accessibility.score * 100)} | ${Math.round(c['best-practices'].score * 100)} | ${Math.round(c.seo.score * 100)} | ${Math.round(r.audits['first-contentful-paint'].numericValue)} | ${Math.round(r.audits['largest-contentful-paint'].numericValue)} |`);
}
console.log(['| Page | Final URL | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms |', '| --- | --- | --- | --- | --- | --- | --- | --- |', ...summary].join('\n'));
