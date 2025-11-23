import { test, expect } from '@playwright/test';

test.describe('Pixuli Web E2E Tests', () => {
  test('示例测试 - 页面加载', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pixuli/i);
  });

  // TODO: 添加更多 E2E 测试用例
});
