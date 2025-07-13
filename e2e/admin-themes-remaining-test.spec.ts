/**
 * Admin Themes 剩餘主題測試
 * 測試剩餘的 5 個 admin themes
 * - upload
 * - update  
 * - stock-management
 * - system
 * - analysis
 */

import { test, expect } from './fixtures/auth.fixture';

const REMAINING_THEMES = [
  'upload',           // 上傳主題
  'update',           // 更新主題
  'stock-management', // 庫存管理主題
  'system',           // 系統主題
  'analysis',         // 分析主題
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
  specificFeatures: string[];
}

test.describe('Admin Themes Remaining Test', () => {
  
  test('should test all remaining admin themes comprehensively', async ({ page, authenticatedPage }) => {
    console.log(`🚀 開始測試剩餘的 ${REMAINING_THEMES.length} 個 admin themes...`);
    
    const results: ThemeTestResult[] = [];
    
    // 設置全局錯誤監聽
    const globalErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        globalErrors.push(`[${msg.location().url}] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      globalErrors.push(`[PageError] ${error.message}`);
    });
    
    for (const theme of REMAINING_THEMES) {
      console.log(`\n🧪 測試 ${theme} theme...`);
      
      const startTime = Date.now();
      const themeErrors: string[] = [];
      const performanceErrors: string[] = [];
      const specificFeatures: string[] = [];
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
            if (errorText.includes('recordMetric') || 
                errorText.includes('performanceMonitor') ||
                errorText.includes('_lib_widgets_performance_monitor')) {
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
        
        // 導航到 theme 頁面（使用較寬鬆的等待條件）
        const response = await page.goto(`/admin/${theme}`, { 
          waitUntil: 'domcontentloaded', 
          timeout: 25000 
        });
        
        responseCode = response?.status() || 0;
        
        // 等待頁面基本加載
        await page.waitForTimeout(4000);
        
        // 檢查頁面內容
        const bodyText = await page.textContent('body');
        hasContent = bodyText ? bodyText.trim().length > 150 : false;
        
        // 計算 widgets 和特殊元素
        try {
          const widgetElements = await page.locator([
            '[data-testid*="widget"]',
            '[class*="widget"]', 
            '[class*="card"]',
            '.grid > div',
            '[class*="dashboard"]',
            '[data-widget-id]'
          ].join(', ')).count();
          widgetCount = widgetElements;
        } catch (e) {
          // 如果無法計算 widgets，不影響主要測試
        }
        
        // 檢查 theme 特定功能
        await detectThemeSpecificFeatures(page, theme, specificFeatures);
        
        // 檢查基本頁面元素
        const hasNavigation = await page.locator('nav, [role="navigation"]').count() > 0;
        const hasMainContent = await page.locator('main, .main-content, [role="main"], .container').count() > 0;
        const hasButtons = await page.locator('button').count() > 0;
        
        // 判斷成功標準（較寬鬆）
        success = responseCode === 200 && 
                 hasContent && 
                 performanceErrors.length === 0 &&
                 (hasNavigation || hasMainContent || hasButtons || widgetCount > 0);
        
        // 移除此 theme 的錯誤監聽器
        page.off('console', errorHandler);
        themeErrors.push(...themeSpecificErrors);
        
        const loadTime = Date.now() - startTime;
        
        console.log(`  ${success ? '✅' : '❌'} ${theme}: ${success ? '成功' : '失敗'} (${loadTime}ms)`);
        console.log(`     狀態碼: ${responseCode}, Widgets: ${widgetCount}, 內容: ${hasContent ? '有' : '無'}`);
        console.log(`     特殊功能: ${specificFeatures.length} 個`);
        
        if (performanceErrors.length > 0) {
          console.log(`     ⚠️  Performance 錯誤: ${performanceErrors.length} 個`);
          performanceErrors.forEach(err => console.log(`        - ${err}`));
        }
        
        if (themeErrors.length > 0) {
          console.log(`     🐛 其他錯誤: ${themeErrors.length} 個`);
        }
        
      } catch (error) {
        const loadTime = Date.now() - startTime;
        themeErrors.push(`Navigation failed: ${error.message}`);
        console.log(`  ❌ ${theme}: 失敗 (${loadTime}ms) - ${error.message}`);
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
        specificFeatures,
      });
    }
    
    // 生成詳細測試報告
    console.log('\n📊 剩餘 Themes 測試結果總結:');
    console.log('===============================');
    
    const successfulThemes = results.filter(r => r.success);
    const failedThemes = results.filter(r => !r.success);
    const themesWithPerformanceErrors = results.filter(r => r.performanceErrors.length > 0);
    const totalWidgets = results.reduce((sum, r) => sum + r.widgetCount, 0);
    const totalFeatures = results.reduce((sum, r) => sum + r.specificFeatures.length, 0);
    
    console.log(`✅ 成功: ${successfulThemes.length}/${results.length} themes`);
    console.log(`❌ 失敗: ${failedThemes.length}/${results.length} themes`);
    console.log(`⚠️  Performance 錯誤: ${themesWithPerformanceErrors.length}/${results.length} themes`);
    console.log(`📊 總 Widgets: ${totalWidgets}`);
    console.log(`🔧 總特殊功能: ${totalFeatures}`);
    
    // 詳細結果表格
    console.log('\n📋 詳細結果:');
    console.log('Theme'.padEnd(17) + '| Status | Time   | Widgets | Features | Perf');
    console.log(''.padEnd(70, '-'));
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const perfStatus = result.performanceErrors.length > 0 ? '⚠️ ' : '✓ ';
      const line = `${result.theme.padEnd(16)} | ${status}    | ${result.loadTime.toString().padStart(4)}ms | ${result.widgetCount.toString().padStart(7)} | ${result.specificFeatures.length.toString().padStart(8)} | ${perfStatus}`;
      console.log(line);
    });
    
    // 特殊功能詳情
    console.log('\n🔧 Theme 特殊功能詳情:');
    results.forEach(result => {
      if (result.specificFeatures.length > 0) {
        console.log(`  ${result.theme}: ${result.specificFeatures.join(', ')}`);
      }
    });
    
    // 關鍵測試斷言
    
    // 1. 最重要：沒有任何 performance monitor 錯誤
    const allPerformanceErrors = results.flatMap(r => r.performanceErrors);
    expect(allPerformanceErrors, `🚨 發現 Performance Monitor 錯誤: ${allPerformanceErrors.join(', ')}`).toHaveLength(0);
    
    // 2. 至少 3/5 themes 應該成功加載
    expect(successfulThemes.length, `❌ 成功的 themes 太少: ${successfulThemes.length}/5`).toBeGreaterThanOrEqual(3);
    
    // 3. 所有 themes 都應該返回 200 狀態碼
    const badResponseCodes = results.filter(r => r.responseCode !== 200);
    expect(badResponseCodes.length, `❌ 有 themes 返回非 200 狀態碼: ${badResponseCodes.map(r => `${r.theme}:${r.responseCode}`).join(', ')}`).toBe(0);
    
    // 4. 至少應該檢測到一些功能
    expect(totalFeatures, `❌ 沒有檢測到任何特殊功能`).toBeGreaterThan(0);
    
    console.log('\n🎉 剩餘 Admin Themes 測試完成！');
  });
  
  test('should test theme-specific functionality deep dive', async ({ page, authenticatedPage }) => {
    console.log('\n🔬 深度測試各 theme 特有功能...');
    
    // 針對每個 theme 進行特定功能測試
    for (const theme of REMAINING_THEMES) {
      console.log(`\n🎯 深度測試 ${theme} theme 特有功能...`);
      
      const performanceErrors: string[] = [];
      const functionalErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const errorText = msg.text();
          if (errorText.includes('recordMetric') || errorText.includes('performanceMonitor')) {
            performanceErrors.push(errorText);
          } else {
            functionalErrors.push(errorText);
          }
        }
      });
      
      try {
        // 導航到 theme
        await page.goto(`/admin/${theme}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(3000);
        
        // 執行 theme 特定的深度測試
        await performDeepThemeTest(page, theme);
        
        console.log(`  ✅ ${theme} 深度測試完成`);
        console.log(`     Performance 錯誤: ${performanceErrors.length}`);
        console.log(`     功能錯誤: ${functionalErrors.length}`);
        
        // 確保沒有 performance monitor 錯誤
        expect(performanceErrors, `${theme} 有 performance monitor 錯誤: ${performanceErrors.join(', ')}`).toHaveLength(0);
        
      } catch (error) {
        console.log(`  ⚠️  ${theme} 深度測試部分失敗: ${error.message}`);
        
        // 仍然檢查沒有 performance 錯誤
        expect(performanceErrors, `${theme} 有 performance monitor 錯誤: ${performanceErrors.join(', ')}`).toHaveLength(0);
      }
    }
    
    console.log('\n✅ 所有 theme 深度測試完成！');
  });
});

