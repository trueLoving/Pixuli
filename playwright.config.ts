import { defineConfig, devices } from '@playwright/test';

/**
 * 阅读 https://playwright.dev/docs/test-configuration 了解更多信息
 */
export default defineConfig({
  testDir: './e2e',
  /* 并行运行测试 */
  fullyParallel: true,
  /* 失败时重试 */
  retries: process.env.CI ? 2 : 0,
  /* 选择器超时时间 */
  timeout: 30 * 1000,
  /* 期望超时时间 */
  expect: {
    timeout: 5000,
  },
  /* 并行运行的工作进程数 */
  workers: process.env.CI ? 1 : undefined,
  /* 报告器配置 */
  reporter: [['html'], ['list'], process.env.CI ? ['github'] : ['line']],
  /* 共享测试配置 */
  use: {
    /* 基础 URL */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5500',
    /* 收集失败时的跟踪信息 */
    trace: 'on-first-retry',
    /* 截图配置 */
    screenshot: 'only-on-failure',
    /* 视频配置 */
    video: 'retain-on-failure',
  },

  /* 配置测试项目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 运行本地开发服务器 */
  webServer: {
    command: 'pnpm run --filter pixuli-web dev',
    url: 'http://localhost:5500',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
