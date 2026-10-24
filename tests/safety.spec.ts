import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

// Shared-phone safety: app lock, discreet mode, quick exit, the policy page and diagnostics.

async function enterAsLerato(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/start');
  await page.getByRole('button', { name: /Lerato/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test('a PIN locks the app, a wrong PIN is refused and the right one unlocks', async ({ page }) => {
  await enterAsLerato(page);
  await page.goto('/app/me');
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await page.getByLabel('New PIN').fill('4821');
  await page.getByLabel('Type the PIN again').fill('4821');
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await expect(page.getByText(/On\. Tengo locks after 5 minutes/).first()).toBeVisible();
  // The PIN itself is never stored.
  const stored = await page.evaluate(() => localStorage.getItem('tengo.lock.v1') ?? '');
  expect(stored).not.toContain('4821');
  await page.getByRole('button', { name: 'Lock now' }).click();
  await expect(page.getByRole('heading', { name: 'Tengo is locked' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Lerato|R\d/);
  await page.getByLabel('PIN').fill('1111');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText('That PIN is not right. Try again.')).toBeVisible();
  await page.getByLabel('PIN').fill('4821');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Me' })).toBeVisible();
  // A reload starts locked.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tengo is locked' })).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('discreet mode hides amounts until Show amounts is tapped', async ({ page }) => {
  await enterAsLerato(page);
  await page.goto('/app/me');
  await page.getByRole('switch', { name: 'Discreet mode' }).check();
  await page.goto('/app');
  const budget = page.locator('section[aria-labelledby="sts-title"]');
  await expect(budget).toContainText('R ••••');
  await expect(budget).not.toContainText(/R\d/);
  await page.getByRole('button', { name: 'Show amounts' }).first().click();
  await expect(budget).toContainText(/R\d/);
  await page.getByRole('button', { name: 'Hide amounts' }).first().click();
  await expect(budget).not.toContainText(/R\d/);
});

test('quick exit goes straight back to the profiles and Back does not return to the forecast', async ({ page }) => {
  await enterAsLerato(page);
  await page.goto('/app/plan');
  await page.getByRole('button', { name: 'Quick exit' }).first().click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Choose how to explore' })).toBeVisible();
  // No amounts and no one chosen: nothing of Lerato's money is left on screen.
  await expect(page.locator('body')).not.toContainText(/R\d/);
  await expect(page.getByRole('button', { name: /Continue as/ })).toHaveCount(0);
  await page.goBack();
  await expect(page).not.toHaveURL(/\/app\/plan$/);
});

test('the safety policy is public and the diagnostics panel holds no personal data', async ({ page }) => {
  await page.goto('/safety');
  await expect(page.getByRole('heading', { name: 'Safety and who Tengo is for' })).toBeVisible();
  await expect(page.getByText('Adults only')).toBeVisible();
  await enterAsLerato(page);
  await page.goto('/app/me');
  await page.getByRole('button', { name: 'Show', exact: true }).click();
  const panel = page.locator('#diag-body');
  await expect(panel).toContainText('Data version');
  await expect(panel).not.toContainText(/Lerato|Salon|R\d/);
});
