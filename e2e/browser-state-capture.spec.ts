/**
 * E2E Test: 瀏覽器狀態完整捕獲
 * 模擬真實用戶體驗並捕捉所有可能的渲染問題
 */

import { test, expect } from '@playwright/test';

test.describe('瀏覽器狀態完整捕獲', () => {
  test('完整模擬用戶瀏覽器狀態並診斷渲染問題', async ({ page }) => {
    console.log('🔍 開始完整瀏覽器狀態診斷...');

    // 收集所有信息
    const diagnosticInfo: any = {
      errors: [],
      warnings: [],
      logs: [],
      networkRequests: [],
      failedRequests: [],
      domState: {},
      renderingInfo: {},
      authState: {},
      reactState: {},
      timing: {},
    };

    const startTime = Date.now();

    // 監聽所有事件
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      if (type === 'error') {
        diagnosticInfo.errors.push(text);
        console.log(`❌ [${type}] ${text}`);
      } else if (type === 'warn') {
        diagnosticInfo.warnings.push(text);
        console.log(`⚠️ [${type}] ${text}`);
      } else if (type === 'log') {
        diagnosticInfo.logs.push(text);
        console.log(`📝 [${type}] ${text}`);
      }
    });

    // 監聽網路請求
    page.on('request', request => {
      diagnosticInfo.networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
      });
    });

    page.on('response', response => {
      if (!response.ok()) {
        const failedReq = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        };
        diagnosticInfo.failedRequests.push(failedReq);
        console.log(`🌐 Failed: ${response.status()} ${response.url()}`);
      }
    });

    // 監聽頁面錯誤
    page.on('pageerror', error => {
      diagnosticInfo.errors.push(`Page Error: ${error.message}`);
      console.log(`💥 Page Error: ${error.message}`);
    });

    console.log('🚀 訪問頁面...');

    // 使用和用戶完全相同的方式訪問頁面
    await page.goto('http://localhost:3000/admin/operations-monitoring', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    diagnosticInfo.timing.pageLoad = Date.now() - startTime;
    console.log(`⏱️ 頁面加載時間: ${diagnosticInfo.timing.pageLoad}ms`);

    // 等待額外時間確保所有異步內容加載
    await page.waitForTimeout(5000);

    // 截圖保存當前狀態
    await page.screenshot({ path: 'test-results/current-page-state.png', fullPage: true });
    console.log('📸 已保存頁面截圖');

    // 詳細分析 DOM 狀態
    diagnosticInfo.domState = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      // 檢查所有可能影響渲染的因素
      const computedBodyStyle = window.getComputedStyle(body);
      const computedHtmlStyle = window.getComputedStyle(html);

      // 查找所有 React 相關元素
      const reactElements = document.querySelectorAll('[data-reactroot], #__next');

      // 查找所有隱藏元素
      const hiddenElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0' ||
          style.height === '0px' ||
          style.width === '0px'
        );
      });

      // 查找所有可見元素
      const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width > 0 &&
          rect.height > 0 &&
          el.textContent &&
          el.textContent.trim().length > 0
        );
      });

      return {
        title: document.title,
        url: window.location.href,
        bodyText: body.textContent?.substring(0, 500) || '',
        bodyHTML: body.innerHTML.substring(0, 1000),
        bodyStyles: {
          display: computedBodyStyle.display,
          visibility: computedBodyStyle.visibility,
          opacity: computedBodyStyle.opacity,
          backgroundColor: computedBodyStyle.backgroundColor,
          color: computedBodyStyle.color,
          overflow: computedBodyStyle.overflow,
        },
        htmlStyles: {
          display: computedHtmlStyle.display,
          visibility: computedHtmlStyle.visibility,
          opacity: computedHtmlStyle.opacity,
          backgroundColor: computedHtmlStyle.backgroundColor,
        },
        elementCounts: {
          total: document.querySelectorAll('*').length,
          react: reactElements.length,
          hidden: hiddenElements.length,
          visible: visibleElements.length,
          withText:
            document.querySelectorAll('*').length -
            Array.from(document.querySelectorAll('*')).filter(el => !el.textContent?.trim()).length,
        },
        reactElements: Array.from(reactElements).map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          hasContent: !!el.textContent?.trim(),
        })),
        visibleContent: visibleElements.slice(0, 10).map(el => ({
          tagName: el.tagName,
          textContent: el.textContent?.substring(0, 100),
          className: el.className,
          id: el.id,
        })),
      };
    });

    // 檢查 React/Next.js 狀態
    diagnosticInfo.reactState = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasNextJS: typeof window.__NEXT_DATA__ !== 'undefined',
        nextData: window.__NEXT_DATA__
          ? {
              page: window.__NEXT_DATA__.page,
              query: window.__NEXT_DATA__.query,
              buildId: window.__NEXT_DATA__.buildId,
              isFallback: window.__NEXT_DATA__.isFallback,
            }
          : null,
        reactVersion: window.React?.version || null,
        hasReactDevTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
      };
    });

    // 檢查認證狀態
    diagnosticInfo.authState = await page.evaluate(() => {
      try {
        const authKeys = Object.keys(localStorage).filter(
          key => key.includes('auth') || key.includes('supabase') || key.includes('session')
        );

        return {
          hasAuthData: authKeys.length > 0,
          authKeys: authKeys,
          cookieCount: document.cookie.split(';').length,
          hasSupabaseClient: typeof window.supabase !== 'undefined',
        };
      } catch (error) {
        return { error: 'Cannot access auth state' };
      }
    });

    // 檢查特定組件是否存在
    const componentChecks = {
      adminDashboard: await page
        .locator('text=Admin Dashboard')
        .isVisible()
        .catch(() => false),
      loginButton: await page
        .locator('text=Login')
        .isVisible()
        .catch(() => false),
      loading: await page
        .locator('text=Loading')
        .isVisible()
        .catch(() => false),
      authenticating: await page
        .locator('text=Authenticating')
        .isVisible()
        .catch(() => false),
      anyText: await page
        .locator('text=/\\w+/')
        .first()
        .isVisible()
        .catch(() => false),
      anyButton: await page
        .locator('button')
        .first()
        .isVisible()
        .catch(() => false),
      newAdminDashboard: await page
        .locator('[data-testid="new-admin-dashboard"]')
        .isVisible()
        .catch(() => false),
    };

    diagnosticInfo.componentChecks = componentChecks;

    // 最終診斷報告
    console.log('\n🔬 完整診斷報告:');
    console.log('===================');
    console.log(`📍 URL: ${diagnosticInfo.domState.url}`);
    console.log(`📄 標題: ${diagnosticInfo.domState.title}`);
    console.log(`⏱️ 加載時間: ${diagnosticInfo.timing.pageLoad}ms`);
    console.log(`📊 總元素: ${diagnosticInfo.domState.elementCounts.total}`);
    console.log(`👁️ 可見元素: ${diagnosticInfo.domState.elementCounts.visible}`);
    console.log(`🙈 隱藏元素: ${diagnosticInfo.domState.elementCounts.hidden}`);
    console.log(`⚛️ React 元素: ${diagnosticInfo.domState.elementCounts.react}`);
    console.log(`📝 錯誤數量: ${diagnosticInfo.errors.length}`);
    console.log(`⚠️ 警告數量: ${diagnosticInfo.warnings.length}`);
    console.log(`🌐 失敗請求: ${diagnosticInfo.failedRequests.length}`);

    console.log('\n🎭 組件檢查:');
    Object.entries(componentChecks).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n⚛️ React/Next.js 狀態:');
    console.log(`  React: ${diagnosticInfo.reactState.hasReact}`);
    console.log(`  Next.js: ${diagnosticInfo.reactState.hasNextJS}`);
    console.log(`  Next.js Page: ${diagnosticInfo.reactState.nextData?.page || 'N/A'}`);

    console.log('\n🔐 認證狀態:');
    console.log(`  Auth Data: ${diagnosticInfo.authState.hasAuthData}`);
    console.log(`  Auth Keys: ${diagnosticInfo.authState.authKeys?.length || 0}`);

    console.log('\n🎨 Body 樣式:');
    console.log(`  Display: ${diagnosticInfo.domState.bodyStyles.display}`);
    console.log(`  Visibility: ${diagnosticInfo.domState.bodyStyles.visibility}`);
    console.log(`  Opacity: ${diagnosticInfo.domState.bodyStyles.opacity}`);
    console.log(`  Background: ${diagnosticInfo.domState.bodyStyles.backgroundColor}`);

    if (diagnosticInfo.domState.elementCounts.visible < 5) {
      console.log('\n🚨 診斷: 頁面可見元素極少，可能的原因:');

      if (diagnosticInfo.errors.length > 0) {
        console.log('  1. JavaScript 錯誤阻止渲染');
        diagnosticInfo.errors.forEach(error => console.log(`     - ${error}`));
      }

      if (!diagnosticInfo.reactState.hasReact) {
        console.log('  2. React 未正確載入');
      }

      if (!diagnosticInfo.reactState.hasNextJS) {
        console.log('  3. Next.js 未正確初始化');
      }

      if (
        diagnosticInfo.domState.bodyStyles.display === 'none' ||
        diagnosticInfo.domState.bodyStyles.visibility === 'hidden' ||
        diagnosticInfo.domState.bodyStyles.opacity === '0'
      ) {
        console.log('  4. CSS 樣式隱藏了內容');
      }

      if (diagnosticInfo.failedRequests.length > 0) {
        console.log('  5. 關鍵資源載入失敗');
        diagnosticInfo.failedRequests.forEach(req =>
          console.log(`     - ${req.status} ${req.url}`)
        );
      }
    }

    // 保存完整診斷數據
    await page.evaluate(data => {
      window.__DIAGNOSTIC_DATA__ = data;
    }, diagnosticInfo);

    console.log('\n📁 診斷數據已保存到 window.__DIAGNOSTIC_DATA__');

    // 基本測試 - 頁面應該至少有一些內容
    expect(diagnosticInfo.domState.title).toBeTruthy();
  });
});
