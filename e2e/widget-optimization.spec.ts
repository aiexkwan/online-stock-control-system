import { test, expect } from './fixtures/auth.fixture';
import { Page } from '@playwright/test';

/**
 * Widget 優化 E2E 測試套件
 * 測試 dashboard widgets 的性能優化功能
 */

// 測試輔助函數
class WidgetTestHelper {
  constructor(private page: Page) {}

  async waitForWidgetLoad(widgetTestId: string, timeout = 10000) {
    await this.page.locator(`[data-testid="${widgetTestId}"]`).waitFor({ 
      state: 'visible',
      timeout 
    });
  }

  async getLoadedWidgetCount(): Promise<number> {
    return await this.page.locator('[data-widget-loaded="true"]').count();
  }

  async measureWidgetLoadTime(widgetTestId: string): Promise<number> {
    const startTime = Date.now();
    await this.waitForWidgetLoad(widgetTestId);
    return Date.now() - startTime;
  }

  async isWidgetInViewport(widgetTestId: string): Promise<boolean> {
    const widget = this.page.locator(`[data-testid="${widgetTestId}"]`);
    const isVisible = await widget.isVisible();
    if (!isVisible) return false;

    const box = await widget.boundingBox();
    if (!box) return false;

    const viewport = this.page.viewportSize();
    if (!viewport) return false;

    return box.y < viewport.height && box.y + box.height > 0;
  }

  async scrollToWidget(widgetTestId: string) {
    await this.page.locator(`[data-testid="${widgetTestId}"]`).scrollIntoViewIfNeeded();
  }

  async selectDateRange(from: string, to: string) {
    await this.page.locator('[data-testid="date-range-from"]').fill(from);
    await this.page.locator('[data-testid="date-range-to"]').fill(to);
    await this.page.locator('[data-testid="apply-date-range"]').click();
  }

  async refreshWidget(widgetTestId: string) {
    await this.page.locator(`[data-testid="${widgetTestId}"] [data-testid="widget-refresh"]`).click();
  }

  async switchTheme(theme: string) {
    await this.page.locator('[data-testid="theme-switcher"]').click();
    await this.page.locator(`[data-theme-option="${theme}"]`).click();
  }

  async checkChartRendered(widgetTestId: string): Promise<boolean> {
    const chartContainer = this.page.locator(`[data-testid="${widgetTestId}"] canvas, [data-testid="${widgetTestId}"] svg`);
    return await chartContainer.isVisible();
  }

  async getBatchQueryCount(): Promise<number> {
    // 監聽 GraphQL 請求
    const requests = await this.page.evaluate(() => {
      return (window as any).__batchedQueries || 0;
    });
    return requests;
  }

  async waitForSSRContent(widgetTestId: string) {
    // 檢查 SSR 標記
    await this.page.locator(`[data-testid="${widgetTestId}"][data-ssr="true"]`).waitFor();
  }
}

