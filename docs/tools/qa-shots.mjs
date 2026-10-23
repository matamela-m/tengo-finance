// Phase 4 QA: full-page screenshots of every page at four widths in both themes, plus a horizontal
// overflow report. Needs vite preview on 4173. Usage: node docs/tools/qa-shots.mjs <out-dir>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const PAGES = ['/', '/start', '/consent', '/welcome', '/safety', '/privacy-notice', '/terms', '/exit', '/app', '/app/plan', '/app/money', '/app/money/import', '/app/money/setup', '/app/account', '/app/inbox', '/app/privacy', '/app/me', '/no-such-page'];
const WIDTHS = [390, 768, 1280, 1600];
const b = await chromium.launch();
const report = [];
for (const theme of ['dark', 'light']) for (const w of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/404-prime');
  await p.evaluate((th) => { localStorage.clear(); localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: th, activePersonaId: 'thabo' }, version: 0 }));
    localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { thabo: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] })); }, theme);
  for (const path of PAGES) {
    await p.goto('http://localhost:4173' + path); await p.waitForLoadState('networkidle'); await p.waitForTimeout(500);
    // Run every scroll reveal and counter, then come back up.
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
    await p.waitForTimeout(700);
    const m = await p.evaluate(() => {
      const over = document.documentElement.scrollWidth - innerWidth;
      const wide = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed'; }).slice(0, 3).map((e) => e.tagName + '.' + String(e.className).slice(0, 40));
      return { over, wide, theme: document.documentElement.dataset.theme ?? document.documentElement.className };
    });
    const name = `${path === '/' ? 'landing' : path.slice(1).replace(/\//g, '-')}-${w}-${theme}.png`;
    await p.screenshot({ path: `${out}/${name}`, fullPage: true });
    report.push({ path, w, theme, ...m });
  }
  await ctx.close();
}
await b.close();
for (const r of report) if (r.over > 0 || r.wide.length) console.log('OVERFLOW', r.path, r.w, r.theme, r.over, r.wide.join(' '));
console.log('shots', report.length);
