// Loadshedding scenario: one visit only, service worker installed, then the network drops. Does the app still open?
import { test } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('offline after a single visit', async ({ page, context }) => {
  const r: Record<string, unknown> = {};
  await page.goto('/');
  r.swState = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state);
  await page.waitForTimeout(500);
  r.cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const out: string[] = [];
    for (const k of keys) for (const req of await (await caches.open(k)).keys()) out.push(new URL(req.url).pathname);
    return out;
  });
  await context.setOffline(true);
  await page.reload().catch((e) => (r.reloadError = String(e).slice(0, 120)));
  await page.waitForTimeout(1500);
  r.h1AfterOfflineReload = await page.locator('h1').count();
  r.bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 120);
  await context.setOffline(false);
  writeFileSync('docs/review/tools/accessibility/results/offline-single-visit.json', JSON.stringify(r, null, 2));
});
