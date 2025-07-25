/**
 * E2E 測試輔助函數
 * QA專家 - 通用測試工具和設置
 */

import { Page, expect } from '@playwright/test';

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

/**
 * 管理員登入輔助函數
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');

  // 輸入登入憑證
  await page.fill('[data-testid="email-input"]', process.env.SYS_LOGIN || 'admin@test.com');
  await page.fill('[data-testid="password-input"]', process.env.SYS_PASSWORD || 'admin123');

  // 點擊登入按鈕
  await page.click('[data-testid="login-button"]');

  // 等待導向到管理儀表板
  await page.waitForURL('/admin/**', { timeout: 15000 });

  // 確認登入成功
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
}

/**
 * 等待 Widget 載入完成
 */
export async function waitForWidgetLoad(
  page: Page,
  widgetTestId: string,
  requireTestId: boolean = true
): Promise<void> {
  if (requireTestId) {
    // 使用 test-id 查找
    await page.waitForSelector(`[data-testid="${widgetTestId}"]`, {
      timeout: 15000,
      state: 'visible',
    });
  } else {
    // 使用類名或其他選擇器查找
    if (widgetTestId === 'history-tree') {
      await page.waitForSelector('.h-full.bg-slate-800', {
        timeout: 15000,
        state: 'visible',
      });
    } else {
      // 通用 widget 載入等待
      await page.waitForTimeout(3000);
    }
  }

  // 等待骨架屏消失（如果存在）
  await page
    .waitForFunction(
      () => {
        const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
        return skeletons.length === 0;
      },
      { timeout: 10000 }
    )
    .catch(() => {
      // 忽略骨架屏等待超時，可能沒有骨架屏
    });

  // 額外等待確保內容完全載入
  await page.waitForTimeout(1000);
}

/**
 * 捕獲性能指標
 */
export async function capturePerformanceMetrics(
  page: Page,
  operation: () => Promise<void>
): Promise<PerformanceMetrics> {
  // 開始性能監控
  await page.evaluate(() => {
    performance.mark('test-start');
  });

  const startTime = Date.now();

  // 執行操作
  await operation();

  const endTime = Date.now();
  const loadTime = endTime - startTime;

  // 獲取瀏覽器性能指標
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0;

    return {
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      timeToInteractive: navigation.loadEventEnd - navigation.fetchStart,
      totalBlockingTime: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
    };
  });

  return {
    loadTime,
    firstContentfulPaint: performanceMetrics.firstContentfulPaint,
    largestContentfulPaint: performanceMetrics.largestContentfulPaint,
    timeToInteractive: performanceMetrics.timeToInteractive,
    totalBlockingTime: performanceMetrics.totalBlockingTime,
  };
}

/**
 * 等待 API 請求完成
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForResponse(
    response => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      } else {
        return urlPattern.test(url);
      }
    },
    { timeout }
  );
}

/**
 * 模擬網路狀況
 */
export async function simulateNetworkConditions(
  page: Page,
  condition: 'fast' | 'slow' | 'offline'
): Promise<void> {
  const conditions = {
    fast: { offline: false, downloadThroughput: 1000000, uploadThroughput: 1000000, latency: 10 },
    slow: { offline: false, downloadThroughput: 50000, uploadThroughput: 20000, latency: 500 },
    offline: { offline: true, downloadThroughput: 0, uploadThroughput: 0, latency: 0 },
  };

  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', conditions[condition]);
}

/**
 * 截圖比較輔助函數
 */
export async function captureWidgetScreenshot(
  page: Page,
  widgetSelector: string,
  screenshotName: string
): Promise<void> {
  const widget = page.locator(widgetSelector);
  await expect(widget).toBeVisible();

  // 等待動畫完成
  await page.waitForTimeout(1000);

  await expect(widget).toHaveScreenshot(`${screenshotName}.png`);
}

/**
 * 檢查控制台錯誤
 */
export async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * 檢查網路錯誤
 */
