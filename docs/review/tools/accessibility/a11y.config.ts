// Playwright config for the accessibility review only. Uses the production build on port 4180.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.a11y\.ts/,
  timeout: 180_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4180', browserName: 'chromium' },
});