test.describe('Widget Optimization E2E Tests', () => {
  let helper: WidgetTestHelper;

  test.beforeEach(async ({ page, authenticatedPage }) => {
    helper = new WidgetTestHelper(page);
    
    // 注入性能監控腳本
    await page.addInitScript(() => {
      (window as any).__batchedQueries = 0;
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0];
        if (typeof url === 'string' && url.includes('graphql')) {
          (window as any).__batchedQueries++;
        }
        return originalFetch(...args);
      };
    });

    // 導航到 dashboard (使用 injection 主題作為預設)
    await page.goto('/admin/injection');
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard 載入和 widget 顯示', async ({ page }) => {
    // 驗證頁面標題
    await expect(page.locator('h1')).toContainText('Dashboard');

    // 測量初始載入時間
    const loadStartTime = Date.now();
    
    // 等待關鍵 widgets 載入
    await helper.waitForWidgetLoad('stats-overview');
    await helper.waitForWidgetLoad('recent-activity');
    
    const initialLoadTime = Date.now() - loadStartTime;
    console.log(`Initial dashboard load time: ${initialLoadTime}ms`);
    
    // 驗證載入時間在合理範圍內
    expect(initialLoadTime).toBeLessThan(3000);

    // 檢查載入的 widget 數量
    const loadedWidgets = await helper.getLoadedWidgetCount();
    expect(loadedWidgets).toBeGreaterThan(3);
  });

  test('批量數據查詢功能', async ({ page }) => {
    // 重置批量查詢計數
    await page.evaluate(() => {
      (window as any).__batchedQueries = 0;
    });

    // 觸發多個 widget 的數據載入
    await helper.refreshWidget('stats-overview');
    await helper.refreshWidget('inventory-summary');
    await helper.refreshWidget('recent-orders');

    // 等待請求完成
    await page.waitForTimeout(1000);

    // 檢查批量查詢是否生效
    const batchCount = await helper.getBatchQueryCount();
    console.log(`Batch query count: ${batchCount}`);
    
    // 應該只有 1-2 個批量請求，而不是 3 個獨立請求
    expect(batchCount).toBeLessThanOrEqual(2);
  });

  test('Widget 交互功能測試', async ({ page }) => {
    // 測試日期範圍選擇
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    await helper.selectDateRange(
      lastWeek.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    );

    // 等待 widgets 更新
    await page.waitForTimeout(1000);

    // 驗證 widgets 已更新
    const updatedIndicator = await page.locator('[data-updated="true"]').count();
    expect(updatedIndicator).toBeGreaterThan(0);

    // 測試單個 widget 刷新
    const refreshStartTime = Date.now();
    await helper.refreshWidget('inventory-summary');
    await helper.waitForWidgetLoad('inventory-summary');
    const refreshTime = Date.now() - refreshStartTime;
    
    console.log(`Widget refresh time: ${refreshTime}ms`);
    expect(refreshTime).toBeLessThan(1500);

    // 測試 widget 展開/收縮
    const expandButton = page.locator('[data-testid="inventory-summary"] [data-testid="widget-expand"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await expect(page.locator('[data-testid="inventory-summary"][data-expanded="true"]')).toBeVisible();
      
      // 再次點擊收縮
      await expandButton.click();
      await expect(page.locator('[data-testid="inventory-summary"][data-expanded="false"]')).toBeVisible();
    }
  });

  test('SSR widgets 的正確渲染', async ({ page }) => {
    // 檢查 SSR 標記的 widgets
    const ssrWidgets = [
      'stats-overview',
      'key-metrics',
      'system-status'
    ];

    for (const widgetId of ssrWidgets) {
      try {
        await helper.waitForSSRContent(widgetId);
        console.log(`SSR widget ${widgetId} loaded successfully`);
        
        // 驗證內容不是空的
        const content = await page.locator(`[data-testid="${widgetId}"]`).textContent();
        expect(content).not.toBe('');
      } catch (error) {
        console.log(`SSR widget ${widgetId} not found or not SSR rendered`);
      }
    }

    // 檢查是否有 SSR 渲染的 widgets
    const ssrWidgetCount = await page.locator('[data-ssr="true"]').count();
    expect(ssrWidgetCount).toBeGreaterThan(0);
  });

  test('Progressive loading 行為（圖表延遲加載）', async ({ page }) => {
    // 滾動到頁面底部，觸發延遲加載
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // 檢查初始可見的 widgets
    const initialVisibleWidgets = await helper.getLoadedWidgetCount();
    console.log(`Initial visible widgets: ${initialVisibleWidgets}`);

    // 記錄不在視口中的圖表 widgets
    const chartWidgets = await page.locator('[data-widget-type="chart"]').all();
    let lazyLoadedCharts = 0;

    for (const chart of chartWidgets) {
      const testId = await chart.getAttribute('data-testid');
      if (testId && !(await helper.isWidgetInViewport(testId))) {
        // 確認圖表尚未渲染
        const isRendered = await helper.checkChartRendered(testId);
        if (!isRendered) {
          lazyLoadedCharts++;
        }
      }
    }

    console.log(`Lazy loaded charts: ${lazyLoadedCharts}`);

    // 滾動到包含圖表的區域
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);

    // 檢查新載入的 widgets
    const afterScrollWidgets = await helper.getLoadedWidgetCount();
    console.log(`After scroll widgets: ${afterScrollWidgets}`);
    
    // 應該有更多 widgets 載入
    expect(afterScrollWidgets).toBeGreaterThan(initialVisibleWidgets);

    // 驗證圖表已經渲染
    for (const chart of chartWidgets) {
      const testId = await chart.getAttribute('data-testid');
      if (testId && await helper.isWidgetInViewport(testId)) {
        const isRendered = await helper.checkChartRendered(testId);
        expect(isRendered).toBe(true);
      }
    }
  });

  test('不同的 dashboard themes 測試', async ({ page }) => {
    const themes = ['default', 'dark', 'compact', 'modern'];
    
    for (const theme of themes) {
      // 切換主題
      await helper.switchTheme(theme);
      await page.waitForTimeout(500);

      // 驗證主題已應用
      const body = page.locator('body');
      await expect(body).toHaveAttribute('data-theme', theme);

      // 檢查 widgets 在不同主題下的可見性
      await helper.waitForWidgetLoad('stats-overview');
      await helper.waitForWidgetLoad('recent-activity');

      // 驗證樣式是否正確應用
      const widget = page.locator('[data-testid="stats-overview"]');
      const backgroundColor = await widget.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // 根據主題驗證背景色不是透明的
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      
      console.log(`Theme ${theme} applied successfully`);
    }
  });

  test('Widget 載入性能基準測試', async ({ page }) => {
    const performanceMetrics: Record<string, number> = {};

    // 測試關鍵 widgets 的載入時間
    const criticalWidgets = [
      'stats-overview',
      'recent-activity',
      'inventory-summary',
      'order-status'
    ];

    for (const widgetId of criticalWidgets) {
      try {
        const loadTime = await helper.measureWidgetLoadTime(widgetId);
        performanceMetrics[widgetId] = loadTime;
        
        // 每個 widget 應該在 2 秒內載入
        expect(loadTime).toBeLessThan(2000);
      } catch (error) {
        console.log(`Widget ${widgetId} not found`);
      }
    }

    console.log('Widget load times:', performanceMetrics);

    // 計算平均載入時間
    const loadTimes = Object.values(performanceMetrics);
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    console.log(`Average widget load time: ${avgLoadTime}ms`);
    
    // 平均載入時間應該少於 1.5 秒
    expect(avgLoadTime).toBeLessThan(1500);
  });

  test('實時數據更新測試', async ({ page }) => {
    // 啟用實時更新（如果可用）
    const realtimeToggle = page.locator('[data-testid="realtime-toggle"]');
    if (await realtimeToggle.isVisible()) {
      await realtimeToggle.click();
      
      // 等待 WebSocket 連接
      await page.waitForTimeout(1000);

      // 驗證實時指示器
      const indicator = page.locator('[data-testid="realtime-indicator"]');
      await expect(indicator).toHaveAttribute('data-status', 'connected');

      // 等待一些實時更新
      await page.waitForTimeout(5000);

      // 檢查是否有 widgets 更新
      const updatedWidgets = await page.locator('[data-realtime-updated="true"]').count();
      console.log(`Realtime updated widgets: ${updatedWidgets}`);
      
      // 應該至少有一個 widget 收到實時更新
      expect(updatedWidgets).toBeGreaterThan(0);
    }
  });

  test('響應式佈局測試', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      console.log(`Testing ${viewport.name} viewport`);

      // 檢查 widgets 佈局
      const widgetContainer = page.locator('[data-testid="widget-container"]');
      const containerWidth = await widgetContainer.evaluate(el => el.clientWidth);
      
      // 驗證容器寬度適應視口
      expect(containerWidth).toBeLessThanOrEqual(viewport.width);

      // 在移動端檢查單列佈局
      if (viewport.width < 768) {
        const widgets = await page.locator('[data-widget-loaded="true"]').all();
        for (let i = 1; i < widgets.length; i++) {
          const prevBox = await widgets[i - 1].boundingBox();
          const currBox = await widgets[i].boundingBox();
          
          if (prevBox && currBox) {
            // widgets 應該垂直排列
            expect(currBox.y).toBeGreaterThan(prevBox.y);
          }
        }
      }
    }
  });

  test('錯誤處理和降級', async ({ page }) => {
    // 模擬網絡錯誤
    await page.route('**/graphql', route => {
      route.abort('failed');
    });

    // 刷新一個 widget
    await helper.refreshWidget('stats-overview');
    await page.waitForTimeout(1000);

    // 檢查錯誤處理
    const errorMessage = page.locator('[data-testid="widget-error"]');
    await expect(errorMessage).toBeVisible();

    // 驗證錯誤信息
    await expect(errorMessage).toContainText(/error|failed|unable/i);

    // 恢復網絡
    await page.unroute('**/graphql');

    // 重試功能
    const retryButton = page.locator('[data-testid="widget-retry"]');
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await helper.waitForWidgetLoad('stats-overview');
    }
  });
});

// 性能報告生成
test.afterAll(async () => {
  console.log('Widget optimization E2E tests completed');
});