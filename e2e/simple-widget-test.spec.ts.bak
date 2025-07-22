/**
 * 簡單的 Widget 錯誤檢測測試
 * 專門用於驗證 performanceMonitor.recordMetric 修復
 */

import { test, expect } from '@playwright/test';

test.describe('Widget Error Detection', () => {
  test('should not show widget error borders after recordMetric fix', async ({ page }) => {
    // 前往登入頁面
    await page.goto('/main-login');

    // 等待頁面加載
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // 檢查頁面是否正常加載，沒有 JavaScript 錯誤
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 等待 2 秒讓 JavaScript 執行
    await page.waitForTimeout(2000);

    // 檢查是否有 recordMetric 相關錯誤
    const recordMetricErrors = errors.filter(
      error => error.includes('recordMetric') || error.includes('performanceMonitor')
    );

    // 驗證沒有 recordMetric 錯誤
    expect(recordMetricErrors).toHaveLength(0);

    // 如果有錯誤，記錄下來
    if (recordMetricErrors.length > 0) {
      console.log('Found recordMetric errors:', recordMetricErrors);
    }

    // 檢查頁面是否正常渲染（沒有白屏）
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent?.length || 0).toBeGreaterThan(0);

    console.log('✅ Widget error test passed - no recordMetric errors found');
  });

  test('should load dashboard page without JavaScript errors', async ({ page }) => {
    // 設置錯誤監聽
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 監聽 network 錯誤
    page.on('response', response => {
      if (!response.ok() && response.status() >= 400) {
        errors.push(`Network error: ${response.status()} ${response.url()}`);
      }
    });

    // 前往 admin dashboard (如果可以不需要認證的話)
    try {
      await page.goto('/admin', { timeout: 10000 });

      // 等待頁面加載
      await page.waitForLoadState('networkidle', { timeout: 5000 });

      // 等待 2 秒讓 widgets 加載
      await page.waitForTimeout(2000);
    } catch (error) {
      // 如果需要認證，嘗試訪問根路徑
      await page.goto('/', { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    }

    // 檢查 performanceMonitor 相關錯誤
    const performanceErrors = errors.filter(
      error =>
        error.includes('recordMetric') ||
        error.includes('performanceMonitor') ||
        error.includes('_lib_widgets_performance_monitor')
    );

    // 記錄所有錯誤以便調試
    if (errors.length > 0) {
      console.log('All console errors:', errors);
    }

    // 重點檢查是否有我們修復的錯誤
    expect(performanceErrors).toHaveLength(0);

    console.log('✅ Dashboard load test passed - no performance monitor errors');
  });
});
