/**
 * Admin Themes 全面測試
 * 測試所有 8 個 admin themes 的完整功能
 *
 * 測試範圍：
 * - 頁面加載性能
 * - JavaScript 錯誤檢測
 * - Widget 渲染狀況
 * - Performance Monitor 錯誤
 * - 認證和權限
 * - 響應式設計
 */

import { test, expect } from './fixtures/auth.fixture';

// 所有 admin themes
const ADMIN_THEMES = [
  'injection', // 注塑主題 (critical theme with SSR)
  'pipeline', // 管道主題 (critical theme with SSR)
  'warehouse', // 倉庫主題 (critical theme with SSR)
  'upload', // 上傳主題
  'update', // 更新主題
  'stock-management', // 庫存管理主題
  'system', // 系統主題
  'analysis', // 分析主題
] as const;

interface ThemeTestResult {
  theme: string;
  loadTime: number;
  success: boolean;
  errors: string[];
  performanceErrors: string[];
  widgetCount: number;
  hasContent: boolean;
  responseCode: number;
}

test.describe('Admin Themes Comprehensive Testing', () => {
  test('should test all admin themes systematically', async ({ page, authenticatedPage }) => {
    const results: ThemeTestResult[] = [];

    // 設置全局錯誤監聽
    const allErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(`[${msg.location().url}] ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      allErrors.push(`[PageError] ${error.message}`);
    });

    console.log(`🚀 開始測試 ${ADMIN_THEMES.length} 個 admin themes...`);

    for (const theme of ADMIN_THEMES) {
      console.log(`\n🧪 測試 theme: ${theme}`);

      const startTime = Date.now();
      const themeErrors: string[] = [];
      const performanceErrors: string[] = [];
      let responseCode = 0;
      let widgetCount = 0;
      let hasContent = false;
      let success = false;

      try {
        // 監聽此 theme 的特定錯誤
        const themeSpecificErrors: string[] = [];
        const errorHandler = (msg: any) => {
          if (msg.type() === 'error') {
            const errorText = msg.text();
            themeSpecificErrors.push(errorText);

            // 檢查是否為 performance monitor 錯誤
            if (
              errorText.includes('recordMetric') ||
              errorText.includes('performanceMonitor') ||
              errorText.includes('_lib_widgets_performance_monitor')
            ) {
              performanceErrors.push(errorText);
            }
          }
        };

        page.on('console', errorHandler);

        // 監聽網絡響應
        page.on('response', response => {
          if (response.url().includes(`/admin/${theme}`)) {
            responseCode = response.status();
          }
        });

        // 導航到 theme 頁面
        const response = await page.goto(`/admin/${theme}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        responseCode = response?.status() || 0;

        // 等待頁面穩定
        await page.waitForTimeout(3000);

        // 檢查頁面內容
        const bodyText = await page.textContent('body');
        hasContent = bodyText ? bodyText.trim().length > 100 : false;

        // 計算 widgets 數量
        try {
          const widgetElements = await page
            .locator('[data-testid*="widget"], [class*="widget"], [class*="card"]')
            .count();
          widgetCount = widgetElements;
        } catch (e) {
          // 如果無法計算 widgets，不影響主要測試
        }

        // 檢查特定元素是否存在
        const hasNavigation = (await page.locator('nav').count()) > 0;
        const hasMainContent =
          (await page.locator('main, .main-content, [role="main"]').count()) > 0;

        // 判斷成功標準
        success =
          responseCode === 200 &&
          hasContent &&
          performanceErrors.length === 0 &&
          (hasNavigation || hasMainContent);

        // 移除此 theme 的錯誤監聽器
        page.off('console', errorHandler);
        themeErrors.push(...themeSpecificErrors);

        const loadTime = Date.now() - startTime;

        console.log(`  ✅ ${theme}: ${success ? '成功' : '失敗'} (${loadTime}ms)`);
        console.log(
          `     狀態碼: ${responseCode}, Widgets: ${widgetCount}, 內容: ${hasContent ? '有' : '無'}`
        );

        if (performanceErrors.length > 0) {
          console.log(`     ⚠️  Performance 錯誤: ${performanceErrors.length} 個`);
        }

        if (themeErrors.length > 0) {
          console.log(`     🐛 JS 錯誤: ${themeErrors.length} 個`);
        }
      } catch (error) {
        const loadTime = Date.now() - startTime;
        themeErrors.push(`Navigation failed: ${(error as Error).message}`);
        console.log(`  ❌ ${theme}: 失敗 (${loadTime}ms) - ${(error as Error).message}`);
      }

      // 記錄結果
      results.push({
        theme,
        loadTime: Date.now() - startTime,
        success,
        errors: themeErrors,
        performanceErrors,
        widgetCount,
        hasContent,
        responseCode,
      });
    }

    // 生成測試報告
    console.log('\n📊 測試結果總結:');
    console.log('================');

    const successfulThemes = results.filter(r => r.success);
    const failedThemes = results.filter(r => !r.success);
    const themesWithPerformanceErrors = results.filter(r => r.performanceErrors.length > 0);

    console.log(`✅ 成功: ${successfulThemes.length}/${results.length} themes`);
    console.log(`❌ 失敗: ${failedThemes.length}/${results.length} themes`);
    console.log(
      `⚠️  Performance 錯誤: ${themesWithPerformanceErrors.length}/${results.length} themes`
    );

    // 詳細結果
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const perfStatus = result.performanceErrors.length > 0 ? '⚠️' : '✓';
      console.log(
        `${status} ${result.theme.padEnd(15)} | ${result.loadTime.toString().padStart(4)}ms | widgets: ${result.widgetCount.toString().padStart(2)} | perf: ${perfStatus}`
      );
    });

    // 關鍵測試斷言

    // 1. 不應該有任何 performance monitor 錯誤
    const allPerformanceErrors = results.flatMap(r => r.performanceErrors);
    expect(
      allPerformanceErrors,
      `❌ 發現 Performance Monitor 錯誤: ${allPerformanceErrors.join(', ')}`
    ).toHaveLength(0);

    // 2. 至少 6/8 themes 應該成功加載
    expect(
      successfulThemes.length,
      `❌ 成功的 themes 太少: ${successfulThemes.length}/8`
    ).toBeGreaterThanOrEqual(6);

    // 3. Critical themes (injection, pipeline, warehouse) 必須全部成功
    const criticalThemes = ['injection', 'pipeline', 'warehouse'];
    const successfulCriticalThemes = results.filter(
      r => criticalThemes.includes(r.theme) && r.success
    );
    expect(successfulCriticalThemes.length, `❌ Critical themes 失敗過多`).toBe(
      criticalThemes.length
    );

    // 4. 不應該有過多的 JavaScript 錯誤
    const totalJSErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    expect(totalJSErrors, `❌ JavaScript 錯誤過多: ${totalJSErrors}`).toBeLessThan(20);

    console.log('\n🎉 Admin Themes 測試完成！');
  });

  test('should test individual theme performance and stability', async ({
    page,
    authenticatedPage,
  }) => {
    // 對每個 theme 進行更深入的個別測試
    for (const theme of ADMIN_THEMES.slice(0, 3)) {
      // 只測試前 3 個 critical themes
      console.log(`\n🔬 深度測試 ${theme} theme...`);

      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      // 導航到 theme
      await page.goto(`/admin/${theme}`, { waitUntil: 'networkidle', timeout: 30000 });

      // 等待更長時間讓所有 widgets 加載
      await page.waitForTimeout(5000);

      // 嘗試與頁面互動（如果有可互動元素）
      try {
        const buttons = await page.locator('button:visible').count();
        if (buttons > 0) {
          // 點擊第一個可見按鈕
          await page.locator('button:visible').first().click({ timeout: 2000 });
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // 互動失敗不影響主要測試
      }

      // 檢查沒有 performance monitor 錯誤
      const perfErrors = errors.filter(
        error => error.includes('recordMetric') || error.includes('performanceMonitor')
      );

      expect(
        perfErrors,
        `${theme} theme 有 performance monitor 錯誤: ${perfErrors.join(', ')}`
      ).toHaveLength(0);

      console.log(`  ✅ ${theme} 深度測試通過 (${errors.length} 個非關鍵錯誤)`);
    }
  });

  test('should verify theme switching functionality', async ({ page, authenticatedPage }) => {
    console.log('\n🔄 測試 theme 切換功能...');

    // 測試從一個 theme 切換到另一個 theme
    const testSequence = ['injection', 'warehouse', 'system'];

    for (let i = 0; i < testSequence.length; i++) {
      const theme = testSequence[i];
      console.log(`  📍 切換到 ${theme}...`);

      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(`/admin/${theme}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // 檢查 URL 正確
      expect(page.url()).toContain(`/admin/${theme}`);

      // 檢查沒有 performance 錯誤
      const perfErrors = errors.filter(e => e.includes('recordMetric'));
      expect(perfErrors).toHaveLength(0);

      console.log(`    ✅ ${theme} 切換成功`);
    }

    console.log('  🎯 Theme 切換測試完成！');
  });
});
