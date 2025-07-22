/**
 * E2E Test: 簡單 Grid 測試
 * 測試簡化版 operations-monitoring 佈局
 */

import { test, expect } from '@playwright/test';

test.describe('簡單 Grid 測試', () => {
  test('測試簡化版 operations-monitoring 佈局', async ({ page }) => {
    console.log('🔍 測試簡化版佈局...');

    await page.goto('http://localhost:3000/admin/operations-monitoring-test', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待頁面加載
    await page.waitForTimeout(3000);

    // 檢查標題
    const hasTitle = await page.locator('text=Operations Monitoring Test').isVisible();
    console.log('標題顯示:', hasTitle);

    // 檢查 Grid 容器
    const gridContainer = await page.locator('[data-testid="grid-container"]');
    const gridExists = await gridContainer.isVisible();
    console.log('Grid 容器存在:', gridExists);

    if (gridExists) {
      // 獲取 Grid 信息
      const gridInfo = await gridContainer.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          gridTemplateRows: style.gridTemplateRows,
          gridTemplateAreas: style.gridTemplateAreas,
          children: el.children.length,
        };
      });

      console.log('Grid 配置:', JSON.stringify(gridInfo, null, 2));
    }

    // 檢查 Widget 元素
    const widgets = await page.locator('.bg-orange-500').count();
    console.log('橙色 Widget 數量:', widgets);

    // 檢查每個 Widget 的內容
    for (let i = 0; i < Math.min(widgets, 5); i++) {
      const widget = page.locator('.bg-orange-500').nth(i);
      const content = await widget.textContent();
      console.log(`Widget ${i + 1}:`, content?.substring(0, 100));
    }

    // 截圖
    await page.screenshot({ path: 'test-results/simple-grid-test.png', fullPage: true });

    // 基本測試
    expect(hasTitle).toBe(true);
    expect(gridExists).toBe(true);
    expect(widgets).toBeGreaterThan(0);
  });
});
