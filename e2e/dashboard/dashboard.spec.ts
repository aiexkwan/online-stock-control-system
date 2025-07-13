import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';
import { waitFor } from '../utils/test-data';

test.describe('Dashboard Functionality', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page, authenticatedPage }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();
  });

  test('should display dashboard components', async ({ page }) => {
    // 驗證頁面標題
    await expect(dashboardPage.pageTitle).toContainText('Dashboard');

    // 驗證導航選單
    await expect(dashboardPage.navigationMenu).toBeVisible();

    // 驗證用戶資訊
    await expect(dashboardPage.userProfile).toBeVisible();

    // 驗證統計卡片
    const statsCount = await dashboardPage.getStatsCount();
    expect(statsCount).toBeGreaterThan(0);
  });

  test('should load statistics data', async () => {
    // 獲取統計數據
    const statsCount = await dashboardPage.getStatsCount();

    // 驗證每個統計卡片都有數據
    for (let i = 0; i < statsCount; i++) {
      const value = await dashboardPage.getStatValue(i);
      expect(value).toBeTruthy();
      expect(value).not.toBe('0'); // 假設至少有一些數據
    }
  });

  test('should display charts correctly', async ({ page }) => {
    // 等待圖表加載
    await waitFor.networkIdle(page);

    // 驗證圖表數量
    const chartCount = await dashboardPage.chartContainers.count();
    expect(chartCount).toBeGreaterThan(0);

    // 驗證每個圖表都已加載
    for (let i = 0; i < chartCount; i++) {
      const isLoaded = await dashboardPage.isChartLoaded(i);
      expect(isLoaded).toBe(true);
    }
  });

  test('should navigate to different sections', async ({ page }) => {
    // 測試導航到庫存管理
    await dashboardPage.navigateTo('Inventory');
    await expect(page).toHaveURL(/\/inventory/);

    // 返回儀表板
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 測試導航到報告
    await dashboardPage.navigateTo('Reports');
    await expect(page).toHaveURL(/\/reports/);
  });

  test('should refresh data on demand', async ({ page }) => {
    // 獲取初始統計值
    const initialValue = await dashboardPage.getStatValue(0);

    // 點擊刷新按鈕（如果有）
    const refreshButton = page.locator('[data-testid="refresh-button"]');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // 等待數據更新
      await waitFor.networkIdle(page);

      // 驗證數據已更新（可能相同，但應該重新加載）
      const newValue = await dashboardPage.getStatValue(0);
      expect(newValue).toBeTruthy();
    }
  });

  test('should display recent activity', async () => {
    // 獲取最近活動項目
    const activities = await dashboardPage.getRecentActivityItems();

    // 驗證有活動記錄
    expect(activities.length).toBeGreaterThan(0);

    // 驗證活動記錄格式
    activities.forEach(activity => {
      expect(activity).toBeTruthy();
      expect(activity.length).toBeGreaterThan(10); // 假設活動描述至少10個字符
    });
  });

  test('should handle responsive layout', async ({ page }) => {
    // 測試桌面視圖
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(dashboardPage.navigationMenu).toBeVisible();

    // 測試平板視圖
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // 等待響應式調整

    // 測試手機視圖
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // 在手機視圖中，導航選單可能變成漢堡選單
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(dashboardPage.navigationMenu).toBeVisible();
    }
  });

  test('should export data when available', async ({ page }) => {
    // 查找導出按鈕
    const exportButton = page.locator('[data-testid="export-button"]');

    if (await exportButton.isVisible()) {
      // 設置下載監聽
      const downloadPromise = page.waitForEvent('download');

      // 點擊導出
      await exportButton.click();

      // 等待下載
      const download = await downloadPromise;

      // 驗證下載文件
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|pdf)$/);
    }
  });

  test('should handle real-time updates', async ({ page }) => {
    // 如果有 WebSocket 連接，測試實時更新
    const realtimeIndicator = page.locator('[data-testid="realtime-indicator"]');

    if (await realtimeIndicator.isVisible()) {
      // 驗證連接狀態
      await expect(realtimeIndicator).toHaveAttribute('data-status', 'connected');

      // 等待一段時間看是否有更新
      await page.waitForTimeout(5000);

      // 檢查是否有新的活動
      const activities = await dashboardPage.getRecentActivityItems();
      expect(activities.length).toBeGreaterThan(0);
    }
  });
});
