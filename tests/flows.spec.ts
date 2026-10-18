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

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.state;
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await context.setOffline(false);
});

test('What helps most offers a way up for a Short persona', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Ayanda/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  const help = page.getByRole('region', { name: 'What helps most' });
  await expect(help).toBeVisible();
  await expect(help.getByText(/less a day until/)).toBeVisible();
});

test('command palette jumps to a page and changes theme and language', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.keyboard.press('Control+k');
  const box = page.getByRole('combobox', { name: 'Search commands' });
  await expect(box).toBeFocused();
  await box.fill('plan');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/app\/plan$/);
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Search commands' }).fill('light theme');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Search commands' }).fill('zulu');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zu');
});

test('theme is set before the app loads, so there is no flash', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: 'light', activePersonaId: null }, version: 0 })),
  );
  // Block the app bundle: only the inline script in index.html can set the theme now.
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('Tshivenda headings use Inter so words never mix fonts', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 've', theme: 'dark', activePersonaId: null }, version: 0 })),
  );
  await page.goto('/start');
  const heading = await page.getByRole('heading', { level: 1 }).evaluate((el) => getComputedStyle(el).fontFamily);
  expect(heading.startsWith('"Inter Variable"')).toBe(true);
  await page.evaluate(() =>
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'zu', theme: 'dark', activePersonaId: null }, version: 0 })),
  );
  await page.goto('/start');
  const zulu = await page.getByRole('heading', { level: 1 }).evaluate((el) => getComputedStyle(el).fontFamily);
  expect(zulu.startsWith('"Figtree Variable"')).toBe(true);
});
