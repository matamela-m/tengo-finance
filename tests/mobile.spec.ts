import { test, expect, devices } from '@playwright/test';

// Phone checks: no sideways panning, and no field small enough to make iOS Safari zoom in on tap.
test.use({ ...devices['iPhone 13'], browserName: 'chromium' });

const PAGES = ['/', '/start', '/app', '/app/plan', '/app/money', '/app/money/import', '/app/inbox', '/app/privacy', '/app/privacy/review', '/app/me'];

test.beforeEach(async ({ page }) => {
  await page.goto('/404-prime');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: 'light', activePersonaId: 'thabo' }, version: 0 }));
    localStorage.setItem(
      'tengo.data.v1',
      JSON.stringify({ personas: { thabo: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }),
    );
  });
});

for (const path of PAGES) {
  test(`phone ${path}: fits the screen and fields are at least 16px`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    if (path === '/app/money/import') await page.getByRole('button', { name: 'Use sample statement' }).click();
    const result = await page.evaluate(() => {
      const small: string[] = [];
      document.querySelectorAll<HTMLElement>('input, select, textarea').forEach((el) => {
        const type = (el as HTMLInputElement).type;
        if (['radio', 'checkbox', 'range', 'file', 'hidden'].includes(type)) return;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 16) small.push(`${el.tagName.toLowerCase()}#${el.id || '?'} ${size}px`);
      });
      return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, small };
    });
    expect(result.overflow, 'page wider than the screen').toBeLessThanOrEqual(0);
    expect(result.small, 'fields under 16px make iOS zoom in').toEqual([]);
    // Try to pan sideways: the page must not move.
    await page.mouse.wheel(400, 0);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
  });
}
