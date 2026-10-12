import { test, expect, type Page } from '@playwright/test';

// Captures every main screen at the four target widths into screenshots/.
// Run: npm run screens. Review the images by eye after each change.

const WIDTHS = [390, 768, 1280, 1600];
const ONLY = process.env.SCREENS?.split(',');

interface Shot {
  name: string;
  path: string;
  persona?: string;
  setup?: (page: Page) => Promise<void>;
}

const SHOTS: Shot[] = [
  { name: 'app-shell', path: '/app/plan' },
];

for (const shot of SHOTS) {
  if (ONLY && !ONLY.includes(shot.name)) continue;
  for (const width of WIDTHS) {
    test(`${shot.name} at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.goto('/');
      if (shot.persona) {
        await page.evaluate((id) => {
          localStorage.setItem('tengo.e2e.persona', id);
        }, shot.persona);
      }
      await page.goto(shot.path);
      await page.waitForLoadState('networkidle');
      if (shot.setup) await shot.setup(page);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `screenshots/${shot.name}-${width}.png`, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
    });
  }
}
