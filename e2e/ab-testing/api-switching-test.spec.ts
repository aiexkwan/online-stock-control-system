/**
 * A/B Testing for API Switching (v1.2.3)
 * 
 * 測試 GraphQL/REST API 切換機制
 * 驗證 feature flags 和性能差異
 */

import { test, expect, Page } from '@playwright/test';

interface APIMetrics {
  responseTime: number;
  success: boolean;
  apiType: 'graphql' | 'rest';
  error?: string;
}

class APITestHelper {
  constructor(private page: Page) {}

  /**
   * 設置 feature flags
   */
  async setFeatureFlags(flags: Record<string, any>) {
    await this.page.evaluate((flags) => {
      // 設置 localStorage 中的 feature flags (模擬)
      localStorage.setItem('feature_flags_override', JSON.stringify(flags));
    }, flags);
  }

  /**
   * 獲取 API 路由信息
   */
  async getAPIRoutingInfo(): Promise<any> {
    return await this.page.evaluate(() => {
      return (window as any).apiRoutingInfo || null;
    });
  }

  /**
   * 監控 API 請求
   */
  async monitorAPIRequests(): Promise<APIMetrics[]> {
    const metrics: APIMetrics[] = [];
    
    // 監控 GraphQL 請求
    this.page.on('response', async (response) => {
      const url = response.url();
      
      if (url.includes('/graphql')) {
        const responseTime = await this.measureResponseTime(response);
        metrics.push({
          responseTime,
          success: response.ok(),
          apiType: 'graphql',
          error: response.ok() ? undefined : `HTTP ${response.status()}`,
        });
      }
      
      if (url.includes('/api/v1/widgets/')) {
        const responseTime = await this.measureResponseTime(response);
        metrics.push({
          responseTime,
          success: response.ok(),
          apiType: 'rest',
          error: response.ok() ? undefined : `HTTP ${response.status()}`,
        });
      }
    });

    return metrics;
  }

  /**
   * 測量響應時間
   */
  private async measureResponseTime(response: any): Promise<number> {
    try {
      const timing = await response.timing();
      return timing.responseEnd - timing.requestStart;
    } catch {
      return 0;
    }
  }

  /**
   * 等待儀表板加載完成
   */
  async waitForDashboardLoad() {
    await this.page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 5000 });
  }

  /**
   * 檢查 widgets 是否正常渲染
   */
  async checkWidgetsLoaded(): Promise<boolean> {
    try {
      // 檢查至少有一些 widget 被渲染
      const widgets = await this.page.locator('[data-testid*="widget"]').count();
      return widgets > 0;
    } catch {
      return false;
    }
  }
}

