// Resolves the offline conflict: which first visit and which offline URL work.
import { test } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const cases = [
  { first: '/', offline: '/', reloadBeforeOffline: true },
  { first: '/', offline: '/', reloadBeforeOffline: false },
  { first: '/', offline: '/app', reloadBeforeOffline: true },
  { first: '/app', offline: '/app', reloadBeforeOffline: false },
  { first: '/app', offline: '/app', reloadBeforeOffline: true },
];

test('offline matrix', async ({ browser }) => {
  const rows: string[] = ['first,offline,reloadBeforeOffline,swControlled,renderedHeading,bodyTextChars'];
  for (const c of cases) {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: 'dark', activePersonaId: 'thabo' }, version: 0 }));
      if (!localStorage.getItem('tengo.data.v1')) localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { thabo: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }));
    });
    const page = await context.newPage();
    await page.goto(c.first);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    if (c.reloadBeforeOffline) {
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    let heading = '';
    let chars = 0;
    try {
      await page.goto(c.offline, { timeout: 10000 });
      await page.waitForTimeout(1500);
      heading = (await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => '')) ?? '';
      chars = (await page.locator('body').innerText()).trim().length;
    } catch (e) {
      heading = `error: ${String(e).slice(0, 60)}`;
    }
    rows.push([c.first, c.offline, c.reloadBeforeOffline, controlled, JSON.stringify(heading.trim().slice(0, 40)), chars].join(','));
    await context.close();
  }
  writeFileSync('docs/review/tools/synthesis/offline-matrix.csv', rows.join('\n') + '\n');
  console.log(rows.join('\n'));
});