export async function collectNetworkErrors(
  page: Page
): Promise<Array<{ url: string; status: number }>> {
  const networkErrors: Array<{ url: string; status: number }> = [];

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });

  return networkErrors;
}

/**
 * 驗證資料載入狀態
 */
export async function verifyDataLoaded(
  page: Page,
  dataSelector: string,
  expectedMinItems: number = 1
): Promise<void> {
  // 等待資料容器出現
  await page.waitForSelector(dataSelector, { timeout: 15000 });

  // 檢查資料項目數量
  const items = page.locator(`${dataSelector} > *`);
  const count = await items.count();

  expect(count).toBeGreaterThanOrEqual(expectedMinItems);

  // 檢查不是載入狀態
  const loadingElements = page.locator('[class*="animate-pulse"], [class*="spinner"]');
  expect(await loadingElements.count()).toBe(0);
}

/**
 * 模擬用戶交互
 */
export async function simulateUserInteraction(
  page: Page,
  actions: Array<{ type: 'click' | 'fill' | 'select' | 'hover'; selector: string; value?: string }>
): Promise<void> {
  for (const action of actions) {
    await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 });

    switch (action.type) {
      case 'click':
        await page.click(action.selector);
        break;
      case 'fill':
        if (action.value) {
          await page.fill(action.selector, action.value);
        }
        break;
      case 'select':
        if (action.value) {
          await page.selectOption(action.selector, action.value);
        }
        break;
      case 'hover':
        await page.hover(action.selector);
        break;
    }

    // 短暫等待避免操作過快
    await page.waitForTimeout(500);
  }
}

/**
 * 驗證響應式設計
 */
export async function testResponsiveDesign(
  page: Page,
  viewports: Array<{ width: number; height: number; name: string }>
): Promise<void> {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(1000); // 等待重排

    // 檢查內容是否溢出
    const bodyWidth = await page.locator('body').boundingBox();
    expect(bodyWidth?.width).toBeLessThanOrEqual(viewport.width);

    // 檢查重要元素是否可見
    const importantElements = page.locator('[data-testid*="important"], .essential');
    const count = await importantElements.count();

    for (let i = 0; i < count; i++) {
      await expect(importantElements.nth(i)).toBeVisible();
    }

    console.log(
      `✅ Responsive test passed for ${viewport.name} (${viewport.width}x${viewport.height})`
    );
  }
}

/**
 * 等待並驗證實時更新
 */
export async function waitForRealtimeUpdate(
  page: Page,
  targetSelector: string,
  expectedChangeIndicator: string,
  timeout: number = 30000
): Promise<void> {
  // 記錄初始狀態
  const initialContent = await page.locator(targetSelector).textContent();

  // 等待變更
  await page.waitForFunction(
    ({ selector, initial, indicator }) => {
      const element = document.querySelector(selector);
      const currentContent = element?.textContent;
      return currentContent !== initial || document.querySelector(indicator);
    },
    { selector: targetSelector, initial: initialContent, indicator: expectedChangeIndicator },
    { timeout }
  );

  console.log('✅ Realtime update detected');
}

/**
 * 批量驗證元素可見性
 */
export async function verifyElementsVisible(
  page: Page,
  selectors: string[]
): Promise<{ visible: string[]; hidden: string[] }> {
  const visible: string[] = [];
  const hidden: string[] = [];

  for (const selector of selectors) {
    try {
      await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
      visible.push(selector);
    } catch {
      hidden.push(selector);
    }
  }

  return { visible, hidden };
}

/**
 * 測試輔助工具匯出
 */
export const TestHelpers = {
  loginAsAdmin,
  waitForWidgetLoad,
  capturePerformanceMetrics,
  waitForAPIResponse,
  simulateNetworkConditions,
  captureWidgetScreenshot,
  collectConsoleErrors,
  collectNetworkErrors,
  verifyDataLoaded,
  simulateUserInteraction,
  testResponsiveDesign,
  waitForRealtimeUpdate,
  verifyElementsVisible,
};
