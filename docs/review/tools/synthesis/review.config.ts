// Playwright config for the review only. Uses the production build served on port 4180.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.review\.ts/,
  timeout: 120_000,
  workers: 4,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4180', browserName: 'chromium' },
  webServer: { command: 'npx vite preview --port 4180 --strictPort', port: 4180, reuseExistingServer: true },
});
