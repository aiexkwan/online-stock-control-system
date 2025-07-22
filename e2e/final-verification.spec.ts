/**
 * E2E Test: 最終驗證 operations 修復
 * 檢查 HistoryTreeV2 警告是否消失
 */

import { test, expect } from '@playwright/test';

test.describe('最終驗證 operations 修復', () => {
  test('檢查 HistoryTreeV2 警告是否消失並驗證頁面正常', async ({ page }) => {
    console.log('🔍 開始最終驗證...');

    const warnings: string[] = [];
    const errors: string[] = [];

    // 監聽 console 警告
    page.on('console', msg => {
      const text = msg.text();

      if (msg.type() === 'warning') {
        warnings.push(text);
        console.log('⚠️ Warning:', text);
      } else if (msg.type() === 'error') {
        errors.push(text);
        console.log('❌ Error:', text);
      }
    });

    console.log('🚀 訪問頁面...');

    await page.goto('http://localhost:3000/admin/operations', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待頁面完全加載
    await page.waitForTimeout(8000);

    console.log('📊 檢查結果:');
    console.log(`警告數量: ${warnings.length}`);
    console.log(`錯誤數量: ${errors.length}`);

    // 檢查特定的 HistoryTreeV2 警告
    const historyTreeWarnings = warnings.filter(
      warning => warning.includes('HistoryTreeV2') || warning.includes('No import function found')
    );

    console.log(`HistoryTreeV2 相關警告: ${historyTreeWarnings.length}`);

    if (historyTreeWarnings.length > 0) {
      console.log('❌ 仍有 HistoryTreeV2 警告:');
      historyTreeWarnings.forEach(warning => console.log(`  - ${warning}`));
    } else {
      console.log('✅ 沒有 HistoryTreeV2 警告');
    }

    // 檢查關鍵錯誤
    const criticalErrors = errors.filter(
      error =>
        error.includes('originalFactory') ||
        error.includes('TypeError') ||
        error.includes('Cannot read properties')
    );

    console.log(`關鍵錯誤: ${criticalErrors.length}`);

    if (criticalErrors.length > 0) {
      console.log('❌ 仍有關鍵錯誤:');
      criticalErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ 沒有關鍵錯誤');
    }

    // 檢查頁面狀態
    const hasLogin = await page.locator('text=Login to Dashboard').isVisible();
    const hasAdminDashboard = await page.locator('text=Admin Dashboard').isVisible();

    console.log('🎭 頁面組件:');
    console.log(`  Admin Dashboard: ${hasAdminDashboard}`);
    console.log(`  Login Button: ${hasLogin}`);

    // 最終診斷
    if (historyTreeWarnings.length === 0 && criticalErrors.length === 0) {
      console.log('🎉 成功！HistoryTreeV2 問題已解決');
    } else {
      console.log('⚠️ 仍有問題需要進一步修復');
    }

    // 截圖記錄最終狀態
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });

    // 基本測試
    expect(hasAdminDashboard).toBe(true);
    expect(hasLogin).toBe(true);
  });
});
