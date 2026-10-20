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
  // Thabo is Tight, so the headline says Tight until (it said Enough until before the Home rule).
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Tight until/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('Home follows one rule when Short: no budget figure, chart labelled as the usual case', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Ayanda/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Short from/);
  const budget = page.locator('section[aria-labelledby="sts-title"]');
  await expect(budget.getByText('Not advised', { exact: true })).toBeVisible();
  await expect(budget).toContainText('An estimate from your own history, not advice.');
  await expect(page.getByText('If money lands as usual').first()).toBeVisible();
  // The chart never repeats the cover state words.
  const readout = page.locator('.scrub-plot').locator('..');
  await expect(readout.getByText(/^(Enough|Tight|Short)$/)).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/safe to spend/i);
});

test('Tight shows a daily budget with what is kept back and the usual spend', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  const budget = page.locator('section[aria-labelledby="sts-title"]');
  await expect(budget.getByRole('heading', { name: 'Daily budget' })).toBeVisible();
  await expect(budget).toContainText(/R\s?\d/);
  await expect(budget).toContainText(/Your usual spend is R/);
  await expect(budget).toContainText(/(Keeps R.* back|nothing extra is kept back)/);
});

// Changed in build 2: html lang is the language of the text actually shown, so it stays "en" while a
// translation is pending (WCAG 3.1.1, A11Y-01). The chosen language still persists.
test('language choice persists, and html lang stays English while the text is English', async ({ page }) => {
  await page.goto('/start');
  await page.getByLabel('Language').selectOption('zu');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-ui-language', 'zu');
  await expect(page.locator('span', { hasText: /^English for now$/ })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Language')).toHaveValue('zu');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByLabel('Language').selectOption('ve');
  await expect(page.getByText('Needs a translator')).toBeVisible();
  await expect(page.getByText('Built for 11 languages. English today.').first()).toBeVisible();
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

test('messages are off by default and the inbox shows nothing until opted in', async ({ page }) => {
  // Messages used to default on; they now stay off until the person opts in.
  await page.goto('/start');
  await page.getByRole('button', { name: /Ayanda/ }).click();
  await expect(page.getByRole('switch', { name: 'Daily messages' })).not.toBeChecked();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/inbox');
  await expect(page.getByText('Daily messages are off')).toBeVisible();
});

test('opting in to messages at consent shows the preview', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Ayanda/ }).click();
  await page.getByRole('switch', { name: 'Daily messages' }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/inbox');
  await expect(page.getByText('Daily budget: not advised until your next money.')).toBeVisible();
});

test('Plan opens with a labelled example and Room to lend', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Lerato/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/plan');
  await expect(page.getByText(/An example to start with/)).toBeVisible();
  await expect(page.getByText('Room to lend', { exact: true })).toBeVisible();
  await expect(page.getByText(/Only lend what you could manage without getting back/)).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/safe to lend/i);
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

test('works offline straight after the first load, with no reload, on a cold profile', async ({ browser }) => {
  // A brand new context is a cold profile: no cache, no service worker, no storage.
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  // Wait until the service worker has installed the whole app and taken control of this page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });
  await context.setOffline(true);
  await page.goto('/start');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /Lerato/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/until|from|enough/i);
  await page.goto('/app/plan');
  await expect(page.getByRole('heading', { level: 1, name: 'Plan' })).toBeVisible();
  await context.close();
});

test('an offline page that was never loaded falls back to the offline page or the app shell', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });
  await context.setOffline(true);
  await page.goto('/app/money');
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.locator('#root, main').first()).toBeVisible();
  await context.close();
});

