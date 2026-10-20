import { spawn, type ChildProcess } from 'node:child_process';
import { test, expect } from '@playwright/test';

// Checks the security headers from vercel.json on the built app, and that the app runs under its
// Content Security Policy with no violations and no requests to other hosts.
const PORT = 4190;
const BASE = `http://localhost:${PORT}`;
let server: ChildProcess;

test.beforeAll(async () => {
  server = spawn('node', ['scripts/serve-dist.mjs', String(PORT)], { stdio: 'pipe' });
  await new Promise<void>((resolve) => server.stdout?.on('data', () => resolve()));
});
test.afterAll(() => {
  server.kill();
});

test('the built app is served with the security headers', async ({ request }) => {
  const res = await request.get(`${BASE}/`);
  const h = res.headers();
  expect(h['content-security-policy']).toContain("default-src 'self'");
  expect(h['content-security-policy']).toContain("script-src 'self'");
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).not.toContain('unsafe-eval');
  expect(h['referrer-policy']).toBe('no-referrer');
  expect(h['permissions-policy']).toContain('camera=()');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['strict-transport-security']).toContain('max-age=');
  const sw = await request.get(`${BASE}/sw.js`);
  expect(sw.headers()['cache-control']).toBe('no-cache');
});

test('the app runs under its Content Security Policy with no violations', async ({ page }) => {
  const violations: string[] = [];
  const foreign: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  page.on('request', (r) => {
    if (!r.url().startsWith(BASE) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) foreign.push(r.url());
  });
  await page.goto(`${BASE}/`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto(`${BASE}/start`);
  await page.getByRole('button', { name: /Thabo/ }).click();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/until|from/);
  await page.goto(`${BASE}/app/plan`);
  await page.goto(`${BASE}/app/money`);
  await page.goto(`${BASE}/app/inbox`);
  expect(violations).toEqual([]);
  expect(foreign).toEqual([]);
});
