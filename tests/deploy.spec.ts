import { spawn, type ChildProcess } from 'node:child_process';
import { appendFileSync, cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

// Deployment checks on the built app, served with the headers and rewrites from vercel.json
// (scripts/serve-dist.mjs). The build has no Supabase variables, so this is the guest-only deployment.

function serve(port: number, root = 'dist'): Promise<ChildProcess> {
  const server = spawn('node', ['scripts/serve-dist.mjs', String(port), root], { stdio: 'pipe' });
  return new Promise((resolve) => server.stdout?.on('data', () => resolve(server)));
}

/** Collects console errors and uncaught page errors. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test.describe('built app with vercel.json', () => {
  const PORT = 4191;
  const BASE = `http://localhost:${PORT}`;
  let server: ChildProcess;
  test.beforeAll(async () => {
    server = await serve(PORT);
  });
  test.afterAll(() => {
    server.kill();
  });

  test('search engines are told not to index or crawl', async ({ request, page }) => {
    const robots = await request.get(`${BASE}/robots.txt`);
    expect(await robots.text()).toMatch(/User-agent: \*\s+Disallow: \/\s*$/);
    const home = await request.get(`${BASE}/`);
    expect(home.headers()['x-robots-tag']).toBe('noindex, nofollow');
    await page.goto(`${BASE}/`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('deep links rewrite to the app, but missing build files are a real 404', async ({ request }) => {
    for (const path of ['/app', '/app/plan', '/start', '/privacy-notice', '/no-such-page']) {
      const res = await request.get(`${BASE}${path}`);
      expect(res.status(), path).toBe(200);
      expect(await res.text(), path).toContain('<div id="root">');
    }
    // An old tab asking for a chunk from a previous deploy must get a 404, never the HTML page as JavaScript.
    const gone = await request.get(`${BASE}/assets/old-build-chunk.js`);
    expect(gone.status()).toBe(404);
    expect(gone.headers()['content-security-policy']).toContain("default-src 'self'");
  });

  test('guest mode runs with no Supabase variables and no console errors', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`${BASE}/`);
    await page.goto(`${BASE}/start`);
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByLabel('Name or nickname (optional)').fill('Sam');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Agree and continue' }).click();
    await page.getByRole('button', { name: /Try with sample numbers/ }).click();
    await expect(page.getByText('Your first forecast')).toBeVisible();
    for (const path of ['/app', '/app/plan', '/app/money', '/app/inbox', '/app/privacy', '/app/me', '/app/account', '/privacy-notice', '/safety']) {
      await page.goto(`${BASE}${path}`);
      await expect(page.getByRole('heading', { level: 1 }).first(), path).toBeVisible();
    }
    // Accounts say plainly that they are not set up on this copy, and nothing is sent anywhere.
    await page.goto(`${BASE}/app/account`);
    await expect(page.getByText('Accounts are not set up on this copy of Tengo.')).toBeVisible();
    await page.goto(`${BASE}/start`);
    await page.getByRole('button', { name: /Thabo/ }).click();
    await page.getByRole('button', { name: 'Agree and continue' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test('a redeploy replaces the cached build instead of serving the old one', async ({ page }) => {
  // Copy the build so it can be changed in place, as a new deploy would change it.
  const root = mkdtempSync(join(tmpdir(), 'tengo-deploy-'));
  cpSync('dist', root, { recursive: true });
  const server = await serve(4192, root);
  try {
    const BASE = 'http://localhost:4192';
    const manifest = JSON.parse(readFileSync(join(root, 'precache-manifest.json'), 'utf8')) as { version: string };
    const sw = readFileSync(join(root, 'sw.js'), 'utf8');
    // The build stamped its version into the worker, so sw.js changes whenever the app does.
    expect(sw).not.toContain('__TENGO_VERSION__');
    expect(sw).toContain(`const VERSION = "${manifest.version}"`);

    await page.goto(`${BASE}/`);
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null && navigator.serviceWorker.controller !== undefined);
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual([`tengo-${manifest.version}`]);

    // "Redeploy": change a file whose name has no hash, and the worker version that comes with it.
    appendFileSync(join(root, 'theme-init.js'), '\n// redeployed\n');
    writeFileSync(join(root, 'sw.js'), sw.replace(`"${manifest.version}"`, '"redeploy0001"'));
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());

    // The new worker takes over, deletes the old cache and serves the new file.
    await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 15_000 }).toEqual(['tengo-redeploy0001']);
    const served = await page.evaluate(async () => (await fetch('/theme-init.js')).text());
    expect(served).toContain('// redeployed');
  } finally {
    server.kill();
  }
});
