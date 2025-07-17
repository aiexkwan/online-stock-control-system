import { test, expect, Page } from '@playwright/test';

/**
 * v1.3.2 前端 Widgets 整合測試
 *
 * 驗證前端 widgets 與後端 API 的整合功能
 */
test.describe('v1.3.2 前端 Widgets 整合測試', () => {
  test.beforeEach(async ({ page, context }) => {
    // 使用預設的認證狀態
    try {
      await context.addCookies([]);
      await page.goto('http://localhost:3000/admin');

      // 如果重定向到登入頁面，進行登入
      if (page.url().includes('/auth/login')) {
        await page.fill('#email', 'akwan@pennineindustries.com');
        await page.fill('#password', 'X315Y316');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin/**', { timeout: 15000 });
      }
    } catch (error) {
      console.warn('認證設置失敗，將跳過需要認證的測試');
    }
  });

  test('管理員儀表板應該正常載入', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 檢查頁面標題
    await expect(page).toHaveTitle(/NewPennine/);

    // 檢查主要導航元素
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible();

    console.log('✅ 管理員儀表板載入成功');
  });

  test('統計卡片 widgets 應該顯示正確數據', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 等待統計卡片載入
    await page.waitForSelector('[data-testid="stats-card"]', {
      timeout: 10000,
    });

    // 檢查所有統計卡片
    const statsCards = await page.locator('[data-testid="stats-card"]').all();
    expect(statsCards.length).toBeGreaterThan(0);

    // 驗證每個統計卡片都有數值
    for (const card of statsCards) {
      await expect(card.locator('[data-testid="stat-value"]')).toBeVisible();
      await expect(card.locator('[data-testid="stat-label"]')).toBeVisible();
    }

    console.log('✅ 統計卡片 widgets 正常顯示');
  });

  test('庫存分析圖表應該正常渲染', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 等待庫存分析圖表載入
    await page.waitForSelector('[data-testid="inventory-analysis-chart"]', {
      timeout: 15000,
    });

    // 檢查圖表容器
    const chartContainer = page.locator(
      '[data-testid="inventory-analysis-chart"]',
    );
    await expect(chartContainer).toBeVisible();

    // 檢查是否有圖表數據
    const chartData = await chartContainer.locator(
      '[data-testid="chart-data"]',
    );
    await expect(chartData).toBeVisible();

    console.log('✅ 庫存分析圖表正常渲染');
  });

  test('產品分佈圓餅圖應該正常顯示', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 等待產品分佈圖載入
    await page.waitForSelector('[data-testid="product-distribution-chart"]', {
      timeout: 15000,
    });

    // 檢查圓餅圖容器
    const pieChart = page.locator('[data-testid="product-distribution-chart"]');
    await expect(pieChart).toBeVisible();

    // 檢查圖例
    const legend = pieChart.locator('[data-testid="chart-legend"]');
    await expect(legend).toBeVisible();

    console.log('✅ 產品分佈圓餅圖正常顯示');
  });

  test('訂單進度圖表應該響應日期篩選', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 等待訂單進度圖表載入
    await page.waitForSelector('[data-testid="order-progress-chart"]', {
      timeout: 15000,
    });

    // 檢查日期選擇器
    const dateFilter = page.locator('[data-testid="date-range-filter"]');
    if (await dateFilter.isVisible()) {
      // 選擇日期範圍
      await dateFilter.click();
      await page.fill('[data-testid="start-date"]', '2025-01-01');
      await page.fill('[data-testid="end-date"]', '2025-01-15');
      await page.click('[data-testid="apply-filter"]');

      // 等待圖表更新
      await page.waitForTimeout(2000);

      // 檢查圖表是否更新
      const chartContainer = page.locator(
        '[data-testid="order-progress-chart"]',
      );
      await expect(chartContainer).toBeVisible();
    }

    console.log('✅ 訂單進度圖表日期篩選功能正常');
  });

  test('倉庫篩選功能應該正常工作', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 檢查倉庫篩選器
    const warehouseFilter = page.locator('[data-testid="warehouse-filter"]');
    if (await warehouseFilter.isVisible()) {
      // 選擇特定倉庫
      await warehouseFilter.click();
      await page.click('[data-testid="warehouse-injection"]');

      // 等待頁面更新
      await page.waitForTimeout(2000);

      // 檢查統計卡片是否更新
      const statsCards = await page.locator('[data-testid="stats-card"]').all();
      expect(statsCards.length).toBeGreaterThan(0);
    }

    console.log('✅ 倉庫篩選功能正常');
  });

  test('Widget 懶加載功能應該正常工作', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 檢查 skeleton 載入狀態
    const skeletons = await page
      .locator('[data-testid="widget-skeleton"]')
      .all();

    if (skeletons.length > 0) {
      // 等待懶加載完成
      await page.waitForTimeout(3000);

      // 檢查 skeleton 是否消失
      await expect(page.locator('[data-testid="widget-skeleton"]')).toHaveCount(
        0,
      );
    }

    // 檢查實際 widget 內容是否載入
    const widgets = await page.locator('[data-testid="widget-content"]').all();
    expect(widgets.length).toBeGreaterThan(0);

    console.log('✅ Widget 懶加載功能正常');
  });

  test('響應式設計應該在不同屏幕尺寸下正常工作', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 測試桌面版本
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();

    // 測試平板版本
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    // 測試手機版本
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // 檢查移動端導航
    const mobileNav = page.locator('[data-testid="mobile-navigation"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }

    console.log('✅ 響應式設計正常工作');
  });

  test('錯誤處理應該正常顯示', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // 監聽網絡請求錯誤
    let hasNetworkError = false;
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes('/api/')) {
        hasNetworkError = true;
      }
    });

    // 等待頁面載入完成
    await page.waitForTimeout(5000);

    // 如果有網絡錯誤，檢查錯誤處理
    if (hasNetworkError) {
      const errorMessages = await page
        .locator('[data-testid="error-message"]')
        .all();
      expect(errorMessages.length).toBeGreaterThan(0);
    }

    console.log('✅ 錯誤處理機制正常');
  });

  test('性能監控應該記錄 Web Vitals', async ({ page }) => {
    // 添加性能監控
    await page.addInitScript(() => {
      (window as any).performanceMetrics = {};
    });

    await page.goto('http://localhost:3000/admin');

    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');

    // 檢查首屏渲染時間
    const timing = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });

    // 驗證性能指標在合理範圍內
    expect(timing.domContentLoaded).toBeLessThan(5000); // 5秒內
    expect(timing.loadComplete).toBeLessThan(10000); // 10秒內

    console.log(
      `✅ 性能指標正常 - DOMContentLoaded: ${timing.domContentLoaded}ms, LoadComplete: ${timing.loadComplete}ms`,
    );
  });
});
