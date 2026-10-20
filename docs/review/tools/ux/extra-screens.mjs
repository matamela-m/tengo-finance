// UX reviewer extra screenshots. Run: node docs/review/tools/ux/extra-screens.mjs (needs build on :4180)
import { chromium } from 'playwright';
const BASE = 'http://localhost:4180';
const OUT = 'docs/review/screens/ux';
const browser = await chromium.launch();
async function ctx(theme, persona, consent, width = 390, messagesOff = false, core = true) {
  const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 900 } });
  await page.goto(BASE + '/404-prime');
  await page.evaluate(({ theme, persona, consent, core }) => {
    localStorage.clear();
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme, activePersonaId: persona, sidebarCollapsed: false }, version: 0 }));
    if (persona && consent) localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { [persona]: { consent: { core, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }));
  }, { theme, persona, consent, core });
  return page;
}
const shot = async (p, f, full = false) => { await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/${f}.png`, fullPage: full }); };
for (const persona of ['thabo', 'lerato', 'ayanda']) {
  const p = await ctx('light', persona, true);
  await p.goto(BASE + '/app'); await shot(p, `${persona}-home-fold-light-390`);
  await p.close();
}
let p = await ctx('dark', 'ayanda', true);
await p.goto(BASE + '/app/does-not-exist'); await shot(p, 'notfound-dark-390');
await p.close();
p = await ctx('dark', 'ayanda', true, 390, false, false);
await p.goto(BASE + '/app'); await shot(p, 'paused-dark-390', true);
await p.close();
p = await ctx('light', 'ayanda', true, 1280);
await p.goto(BASE + '/app/plan');
const amt = p.getByLabel('Amount').first(); await amt.fill(''); await shot(p, 'ayanda-plan-empty-amount-light-1280');
await amt.fill('-50'); await shot(p, 'ayanda-plan-negative-light-1280');
await p.close();
p = await ctx('light', 'thabo', true, 1280);
await p.goto(BASE + '/app/money/import');
await p.setInputFiles('input[type=file]', { name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('foo,bar\n1,2\n') });
await shot(p, 'thabo-import-badfile-light-1280', true);
await p.close();
await browser.close();