// 檢測 theme 特定功能的輔助函數
async function detectThemeSpecificFeatures(page: any, theme: string, features: string[]) {
  try {
    switch (theme) {
      case 'upload':
        // 檢查上傳相關功能
        if (await page.locator('input[type="file"]').count() > 0) features.push('文件上傳');
        if (await page.locator('[class*="upload"], [data-testid*="upload"]').count() > 0) features.push('上傳組件');
        if (await page.locator('button:has-text("Upload"), button:has-text("上傳")').count() > 0) features.push('上傳按鈕');
        break;
        
      case 'update':
        // 檢查更新相關功能
        if (await page.locator('button:has-text("Update"), button:has-text("更新")').count() > 0) features.push('更新按鈕');
        if (await page.locator('[class*="update"], [data-testid*="update"]').count() > 0) features.push('更新組件');
        if (await page.locator('form').count() > 0) features.push('表單');
        break;
        
      case 'stock-management':
        // 檢查庫存管理功能
        if (await page.locator('[class*="stock"], [data-testid*="stock"]').count() > 0) features.push('庫存組件');
        if (await page.locator('table, .table').count() > 0) features.push('數據表格');
        if (await page.locator('[class*="inventory"]').count() > 0) features.push('庫存管理');
        break;
        
      case 'system':
        // 檢查系統相關功能
        if (await page.locator('[class*="config"], [class*="setting"]').count() > 0) features.push('系統設置');
        if (await page.locator('[class*="admin"], [class*="management"]').count() > 0) features.push('管理功能');
        if (await page.locator('button:has-text("Configure"), button:has-text("設置")').count() > 0) features.push('配置按鈕');
        break;
        
      case 'analysis':
        // 檢查分析相關功能
        if (await page.locator('canvas, svg').count() > 0) features.push('圖表分析');
        if (await page.locator('[class*="chart"], [class*="graph"]').count() > 0) features.push('圖表組件');
        if (await page.locator('[class*="analysis"], [class*="report"]').count() > 0) features.push('分析報告');
        break;
    }
    
    // 通用功能檢測
    if (await page.locator('button').count() > 0) features.push('交互按鈕');
    if (await page.locator('.grid, [class*="grid"]').count() > 0) features.push('網格佈局');
    if (await page.locator('[class*="card"]').count() > 0) features.push('卡片組件');
    
  } catch (e) {
    // 功能檢測失敗不影響主要測試
  }
}

