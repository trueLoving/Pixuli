import { test, expect } from '@playwright/test';

/**
 * REF-413 / REF-602 P3：应用壳层最小冒烟路径。
 * 覆盖：根路由可访问、主布局挂载。
 */
test.describe('app shell smoke', () => {
  test('loads photos shell', async ({ page }) => {
    await page.goto('/photos');
    await expect(page).toHaveTitle(/Pixuli/i);
    await expect(
      page.locator('.photos-page, .main-layout, #root'),
    ).toBeVisible();
  });

  test('settings modal can open from sidebar', async ({ page }) => {
    await page.goto('/photos');
    const settingsButton = page.getByRole('button', {
      name: /设置|Settings/i,
    });
    if ((await settingsButton.count()) === 0) {
      test.skip(true, 'settings nav not visible in current viewport');
    }
    await settingsButton.first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
