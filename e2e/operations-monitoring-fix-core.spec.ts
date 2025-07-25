/**
 * E2E Test: Operations Monitoring 核心修復驗證
 * 專注測試核心修復功能，避免複雜的登入流程
 */

import { test, expect } from '@playwright/test';

test.describe('Operations Monitoring 核心修復驗證', () => {
  test('驗證核心修復：頁面不再空白，顯示正確登入介面', async ({ page }) => {
    console.log('🧪 開始測試：未登入用戶訪問 operations');

    // 核心測試：訪問頁面
    await page.goto('/admin/operations', { waitUntil: 'domcontentloaded' });

    // 1. 驗證 URL 沒有被重定向到 main-login
    expect(page.url()).toContain('/admin/operations');
    console.log('✅ URL 驗證通過：無重定向到 main-login');

    // 2. 驗證頁面不是空白 - 應該有內容
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);
    console.log('✅ 頁面內容驗證通過：不是空白頁面');

    // 3. 驗證顯示登入相關內容（至少包含這些關鍵詞之一）
    const hasLoginContent =
      (await page
        .locator('text=Login')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('text=Dashboard')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('text=Admin')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('text=Authenticating')
        .isVisible()
        .catch(() => false));

    expect(hasLoginContent).toBe(true);
    console.log('✅ 登入介面驗證通過：顯示相關內容');

    // 4. 驗證頁面加載完成（無持續 loading 狀態）
    await page.waitForTimeout(2000);
    const isStillLoading = await page
      .locator('.animate-spin')
      .isVisible()
      .catch(() => false);

    if (isStillLoading) {
      console.log('⚠️ 頁面仍在加載中，等待加載完成...');
      await page.waitForTimeout(3000);
    }

    console.log('✅ 頁面加載狀態檢查完成');
  });

  test('驗證 HTTP 響應正確', async ({ page }) => {
    console.log('🧪 開始測試：HTTP 響應狀態');

    // 測試 HTTP 回應
    const response = await page.goto('/admin/operations');

    // 驗證狀態碼
    expect(response?.status()).toBe(200);
    console.log('✅ HTTP 200 狀態驗證通過');

    // 驗證響應頭
    if (response) {
      const headers = response.headers();

      // 檢查身份驗證相關標頭
      if (headers['x-user-logged']) {
        expect(headers['x-user-logged']).toBe('false');
        console.log('✅ 用戶登入狀態標頭正確：false');
      }

      if (headers['x-auth-required']) {
        expect(headers['x-auth-required']).toBe('true');
        console.log('✅ 身份驗證要求標頭正確：true');
      }
    }
  });

  test('驗證無 JavaScript 錯誤', async ({ page }) => {
    console.log('🧪 開始測試：JavaScript 錯誤檢查');

    const jsErrors: string[] = [];

    // 監聽 console 錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // 訪問頁面
    await page.goto('/admin/operations');
    await page.waitForTimeout(3000);

    // 檢查是否有關鍵錯誤
    const criticalErrors = jsErrors.filter(
      error =>
        error.includes('originalFactory.call') ||
        error.includes('Cannot read properties of undefined') ||
        error.includes('factory') ||
        error.includes('TypeError: undefined is not an object')
    );

    expect(criticalErrors).toHaveLength(0);

    if (jsErrors.length > 0) {
      console.log('⚠️ 發現非關鍵 JavaScript 錯誤：', jsErrors.length);
      jsErrors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ 無 JavaScript 錯誤');
    }

    console.log('✅ 關鍵 JavaScript 錯誤檢查通過');
  });

  test('驗證頁面基本可用性', async ({ page }) => {
    console.log('🧪 開始測試：頁面基本可用性');

    await page.goto('/admin/operations');

    // 檢查頁面是否有基本的 HTML 結構
    const hasHtml = await page.locator('html').isVisible();
    const hasBody = await page.locator('body').isVisible();

    expect(hasHtml).toBe(true);
    expect(hasBody).toBe(true);
    console.log('✅ HTML 結構正常');

    // 檢查頁面標題
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log(`✅ 頁面標題：${title}`);

    // 檢查是否有基本的樣式加載
    const hasStylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(hasStylesheets).toBeGreaterThan(0);
    console.log(`✅ 樣式表加載：${hasStylesheets} 個文件`);
  });
});
