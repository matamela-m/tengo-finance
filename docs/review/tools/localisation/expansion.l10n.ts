// Pseudo-localisation: sets the app to Tshivenda (ve), grows every visible text node by 40 percent
// with Tshivenda letters, then lists elements whose text is clipped or overflows, at 390px wide.
import { test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const OUT = 'docs/review/tools/localisation';
const PAGES = [
  ['home', '/app'], ['plan', '/app/plan'], ['money', '/app/money'], ['inbox', '/app/inbox'],
  ['privacy', '/app/privacy'], ['me', '/app/me'],
] as const;
const MODE = process.env.L10N_MODE ?? 'flat';

async function prime(page: Page) {
  await page.goto('/404-prime');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language: 've', theme: 'light', activePersonaId: 'thabo', sidebarCollapsed: false }, version: 0 }));
    localStorage.setItem('tengo.data.v1', JSON.stringify({ personas: { thabo: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }));
  });
}

for (const width of [390, 360]) {
  for (const [name, path] of PAGES) {
    test(`${name} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await prime(page);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.evaluate((m) => { (window as any).__mode = m; }, MODE);
      const info = await page.evaluate(() => {
        const lang = document.documentElement.lang;
        const h1 = document.querySelector('h1');
        const headingFont = h1 ? getComputedStyle(h1).fontFamily : null;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        while (walker.nextNode()) {
          const n = walker.currentNode as Text;
          const p = n.parentElement;
          if (!p || ['SCRIPT', 'STYLE', 'TITLE'].includes(p.tagName)) continue;
          const s = n.data.trim();
          if (!s || /^[\sR0-9.,:%+\-/]+$/.test(s)) continue; // leave numbers alone
          nodes.push(n);
        }
        const pad = 'ṱhoḓaṅṋḽ';
        for (const n of nodes) {
          const len = n.data.trim().length;
          // W3C/IBM guide, lower bound of each band: total length as a share of the English length.
          const factor = (window as any).__mode === 'ibm' ? (len <= 10 ? 2 : len <= 20 ? 1.8 : len <= 30 ? 1.6 : len <= 50 ? 1.4 : len <= 70 ? 1.5 : 1.3) : 1.4;
          const extra = Math.ceil(len * (factor - 1));
          n.data = n.data.replace(/\s+$/, '') + ' ' + pad.repeat(Math.ceil(extra / pad.length)).slice(0, extra);
        }
        const clipped: string[] = [];
        for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
          const r = el.getBoundingClientRect();
          if (!r.width || !el.textContent?.trim() || el.children.length > 3) continue;
          const cs = getComputedStyle(el);
          const hidesOverflow = cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis';
          if (el.scrollWidth > el.clientWidth + 1 && hidesOverflow) clipped.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}"`);
        }
        return { lang, headingFont, nodes: nodes.length, clipped: [...new Set(clipped)], pageOverflow: document.documentElement.scrollWidth > window.innerWidth };
      });
            await page.screenshot({ path: `${OUT}/shots/pseudo-ve-${MODE}-${name}-${width}.png`, fullPage: false });
      writeFileSync(`${OUT}/expansion-${MODE}-${name}-${width}.json`, JSON.stringify(info, null, 2));
    });
  }
}
