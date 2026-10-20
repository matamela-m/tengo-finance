import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.l10n\.ts/,
  timeout: 120_000,
  workers: 2,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4180', browserName: 'chromium' },
});