// 執行深度 theme 測試的輔助函數
async function performDeepThemeTest(page: any, theme: string) {
  try {
    // 基本互動測試
    const buttons = await page.locator('button:visible').count();
    if (buttons > 0) {
      await page.locator('button:visible').first().click({ timeout: 3000 });
      await page.waitForTimeout(1000);
    }
    
    // 滾動測試
    await page.evaluate(() => {
      window.scrollTo(0, 300);
    });
    await page.waitForTimeout(1000);
    
    // Theme 特定的深度測試
    switch (theme) {
      case 'upload':
        // 嘗試測試文件輸入（如果存在）
        const fileInputs = await page.locator('input[type="file"]').count();
        if (fileInputs > 0) {
          console.log(`    📁 發現 ${fileInputs} 個文件上傳輸入`);
        }
        break;
        
      case 'stock-management':
        // 嘗試測試表格互動（如果存在）
        const tables = await page.locator('table').count();
        if (tables > 0) {
          console.log(`    📊 發現 ${tables} 個數據表格`);
        }
        break;
        
      case 'analysis':
        // 檢查圖表元素
        const charts = await page.locator('canvas, svg').count();
        if (charts > 0) {
          console.log(`    📈 發現 ${charts} 個圖表元素`);
        }
        break;
    }
    
  } catch (e) {
    // 深度測試失敗不影響主要測試
  }
}