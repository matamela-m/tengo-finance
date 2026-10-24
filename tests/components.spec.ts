import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

// The Phase 1 primitives: onboarding stepper, calendar date field and the sortable transaction table.

async function asLerato(page: Page) {
  await page.goto('/start');
  await page.getByRole('button', { name: /Lerato/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test('the onboarding stepper marks the current step, moves focus to each new step, and Back never bounces forward', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: 'Start' }).click();
  const steps = page.getByRole('navigation', { name: 'Setup steps' });
  await expect(steps.locator('[aria-current="step"]')).toContainText('About');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your choices' })).toBeFocused();
  await expect(steps.locator('[aria-current="step"]')).toContainText('Choices');
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Add your money' })).toBeFocused();
  // Back from step 3 lands on step 2 and stays there, even though consent is already given.
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your choices' })).toBeFocused();
  await page.waitForTimeout(300);
  await expect(page.getByRole('heading', { level: 1, name: 'Your choices' })).toBeVisible();
  // A finished step can be revisited from the stepper.
  await steps.getByRole('button', { name: /About/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'What Tengo asks for, and why' })).toBeFocused();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('the calendar picks a date by keyboard, closes on Escape and returns focus', async ({ page }) => {
  await asLerato(page);
  await page.goto('/app/plan');
  const date = page.getByLabel('Date').first();
  const before = await date.inputValue();
  const open = page.getByRole('button', { name: 'Choose on a calendar' }).first();
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Calendar' });
  await expect(dialog).toBeVisible();
  const axe = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  // Open again, move one day on with the arrow key and choose it.
  await open.click();
  await expect(dialog.locator('button[aria-label*="selected"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  const after = await date.inputValue();
  expect(new Date(`${after}T12:00:00`).getTime() - new Date(`${before}T12:00:00`).getTime()).toBe(86_400_000);
});

test('the transaction table sorts by amount and says so to screen readers', async ({ page }) => {
  await asLerato(page);
  await page.goto('/app/money');
  const table = page.getByRole('table', { name: 'Transaction history' });
  await expect(table).toBeVisible();
  const amount = table.getByRole('columnheader', { name: /Amount/ });
  await expect(amount).toHaveAttribute('aria-sort', 'none');
  await table.getByRole('button', { name: 'Sort by Amount' }).click();
  await expect(amount).toHaveAttribute('aria-sort', 'descending');
  const first = await table.locator('tbody tr').first().locator('td').nth(3).innerText();
  await table.getByRole('button', { name: 'Sort by Amount' }).click();
  await expect(amount).toHaveAttribute('aria-sort', 'ascending');
  const firstAsc = await table.locator('tbody tr').first().locator('td').nth(3).innerText();
  expect(first.startsWith('+')).toBe(true);
  expect(firstAsc.startsWith('-')).toBe(true);
});

test('landing: the FAQ opens by keyboard, stats read their real numbers, and nothing moves under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const faq = page.locator('#faq');
  const first = faq.locator('summary').first();
  await expect(first).toHaveText('Is Tengo a bank?');
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(faq.getByText(/does not hold money, lend, sell products or give financial advice/)).toBeVisible();
  await expect(page.locator('#how').getByText('90', { exact: true }).first()).toBeAttached();
  const animated = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-line')!).animationDuration);
  expect(parseFloat(animated)).toBeLessThan(0.01);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('changing theme switches every colour at once, with no half-dark frame', async ({ page }) => {
  await asLerato(page);
  await page.goto('/app/me');
  await page.getByRole('heading', { level: 1 }).waitFor();
  // Colours of every element that animates its colours, read on the first frame after the click
  // and again once any transition would have finished.
  const animated = await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>('body *')].filter(
      (e) => /color|all/.test(getComputedStyle(e).transitionProperty) && parseFloat(getComputedStyle(e).transitionDuration) > 0,
    );
    els.forEach((e) => (e.dataset.fades = ''));
    return els.length;
  });
  expect(animated).toBeGreaterThan(3);
  const read = () =>
    [...document.querySelectorAll<HTMLElement>('[data-fades]')].map(
      (e) => getComputedStyle(e).backgroundColor + ' ' + getComputedStyle(e).color + ' ' + getComputedStyle(e).borderTopColor,
    );
  const during = await page.getByRole('radio', { name: 'Light' }).evaluate((el, src) => {
    // Read on the first frame after the theme attribute changes.
    const done = new Promise<string[]>((r) => {
      new MutationObserver((_, obs) => {
        obs.disconnect();
        requestAnimationFrame(() => r((0, eval)(`(${src})()`)));
      }).observe(document.documentElement, { attributeFilter: ['data-theme'] });
    });
    (el as HTMLElement).click();
    return done;
  }, read.toString());
  await page.waitForTimeout(600);
  const after: string[] = await page.evaluate(`(${read.toString()})()`);
  expect(during).toEqual(after);
});
