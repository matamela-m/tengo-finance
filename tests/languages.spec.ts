import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { test, expect, devices } from '@playwright/test';

// Every drafted or reviewed language, on a phone: translated text is often longer than English, so pages must
// still fit, the page must declare the language it shows, no raw translation key may leak, and Home must pass axe.
test.use({ ...devices['iPhone 13'], browserName: 'chromium' });

const status = JSON.parse(readFileSync('src/i18n/status.json', 'utf8')) as Record<string, string>;
const LANGS = Object.entries(status)
  .filter(([, s]) => s === 'machine' || s === 'reviewed')
  .map(([code]) => code);
const PAGES = ['/', '/start', '/app', '/app/plan', '/app/money', '/app/inbox', '/app/privacy', '/app/me', '/safety'];
// A dotted lower-camel key such as "sts.title" or "plan.roomToLendHint" showing as text means a missing string.
const RAW_KEY = /\b[a-z][a-zA-Z]+\.[a-z][a-zA-Z]+(\.[a-zA-Z]+)?\b/;

for (const lang of LANGS) {
  test.describe(lang, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/404-prime');
      await page.evaluate((l) => {
        localStorage.clear();
        localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: l, theme: 'light', activePersonaId: 'thabo' }, version: 0 }));
        localStorage.setItem(
          'tengo.data.v1',
          JSON.stringify({ personas: { thabo: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }),
        );
      }, lang);
    });

    for (const path of PAGES) {
      test(`${lang} ${path}: fits, declares the language, no raw keys`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          text: document.body.innerText,
        }));
        expect(result.overflow, 'page wider than the screen').toBeLessThanOrEqual(0);
        const leaked = result.text.split('\n').filter((line) => RAW_KEY.test(line) && !/https?:|\.csv|\.json|tengo\./i.test(line));
        expect(leaked, 'raw translation keys on screen').toEqual([]);
      });
    }

    test(`${lang} Home has no axe violations`, async ({ page }) => {
      await page.goto('/app');
      await page.waitForLoadState('networkidle');
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  });
}
