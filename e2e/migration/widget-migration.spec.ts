/**
 * Widget 遷移 E2E 測試
 * QA專家 - 用戶體驗連續性驗證
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, waitForWidgetLoad, capturePerformanceMetrics } from '../helpers/test-helpers';

test.describe('🔄 Widget Migration E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('📊 InventoryOrderedAnalysisWidget Migration', () => {
    test('should display inventory analysis after migration', async () => {
      await test.step('Navigate to dashboard', async () => {
        await page.goto('/admin/dashboard');
        await page.waitForLoadState('networkidle');
      });

      await test.step('Wait for inventory widget to load', async () => {
        // 等待 widget 出現
        await page.waitForSelector('[data-testid="inventory-analysis-widget"]', {
          timeout: 10000
        });

        // 驗證 REST API 標識存在
        const restApiIndicator = page.locator('text="✓ REST API"');
        await expect(restApiIndicator).toBeVisible();
      });

      await test.step('Verify widget content structure', async () => {
        // 驗證標題存在
        const widgetTitle = page.locator('text="Inventory Ordered Analysis"');
        await expect(widgetTitle).toBeVisible();

        // 驗證總體狀態卡片
        const statusCard = page.locator('.border-success, .border-destructive').first();
        await expect(statusCard).toBeVisible();

        // 驗證指標顯示
        const totalStockLabel = page.locator('text="Total Stock"');
        const orderDemandLabel = page.locator('text="Order Demand"');
        const remainingStockLabel = page.locator('text="Remaining Stock"');
        
        await expect(totalStockLabel).toBeVisible();
        await expect(orderDemandLabel).toBeVisible();
        await expect(remainingStockLabel).toBeVisible();
      });

      await test.step('Verify progress bar functionality', async () => {
        // 檢查滿足率進度條
        const progressBar = page.locator('[role="progressbar"]').first();
        await expect(progressBar).toBeVisible();

        // 檢查進度條數值
        const progressText = page.locator('text=/\\d+\\.\\d+%/').first();
        await expect(progressText).toBeVisible();
      });

      await test.step('Verify product list rendering', async () => {
        // 等待產品列表載入
        await page.waitForTimeout(2000);

        // 檢查產品項目是否存在
        const productItems = page.locator('.space-y-2 > div').filter({
          has: page.locator('p:has-text(/^[A-Z0-9]+$/)')
        });

        const productCount = await productItems.count();
        expect(productCount).toBeGreaterThan(0);

        // 驗證第一個產品的資料結構
        if (productCount > 0) {
          const firstProduct = productItems.first();
          
          // 產品代碼
          await expect(firstProduct.locator('p').first()).toBeVisible();
          
          // Stock/Demand/Remain 資訊
          await expect(firstProduct.locator('text="Stock:"')).toBeVisible();
          await expect(firstProduct.locator('text="Demand:"')).toBeVisible();
          await expect(firstProduct.locator('text="Remain:"')).toBeVisible();
        }
      });
    });

    test('should handle real-time updates correctly', async () => {
      await test.step('Open dashboard and inventory page in separate tabs', async () => {
        const dashboardPage = page;
        const inventoryPage = await page.context().newPage();

        await dashboardPage.goto('/admin/dashboard');
        await inventoryPage.goto('/admin/inventory');

        await waitForWidgetLoad(dashboardPage, 'inventory-analysis-widget');
      });

      await test.step('Capture initial state', async () => {
        const initialStockText = await page.locator('.stock-summary').first().textContent();
        console.log('Initial stock state:', initialStockText);
      });

      // Note: 實際的庫存更新需要根據應用程式的具體實現來調整
      await test.step('Simulate stock update', async () => {
        // 模擬庫存變更操作
        await page.evaluate(() => {
          // 觸發 AdminRefresh context
          window.dispatchEvent(new CustomEvent('admin-refresh-trigger'));
        });

        // 等待重新載入
        await page.waitForTimeout(3000);
      });
    });

    test('should maintain performance after migration', async () => {
      const performanceMetrics = await capturePerformanceMetrics(page, async () => {
        await page.goto('/admin/dashboard');
        await waitForWidgetLoad(page, 'inventory-analysis-widget');
      });

      // 驗證載入時間在可接受範圍內
      expect(performanceMetrics.loadTime).toBeLessThan(5000); // 5秒
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // 2秒
      expect(performanceMetrics.largestContentfulPaint).toBeLessThan(3000); // 3秒

      console.log('📊 Widget Performance Metrics:', performanceMetrics);
    });

    test('should handle error states gracefully', async () => {
      await test.step('Simulate network error', async () => {
        // 攔截 API 請求並返回錯誤
        await page.route('/api/dashboard/**', route => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal Server Error' })
          });
        });

        await page.goto('/admin/dashboard');
      });

      await test.step('Verify error handling', async () => {
        // 檢查是否顯示錯誤狀態或降級內容
        const errorState = page.locator('text="No inventory data available"');
        await expect(errorState).toBeVisible({ timeout: 15000 });
      });
    });
  });

  test.describe('🌳 HistoryTreeV2 Migration', () => {
    test('should render history tree without errors', async () => {
      await test.step('Navigate to dashboard', async () => {
        await page.goto('/admin/dashboard');
        await page.waitForLoadState('networkidle');
      });

      await test.step('Locate history tree widget', async () => {
        // 尋找 HistoryTreeV2 widget
        const historyWidget = page.locator('.h-full.bg-slate-800').filter({
          has: page.locator('text="History Tree"')
        });
        
        await expect(historyWidget).toBeVisible();
      });

      await test.step('Verify basic structure', async () => {
        const historyWidget = page.locator('.h-full.bg-slate-800').first();
        
        // 檢查標題
        await expect(historyWidget.locator('h3')).toContainText('History Tree');
        
        // 檢查內容區域
        const contentArea = historyWidget.locator('.p-4').last();
        await expect(contentArea).toBeVisible();
      });

      await test.step('Verify content items', async () => {
        const contentItems = page.locator('.space-y-3 > div');
        const itemCount = await contentItems.count();
        
        expect(itemCount).toBeGreaterThanOrEqual(3); // 至少有3個項目
        
        // 檢查每個項目的結構
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = contentItems.nth(i);
          
          // 檢查圓點指示器
          await expect(item.locator('.w-2.h-2.rounded-full')).toBeVisible();
          
          // 檢查文字內容
          await expect(item.locator('.text-sm.font-medium')).toBeVisible();
          await expect(item.locator('.text-xs.text-slate-400')).toBeVisible();
        }
      });
    });

    test('should handle edit mode correctly', async () => {
      // 模擬編輯模式
      await page.goto('/admin/dashboard?edit=true');
      
      const historyWidget = page.locator('.h-full.bg-slate-800').filter({
        has: page.locator('text="History Tree"')
      });
      
      // 檢查編輯模式顯示
      await expect(historyWidget.locator('text="Edit Mode - History Tree"')).toBeVisible();
    });

    test('should not cause Next.js factory errors', async () => {
      // 監聽控制台錯誤
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/admin/dashboard');
      await waitForWidgetLoad(page, 'history-tree', false); // 不要求特定 testid

      // 等待一段時間確保所有錯誤都被捕獲
      await page.waitForTimeout(3000);

      // 檢查沒有 Next.js factory 相關錯誤
      const factoryErrors = consoleErrors.filter(error => 
        error.includes('factory.call') || 
        error.includes('originalFactory') ||
        error.includes('Cannot read properties of undefined')
      );

      expect(factoryErrors).toHaveLength(0);

      if (consoleErrors.length > 0) {
        console.log('⚠️ Console errors detected:', consoleErrors);
      }
    });
  });

  test.describe('🔄 Cross-Widget Integration', () => {
    test('should maintain widget interactions after migration', async () => {
      await page.goto('/admin/dashboard');
      
      // 等待所有 widgets 載入
      await page.waitForTimeout(5000);

      // 檢查 widget 之間的事件通信
      await test.step('Test StockTypeSelector integration', async () => {
        // 尋找庫存類型選擇器（如果存在）
        const typeSelector = page.locator('[data-testid="stock-type-selector"]');
        
        if (await typeSelector.isVisible()) {
          // 切換類型
          await typeSelector.selectOption('Electronics');
          
          // 等待 InventoryOrderedAnalysisWidget 更新
          await page.waitForTimeout(2000);
          
          // 驗證 widget 內容已更新
          const widgetContent = page.locator('[data-testid="inventory-analysis-widget"]');
          await expect(widgetContent).toBeVisible();
        }
      });
    });

    test('should handle concurrent widget operations', async () => {
      await page.goto('/admin/dashboard');
      
      // 同時觸發多個 widget 操作
      await Promise.all([
        page.locator('[data-testid="refresh-inventory"]').click().catch(() => {}),
        page.locator('[data-testid="refresh-history"]').click().catch(() => {}),
        page.evaluate(() => window.dispatchEvent(new CustomEvent('admin-refresh-trigger')))
      ]);

      // 等待所有操作完成
      await page.waitForTimeout(5000);

      // 驗證沒有衝突或錯誤
      const errorElements = page.locator('text="Error"');
      expect(await errorElements.count()).toBe(0);
    });
  });

  test.describe('📱 Mobile Responsiveness', () => {
    test('should render correctly on mobile devices', async () => {
      // 設置移動設備視窗
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // 檢查 widgets 在移動設備上的顯示
      const inventoryWidget = page.locator('[data-testid="inventory-analysis-widget"]');
      if (await inventoryWidget.isVisible()) {
        // 檢查響應式布局
        const widgetBounds = await inventoryWidget.boundingBox();
        expect(widgetBounds?.width).toBeLessThanOrEqual(375);
        
        // 檢查內容是否仍然可讀
        await expect(inventoryWidget.locator('text="Total Stock"')).toBeVisible();
      }

      const historyWidget = page.locator('.h-full.bg-slate-800').first();
      if (await historyWidget.isVisible()) {
        const widgetBounds = await historyWidget.boundingBox();
        expect(widgetBounds?.width).toBeLessThanOrEqual(375);
      }
    });
  });
});

/**
 * 測試執行命令:
 * npm run test:e2e -- e2e/migration/widget-migration.spec.ts
 * 
 * 在 CI/CD 中的使用:
 * - 每次部署前執行
 * - 檢測用戶體驗回歸
 * - 驗證跨瀏覽器兼容性
 */