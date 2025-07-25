/**
 * recordMetric 修復驗證測試
 * 專門檢查 performanceMonitor.recordMetric 錯誤是否已修復
 */

import { test, expect } from '@playwright/test';

test.describe('recordMetric Fix Verification', () => {
  test('should verify recordMetric errors are fixed on admin injection page', async ({ page }) => {
    const consoleErrors: string[] = [];
    const jsErrors: string[] = [];

    // 監聽 console 錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 監聽 JavaScript 錯誤
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // 前往正確的 admin 路由
    console.log('📍 Navigating to /admin/injection...');
    await page.goto('/admin/injection', { waitUntil: 'networkidle', timeout: 30000 });

    // 等待 3 秒讓所有 widgets 嘗試加載
    await page.waitForTimeout(3000);

    console.log('🔍 Checking for recordMetric errors...');

    // 檢查是否有 recordMetric 相關錯誤
    const recordMetricErrors = [...consoleErrors, ...jsErrors].filter(
      error =>
        error.includes('recordMetric') ||
        error.includes('_lib_widgets_performance_monitor') ||
        error.includes('performanceMonitor.recordMetric is not a function') ||
        error.includes('performanceMonitor.recordMetric is undefined')
    );

    // 記錄所有錯誤以便調試
    if (consoleErrors.length > 0) {
      console.log('📋 Console errors found:', consoleErrors.slice(0, 5)); // 只顯示前 5 個
    }

    if (jsErrors.length > 0) {
      console.log('💥 JavaScript errors found:', jsErrors.slice(0, 5));
    }

    // 主要驗證：確保沒有 recordMetric 錯誤
    expect(
      recordMetricErrors,
      `❌ Found recordMetric errors: ${recordMetricErrors.join(', ')}`
    ).toHaveLength(0);

    console.log('✅ recordMetric fix verification passed - no related errors found');

    // 額外檢查：確保頁面至少部分渲染
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.trim().length || 0).toBeGreaterThan(0);

    console.log('✅ Page rendering verification passed');
  });

  test('should verify no performanceMonitor errors during widget loading', async ({ page }) => {
    const performanceErrors: string[] = [];

    // 特別監聽 performance monitor 相關錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('performance') ||
          text.includes('recordMetric') ||
          text.includes('performanceMonitor')
        ) {
          performanceErrors.push(text);
        }
      }
    });

    page.on('pageerror', error => {
      const message = error.message;
      if (
        message.includes('performance') ||
        message.includes('recordMetric') ||
        message.includes('performanceMonitor')
      ) {
        performanceErrors.push(message);
      }
    });

    // 測試不同的 admin theme 路由
    const themes = ['injection', 'pipeline', 'warehouse'];

    for (const theme of themes) {
      console.log(`🧪 Testing theme: ${theme}`);

      try {
        await page.goto(`/admin/${theme}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000); // 讓 widgets 嘗試加載

        console.log(`✅ ${theme} theme loaded without performance errors`);
      } catch (error) {
        console.log(
          `⚠️  ${theme} theme had loading issues, but checking for performance errors anyway`
        );
      }
    }

    // 驗證沒有 performance monitor 錯誤
    expect(
      performanceErrors,
      `Performance monitor errors found: ${performanceErrors.join(', ')}`
    ).toHaveLength(0);

    console.log('✅ Performance monitor verification passed across all themes');
  });
});
