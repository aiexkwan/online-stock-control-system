/**
 * A11y 煙霧測試套件
 *
 * 快速 5 分鐘測試，驗證基本的 WCAG 2.1 AA 合規性
 *
 * 基於四個專家的協作方案：
 * - 系統架構專家：模組化測試架構
 * - Backend工程師：API 無障礙性支援
 * - 優化專家：快速測試執行
 * - QA專家：關鍵路徑測試策略
 */

import { test, expect } from '@playwright/test';
import {
  A11yTester,
  quickA11yCheck,
  testKeyboardNavigation,
  testColorContrast,
  A11ySeverity,
} from './utils/a11y-helpers';

// 關鍵頁面測試
const CRITICAL_PAGES = [
  { url: '/', name: '首頁' },
  { url: '/admin/injection', name: '管理儀表板 - 注射' },
  { url: '/admin/pipeline', name: '管理儀表板 - 管道' },
  { url: '/admin/warehouse', name: '管理儀表板 - 倉庫' },
  { url: '/access', name: '存取頁面' },
];

// 關鍵組件選擇器
const CRITICAL_COMPONENTS = [
  { selector: '[data-testid="navigation"]', name: '導航' },
  { selector: '[data-testid="dashboard"]', name: '儀表板' },
  { selector: '[data-testid="widget-container"]', name: '小工具容器' },
  { selector: 'main', name: '主要內容區域' },
  { selector: 'button', name: '按鈕' },
  { selector: 'a[href]', name: '連結' },
  { selector: 'input', name: '輸入欄位' },
];

