// WCAG 2.2 AA axe scan, both themes, 390 and 1280 px, every main screen plus overlays.
// Raw results are written to docs/review/tools/accessibility/results/.
import AxeBuilder from '@axe-core/playwright';
import { test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const OUT = 'docs/review/tools/accessibility/results';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PAGES = ['/', '/start', '/consent', '/app', '/app/plan', '/app/money', '/app/money/import', '/app/inbox', '/app/privacy', '/app/privacy/data', '/app/privacy/audit', '/app/privacy/review', '/app/privacy/breach', '/app/privacy/delete', '/app/me'];

async function prime(page: Page, theme: string, consent: boolean, language = 'en') {
  await page.goto('/404-prime');
  await page.evaluate(
    ({ theme, consent, language }) => {
      localStorage.clear();
      localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language, theme, activePersonaId: 'ayanda', sidebarCollapsed: false }, version: 0 }));
      if (consent)
        localStorage.setItem(
          'tengo.data.v1',
          JSON.stringify({ personas: { ayanda: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }),
        );
    },
    { theme, consent, language },
  );
}

async function scan(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return {
    url: page.url(),
    violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, tags: v.tags, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target, html: n.html.slice(0, 200), summary: n.failureSummary })) })),
    incomplete: r.incomplete.map((v) => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length, targets: v.nodes.slice(0, 5).map((n) => n.target) })),
    passes: r.passes.length,
  };
}

for (const theme of ['dark', 'light'] as const) {
  for (const width of [390, 1280]) {
    test(`axe ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      const results: unknown[] = [];
      for (const path of PAGES) {
        await prime(page, theme, path !== '/consent');
        await page.goto(path);
        results.push(await scan(page));
      }
      // Overlays: Why this date drawer, command palette, open data table.
      await prime(page, theme, true);
      await page.goto('/app');
      await page.getByRole('button', { name: 'Why this date' }).first().click();
      await page.getByRole('dialog').waitFor();
      results.push({ overlay: 'why-drawer', ...(await scan(page)) });
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Show numbers' }).click();
      results.push({ overlay: 'chart-table', ...(await scan(page)) });
      await page.keyboard.press('Control+k');
      await page.getByRole('combobox').waitFor();
      results.push({ overlay: 'command-menu', ...(await scan(page)) });
      // Tshivenda selected (content still English).
      await prime(page, theme, true, 've');
      await page.goto('/app');
      results.push({ language: 've', ...(await scan(page)) });
      writeFileSync(`${OUT}/axe-${theme}-${width}.json`, JSON.stringify(results, null, 2));
    });
  }
}
