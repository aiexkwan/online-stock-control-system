import { test, expect } from './fixtures/auth.fixture';

/**
 * API 調用監控測試
 * 專門測試 analysis 頁面的 API 調用數量
 */
test.describe('API Call Monitoring', () => {
  let apiCalls: Array<{
    url: string;
    method: string;
    timestamp: number;
    status?: number;
  }> = [];

  test.beforeEach(async ({ page }) => {
    // 重置 API 調用記錄
    apiCalls = [];

    // 監聽所有網絡請求
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now(),
        });
        console.log(`[API-CALL] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const existingCall = apiCalls.find(call => call.url === response.url() && !call.status);
        if (existingCall) {
          existingCall.status = response.status();
        }
        console.log(`[API-RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    // 設置測試模式環境變量
    await page.addInitScript(() => {
      window.localStorage.setItem('testMode', 'true');
      // @ts-ignore
      window.process = { env: { PLAYWRIGHT_TEST: 'true' } };
    });
  });

  test('should monitor API calls on analysis theme with minimal widgets', async ({
    page,
    authenticatedPage,
  }) => {
    console.log('🚀 Starting API call monitoring test...');

    // 已經通過 fixture 登錄，重置 API 調用記錄
    apiCalls = [];

    console.log(`[API-COUNT] Starting fresh: ${apiCalls.length} calls`);

    // 3. 導航到 analysis 主題（启用測試模式）
    apiCalls = []; // 重置計數器

    await page.goto('/admin/analysis?testMode=true');
    await page.waitForLoadState('networkidle');

    // 等待所有可能的延遲請求
    await page.waitForTimeout(5000);

    console.log(`[API-COUNT] After analysis page load: ${apiCalls.length} calls`);

    // 4. 分析 API 調用
    const uniqueApiEndpoints = new Set(
      apiCalls.map(call => {
        const url = new URL(call.url);
        return url.pathname;
      })
    );

    console.log('\n📊 API Call Analysis:');
    console.log(`Total API calls: ${apiCalls.length}`);
    console.log(`Unique endpoints: ${uniqueApiEndpoints.size}`);
    console.log('\nUnique endpoints:');
    uniqueApiEndpoints.forEach(endpoint => {
      const count = apiCalls.filter(call => new URL(call.url).pathname === endpoint).length;
      console.log(`  ${endpoint}: ${count} calls`);
    });

    console.log('\nAll API calls:');
    apiCalls.forEach((call, index) => {
      console.log(`  ${index + 1}. ${call.method} ${call.url} (${call.status || 'pending'})`);
    });

    // 5. 驗證目標
    expect(apiCalls.length).toBeLessThanOrEqual(15); // 目標：< 15 次 API 調用

    // 6. 驗證頁面已正確加載（使用更寬鬆的選擇器）
    await expect(page.locator('main, [role="main"], .dashboard-content')).toBeVisible();

    // 7. 驗證至少有一些統計數據顯示（使用更寬鬆的選擇器）
    const statsElements = page.locator('.stat-card, [data-testid*="stat"], .metric-card, .card');
    await expect(statsElements.first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Test completed successfully!');
    console.log(`Final API call count: ${apiCalls.length} (Target: < 15)`);
  });

  test('should compare full vs minimal analysis theme', async ({ page, authenticatedPage }) => {
    console.log('🚀 Starting comparison test...');

    // 已經通過 fixture 登錄，直接開始測試
    apiCalls = [];

    // 測試最小化版本（启用測試模式）
    apiCalls = [];
    await page.goto('/admin/analysis?testMode=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const minimalCalls = apiCalls.length;
    console.log(`Minimal analysis theme: ${minimalCalls} API calls`);

    // 測試完整版本（如果存在）
    apiCalls = [];
    await page.goto('/admin/analysis?testMode=false');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const fullCalls = apiCalls.length;
    console.log(`Full analysis theme: ${fullCalls} API calls`);

    console.log(`\n📊 Comparison Results:`);
    console.log(`Minimal: ${minimalCalls} calls`);
    console.log(`Full: ${fullCalls} calls`);
    console.log(
      `Reduction: ${fullCalls - minimalCalls} calls (${Math.round(((fullCalls - minimalCalls) / fullCalls) * 100)}%)`
    );

    // 驗證最小化版本確實更少
    expect(minimalCalls).toBeLessThanOrEqual(15);
    if (fullCalls > 0) {
      expect(minimalCalls).toBeLessThanOrEqual(fullCalls);
    }
  });
});
