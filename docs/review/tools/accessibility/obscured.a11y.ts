// Focus not obscured (2.4.11): tab on Home and Money at 390 px and screenshot the focused control behind the bottom tab bar.
import { test } from '@playwright/test';

for (const [path, name] of [['/app', 'Try it in Plan'], ['/app/money', 'Edit Paraffin']] as const) {
  test(`obscured ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/404-prime');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 'en', theme: 'light', activePersonaId: 'ayanda', sidebarCollapsed: false }, version: 0 }));
      localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { ayanda: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }));
    });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const n = await page.evaluate(() => (document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '').trim());
      if (n.startsWith(name)) break;
    }
    const info = await page.evaluate(() => {
      const r = document.activeElement!.getBoundingClientRect();
      const nav = document.querySelector('nav.fixed')!.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { el: [Math.round(r.top), Math.round(r.bottom)], navTop: Math.round(nav.top), elementOnTop: top?.closest('nav') ? 'bottom tab bar' : top?.tagName };
    });
    console.log(path, JSON.stringify(info));
    await page.screenshot({ path: `docs/review/tools/accessibility/results/focus-obscured${path.replace(/\//g, '-')}-390.png` });
  });
}