test('What helps most offers a way up for a Short persona', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Ayanda/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  const help = page.getByRole('region', { name: 'What helps most' });
  await expect(help).toBeVisible();
  // Changed in build 2: trims only come from spending the person marked flexible, so the first idea is to
  // earn or receive more, with a prompt to mark flexible spending.
  await expect(help.getByText(/Earn or receive R.* more before/)).toBeVisible();
  await expect(help.getByText(/Borrowing to cover a gap usually costs more later/)).toBeVisible();
  await expect(help.getByRole('link', { name: 'Choose on Money' })).toBeVisible();
  await expect(help).not.toContainText(/instalment|insurance|stock/i);
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
  // Changed in build 2: html lang stays "en" while isiZulu text is not translated yet.
  await expect(page.locator('html')).toHaveAttribute('data-ui-language', 'zu');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
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

// Changed in build 2: html lang is only "ve" once Tshivenda text is shown, so the test sets it directly
// to check the font rule that will apply then.
test('Tshivenda headings use Inter so words never mix fonts', async ({ page }) => {
  await page.goto('/start');
  await page.evaluate(() => (document.documentElement.lang = 've'));
  const heading = await page.getByRole('heading', { level: 1 }).evaluate((el) => getComputedStyle(el).fontFamily);
  expect(heading.startsWith('"Inter Variable"')).toBe(true);
  await page.evaluate(() => (document.documentElement.lang = 'zu'));
  const zulu = await page.getByRole('heading', { level: 1 }).evaluate((el) => getComputedStyle(el).fontFamily);
  expect(zulu.startsWith('"Figtree Variable"')).toBe(true);
});

/** Stores an imported record for Thabo, built in the page so dates are relative to the browser's today. */
async function seedImported(page: import('@playwright/test').Page, opts: { days: number; rentMonthsAgo?: number[]; balance: number }) {
  await page.goto('/');
  await page.evaluate((o) => {
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = new Date();
    const tx: { id: string; date: string; description: string; amount: number; category: string }[] = [];
    for (let i = o.days; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      tx.push({ id: `s${i}`, date: iso(d), description: 'Groceries', amount: -80, category: 'spend' });
      if (d.getDay() === 5) tx.push({ id: `p${i}`, date: iso(d), description: 'Wages', amount: 1500, category: 'income' });
    }
    for (const m of o.rentMonthsAgo ?? []) {
      const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
      tx.push({ id: `r${m}`, date: iso(d), description: 'Rent', amount: -900, category: 'bill' });
    }
    const now = new Date().toISOString();
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: 'light', activePersonaId: 'thabo', sidebarCollapsed: false }, version: 0 }));
    localStorage.setItem(
      'tengo.data.v1',
      JSON.stringify({
        personas: {
          thabo: {
            record: { personaId: 'thabo', transactions: tx, balance: o.balance, source: 'import', seededOn: iso(today), balanceDate: iso(today), billDecisions: {}, createdAt: now, updatedAt: now },
            consent: { core: true, messages: false, analytics: false, decidedAt: now },
            audit: [],
            reviews: [],
          },
        },
        receipts: [],
      }),
    );
  }, opts);
}

test('a 10 day history says Not enough to tell and shows no figures', async ({ page }) => {
  await seedImported(page, { days: 10, balance: 1500 });
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Not enough to tell');
  const budget = page.locator('section[aria-labelledby="sts-title"]');
  await expect(budget).toContainText('Not shown yet');
  await expect(page.getByText(/at least 14 days of money history/)).toBeVisible();
});

test('a bill that looks unpaid asks the person, and the answer clears the question', async ({ page }) => {
  await seedImported(page, { days: 100, rentMonthsAgo: [3, 2], balance: 3000 });
  await page.goto('/app');
  await expect(page.getByText(/Rent \(R.*\) looks unpaid/)).toBeVisible();
  await page.getByRole('button', { name: 'I still owe it' }).click();
  await expect(page.getByText(/looks unpaid/)).toHaveCount(0);
  await page.goto('/app/privacy/audit');
  await expect(page.getByText('Answered a question about a bill that looked unpaid')).toBeVisible();
});

test('cash out from Home lowers cash on hand and counts in the forecast', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Lerato/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  const before = await page.locator('section[aria-labelledby="sts-title"]').innerText();
  await page.getByRole('button', { name: 'Add cash' }).click();
  await page.getByRole('radio', { name: 'Cash out' }).check();
  await page.getByLabel('Amount').fill('150');
  await page.getByLabel('Note (optional)').fill('Taxi');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('section[aria-labelledby="sts-title"]')).not.toHaveText(before);
  await page.goto('/app/money');
  await expect(page.getByText('Cash on hand')).toBeVisible();
  await expect(page.getByText(/Cash$/).first()).toBeVisible();
  await page.goto('/app/privacy/audit');
  await expect(page.getByText('Recorded cash out')).toBeVisible();
});

test('set up by hand gives an estimated, low-confidence forecast', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/money/setup');
  await page.getByLabel('Balance in your bank account today').fill('1800');
  await page.getByRole('radio', { name: 'Weekly' }).check();
  await page.getByLabel('Usual amount each time').fill('2500');
  await page.getByLabel('Usual everyday spending a day').fill('200');
  await page.getByRole('button', { name: 'Add a bill' }).click();
  await page.getByLabel('Bill', { exact: true }).fill('Rent');
  await page.getByLabel('Amount', { exact: true }).fill('1500');
  await page.getByRole('button', { name: 'See my date' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText('Estimated from your answers', { exact: true })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="sts-title"]')).toContainText('Low');
});

test('an informal obligation can be added and counts like a bill', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('button', { name: /Lerato/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.goto('/app/money');
  await page.getByRole('button', { name: 'Add one' }).click();
  await page.getByLabel('Kind').selectOption('loan');
  await expect(page.getByText(/Never suggested to move: paying a loan/)).toBeVisible();
  await page.getByLabel('Name').fill('Paying back my cousin');
  await page.getByLabel('Amount').fill('300');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Paying back my cousin')).toBeVisible();
});
