// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/link-check',
  testMatch: /crawl\.spec\.js/,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8765',
    trace: 'on-first-retry',
    // Local: use installed Chrome (avoids a 180MB browser download).
    // CI: install Playwright Chromium via `npx playwright install chromium`.
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  webServer: {
    command: 'python3 -m http.server 8765',
    cwd: __dirname,
    url: 'http://127.0.0.1:8765/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
