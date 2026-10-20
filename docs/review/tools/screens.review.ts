// Captures every page, both themes, at 390, 768 and 1280px, for all three personas, into docs/review/screens.
import { test, type Page } from '@playwright/test';

const WIDTHS = [390, 768, 1280];
const THEMES = ['dark', 'light'] as const;
const PERSONAS = ['thabo', 'lerato', 'ayanda'] as const;
const OUT = 'docs/review/screens';

const APP_PAGES: { name: string; path: string; setup?: (p: Page) => Promise<void> }[] = [
  { name: 'home', path: '/app' },
  {
    name: 'why-drawer',
    path: '/app',
    setup: async (p) => {
      await p.getByRole('button', { name: 'Why this date' }).first().click();
      await p.getByRole('dialog').waitFor();
    },
  },
  { name: 'plan', path: '/app/plan' },
  { name: 'money', path: '/app/money' },
  {
    name: 'import-sample',
    path: '/app/money/import',
    setup: async (p) => {
      await p.getByRole('button', { name: 'Use sample statement' }).click();
    },
  },
  { name: 'inbox', path: '/app/inbox' },
  { name: 'privacy', path: '/app/privacy' },
  { name: 'privacy-data', path: '/app/privacy/data' },
  { name: 'privacy-audit', path: '/app/privacy/audit' },
  { name: 'privacy-review', path: '/app/privacy/review' },
  { name: 'privacy-breach', path: '/app/privacy/breach' },
  { name: 'privacy-delete', path: '/app/privacy/delete' },
  { name: 'me', path: '/app/me' },
];

async function prime(page: Page, theme: string, persona: string | null, consent: boolean) {
  await page.goto('/404-prime');
  await page.evaluate(
    ({ theme, persona, consent }) => {
      localStorage.clear();
      localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme, activePersonaId: persona, sidebarCollapsed: false }, version: 0 }));
      if (persona && consent) {
        localStorage.setItem(
          'tengo.data.v1',
          JSON.stringify({ personas: { [persona]: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }),
        );
      }
    },
    { theme, persona, consent },
  );
}

async function shoot(page: Page, file: string, full = true) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: full });
}

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test(`public pages ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await prime(page, theme, null, false);
      await page.goto('/');
      await shoot(page, `landing-${theme}-${width}`);
      await page.goto('/start');
      await shoot(page, `picker-${theme}-${width}`);
    });
    for (const persona of PERSONAS) {
      test(`${persona} ${theme} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await prime(page, theme, persona, false);
        await page.goto('/consent');
        await shoot(page, `${persona}-consent-${theme}-${width}`);
        await prime(page, theme, persona, true);
        for (const p of APP_PAGES) {
          await page.goto(p.path);
          await page.waitForLoadState('networkidle');
          if (p.setup) await p.setup(page);
          await shoot(page, `${persona}-${p.name}-${theme}-${width}`, p.name !== 'why-drawer');
        }
      });
    }
  }
}
