// Times the in-app Home page under mobile throttling (4x CPU slowdown, about 1.6 Mbps, 150 ms latency).
// Cold: a fresh browser context, so every asset downloads under throttling. Warm: a reload in the same context.
import { test } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('home under mobile throttling', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await context.addInitScript(() => {
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: 'dark', activePersonaId: 'thabo' }, version: 0 }));
    if (!localStorage.getItem('tengo.data.v1')) {
      localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { thabo: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }));
    }
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });

  const results: Record<string, number | string>[] = [];
  for (const run of ['cold', 'warm'] as const) {
    const t0 = Date.now();
    if (run === 'cold') await page.goto('/app');
    else await page.reload();
    await page.getByRole('heading', { level: 1 }).waitFor();
    const heroVisibleMs = Date.now() - t0;
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const kb = Math.round(res.reduce((s, r) => s + (r.transferSize || 0), n.transferSize || 0) / 1024);
      return { domContentLoadedMs: Math.round(n.domContentLoadedEventEnd), loadMs: Math.round(n.loadEventEnd), fcpMs: fcp ? Math.round(fcp.startTime) : -1, transferredKB: kb };
    });
    results.push({ run, heroVisibleMs, ...nav });
  }
  writeFileSync('docs/review/prep/perf-home.json', JSON.stringify({ conditions: '4x CPU slowdown, 1.6 Mbps down, 750 kbps up, 150 ms latency, 390x844, service worker blocked', results }, null, 2));
  console.log(JSON.stringify(results));
  await context.close();
});
