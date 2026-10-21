import { readFileSync } from 'node:fs';
import { test, expect, type BrowserContext, type Page } from '@playwright/test';

// Optional accounts, against the in-memory account server (switched on only at localhost by
// "tengo.e2e.accounts"). The "cloud" is the localStorage key tengo.e2e.server, carried between browser
// contexts to stand in for a second device. Row-level security itself is tested in SQL (npm run test:rls).

async function device(context: BrowserContext, server = '') {
  await context.addInitScript((s) => {
    localStorage.setItem('tengo.e2e.accounts', '1');
    if (s && !localStorage.getItem('tengo.e2e.server')) localStorage.setItem('tengo.e2e.server', s);
  }, server);
  return context.newPage();
}

async function guestWithSample(page: Page) {
  await page.goto('/start');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByLabel('Name or nickname (optional)').fill('Sam');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.getByRole('button', { name: /Try with sample numbers/ }).click();
  await expect(page.getByText('Your first forecast')).toBeVisible();
}

async function signIn(page: Page, email: string) {
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('I am 18 or older.').check();
  await page.getByRole('button', { name: 'Send me a code' }).click();
  await page.getByLabel('One-time code').fill('123456');
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('a guest saves to an account after seeing value; the device copy is removed', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await device(context);
  await guestWithSample(page);
  await page.getByRole('link', { name: 'Save to an account' }).click();
  // The 18 or older box is required before a code can be sent.
  await page.getByLabel('Email address').fill('sam@example.test');
  await expect(page.getByRole('button', { name: 'Send me a code' })).toBeDisabled();
  await signIn(page, 'sam@example.test');
  await expect(page.getByRole('heading', { name: 'Save what is on this device?' })).toBeVisible();
  await page.getByRole('button', { name: "Save this device's profile" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(/Your profile \| Saved to your account/).first()).toBeVisible();
  await expect(page.getByText(/Good (morning|afternoon|evening), Sam\./)).toBeVisible();
  const onDevice = await page.evaluate(() => localStorage.getItem('tengo.profile.v1') ?? '');
  expect(onDevice).not.toMatch(/Sample money in/);
  await context.close();
});

test('signing in on a second device uses the account data; a conflict asks first', async ({ browser }) => {
  const first = await browser.newContext();
  const a = await device(first);
  await guestWithSample(a);
  await a.goto('/app/account');
  await signIn(a, 'pat@example.test');
  await a.getByRole('button', { name: "Save this device's profile" }).click();
  await expect(a).toHaveURL(/\/app$/);
  const server = await a.evaluate(() => localStorage.getItem('tengo.e2e.server') ?? '');
  await first.close();
  // Later devices sign in a minute on, so a new code may be sent (the server limits code requests per email).
  const later = JSON.stringify({ ...JSON.parse(server), lastCode: {} });

  // A clean second device: sign in from onboarding and get the account's data.
  const second = await browser.newContext();
  const b = await device(second, later);
  await b.goto('/start');
  await b.getByRole('button', { name: 'Start' }).click();
  await b.getByRole('link', { name: 'Already saved to an account? Sign in' }).click();
  await signIn(b, 'pat@example.test');
  await expect(b.getByRole('button', { name: "Use the account's data" })).toBeVisible();
  await expect(b.getByRole('button', { name: "Replace it with this device's data" })).toHaveCount(0);
  await b.getByRole('button', { name: "Use the account's data" }).click();
  await expect(b).toHaveURL(/\/app$/);
  await expect(b.getByText('Sample numbers', { exact: true })).toBeVisible();
  await second.close();

  // A third device that already has its own profile: the conflict prompt offers both, account first.
  const third = await browser.newContext();
  const c = await device(third, later);
  await guestWithSample(c);
  await c.goto('/app/account');
  await signIn(c, 'pat@example.test');
  await expect(c.getByRole('heading', { name: 'This account already has data' })).toBeVisible();
  const buttons = c.locator('section[aria-labelledby="acc-choose"] button');
  await expect(buttons.nth(0)).toHaveText("Use the account's data");
  await expect(buttons.nth(1)).toHaveText("Replace it with this device's data");
  await third.close();
});

test('export from the server, then delete the account with a receipt', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await device(context);
  await guestWithSample(page);
  await page.goto('/app/account');
  await signIn(page, 'del@example.test');
  await page.getByRole('button', { name: "Save this device's profile" }).click();
  await page.goto('/app/account');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
  const data = JSON.parse(readFileSync((await download.path())!, 'utf8'));
  expect(data.transactions.length).toBeGreaterThan(10);
  expect(data.consentRecords.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Delete my account' }).click();
  await page.getByRole('button', { name: 'Yes, delete my account' }).click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByText('Your profile was deleted')).toBeVisible();
  const server = await page.evaluate(() => localStorage.getItem('tengo.e2e.server') ?? '');
  expect(server).not.toMatch(/del@example|Sam|Sample money in/);
  await context.close();
});

test('sign out everywhere ends the session and returns to the picker', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await device(context);
  await guestWithSample(page);
  await page.goto('/app/account');
  await signIn(page, 'out@example.test');
  await page.getByRole('button', { name: "Save this device's profile" }).click();
  await page.goto('/app/account');
  await page.getByRole('button', { name: 'Sign out everywhere' }).click();
  await expect(page).toHaveURL(/\/start$/);
  const session = await page.evaluate(() => localStorage.getItem('tengo.e2e.session'));
  expect(session).toBeNull();
  await context.close();
});
