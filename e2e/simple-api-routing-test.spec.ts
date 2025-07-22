/**
 * 簡單 API 路由測試 (v1.2.3)
 *
 * 測試 feature flags 和 API 路由基本功能
 * 無需認證
 */

import { test, expect } from '@playwright/test';

test.describe('API Routing Basic Tests', () => {
  test('should load feature flag system correctly', async ({ page }) => {
    // 前往首頁 (不需要認證)
    await page.goto('/');

    // 等待頁面加載
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // 注入測試代碼來檢查 feature flag 系統
    const featureFlagSystemLoaded = await page.evaluate(async () => {
      try {
        // 檢查 feature flag manager 是否可用
        const featureFlags = await import('@/lib/feature-flags');
        return {
          isFeatureEnabled: typeof featureFlags.isFeatureEnabled === 'function',
          getFeatureVariant: typeof featureFlags.getFeatureVariant === 'function',
          checkFeatures: typeof featureFlags.checkFeatures === 'function',
        };
      } catch (error) {
        console.error('Feature flag system error:', error);
        return null;
      }
    });

    console.log('Feature flag system status:', featureFlagSystemLoaded);
    expect(featureFlagSystemLoaded).not.toBeNull();
  });

  test('should create API router correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const apiRouterTest = await page.evaluate(async () => {
      try {
        // 測試 API Router 基本功能
        const { APIRouter } = await import('@/lib/api/api-router');

        const router = new APIRouter({
          userId: 'test-user',
          environment: 'development',
        });

        // 測試路由決策
        const result = await router.route();

        return {
          hasResult: !!result,
          hasUseRestAPI: typeof result.useRestAPI === 'boolean',
          hasPercentage: typeof result.percentage === 'number',
          hasReason: typeof result.reason === 'string',
          result,
        };
      } catch (error) {
        console.error('API Router error:', error);
        return { error: (error as Error).message };
      }
    });

    console.log('API Router test result:', apiRouterTest);
    expect(apiRouterTest.hasResult).toBe(true);
    expect(apiRouterTest.hasUseRestAPI).toBe(true);
    expect(apiRouterTest.hasPercentage).toBe(true);
    expect(apiRouterTest.hasReason).toBe(true);
  });

  test('should initialize API monitor correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const apiMonitorTest = await page.evaluate(async () => {
      try {
        const { apiMonitor } = await import('@/lib/api/api-monitor');

        // 測試記錄指標
        apiMonitor.recordSuccess('rest', '/test', 100, 'test-user');
        apiMonitor.recordError('graphql', '/test', 200, 'Test error', 'test-user');

        // 獲取統計
        const stats = apiMonitor.getStats();
        const comparison = apiMonitor.compareAPIs();

        return {
          hasStats: !!stats,
          totalRequests: stats.totalRequests,
          hasComparison: !!comparison,
          monitorWorking: stats.totalRequests === 2,
        };
      } catch (error) {
        console.error('API Monitor error:', error);
        return { error: (error as Error).message };
      }
    });

    console.log('API Monitor test result:', apiMonitorTest);
    expect(apiMonitorTest.hasStats).toBe(true);
    expect(apiMonitorTest.monitorWorking).toBe(true);
  });

  test('should handle feature flag evaluation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const featureFlagTest = await page.evaluate(async () => {
      try {
        const { isFeatureEnabled, getFeatureVariant } = await import('@/lib/feature-flags');

        // 測試基本 feature flag 檢查
        const isDebugEnabled = await isFeatureEnabled('debug_mode');
        const variant = await getFeatureVariant('rest_api_percentage');

        return {
          debugResult: typeof isDebugEnabled === 'boolean',
          variantResult: variant === undefined || typeof variant === 'string',
          testPassed: true,
        };
      } catch (error) {
        console.error('Feature flag evaluation error:', error);
        return { error: (error as Error).message, testPassed: false };
      }
    });

    console.log('Feature flag evaluation result:', featureFlagTest);
    expect(featureFlagTest.testPassed).toBe(true);
  });

  test('should demonstrate API switching logic', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const switchingTest = await page.evaluate(async () => {
      try {
        const { APIRouter } = await import('@/lib/api/api-router');

        const results = [];

        // 測試不同配置下的路由決策
        const configs = [
          { userId: 'user1', environment: 'development' as const },
          { userId: 'user2', environment: 'development' as const },
          { userId: 'user3', environment: 'production' as const },
        ];

        for (const config of configs) {
          const router = new APIRouter(config);
          const result = await router.route();
          results.push({
            config,
            useRestAPI: result.useRestAPI,
            percentage: result.percentage,
            reason: result.reason,
          });
        }

        return {
          testCount: results.length,
          results,
          allHaveDecisions: results.every(
            r => typeof r.useRestAPI === 'boolean' && typeof r.percentage === 'number'
          ),
        };
      } catch (error) {
        console.error('API switching test error:', error);
        return { error: (error as Error).message };
      }
    });

    console.log('API switching test results:', switchingTest);
    expect(switchingTest.testCount).toBe(3);
    expect(switchingTest.allHaveDecisions).toBe(true);
  });

  test('should validate unified API client structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const unifiedClientTest = await page.evaluate(async () => {
      try {
        const { UnifiedAPIClient, getAPIClient } = await import('@/lib/api/unified-api-client');

        const client = getAPIClient({
          userId: 'test-user',
          timeout: 5000,
        });

        return {
          hasClient: !!client,
          hasRequestMethod: typeof client.request === 'function',
          clientType: client.constructor.name,
        };
      } catch (error) {
        console.error('Unified API client error:', error);
        return { error: (error as Error).message };
      }
    });

    console.log('Unified API client test result:', unifiedClientTest);
    expect(unifiedClientTest.hasClient).toBe(true);
    expect(unifiedClientTest.hasRequestMethod).toBe(true);
  });
});

test.describe('Performance Baseline Tests', () => {
  test('should measure basic page load performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    // 基本性能檢查 - 頁面應該在合理時間內加載
    expect(loadTime).toBeLessThan(10000); // 10 秒內

    // 檢查頁面內容是否正常加載
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length || 0).toBeGreaterThan(0);
  });

  test('should record API routing decisions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // 在頁面上設置 API 路由追蹤
    await page.evaluate(() => {
      (window as any).apiRoutingDecisions = [];
      (window as any).recordAPIDecision = (decision: any) => {
        (window as any).apiRoutingDecisions.push({
          ...decision,
          timestamp: Date.now(),
        });
      };
    });

    // 模擬一些 API 路由決策
    const decisions = await page.evaluate(async () => {
      try {
        const { APIRouter } = await import('@/lib/api/api-router');

        const testCases = [
          { userId: 'test1', environment: 'development' as const },
          { userId: 'test2', environment: 'development' as const },
          { userId: 'test3', environment: 'production' as const },
        ];

        const decisions = [];
        for (const config of testCases) {
          const router = new APIRouter(config);
          const result = await router.route();

          const decision = {
            userId: config.userId,
            environment: config.environment,
            useRestAPI: result.useRestAPI,
            percentage: result.percentage,
            reason: result.reason,
          };

          decisions.push(decision);
          (window as any).recordAPIDecision?.(decision);
        }

        return decisions;
      } catch (error) {
        console.error('Decision recording error:', error);
        return [];
      }
    });

    console.log('API routing decisions:', decisions);
    expect(decisions.length).toBe(3);

    // 檢查決策是否記錄在頁面上
    const recordedDecisions = await page.evaluate(() => {
      return (window as any).apiRoutingDecisions || [];
    });

    expect(recordedDecisions.length).toBe(3);
  });
});
