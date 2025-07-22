/**
 * E2E Test: Operations Monitoring 真實錯誤診斷
 * 直接執行並捕捉所有錯誤訊息
 */

import { test, expect } from '@playwright/test';

test.describe('Operations Monitoring 真實錯誤診斷', () => {
  test('捕捉所有錯誤訊息並分析空白頁面原因', async ({ page }) => {
    console.log('🔍 開始真實錯誤診斷...');

    // 收集所有錯誤
    const jsErrors: string[] = [];
    const networkErrors: string[] = [];
    const consoleMessages: string[] = [];

    // 監聽所有 console 訊息
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);

      if (msg.type() === 'error') {
        jsErrors.push(text);
        console.log('❌ JavaScript Error:', text);
      } else if (msg.type() === 'warn') {
        console.log('⚠️ Warning:', text);
      } else if (msg.type() === 'log' && text.includes('error')) {
        console.log('📝 Log with error:', text);
      }
    });

    // 監聽網路錯誤
    page.on('response', response => {
      if (!response.ok()) {
        const error = `HTTP ${response.status()}: ${response.url()}`;
        networkErrors.push(error);
        console.log('🌐 Network Error:', error);
      }
    });

    // 監聽頁面錯誤
    page.on('pageerror', error => {
      const errorMsg = error.message;
      jsErrors.push(errorMsg);
      console.log('💥 Page Error:', errorMsg);
    });

    console.log('🚀 正在訪問 operations-monitoring 頁面...');

    // 訪問頁面 - 檢查兩個可能的 port
    let finalUrl = '';
    try {
      await page.goto('http://localhost:3001/admin/operations-monitoring', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
      finalUrl = page.url();
      console.log('✅ 成功連接到 port 3001');
    } catch (error) {
      console.log('❌ Port 3001 失敗，嘗試 port 3000...');
      try {
        await page.goto('http://localhost:3000/admin/operations-monitoring', {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });
        finalUrl = page.url();
        console.log('✅ 成功連接到 port 3000');
      } catch (error2) {
        console.log('❌ 兩個 port 都無法連接:', error2);
        throw error2;
      }
    }

    console.log('📍 最終 URL:', finalUrl);

    // 等待頁面渲染
    await page.waitForTimeout(5000);

    // 檢查頁面內容
    const bodyText = await page.textContent('body');
    const bodyHTML = await page.innerHTML('body');
    const title = await page.title();

    console.log('📄 頁面標題:', title);
    console.log('📏 Body 文字長度:', bodyText?.length || 0);
    console.log('🏗️ Body HTML 長度:', bodyHTML?.length || 0);

    // 檢查是否有可見內容
    const visibleElements = await page.$$eval(
      '*',
      els =>
        els.filter(el => {
          const style = window.getComputedStyle(el);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            el.textContent?.trim().length > 0
          );
        }).length
    );

    console.log('👁️ 可見元素數量:', visibleElements);

    // 檢查特定組件
    const hasAdminDashboard = await page
      .locator('text=Admin Dashboard')
      .isVisible()
      .catch(() => false);
    const hasLogin = await page
      .locator('text=Login')
      .isVisible()
      .catch(() => false);
    const hasLoading = await page
      .locator('text=Loading')
      .isVisible()
      .catch(() => false);
    const hasAuthenticating = await page
      .locator('text=Authenticating')
      .isVisible()
      .catch(() => false);

    console.log('🔍 組件檢查:');
    console.log('  - Admin Dashboard:', hasAdminDashboard);
    console.log('  - Login:', hasLogin);
    console.log('  - Loading:', hasLoading);
    console.log('  - Authenticating:', hasAuthenticating);

    // 檢查 React 是否正常載入
    const hasReact = await page.evaluate(() => {
      return (
        typeof window.React !== 'undefined' ||
        document.querySelector('[data-reactroot]') !== null ||
        document.querySelector('#__next') !== null
      );
    });

    console.log('⚛️ React 載入狀態:', hasReact);

    // 檢查是否有 Next.js
    const hasNextJS = await page.evaluate(() => {
      return typeof window.__NEXT_DATA__ !== 'undefined';
    });

    console.log('🔗 Next.js 載入狀態:', hasNextJS);

    // 檢查認證狀態 (如果有 useAuth)
    const authState = await page.evaluate(() => {
      try {
        // 檢查是否有認證相關的全域變數或狀態
        return {
          hasSupabase: typeof window.supabase !== 'undefined',
          hasAuthUser: document.querySelector('[data-auth-user]') !== null,
          localStorage: Object.keys(localStorage).filter(key => key.includes('auth')),
        };
      } catch {
        return { error: 'Cannot access auth state' };
      }
    });

    console.log('🔐 認證狀態:', JSON.stringify(authState, null, 2));

    // 總結報告
    console.log('\n📊 診斷總結報告:');
    console.log('==================');
    console.log(`URL: ${finalUrl}`);
    console.log(`標題: ${title}`);
    console.log(`頁面內容長度: ${bodyText?.length || 0} 字符`);
    console.log(`可見元素: ${visibleElements} 個`);
    console.log(`JavaScript 錯誤: ${jsErrors.length} 個`);
    console.log(`網路錯誤: ${networkErrors.length} 個`);
    console.log(`Console 訊息: ${consoleMessages.length} 個`);

    if (jsErrors.length > 0) {
      console.log('\n❌ JavaScript 錯誤詳情:');
      jsErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 網路錯誤詳情:');
      networkErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (consoleMessages.length > 0) {
      console.log('\n📝 重要 Console 訊息:');
      consoleMessages.slice(-10).forEach((msg, index) => {
        // 只顯示最後 10 條
        console.log(`  ${msg}`);
      });
    }

    // 如果頁面是空白的，提供診斷建議
    if ((bodyText?.length || 0) < 100 && visibleElements < 5) {
      console.log('\n🚨 診斷: 頁面確實是空白的');
      console.log('可能原因:');

      if (jsErrors.length > 0) {
        console.log('  1. JavaScript 錯誤阻止渲染');
      }

      if (!hasReact) {
        console.log('  2. React 未正確載入');
      }

      if (!hasNextJS) {
        console.log('  3. Next.js 未正確初始化');
      }

      if (hasLoading || hasAuthenticating) {
        console.log('  4. 認證狀態檢查卡住');
      }

      if (networkErrors.length > 0) {
        console.log('  5. 關鍵資源載入失敗');
      }

      console.log('\n建議修復步驟:');
      console.log('  1. 檢查並修復 JavaScript 錯誤');
      console.log('  2. 驗證 useAuth hook 不會無限 loading');
      console.log('  3. 檢查 Supabase 客戶端初始化');
      console.log('  4. 確認 NewAdminDashboard 組件正確渲染');
    }

    // 最基本的測試 - 確保我們能連接到頁面
    expect(finalUrl).toContain('/admin/operations-monitoring');
  });
});
