// Phone screenshot of one page in one language, for checking a translation by eye. Needs vite preview on 4173.
// Usage: node docs/tools/lang-shot.mjs <lang> <path> <out.png> [persona]
import { chromium, devices } from '@playwright/test';
const [lang, path, out, persona='thabo'] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
await p.goto('http://localhost:4173/404-prime');
await p.evaluate(([l, who]) => { localStorage.clear(); localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: l, theme: 'light', activePersonaId: who }, version: 0 }));
 localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { [who]: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] })); }, [lang, persona]);
await p.goto('http://localhost:4173' + path); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400);
await p.screenshot({ path: out, fullPage: true }); await b.close();