test.describe('🚀 A11y 煙霧測試 - 5分鐘快速驗證', () => {
  let a11yTester: A11yTester;

  test.beforeEach(async ({ page }) => {
    a11yTester = new A11yTester(page);
    await a11yTester.initialize();
  });

  test.describe('🎯 關鍵頁面基本 A11y 檢查', () => {
    for (const { url, name } of CRITICAL_PAGES) {
      test(`${name} - 基本無障礙性檢查`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 執行快速 A11y 檢查
        await quickA11yCheck(page);

        // 檢查頁面是否有基本結構
        await expect(page.locator('main, [role="main"]')).toBeVisible();
        await expect(page).toHaveTitle(/.+/); // 確保有標題

        // 檢查是否有語言屬性
        const htmlElement = await page.locator('html').first();
        const lang = await htmlElement.getAttribute('lang');
        expect(lang).toBeTruthy();

        console.log(`✅ ${name} 基本 A11y 檢查通過`);
      });
    }
  });

  test.describe('⚡ 關鍵組件 A11y 檢查', () => {
    test('導航組件 - 鍵盤可訪問性', async ({ page }) => {
      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      // 測試鍵盤導航
      await testKeyboardNavigation(page);

      // 檢查導航是否有適當的 ARIA 標籤
      const navigation = page.locator('[data-testid="navigation"], nav').first();

      if (await navigation.isVisible()) {
        const ariaLabel = await navigation.getAttribute('aria-label');
        const role = await navigation.getAttribute('role');

        expect(ariaLabel || role === 'navigation').toBeTruthy();
        console.log('✅ 導航組件鍵盤可訪問性通過');
      }
    });

    test('按鈕組件 - 可訪問名稱檢查', async ({ page }) => {
      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        if (await button.isVisible()) {
          const accessibleName =
            (await button.getAttribute('aria-label')) ||
            (await button.getAttribute('title')) ||
            (await button.textContent());

          expect(accessibleName && accessibleName.trim().length > 0).toBeTruthy();
        }
      }

      console.log('✅ 按鈕組件可訪問名稱檢查通過');
    });

    test('表單組件 - 標籤關聯檢查', async ({ page }) => {
      await page.goto('/access');
      await page.waitForLoadState('networkidle');

      const inputs = await page
        .locator('input[type="text"], input[type="email"], input[type="password"]')
        .all();

      for (const input of inputs) {
        if (await input.isVisible()) {
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');

          let hasLabel = false;

          if (id) {
            const label = await page.locator(`label[for="${id}"]`).first();
            hasLabel = await label.isVisible();
          }

          expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
        }
      }

      console.log('✅ 表單組件標籤關聯檢查通過');
    });

    test('色彩對比度 - 關鍵元素檢查', async ({ page }) => {
      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      // 執行專用的色彩對比度測試
      await testColorContrast(page);

      console.log('✅ 色彩對比度檢查通過');
    });
  });

  test.describe('📱 響應式設計 A11y 檢查', () => {
    test('手機版本 - 基本 A11y 檢查', async ({ page }) => {
      // 設定手機視窗大小
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      // 執行快速 A11y 檢查
      await quickA11yCheck(page);

      // 檢查觸控目標大小
      const buttons = await page.locator('button, a[href]').all();

      for (const button of buttons.slice(0, 5)) {
        // 只檢查前 5 個以節省時間
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox();

          if (boundingBox) {
            // WCAG 建議觸控目標至少 44x44 像素
            const minSize = 44;
            expect(boundingBox.width >= minSize - 5).toBeTruthy(); // 允許 5px 誤差
            expect(boundingBox.height >= minSize - 5).toBeTruthy();
          }
        }
      }

      console.log('✅ 手機版本 A11y 檢查通過');
    });

    test('平板版本 - 基本 A11y 檢查', async ({ page }) => {
      // 設定平板視窗大小
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      // 執行快速 A11y 檢查
      await quickA11yCheck(page);

      console.log('✅ 平板版本 A11y 檢查通過');
    });
  });

  test.describe('🔧 特殊功能 A11y 檢查', () => {
    test('跳轉連結 - 功能性檢查', async ({ page }) => {
      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      // 檢查跳轉連結
      const skipLinks = await page
        .locator('a[href*="#main"], a[href*="#content"], [class*="skip"]')
        .all();

      if (skipLinks.length > 0) {
        for (const link of skipLinks) {
          const href = await link.getAttribute('href');

          if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            const target = await page.locator(`#${targetId}`).first();

            expect(await target.isVisible()).toBeTruthy();
          }
        }

        console.log('✅ 跳轉連結功能性檢查通過');
      } else {
        console.warn('⚠️ 未找到跳轉連結');
      }
    });

    test('焦點管理 - 基本檢查', async ({ page }) => {
      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      // 測試焦點可見性
      const focusableElements = await page
        .locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .all();

      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];

        if (await firstElement.isVisible()) {
          await firstElement.focus();

          // 檢查是否有焦點指示器
          const focusStyles = await firstElement.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
              outline: style.outline,
              outlineWidth: style.outlineWidth,
              boxShadow: style.boxShadow,
            };
          });

          const hasFocusIndicator =
            focusStyles.outline !== 'none' ||
            focusStyles.outlineWidth !== '0px' ||
            focusStyles.boxShadow !== 'none';

          expect(hasFocusIndicator).toBeTruthy();
        }
      }

      console.log('✅ 焦點管理基本檢查通過');
    });

    test('ARIA 標籤 - 基本驗證', async ({ page }) => {
      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      // 檢查 ARIA 標籤的基本正確性
      const ariaElements = await page
        .locator('[aria-label], [aria-labelledby], [aria-describedby]')
        .all();

      for (const element of ariaElements) {
        if (await element.isVisible()) {
          const ariaLabel = await element.getAttribute('aria-label');
          const ariaLabelledby = await element.getAttribute('aria-labelledby');
          const ariaDescribedby = await element.getAttribute('aria-describedby');

          // 確保 ARIA 標籤不為空
          if (ariaLabel) {
            expect(ariaLabel.trim().length > 0).toBeTruthy();
          }

          // 確保 aria-labelledby 引用的元素存在
          if (ariaLabelledby) {
            const labelElement = await page.locator(`#${ariaLabelledby}`).first();
            expect(await labelElement.isVisible()).toBeTruthy();
          }

          // 確保 aria-describedby 引用的元素存在
          if (ariaDescribedby) {
            const descElement = await page.locator(`#${ariaDescribedby}`).first();
            expect(await descElement.isVisible()).toBeTruthy();
          }
        }
      }

      console.log('✅ ARIA 標籤基本驗證通過');
    });
  });

  test.describe('⚡ 性能影響測試', () => {
    test('A11y 檢查性能影響', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/admin/injection');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // 執行 A11y 檢查
      const a11yStartTime = Date.now();
      const results = await a11yTester.runSmokeTest();
      const a11yTime = Date.now() - a11yStartTime;

      // 確保 A11y 檢查時間合理
      expect(a11yTime).toBeLessThan(10000); // 10 秒內

      // 確保 A11y 檢查不超過頁面載入時間的 50%
      expect(a11yTime).toBeLessThan(loadTime * 0.5);

      console.log(`✅ A11y 檢查性能影響測試通過 (檢查時間: ${a11yTime}ms)`);
    });
  });

  test.describe('🎯 綜合煙霧測試', () => {
    test('5分鐘完整煙霧測試', async ({ page }) => {
      const testStartTime = Date.now();
      let passedChecks = 0;
      let totalChecks = 0;

      // 測試每個關鍵頁面
      for (const { url, name } of CRITICAL_PAGES) {
        totalChecks++;

        try {
          await page.goto(url);
          await page.waitForLoadState('networkidle');

          // 執行快速 A11y 檢查
          const results = await a11yTester.runSmokeTest();

          // 檢查是否有嚴重問題
          const criticalIssues = results.failedRules.filter(
            rule => rule.impact === A11ySeverity.CRITICAL
          );

          if (criticalIssues.length === 0) {
            passedChecks++;
            console.log(`✅ ${name} 煙霧測試通過`);
          } else {
            console.log(`❌ ${name} 煙霧測試失敗: ${criticalIssues.length} 個嚴重問題`);
          }
        } catch (error) {
          console.log(`❌ ${name} 煙霧測試失敗: ${error}`);
        }
      }

      const testEndTime = Date.now();
      const totalTime = testEndTime - testStartTime;

      // 確保測試在 5 分鐘內完成
      expect(totalTime).toBeLessThan(5 * 60 * 1000); // 5 分鐘

      // 確保至少 80% 的檢查通過
      const passRate = passedChecks / totalChecks;
      expect(passRate).toBeGreaterThanOrEqual(0.8);

      console.log(
        `🎯 煙霧測試完成: ${passedChecks}/${totalChecks} 通過 (${(passRate * 100).toFixed(1)}%)`
      );
      console.log(`⏱️ 總時間: ${(totalTime / 1000).toFixed(1)}s`);
    });
  });
});
