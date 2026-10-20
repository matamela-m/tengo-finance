// Scripted manual checks the axe scan cannot make: keyboard paths, focus obscured by sticky bars,
// slider value text, reflow at 320 CSS px, target sizes, language attribute, what the accessibility tree exposes.
// Writes docs/review/tools/accessibility/results/manual.json.
import { test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const OUT = 'docs/review/tools/accessibility/results';
const out: Record<string, unknown> = {};

async function prime(page: Page, opts: { theme?: string; persona?: string | null; consent?: boolean; language?: string } = {}) {
  const { theme = 'dark', persona = 'ayanda', consent = true, language = 'en' } = opts;
  await page.goto('/404-prime');
  await page.evaluate(
    ({ theme, persona, consent, language }) => {
      localStorage.clear();
      localStorage.setItem('tengo.session.v1', JSON.stringify({ state: { language, theme, activePersonaId: persona, sidebarCollapsed: false }, version: 0 }));
      if (persona && consent)
        localStorage.setItem(
          'tengo.data.v1',
          JSON.stringify({ personas: { [persona]: { consent: { core: true, messages: true, analytics: false, decidedAt: new Date().toISOString() }, audit: [], reviews: [] } }, receipts: [] }),
        );
    },
    { theme, persona, consent, language },
  );
}

const focusInfo = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { tag: 'body' };
    const r = el.getBoundingClientRect();
    const header = document.querySelector('header.sticky') as HTMLElement | null;
    const nav = document.querySelector('nav.fixed') as HTMLElement | null;
    const hb = header && getComputedStyle(header).display !== 'none' ? header.getBoundingClientRect().bottom : 0;
    const nt = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : window.innerHeight;
    const inBar = !!(el.closest('header') || el.closest('nav.fixed'));
    const visibleTop = Math.max(r.top, hb);
    const visibleBottom = Math.min(r.bottom, nt);
    const visibleFrac = r.height > 0 ? Math.max(0, visibleBottom - visibleTop) / r.height : 1;
    return {
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role'),
      name: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      inBar,
      visibleFrac: inBar ? 1 : Math.round(visibleFrac * 100) / 100,
    };
  });

test('keyboard path and focus obscured, Home 390', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/app', '/app/plan', '/app/money', '/app/privacy', '/app/me']) {
    await prime(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    const seq = [];
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press('Tab');
      seq.push(await focusInfo(page));
    }
    out[`tab-${path}`] = seq;
    out[`obscured-${path}`] = seq.filter((s) => 'visibleFrac' in s && (s as { visibleFrac: number }).visibleFrac < 1);
  }
});

test('command menu keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prime(page);
  await page.goto('/app');
  await page.getByRole('heading', { level: 1 }).waitFor();
  const before = await page.evaluate(() => document.activeElement?.tagName);
  await page.keyboard.press('Control+k');
  const combo = page.getByRole('combobox');
  await combo.waitFor();
  const r: Record<string, unknown> = { focusOnOpen: await page.evaluate(() => document.activeElement?.getAttribute('role')) };
  await page.keyboard.type('plan');
  r.activeAfterTyping = await page.evaluate(() => document.getElementById(document.activeElement!.getAttribute('aria-activedescendant') || '')?.textContent);
  await page.keyboard.press('Tab');
  r.focusAfterTab = await page.evaluate(() => ({ tag: document.activeElement?.tagName, inDialog: !!document.activeElement?.closest('[role=dialog]') }));
  await page.keyboard.press('Escape');
  r.openAfterEscapeFromOutside = await page.getByRole('combobox').count();
  await page.keyboard.press('Control+k');
  await combo.waitFor();
  await page.keyboard.type('plan');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  r.urlAfterEnter = page.url();
  r.focusAfterRun = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  r.optionGroupsExposed = 'group labels are <p role=presentation>, no role=group';
  r.before = before;
  // Mobile: is there any visible way to open it without a keyboard?
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  r.mobileOpenButtonVisible = await page.getByRole('button', { name: /search|command|menu/i }).filter({ visible: true }).count();
  out.commandMenu = r;
});

test('why drawer keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prime(page);
  await page.goto('/app');
  const btn = page.getByRole('button', { name: 'Why this date' }).first();
  await btn.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  const r: Record<string, unknown> = { focusOnOpen: await focusInfo(page) };
  const seen = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    seen.push(await page.evaluate(() => ({ inDialog: !!document.activeElement?.closest('[role=dialog]'), name: (document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '').trim().slice(0, 40) })));
  }
  r.tabCycle = seen;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  r.dialogsAfterEscape = await page.getByRole('dialog').count();
  r.focusReturnedTo = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40));
  out.drawer = r;
});

