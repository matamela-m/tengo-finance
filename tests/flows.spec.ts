import { test, expect } from '@playwright/test';

// End to end checks of the flows that change stored data.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('enter as a persona, give consent, see the date', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await expect(page).toHaveURL(/\/consent$/);
  await expect(page.getByText('Simulated privacy controls. Not a compliance certification.')).toBeVisible();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Enough until|Short from/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('language choice persists and sets html lang', async ({ page }) => {
  await page.goto('/start');
  await page.getByLabel('Language').selectOption('zu');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zu');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zu');
  await page.getByLabel('Language').selectOption('nso');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nso');
});

test('withdrawing core consent pauses the forecast and resume brings it back', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Lerato/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/privacy');
  await page.getByRole('switch', { name: 'Forecast' }).click();
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Forecast paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume forecast' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Enough until/);
});

test('messages off hides the inbox preview', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Ayanda/ }).click();
  await page.getByRole('switch', { name: 'Daily messages' }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/inbox');
  await expect(page.getByText('Daily messages are off')).toBeVisible();
});

test('import the sample statement and land on Home', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/money/import');
  await page.getByRole('button', { name: 'Use sample statement' }).click();
  await expect(page.getByText('2 rows skipped')).toBeVisible();
  await page.getByRole('button', { name: 'Replace history and see my date' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/app/privacy/audit');
  await expect(page.getByText(/Imported a statement with \d+ transactions/)).toBeVisible();
});

test('correct a transaction and see it in the audit log', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Lerato/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/money');
  await page.getByRole('button', { name: /^Edit / }).first().click();
  await page.getByLabel('Description').fill('Corrected entry');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Corrected entry').first()).toBeVisible();
  await page.goto('/app/privacy/audit');
  await expect(page.getByText(/Corrected .*: description/)).toBeVisible();
});

test('delete my data writes a receipt and returns to the picker', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Ayanda/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/privacy/delete');
  await page.getByRole('button', { name: 'Delete my data' }).click();
  await page.getByLabel('I understand this removes the data for good').check();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page).toHaveURL(/\/start\?deleted=/);
  await expect(page.getByText("Ayanda's data was deleted")).toBeVisible();
  // Entering again asks for consent afresh.
  await page.getByRole('button', { name: /Ayanda/ }).click();
  await expect(page).toHaveURL(/\/consent$/);
});

test('question this result sends a simulated review request', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.getByRole('button', { name: 'Why this date' }).first().click();
  await page.getByRole('link', { name: 'Question this result' }).click();
  await expect(page).toHaveURL(/\/app\/privacy\/review$/);
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('Request received')).toBeVisible();
});

test('scrubber responds to the keyboard', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  const slider = page.getByRole('slider', { name: 'Pick a day in the next 30 days' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('2');
  await page.keyboard.press('End');
  await expect(slider).toHaveValue('29');
});

test('no third party requests', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol.startsWith('http')) external.push(r.url());
  });
  await page.goto('/');
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.waitForLoadState('networkidle');
  expect(external).toEqual([]);
});
