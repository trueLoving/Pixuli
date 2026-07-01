import { defineConfig, devices } from '@playwright/test';

/**
 * REF-413 冒烟 E2E：仅 chromium，单 worker。
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 30 * 1000,
  expect: { timeout: 8000 },
  workers: 1,
  reporter: [['list'], process.env.CI ? ['github'] : ['line']],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5500',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run --filter pixuli-app dev:web',
    url: 'http://localhost:5500',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