test('chart slider and hero, what a screen reader gets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const r: Record<string, unknown> = {};
  for (const persona of ['ayanda', 'thabo', 'lerato']) {
    await prime(page, { persona });
    await page.goto('/app');
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.waitForTimeout(300);
    const slider = page.getByRole('slider');
    await slider.focus();
    const texts = [await slider.getAttribute('aria-valuetext')];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowRight');
      texts.push(await slider.getAttribute('aria-valuetext'));
    }
    const visibleNotes = await page.locator('.scrub-plot').locator('xpath=preceding-sibling::p[1]').textContent();
    await page.keyboard.press('End');
    texts.push(await slider.getAttribute('aria-valuetext'));
    r[persona] = {
      h1: await page.getByRole('heading', { level: 1 }).ariaSnapshot(),
      slider: texts,
      visibleBillOrIncomeNoteAtDay6_ariaHidden: visibleNotes,
      main: (await page.locator('main').ariaSnapshot()).split('\n').slice(0, 60).join('\n'),
    };
  }
  // Pointer: a single tap on the plot sets the day (2.5.7 alternative to dragging).
  const box = await page.locator('.scrub-plot').boundingBox();
  await page.mouse.click(box!.x + box!.width * 0.6, box!.y + box!.height / 2);
  r.tapSetsValue = await page.getByRole('slider').inputValue();
  out.chart = r;
});

test('persona cards keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prime(page, { persona: null, consent: false });
  await page.goto('/start');
  await page.waitForLoadState('networkidle');
  const seq = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    seq.push(await focusInfo(page));
  }
  out.pickerTab = seq;
  out.pickerCardsSnapshot = await page.locator('#persona-heading + ul').ariaSnapshot();
});

test('reflow at 320 and target sizes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const r: Record<string, unknown> = {};
  for (const path of ['/', '/start', '/consent', '/app', '/app/plan', '/app/money', '/app/money/import', '/app/inbox', '/app/privacy', '/app/privacy/data', '/app/privacy/audit', '/app/me']) {
    await prime(page, { consent: path !== '/consent' });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    r[path] = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const overflow: string[] = [];
      document.querySelectorAll('main *, header *').forEach((el) => {
        const rr = el.getBoundingClientRect();
        if (rr.width === 0 || rr.height === 0) return;
        if (rr.right > vw + 1 || rr.left < -1) {
          // ignore elements inside an intentional horizontal scroller
          let p: HTMLElement | null = el.parentElement;
          while (p && p !== document.body) {
            const cs = getComputedStyle(p);
            if (/(auto|scroll)/.test(cs.overflowX)) return;
            p = p.parentElement;
          }
          const tx = (el.textContent || '').trim().slice(0, 40);
          if (el.children.length === 0 || tx) overflow.push(`${el.tagName.toLowerCase()}.${(el.className?.toString() || '').slice(0, 40)} right=${Math.round(rr.right)} "${tx}"`);
        }
      });
      const small: string[] = [];
      document.querySelectorAll('a[href], button, input, select, [role=option], [role=switch], [role=tab], summary, label').forEach((el) => {
        const rr = el.getBoundingClientRect();
        if (rr.width === 0 || rr.height === 0) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || (el as HTMLElement).closest('.sr-only')) return;
        if (el.tagName === 'INPUT' && ['radio', 'checkbox'].includes((el as HTMLInputElement).type) && el.classList.contains('sr-only')) return;
        if (rr.width < 24 || rr.height < 24) small.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(rr.width)}x${Math.round(rr.height)}`);
        else if (rr.width < 44 || rr.height < 44) small.push(`(under 44) ${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(rr.width)}x${Math.round(rr.height)}`);
      });
      return { scrollWidth: document.documentElement.scrollWidth, vw, overflow: overflow.slice(0, 15), small: small.slice(0, 25) };
    });
  }
  out.reflow320 = r;
  await page.screenshot({ path: `${OUT}/home-320.png`, fullPage: true }).catch(() => undefined);
});

test('text spacing 1.4.12 on Home 390', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prime(page);
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
  await page.waitForTimeout(300);
  out.textSpacing = await page.evaluate(() => {
    const clipped: string[] = [];
    document.querySelectorAll('main *').forEach((el) => {
      const h = el as HTMLElement;
      const cs = getComputedStyle(h);
      if ((cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && (h.scrollWidth > h.clientWidth + 1 || h.scrollHeight > h.clientHeight + 1)) clipped.push(`${h.tagName.toLowerCase()} "${(h.textContent || '').trim().slice(0, 40)}"`);
    });
    return { clipped: clipped.slice(0, 20), scrollWidth: document.documentElement.scrollWidth };
  });
  await page.screenshot({ path: `${OUT}/home-text-spacing-390.png`, fullPage: true });
});

test('language attribute with Tshivenda and Sepedi selected', async ({ page }) => {
  const r: Record<string, unknown> = {};
  for (const language of ['ve', 'nso', 'zu']) {
    await prime(page, { language });
    await page.goto('/app');
    await page.getByRole('heading', { level: 1 }).waitFor();
    r[language] = await page.evaluate(() => ({ htmlLang: document.documentElement.lang, h1: document.querySelector('h1')?.textContent, nav: [...document.querySelectorAll('nav a')].map((a) => a.textContent).slice(0, 5) }));
  }
  out.lang = r;
});

test('shared phone: what persists in localStorage', async ({ page }) => {
  await prime(page);
  await page.goto('/app');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.goto('/app/money');
  await page.waitForLoadState('networkidle');
  out.storage = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, (localStorage.getItem(k) || '').length])));
  out.storageSample = await page.evaluate(() => (localStorage.getItem('tengo.data.v1') || '').slice(0, 400));
});

test.afterAll(() => {
  writeFileSync(`${OUT}/manual.json`, JSON.stringify(out, null, 2));
});
