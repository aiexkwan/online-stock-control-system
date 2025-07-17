/**
 * Admin Themes 快速測試
 * 重點驗證 recordMetric 修復和基本功能
 */

import { test, expect } from './fixtures/auth.fixture';

const CRITICAL_THEMES = ['injection', 'pipeline', 'warehouse'];

test.describe('Admin Themes Quick Test', () => {
  
  test('should verify recordMetric fix across critical themes', async ({ page, authenticatedPage }) => {
    console.log('🎯 測試關鍵 themes 的 recordMetric 修復...');
    
    const results: Array<{
      theme: string;
      success: boolean;
      performanceErrors: string[];
      widgetCount: number;
      loadTime: number;
    }> = [];
    
    for (const theme of CRITICAL_THEMES) {
      console.log(`\n🧪 測試 ${theme} theme...`);
      
      const startTime = Date.now();
      const performanceErrors: string[] = [];
      const allErrors: string[] = [];
      
      // 監聽錯誤
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const errorText = msg.text();
          allErrors.push(errorText);
          
          // 特別檢查 performance monitor 錯誤
          if (errorText.includes('recordMetric') || 
              errorText.includes('performanceMonitor') ||
              errorText.includes('_lib_widgets_performance_monitor')) {
            performanceErrors.push(errorText);
          }
        }
      });
      
      let success = false;
      let widgetCount = 0;
      
      try {
        // 導航到 theme（縮短 timeout）
        await page.goto(`/admin/${theme}`, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });
        
        // 等待基本內容加載
        await page.waitForTimeout(3000);
        
        // 檢查 widgets
        widgetCount = await page.locator('[data-testid*="widget"], [class*="widget"], [class*="card"], .grid > div').count();
        
        // 檢查頁面是否有實際內容
        const bodyText = await page.textContent('body');
        const hasContent = bodyText && bodyText.trim().length > 200;
        
        success = Boolean(hasContent) && performanceErrors.length === 0;
        
        console.log(`  ${success ? '✅' : '❌'} ${theme}: ${performanceErrors.length === 0 ? '無 performance 錯誤' : '有 performance 錯誤'}`);
        console.log(`     Widgets: ${widgetCount}, 其他錯誤: ${allErrors.length - performanceErrors.length}`);
        
      } catch (error) {
        console.log(`  ❌ ${theme}: 加載失敗 - ${(error as Error).message}`);
      }
      
      const loadTime = Date.now() - startTime;
      
      results.push({
        theme,
        success,
        performanceErrors,
        widgetCount,
        loadTime,
      });
    }
    
    // 生成結果摘要
    console.log('\n📊 測試結果摘要:');
    console.log('=================');
    
    const successfulThemes = results.filter(r => r.success);
    const themesWithPerfErrors = results.filter(r => r.performanceErrors.length > 0);
    const totalWidgets = results.reduce((sum, r) => sum + r.widgetCount, 0);
    
    console.log(`✅ 成功加載: ${successfulThemes.length}/${results.length} themes`);
    console.log(`⚠️  Performance 錯誤: ${themesWithPerfErrors.length}/${results.length} themes`);
    console.log(`📊 總 Widgets: ${totalWidgets}`);
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const perfStatus = result.performanceErrors.length > 0 ? '⚠️' : '✓';
      console.log(`${status} ${result.theme.padEnd(12)} | ${result.loadTime.toString().padStart(4)}ms | widgets: ${result.widgetCount.toString().padStart(2)} | perf: ${perfStatus}`);
    });
    
    // 關鍵斷言
    
    // 1. 最重要：沒有 performance monitor 錯誤
    const allPerfErrors = results.flatMap(r => r.performanceErrors);
    expect(allPerfErrors, `🚨 發現 Performance Monitor 錯誤: ${allPerfErrors.join(', ')}`).toHaveLength(0);
    
    // 2. 至少一個 theme 應該成功加載
    expect(successfulThemes.length, `❌ 沒有 theme 成功加載`).toBeGreaterThan(0);
    
    // 3. 至少應該有一些 widgets
    expect(totalWidgets, `❌ 沒有找到任何 widgets`).toBeGreaterThan(0);
    
    console.log('\n🎉 recordMetric 修復驗證完成！');
  });
  
  test('should verify specific performance monitor functionality', async ({ page, authenticatedPage }) => {
    console.log('\n🔍 專門測試 Performance Monitor 功能...');
    
    const performanceErrors: string[] = [];
    const performanceLogs: string[] = [];
    
    // 監聽所有 console 訊息
    page.on('console', msg => {
      const text = msg.text();
      
      if (msg.type() === 'error') {
        if (text.includes('performanceMonitor') || text.includes('recordMetric')) {
          performanceErrors.push(text);
        }
      } else if (msg.type() === 'log') {
        if (text.includes('PerformanceMonitor') || text.includes('recordMetrics')) {
          performanceLogs.push(text);
        }
      }
    });
    
    // 訪問 injection theme（最容易加載的）
    await page.goto('/admin/injection', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // 等待足夠時間讓 performance monitor 執行
    await page.waitForTimeout(5000);
    
    // 嘗試觸發更多的 performance monitoring
    try {
      // 點擊一些元素觸發互動
      const buttons = await page.locator('button:visible').count();
      if (buttons > 0) {
        await page.locator('button:visible').first().click({ timeout: 2000 });
        await page.waitForTimeout(1000);
      }
      
      // 滾動頁面
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(1000);
    } catch (e) {
      // 互動失敗不影響主要測試
      console.log('  ℹ️ 頁面互動部分失敗，但繼續測試');
    }
    
    console.log(`📋 Performance 錯誤數量: ${performanceErrors.length}`);
    console.log(`📋 Performance 日誌數量: ${performanceLogs.length}`);
    
    if (performanceErrors.length > 0) {
      console.log('❌ Performance 錯誤詳情:');
      performanceErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
    
    if (performanceLogs.length > 0) {
      console.log('ℹ️ Performance 日誌樣本:');
      performanceLogs.slice(0, 3).forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
    }
    
    // 關鍵斷言：沒有 performance monitor 錯誤
    expect(performanceErrors, `Performance Monitor 仍有錯誤: ${performanceErrors.join(', ')}`).toHaveLength(0);
    
    console.log('✅ Performance Monitor 功能測試通過！');
  });
});