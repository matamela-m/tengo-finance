import { test, expect, type Page } from '@playwright/test';

// Captures the main screens at the four target widths into screenshots/.
// Run: npm run screens (or SCREENS=home-thabo,landing npm run screens). Review the images by eye.

const WIDTHS = [390, 768, 1280, 1600];
const ONLY = process.env.SCREENS?.split(',');
const ONLY_WIDTHS = process.env.WIDTHS?.split(',').map(Number);
const THEMES = (process.env.THEMES?.split(',') ?? ['dark', 'light']) as ('dark' | 'light')[];

interface Shot {
  name: string;
  path: string;
  /** Enter the app as this persona with consent already given. */
  persona?: string;
  consent?: boolean;
  theme?: 'light' | 'dark';
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
  { name: 'privacy', path: '/app/privacy', persona: 'thabo' },
  { name: 'privacy-data', path: '/app/privacy/data', persona: 'thabo' },
  { name: 'privacy-review', path: '/app/privacy/review', persona: 'thabo' },
  { name: 'privacy-breach', path: '/app/privacy/breach', persona: 'thabo' },
  { name: 'inbox', path: '/app/inbox', persona: 'lerato' },
  { name: 'inbox-off', path: '/app/inbox', persona: 'ayanda', messages: false },
  { name: 'me', path: '/app/me', persona: 'ayanda' },
  { name: 'plan-ayanda', path: '/app/plan', persona: 'ayanda' },
  { name: 'setup', path: '/app/money/setup', persona: 'lerato' },
  { name: 'safety', path: '/safety' },
  { name: 'exit', path: '/exit' },
  { name: 'privacy-notice', path: '/privacy-notice' },
  { name: 'terms', path: '/terms' },
  { name: 'welcome-1', path: '/start', setup: async (page) => startOwn(page, 1) },
  { name: 'welcome-2', path: '/start', setup: async (page) => startOwn(page, 2) },
  { name: 'welcome-3', path: '/start', setup: async (page) => startOwn(page, 3) },
  { name: 'welcome-4', path: '/start', setup: async (page) => startOwn(page, 4) },
  {
    name: 'own-home',
    path: '/start',
    setup: async (page) => {
      await startOwn(page, 4);
      await page.getByRole('button', { name: 'Open Home' }).click();
      await page.getByRole('heading', { level: 1 }).waitFor();
    },
  },
  {
    name: 'account',
    path: '/start',
    setup: async (page) => {
      await startOwn(page, 4);
      await page.goto('/app/account');
      await page.getByLabel('Email address').waitFor();
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

/** Walks the own-profile onboarding to the given step, with sample numbers at step 4. */
async function startOwn(page: Page, step: 1 | 2 | 3 | 4) {
  await page.evaluate(() => localStorage.setItem('tengo.e2e.accounts', '1'));
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('heading', { name: 'What Tengo asks for, and why' }).waitFor();
  if (step === 1) return;
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('heading', { name: 'Your choices' }).waitFor();
  if (step === 2) return;
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.getByRole('heading', { name: 'Add your money' }).waitFor();
  if (step === 3) return;
  await page.getByRole('button', { name: /Try with sample numbers/ }).click();
  await page.getByText('Your first forecast').waitFor();
}

async function prime(page: Page, shot: Shot) {
  await page.goto('/404-prime');
  await page.evaluate(
    ({ persona, consent, messages, theme }) => {
      localStorage.clear();
      localStorage.setItem(
        'tengo.session.v1',
        JSON.stringify({ state: { language: 'en', theme, activePersonaId: persona ?? null }, version: 0 }),
      );
      if (persona && consent) {
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
    { persona: shot.persona, consent: shot.consent ?? true, messages: shot.messages ?? true, theme: shot.theme ?? 'light' },
  );
}

for (const shot of SHOTS) {
  if (ONLY && !ONLY.includes(shot.name)) continue;
  for (const theme of THEMES) for (const width of WIDTHS) {
    if (ONLY_WIDTHS && !ONLY_WIDTHS.includes(width)) continue;
    test(`${shot.name} ${theme} at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await prime(page, { ...shot, theme });
      await page.goto(shot.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400);
      if (shot.setup) await shot.setup(page);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `screenshots/${shot.name}-${theme}-${width}.png`, fullPage: shot.fullPage ?? true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
    });
  }
}
