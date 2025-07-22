/**
 * E2E Test: Widget 載入詳細診斷
 * 檢查為什麼只顯示 1 個 widget 而不是 9 個
 */

import { test, expect } from '@playwright/test';

test.describe('Widget 載入詳細診斷', () => {
  test('檢查所有 9 個 widgets 的載入狀態', async ({ page }) => {
    console.log('🔍 開始 Widget 載入診斷...');

    const errors: string[] = [];
    const warnings: string[] = [];

    // 監聽錯誤
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
        console.log('❌ Error:', text);
      } else if (msg.type() === 'warning') {
        warnings.push(text);
        console.log('⚠️ Warning:', text);
      } else if (text.includes('[renderLazyComponent]') || text.includes('widget')) {
        console.log('📝 Widget Log:', text);
      }
    });

    await page.goto('http://localhost:3000/admin/operations-monitoring', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待 widgets 加載
    await page.waitForTimeout(8000);

    console.log('🔍 檢查 Grid 佈局...');

    // 檢查 CSS Grid 是否正確設置
    const gridInfo = await page.evaluate(() => {
      const gridContainer = document.querySelector('[style*="display: grid"]');
      if (!gridContainer) return { error: 'No grid container found' };

      const style = window.getComputedStyle(gridContainer);
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        gridTemplateRows: style.gridTemplateRows,
        gridTemplateAreas: style.gridTemplateAreas,
        children: gridContainer.children.length,
        innerHTML: gridContainer.innerHTML.substring(0, 500),
      };
    });

    console.log('🎨 Grid 配置:', JSON.stringify(gridInfo, null, 2));

    // 檢查每個預期的 grid area
    const expectedAreas = [
      'stats-1',
      'stats-2',
      'stats-3',
      'stats-4',
      'history',
      'table-1',
      'chart',
      'table-2',
      'chart-2',
    ];

    console.log('🔍 檢查 Grid Areas...');

    for (const area of expectedAreas) {
      const hasElement = await page.evaluate(gridArea => {
        const element = document.querySelector(`[style*="grid-area: ${gridArea}"]`);
        return {
          exists: !!element,
          content: element ? element.textContent?.substring(0, 100) : null,
          className: element ? element.className : null,
          tagName: element ? element.tagName : null,
        };
      }, area);

      console.log(`📍 ${area}:`, hasElement);
    }

    // 檢查特定組件
    const componentChecks = {
      UnifiedStatsWidget: await page.locator('[data-widget-type="stats"]').count(),
      UnifiedChartWidget: await page.locator('[data-widget-type="chart"]').count(),
      UnifiedTableWidget: await page.locator('[data-widget-type="table"]').count(),
      HistoryTreeV2: await page.locator('[data-widget-type="history-tree"]').count(),
      DepartmentSelectorWidget: await page.locator('text=Department').count(),
    };

    console.log('🎭 組件計數:', JSON.stringify(componentChecks, null, 2));

    // 檢查所有可見的 widgets
    const visibleWidgets = await page.evaluate(() => {
      const widgets = document.querySelectorAll('[data-widget-focusable="true"]');
      return Array.from(widgets).map(widget => ({
        className: widget.className,
        textContent: widget.textContent?.substring(0, 100),
        style: widget.getAttribute('style'),
        gridArea: widget.style?.gridArea || 'none',
      }));
    });

    console.log('👁️ 可見 Widgets:', JSON.stringify(visibleWidgets, null, 2));

    // 檢查是否有隱藏的 widgets
    const hiddenWidgets = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const hiddenWidgets = [];

      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        if (
          el.textContent?.includes('Widget') ||
          el.textContent?.includes('Chart') ||
          el.textContent?.includes('Stats')
        ) {
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            hiddenWidgets.push({
              text: el.textContent?.substring(0, 50),
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
            });
          }
        }
      }

      return hiddenWidgets;
    });

    console.log('🙈 隱藏 Widgets:', JSON.stringify(hiddenWidgets, null, 2));

    // 檢查 AdminDashboardContent 是否正確渲染
    const dashboardContent = await page.evaluate(() => {
      const content =
        document.querySelector('[data-testid="admin-dashboard-content"]') ||
        document.querySelector('.admin-dashboard-content') ||
        document.querySelector('[class*="dashboard"]');

      return {
        exists: !!content,
        children: content ? content.children.length : 0,
        classes: content ? content.className : null,
      };
    });

    console.log('📊 Dashboard Content:', JSON.stringify(dashboardContent, null, 2));

    // 總結報告
    console.log('\n📊 Widget 載入診斷報告:');
    console.log('=========================');
    console.log(`錯誤: ${errors.length} 個`);
    console.log(`警告: ${warnings.length} 個`);
    console.log(`可見 Widgets: ${visibleWidgets.length} 個 (預期: 9 個)`);
    console.log(`隱藏 Widgets: ${hiddenWidgets.length} 個`);

    if (visibleWidgets.length < 9) {
      console.log('\n🚨 問題診斷:');

      if (!gridInfo.gridTemplateAreas || gridInfo.gridTemplateAreas === 'none') {
        console.log('  1. CSS Grid Template Areas 未正確設置');
      }

      if (errors.some(e => e.includes('UnifiedStatsWidget') || e.includes('UnifiedChartWidget'))) {
        console.log('  2. 統一組件載入失敗');
      }

      if (hiddenWidgets.length > 0) {
        console.log('  3. 部分 Widgets 被 CSS 隱藏');
      }

      if (dashboardContent.children < 5) {
        console.log('  4. AdminDashboardContent 渲染不完整');
      }
    }

    // 截圖保存狀態
    await page.screenshot({ path: 'test-results/widget-debug.png', fullPage: true });

    // 基本測試
    expect(visibleWidgets.length).toBeGreaterThan(0);
  });
});
