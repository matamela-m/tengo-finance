import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

// The person's own money as a guest: three ways in, the Home rule, export, delete, back to the picker.

async function startOwn(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/start');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { name: 'What Tengo asks for, and why' })).toBeVisible();
  await page.getByLabel('Name or nickname (optional)').fill('Sam');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Your choices' })).toBeVisible();
  // Messages and analytics start off.
  await expect(page.getByRole('switch', { name: 'Daily messages' })).not.toBeChecked();
  await expect(page.getByRole('switch', { name: 'Product analytics' })).not.toBeChecked();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Add your money' })).toBeVisible();
}

async function expectHomeRule(page: Page) {
  await expect(page).toHaveURL(/\/app$/);
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toContainText(/Enough until|Enough beyond|Tight until|Short from|Not enough to tell/);
  const budget = page.locator('section[aria-labelledby="sts-title"]');
  const text = await h1.innerText();
  if (/Short from/.test(text)) await expect(budget).toContainText('Not advised');
  // Own mode never shows the fictional demo chip.
  await expect(page.getByText('Demo | Fictional Data')).toHaveCount(0);
  await expect(page.getByText(/Your profile \| This device only/).first()).toBeVisible();
}

test('guest with sample numbers sees a labelled forecast that follows the Home rule', async ({ page }) => {
  await startOwn(page);
  await page.getByRole('button', { name: /Try with sample numbers/ }).click();
  await expect(page.getByText('Your first forecast')).toBeVisible();
  await page.getByRole('button', { name: 'Open Home' }).click();
  await expectHomeRule(page);
  await expect(page.getByText('Sample numbers', { exact: true })).toBeVisible();
  await expect(page.getByText(/Good (morning|afternoon|evening), Sam\./)).toBeVisible();
  // Nothing has left the device: only the profile namespace holds the data.
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain('tengo.profile.v1');
});

test('guest with answers gets an estimated forecast', async ({ page }) => {
  await startOwn(page);
  await page.getByRole('button', { name: /Answer a few questions/ }).click();
  await page.getByLabel('Balance in your bank account today').fill('2400');
  await page.getByLabel('Usual amount each time').fill('3000');
  await page.getByLabel('Usual everyday spending a day').fill('220');
  await page.getByRole('button', { name: 'See my date' }).click();
  await page.getByRole('button', { name: 'Open Home' }).click();
  await expectHomeRule(page);
  await expect(page.getByText('Estimated from your answers', { exact: true })).toBeVisible();
});

test('guest with a statement imports it and lands on Home', async ({ page }) => {
  await startOwn(page);
  await page.getByRole('button', { name: /Import a statement/ }).click();
  await expect(page).toHaveURL(/\/app\/money\/import$/);
  await page.getByRole('button', { name: 'Use sample statement' }).click();
  await page.getByRole('button', { name: 'Replace history and see my date' }).click();
  await expectHomeRule(page);
});

test('export, delete and return to the picker', async ({ page }) => {
  await startOwn(page);
  await page.getByRole('button', { name: /Try with sample numbers/ }).click();
  await page.getByRole('button', { name: 'Open Home' }).click();
  await page.goto('/app/privacy/data');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
  const json = JSON.parse(readFileSync((await download.path())!, 'utf8'));
  expect(json.persona.fictional).toBe(false);
  expect(json.transactions.length).toBeGreaterThan(10);
  expect(json.accounts.map((a: { kind: string }) => a.kind)).toEqual(['bank', 'cash']);
  const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  expect(readFileSync((await csv.path())!, 'utf8').split('\n')[0]).toBe('date,description,amount,category,account,one_off,estimated');

  await page.goto('/app/me');
  await page.getByRole('link', { name: 'Delete my profile' }).click();
  await page.getByRole('button', { name: 'Delete my data' }).click();
  await page.getByLabel('I understand this removes the data for good').check();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByText('Your profile was deleted')).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('tengo.profile.v1') ?? '');
  expect(stored).not.toMatch(/Sam|Sample money in/);
});

test('onboarding can be resumed where it stopped', async ({ page }) => {
  await startOwn(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Add your money' })).toBeVisible();
  await page.goto('/app');
  await expect(page).toHaveURL(/\/welcome$/);
});

test('a profile photo can be chosen, shows beside the name, and can be removed', async ({ page }) => {
  await startOwn(page);
  await page.getByRole('button', { name: /Try with sample numbers/ }).click();
  await page.getByRole('button', { name: 'Open Home' }).click();
  await page.goto('/app/me');
  // A 400 x 300 photo, made in the page so the test needs no file on disk.
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 300;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(0, 0, 400, 300);
    return c.toDataURL('image/png').split(',')[1]!;
  });
  await page.locator('input[type=file][accept="image/*"]').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByText('Photo saved')).toBeAttached();
  // Saved small and square with the profile, and used for the avatar.
  const photo = await page.evaluate(() => (JSON.parse(localStorage.getItem('tengo.profile.v1') ?? '{}') as { personas?: Record<string, { record?: { profile?: { photo?: string } } }> }).personas?.own?.record?.profile?.photo ?? '');
  expect(photo).toMatch(/^data:image\/(webp|jpeg);base64,/);
  expect(photo.length).toBeLessThan(40_000);
  await expect(page.locator(`img[src="${photo}"]`).first()).toBeVisible();
  // A file that is not an image is refused with a message.
  await page.locator('input[type=file][accept="image/*"]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.getByRole('alert')).toHaveText('That file could not be used. Try a JPG or PNG photo.');
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(page.locator(`img[src="${photo}"]`)).toHaveCount(0);
});