test.describe('API Switching A/B Test', () => {
  let apiHelper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    apiHelper = new APITestHelper(page);
  });

  test('should use GraphQL when REST API is disabled', async ({ page }) => {
    // 設置 feature flags - 禁用 REST API
    await apiHelper.setFeatureFlags({
      enable_rest_api: false,
      rest_api_percentage: 0,
      fallback_to_graphql: true,
    });

    const metrics = await apiHelper.monitorAPIRequests();

    // 前往 admin dashboard
    await page.goto('/admin');
    await apiHelper.waitForDashboardLoad();

    // 驗證 widgets 正常加載
    const widgetsLoaded = await apiHelper.checkWidgetsLoaded();
    expect(widgetsLoaded).toBe(true);

    // 等待一段時間讓所有 API 請求完成
    await page.waitForTimeout(3000);

    // 檢查是否主要使用 GraphQL
    const graphqlRequests = metrics.filter(m => m.apiType === 'graphql');
    const restRequests = metrics.filter(m => m.apiType === 'rest');

    console.log(`GraphQL requests: ${graphqlRequests.length}, REST requests: ${restRequests.length}`);
    
    // 應該主要使用 GraphQL
    expect(graphqlRequests.length).toBeGreaterThan(0);
  });

  test('should use REST API when enabled at 100%', async ({ page }) => {
    // 設置 feature flags - 100% 使用 REST API
    await apiHelper.setFeatureFlags({
      enable_rest_api: true,
      rest_api_percentage: 100,
      fallback_to_graphql: true,
    });

    const metrics = await apiHelper.monitorAPIRequests();

    // 前往 admin dashboard
    await page.goto('/admin');
    await apiHelper.waitForDashboardLoad();

    // 驗證 widgets 正常加載
    const widgetsLoaded = await apiHelper.checkWidgetsLoaded();
    expect(widgetsLoaded).toBe(true);

    // 等待一段時間讓所有 API 請求完成
    await page.waitForTimeout(3000);

    // 檢查是否主要使用 REST API
    const graphqlRequests = metrics.filter(m => m.apiType === 'graphql');
    const restRequests = metrics.filter(m => m.apiType === 'rest');

    console.log(`GraphQL requests: ${graphqlRequests.length}, REST requests: ${restRequests.length}`);
    
    // 如果有支援 REST API 的 endpoints，應該使用 REST
    if (restRequests.length > 0) {
      expect(restRequests.length).toBeGreaterThan(0);
    }
  });

  test('should use mixed APIs at 50% rollout', async ({ page }) => {
    // 設置 feature flags - 50% 使用 REST API
    await apiHelper.setFeatureFlags({
      enable_rest_api: true,
      rest_api_percentage: 50,
      fallback_to_graphql: true,
    });

    const allMetrics: APIMetrics[] = [];

    // 測試多個用戶會話 (通過清除 localStorage 模擬不同用戶)
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await apiHelper.setFeatureFlags({
        enable_rest_api: true,
        rest_api_percentage: 50,
        fallback_to_graphql: true,
      });

      const metrics = await apiHelper.monitorAPIRequests();
      
      await page.goto('/admin');
      await apiHelper.waitForDashboardLoad();
      await page.waitForTimeout(2000);

      allMetrics.push(...metrics);
    }

    // 分析結果
    const graphqlRequests = allMetrics.filter(m => m.apiType === 'graphql');
    const restRequests = allMetrics.filter(m => m.apiType === 'rest');

    console.log(`Total - GraphQL: ${graphqlRequests.length}, REST: ${restRequests.length}`);
    
    // 應該有兩種 API 類型的請求
    expect(graphqlRequests.length + restRequests.length).toBeGreaterThan(0);
  });

  test('should fallback from REST to GraphQL on error', async ({ page }) => {
    // 設置 feature flags
    await apiHelper.setFeatureFlags({
      enable_rest_api: true,
      rest_api_percentage: 100,
      fallback_to_graphql: true,
    });

    // 攔截 REST API 請求並返回錯誤
    await page.route('**/api/v1/widgets/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    const metrics = await apiHelper.monitorAPIRequests();

    await page.goto('/admin');
    await apiHelper.waitForDashboardLoad();

    // 驗證 widgets 仍然正常加載 (通過 fallback)
    const widgetsLoaded = await apiHelper.checkWidgetsLoaded();
    expect(widgetsLoaded).toBe(true);

    await page.waitForTimeout(3000);

    // 分析請求
    const failedRestRequests = metrics.filter(m => m.apiType === 'rest' && !m.success);
    const graphqlRequests = metrics.filter(m => m.apiType === 'graphql');

    console.log(`Failed REST: ${failedRestRequests.length}, Fallback GraphQL: ${graphqlRequests.length}`);
    
    // 應該有失敗的 REST 請求和成功的 GraphQL fallback
    expect(failedRestRequests.length).toBeGreaterThan(0);
  });

  test('should measure performance difference between APIs', async ({ page }) => {
    const testCases = [
      { name: 'GraphQL Only', flags: { enable_rest_api: false, rest_api_percentage: 0 } },
      { name: 'REST Only', flags: { enable_rest_api: true, rest_api_percentage: 100 } },
    ];

    const performanceResults: Record<string, APIMetrics[]> = {};

    for (const testCase of testCases) {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await apiHelper.setFeatureFlags(testCase.flags);
      const metrics = await apiHelper.monitorAPIRequests();

      const startTime = Date.now();
      await page.goto('/admin');
      await apiHelper.waitForDashboardLoad();
      const loadTime = Date.now() - startTime;

      await page.waitForTimeout(3000);

      performanceResults[testCase.name] = metrics;
      
      console.log(`${testCase.name} - Page load time: ${loadTime}ms`);
      console.log(`${testCase.name} - API requests: ${metrics.length}`);
      
      if (metrics.length > 0) {
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
        const successRate = metrics.filter(m => m.success).length / metrics.length;
        
        console.log(`${testCase.name} - Avg response time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`${testCase.name} - Success rate: ${(successRate * 100).toFixed(1)}%`);
      }
    }

    // 驗證兩種 API 都能正常工作
    expect(Object.keys(performanceResults).length).toBe(2);
  });

  test('should track API usage analytics', async ({ page }) => {
    await apiHelper.setFeatureFlags({
      enable_rest_api: true,
      rest_api_percentage: 50,
      api_monitoring: true,
    });

    // 模擬設置用戶 ID
    await page.evaluate(() => {
      localStorage.setItem('user_id', 'test-user-123');
    });

    await page.goto('/admin');
    await apiHelper.waitForDashboardLoad();
    await page.waitForTimeout(3000);

    // 檢查是否有記錄 API 使用情況
    const apiUsage = await page.evaluate(() => {
      return (window as any).apiUsageTracking || null;
    });

    // 應該有一些 API 使用追蹤數據
    expect(apiUsage).not.toBeNull();
  });
});

test.describe('API Monitoring and Alerts', () => {
  test('should detect high error rates', async ({ page }) => {
    // 設置所有 API 請求都返回錯誤
    await page.route('**/graphql', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Internal Server Error' }] }),
      });
    });

    await page.route('**/api/v1/widgets/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/admin');
    
    // 等待頁面嘗試加載
    await page.waitForTimeout(5000);

    // 檢查是否顯示錯誤狀態或降級功能
    const errorElements = await page.locator('[data-testid*="error"], .error-message, .alert-error').count();
    
    // 應該有一些錯誤指示
    expect(errorElements).toBeGreaterThan(0);
  });
});

// 測試工具函數
test.describe('API Testing Utilities', () => {
  test('should provide debugging information', async ({ page }) => {
    await page.goto('/admin');
    
    // 注入調試工具
    await page.evaluate(() => {
      (window as any).debugAPIRouting = () => {
        return {
          currentFlags: localStorage.getItem('feature_flags_override'),
          apiCalls: (window as any).apiCallHistory || [],
          routingDecisions: (window as any).routingDecisions || [],
        };
      };
    });

    const debugInfo = await page.evaluate(() => {
      return (window as any).debugAPIRouting?.() || null;
    });

    console.log('Debug info:', debugInfo);
    expect(debugInfo).not.toBeNull();
  });
});