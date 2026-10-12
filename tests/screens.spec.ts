import { test, expect, type Page } from '@playwright/test';

// Captures the main screens at the four target widths into screenshots/.
// Run: npm run screens (or SCREENS=home-thabo,landing npm run screens). Review the images by eye.

const WIDTHS = [390, 768, 1280, 1600];
const ONLY = process.env.SCREENS?.split(',');
const ONLY_WIDTHS = process.env.WIDTHS?.split(',').map(Number);

interface Shot {
  name: string;
  path: string;
  /** Enter the app as this persona with consent already given. */
  persona?: string;
  consent?: boolean;
  messages?: boolean;
  setup?: (page: Page) => Promise<void>;
  fullPage?: boolean;
}

const SHOTS: Shot[] = [
  { name: 'landing', path: '/' },
  { name: 'picker', path: '/start' },
  { name: 'consent', path: '/consent', persona: 'thabo', consent: false },
  { name: 'home-thabo', path: '/app', persona: 'thabo' },
  { name: 'home-lerato', path: '/app', persona: 'lerato' },
  { name: 'home-ayanda', path: '/app', persona: 'ayanda' },
  { name: 'plan', path: '/app/plan', persona: 'thabo' },
  { name: 'money', path: '/app/money', persona: 'lerato' },
  {
    name: 'import',
    path: '/app/money/import',
    persona: 'lerato',
    setup: async (page) => {
      await page.getByRole('button', { name: 'Use sample statement' }).click();
    },
  },
  {
    name: 'why-drawer',
    path: '/app',
    persona: 'thabo',
    fullPage: false,
    setup: async (page) => {
      await page.getByRole('button', { name: 'Why this date' }).first().click();
      await page.getByRole('dialog').waitFor();
    },
  },
];

async function prime(page: Page, shot: Shot) {
  await page.goto('/404-prime');
  await page.evaluate(
    ({ persona, consent, messages }) => {
      localStorage.clear();
      if (!persona) return;
      localStorage.setItem(
        'tengo.session.v1',
        JSON.stringify({ state: { language: 'en', theme: 'light', activePersonaId: persona }, version: 0 }),
      );
      if (consent) {
        const now = new Date().toISOString();
        localStorage.setItem(
          'tengo.data.v1',
          JSON.stringify({
            personas: { [persona]: { consent: { core: true, messages, analytics: false, decidedAt: now }, audit: [], reviews: [] } },
            receipts: [],
          }),
        );
      }
    },
    { persona: shot.persona, consent: shot.consent ?? true, messages: shot.messages ?? true },
  );
}

for (const shot of SHOTS) {
  if (ONLY && !ONLY.includes(shot.name)) continue;
  for (const width of WIDTHS) {
    if (ONLY_WIDTHS && !ONLY_WIDTHS.includes(width)) continue;
    test(`${shot.name} at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await prime(page, shot);
      await page.goto(shot.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400);
      if (shot.setup) await shot.setup(page);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `screenshots/${shot.name}-${width}.png`, fullPage: shot.fullPage ?? true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
    });
  }
}
