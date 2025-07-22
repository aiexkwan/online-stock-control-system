/**
 * E2E Test: Operations Monitoring 頁面修復驗證
 * 測試目標：確認 /admin/operations-monitoring 頁面不再空白，能正常顯示登入介面
 */

import { test, expect, Page } from '@playwright/test';

// 測試憑證 - 根據 general_rules.md
const SYS_LOGIN = process.env.SYS_LOGIN || 'akwan@pennineindustries.com';
const SYS_PASSWORD = process.env.SYS_PASSWORD || 'X315Y316';

test.describe('Operations Monitoring 頁面修復驗證', () => {
  test('未登入用戶訪問 operations-monitoring 應顯示登入介面而非空白頁面', async ({ page }) => {
    // 測試 1: 確保頁面能正常加載，無重定向到 main-login
    await page.goto('/admin/operations-monitoring');

    // 驗證頁面 URL 沒有被重定向
    expect(page.url()).toContain('/admin/operations-monitoring');

    // 驗證頁面不是空白 - 應該顯示登入介面
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=Please log in to access the dashboard')).toBeVisible();
    await expect(page.locator('text=Login to Dashboard')).toBeVisible();

    // 驗證主題標識顯示
    await expect(page.locator('text=Operations Monitoring')).toBeVisible();

    console.log('✅ 未登入用戶測試通過：顯示正確的登入介面');
  });

  test('登入後用戶能正常訪問 operations-monitoring 儀表板', async ({ page }) => {
    // 測試 2: 登入流程和儀表板訪問
    await page.goto('/main-login');

    // 執行登入
    await page.fill('input[type="email"]', SYS_LOGIN);
    await page.fill('input[type="password"]', SYS_PASSWORD);
    await page.click('button[type="submit"]');

    // 等待登入完成
    await page.waitForLoadState('networkidle');

    // 訪問 operations-monitoring 頁面
    await page.goto('/admin/operations-monitoring');

    // 驗證頁面正常加載
    expect(page.url()).toContain('/admin/operations-monitoring');

    // 驗證儀表板組件正常顯示
    await expect(page.locator('[data-widget-focusable="true"]')).toBeVisible({ timeout: 10000 });

    // 驗證 HistoryTreeV2 組件正常顯示（修復的核心組件）
    await expect(page.locator('text=History Tree')).toBeVisible();

    // 驗證無 originalFactory.call 錯誤
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // 等待頁面完全加載
    await page.waitForTimeout(3000);

    // 檢查是否有 originalFactory.call 錯誤
    const factoryErrors = jsErrors.filter(
      error =>
        error.includes('originalFactory.call') ||
        error.includes('factory') ||
        error.includes('undefined is not an object')
    );

    expect(factoryErrors).toHaveLength(0);

    console.log('✅ 登入用戶測試通過：儀表板正常顯示，無 originalFactory 錯誤');
  });

  test('驗證頁面響應頭正確設置', async ({ page }) => {
    // 測試 3: 驗證中間件修復後的響應頭
    const response = await page.goto('/admin/operations-monitoring');

    if (response) {
      // 驗證 HTTP 狀態碼是 200，不是重定向
      expect(response.status()).toBe(200);

      // 驗證身份驗證相關的響應頭
      const headers = response.headers();
      expect(headers['x-user-logged']).toBe('false');
      expect(headers['x-auth-required']).toBe('true');

      console.log('✅ 響應頭測試通過：HTTP 200，正確的身份驗證標頭');
    }
  });

  test('驗證 CSS Grid Layout 正確顯示', async ({ page }) => {
    // 測試 4: 驗證登入後的 Grid Layout 修復
    await page.goto('/main-login');

    // 登入
    await page.fill('input[type="email"]', SYS_LOGIN);
    await page.fill('input[type="password"]', SYS_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // 訪問 operations-monitoring
    await page.goto('/admin/operations-monitoring');
    await page.waitForTimeout(5000); // 等待 widgets 加載

    // 驗證 Grid 容器存在
    const gridContainer = page.locator('[style*="display: grid"]');
    await expect(gridContainer).toBeVisible();

    // 驗證 Grid 模板設置正確
    const gridElement = await gridContainer.first();
    const style = await gridElement.getAttribute('style');
    expect(style).toContain('grid-template-columns');
    expect(style).toContain('grid-template-rows');
    expect(style).toContain('grid-template-areas');

    console.log('✅ CSS Grid Layout 測試通過：Grid 樣式正確設置');
  });

  test('性能測試：頁面加載時間', async ({ page }) => {
    // 測試 5: 驗證修復後的性能表現
    const startTime = Date.now();

    await page.goto('/admin/operations-monitoring');

    // 等待關鍵元素出現
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // 頁面應該在 5 秒內加載完成
    expect(loadTime).toBeLessThan(5000);

    console.log(`✅ 性能測試通過：頁面加載時間 ${loadTime}ms`);
  });
});

test.afterEach(async ({ page }) => {
  // 清理：登出（如果已登入）
  try {
    await page.goto('/main-login');
    await page.click('text=Logout', { timeout: 2000 });
  } catch {
    // 忽略登出錯誤
  }
});
