import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

// Automated WCAG 2.1 A and AA checks with axe-core on every main screen, light and dark.

const PAGES = ['/', '/start', '/app', '/app/plan', '/app/money', '/app/money/import', '/app/inbox', '/app/privacy', '/app/privacy/data', '/app/privacy/audit', '/app/privacy/review', '/app/privacy/breach', '/app/privacy/delete', '/app/me', '/app/money/setup', '/safety', '/exit'];

async function enter(page: Page, theme: 'light' | 'dark') {
  await page.goto('/404-prime');
  await page.evaluate((theme) => {
    localStorage.clear();
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme, activePersonaId: 'thabo' }, version: 0 }));
    localStorage.setItem(
      'tengo.data.v1',
      JSON.stringify({ personas: { thabo: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }),
    );
  }, theme);
}

async function scan(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const problems = result.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
        .slice(0, 4)
        .map((n) => `${n.target.join(' ')} :: ${n.html.slice(0, 120)} :: ${(n.any[0]?.message ?? n.failureSummary ?? '').slice(0, 160)}`)
        .join('\n  ')}`,
  );
  expect(problems, problems.join('\n')).toEqual([]);
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1280]) for (const path of PAGES) {
    test(`axe ${theme} ${width} ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await enter(page, theme);
      await page.goto(path);
      await scan(page);
    });
  }
}

test('axe consent screen', async ({ page }) => {
  await page.goto('/start');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.waitForURL(/consent/);
  await scan(page);
});

test('axe Why this date drawer', async ({ page }) => {
  await enter(page, 'light');
  await page.goto('/app');
  await page.getByRole('button', { name: 'Why this date' }).first().click();
  await page.getByRole('dialog').waitFor();
  await scan(page);
});

test('route change moves focus to main content', async ({ page }) => {
  await enter(page, 'light');
  await page.goto('/app');
  await page.getByRole('link', { name: 'Plan' }).first().click();
  await expect(page.locator('#main')).toBeFocused();
});

test('axe command palette', async ({ page }) => {
  await enter(page, 'dark');
  await page.goto('/app');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Search commands' }).waitFor();
  await scan(page);
});

for (const theme of ['light', 'dark'] as const) {
  test(`axe ${theme}: own-profile onboarding, account, notice and terms`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/404-prime');
    await page.evaluate((theme) => {
      localStorage.clear();
      localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme, activePersonaId: null }, version: 0 }));
      localStorage.setItem('tengo.e2e.accounts', '1');
    }, theme);
    for (const path of ['/privacy-notice', '/terms']) {
      await page.goto(path);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await scan(page);
    }
    await page.goto('/start');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('heading', { name: 'What Tengo asks for, and why' }).waitFor();
    await scan(page);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('heading', { name: 'Your choices' }).waitFor();
    await scan(page);
    await page.getByRole('button', { name: 'Agree and continue' }).click();
    await page.getByRole('heading', { name: 'Add your money' }).waitFor();
    await scan(page);
    await page.getByRole('button', { name: /Answer a few questions/ }).click();
    await scan(page);
    await page.goto('/app/account');
    await page.getByLabel('Email address').waitFor();
    await scan(page);
  });
}
