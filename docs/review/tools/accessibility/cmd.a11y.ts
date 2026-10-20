// Command menu keyboard check with explicit waits. Writes results/command-menu.json.
import { test } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('command menu keyboard, careful', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/404-prime');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: 'dark', activePersonaId: 'ayanda', sidebarCollapsed: false }, version: 0 }));
    localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { ayanda: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }));
  });
  await page.goto('/app');
  await page.getByRole('heading', { level: 1 }).waitFor();
  const r: Record<string, unknown> = {};
  await page.keyboard.press('Control+k');
  const combo = page.getByRole('combobox');
  await combo.waitFor();
  await page.waitForTimeout(100);
  r.focusOnOpen = await page.evaluate(() => document.activeElement?.getAttribute('role'));
  r.optionsInitially = await page.getByRole('option').count();
  await page.keyboard.type('plan');
  await page.waitForTimeout(100);
  r.optionsAfterPlan = await page.getByRole('option').allTextContents();
  r.activeDesc = await page.evaluate(() => document.getElementById(document.activeElement!.getAttribute('aria-activedescendant') || '')?.textContent);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  r.urlAfterEnter = page.url();
  r.focusAfterRun = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  // Arrow navigation and theme command
  await page.keyboard.press('Control+k');
  await combo.waitFor();
  await page.waitForTimeout(100);
  await page.keyboard.type('light');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  r.themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
  r.liveRegion = await page.locator('[role=status][aria-live=polite]').first().textContent();
  // Typing Ctrl+K while inside a text field
  await page.goto('/app/plan');
  await page.waitForLoadState('networkidle');
  await page.locator('#loan-amount').focus();
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(200);
  r.opensFromTextField = await page.getByRole('combobox').count();
  writeFileSync('docs/review/tools/accessibility/results/command-menu.json', JSON.stringify(r, null, 2));
});
