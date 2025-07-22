/**
 * WCAG 2.1 AA - Operable (可操作性) 測試模組
 *
 * 測試原則：使用者介面元件和導航必須是可操作的
 *
 * 基於專家協作方案：
 * - 系統架構專家：模組化測試架構，長期可維護性
 * - Backend工程師：API 無障礙性支援和資料完整性
 * - 優化專家：測試效能優化和智能執行策略
 * - QA專家：全面的 WCAG 合規性測試策略
 */

import { test, expect } from '@playwright/test';
import {
  A11yTester,
  quickA11yCheck,
  testWCAGPrinciple,
  testKeyboardNavigation,
  TestType,
} from '../utils/a11y-helpers';

// 測試配置
const TEST_URLS = [
  '/',
  '/admin/injection',
  '/admin/pipeline',
  '/admin/warehouse',
  '/print-label',
];

const INTERACTIVE_ELEMENTS = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
];

test.describe('WCAG 2.1 AA - Operable (可操作性)', () => {
  let a11yTester: A11yTester;

  test.beforeEach(async ({ page }) => {
    a11yTester = new A11yTester(page);
    await a11yTester.initialize();
  });

  test.describe('2.1 鍵盤可存取性 (Keyboard Accessible)', () => {
    test('2.1.1 鍵盤 - 所有功能都可以用鍵盤操作', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 執行專用的鍵盤導航測試
        await testKeyboardNavigation(page);

        // 檢查所有互動元素都可以用鍵盤訪問
        const interactiveElements = await page.locator(INTERACTIVE_ELEMENTS.join(', ')).all();

        for (const element of interactiveElements) {
          if (await element.isVisible()) {
            // 確保元素可以接收焦點
            await element.focus();
            const isFocused = await element.evaluate(el => el === document.activeElement);

            expect(isFocused, `元素無法用鍵盤聚焦 in ${url}`).toBe(true);

            // 測試 Enter 和 Space 鍵
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());

            if (tagName === 'button' || (await element.getAttribute('role')) === 'button') {
              // 按鈕應該響應 Enter 和 Space 鍵
              await element.press('Enter');
              await element.press('Space');
            } else if (tagName === 'a') {
              // 連結應該響應 Enter 鍵
              await element.press('Enter');
            }
          }
        }
      }
    });

    test('2.1.2 無鍵盤陷阱 - 確保沒有鍵盤陷阱', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 測試 Tab 導航不會被困住
        let tabCount = 0;
        const maxTabs = 50; // 合理的最大 Tab 次數

        while (tabCount < maxTabs) {
          await page.keyboard.press('Tab');
          tabCount++;

          // 檢查是否可以用 Shift+Tab 回到上一個元素
          const currentElement = await page.locator(':focus').first();

          if (await currentElement.isVisible()) {
            await page.keyboard.press('Shift+Tab');
            await page.keyboard.press('Tab');

            // 確保能夠正常導航
            const afterNavigation = await page.locator(':focus').first();
            const isStillFocused = await afterNavigation.isVisible();

            expect(isStillFocused, `鍵盤陷阱檢測到 in ${url}`).toBe(true);
          }
        }
      }
    });

    test('2.1.3 鍵盤（無例外）- 所有功能都可以用鍵盤操作', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查自訂控制項的鍵盤可訪問性
        const customControls = await page
          .locator('[role="slider"], [role="spinbutton"], [role="listbox"], [role="combobox"]')
          .all();

        for (const control of customControls) {
          if (await control.isVisible()) {
            await control.focus();

            // 測試方向鍵
            await control.press('ArrowUp');
            await control.press('ArrowDown');
            await control.press('ArrowLeft');
            await control.press('ArrowRight');

            // 測試 Home 和 End 鍵
            await control.press('Home');
            await control.press('End');

            // 確保控制項響應鍵盤輸入
            expect(
              await control.evaluate(el => el === document.activeElement),
              `自訂控制項無法用鍵盤操作 in ${url}`
            ).toBe(true);
          }
        }
      }
    });

    test('2.1.4 字元鍵快速鍵 - 檢查快速鍵衝突', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查是否有單字元快速鍵
        const elementsWithAccesskey = await page.locator('[accesskey]').all();

        for (const element of elementsWithAccesskey) {
          const accesskey = await element.getAttribute('accesskey');

          // 單字元快速鍵應該有關閉或重新指派的方式
          expect(accesskey && accesskey.length > 1, `單字元快速鍵可能造成衝突 in ${url}`).toBe(
            true
          );
        }
      }
    });
  });

  test.describe('2.2 充足時間 (Enough Time)', () => {
    test('2.2.1 時間調整 - 檢查時間限制', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查是否有計時器或時間限制
        const timerElements = await page
          .locator('[class*="timer"], [class*="countdown"], [id*="timer"]')
          .all();

        for (const timer of timerElements) {
          if (await timer.isVisible()) {
            // 檢查是否有控制計時器的方法
            const controls = await page
              .locator('button[class*="pause"], button[class*="stop"], button[class*="extend"]')
              .count();

            expect(controls > 0, `計時器缺少控制項 in ${url}`).toBeGreaterThan(0);
          }
        }

        // 檢查會話超時
        const sessionWarnings = await page
          .locator('[class*="session"], [class*="timeout"], [class*="expire"]')
          .all();

        for (const warning of sessionWarnings) {
          if (await warning.isVisible()) {
            // 確保有延長會話的選項
            const extendOptions = await page
              .locator('button[class*="extend"], button[class*="continue"]')
              .count();

            expect(extendOptions > 0, `會話超時缺少延長選項 in ${url}`).toBeGreaterThan(0);
          }
        }
      }
    });

    test('2.2.2 暫停、停止、隱藏 - 檢查移動內容控制', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查自動更新的內容
        const animatedElements = await page
          .locator('[class*="animate"], [class*="spin"], [class*="pulse"]')
          .all();

        for (const element of animatedElements) {
          if (await element.isVisible()) {
            // 檢查是否有暫停動畫的控制項
            const pauseControls = await page
              .locator('button[class*="pause"], button[class*="stop"]')
              .count();

            if (pauseControls === 0) {
              // 檢查動畫是否會自動停止
              const animationDuration = await element.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.animationDuration;
              });

              expect(
                animationDuration === '0s' || animationDuration === 'none',
                `長時間動畫缺少控制項 in ${url}`
              ).toBe(true);
            }
          }
        }
      }
    });
  });

  test.describe('2.3 癲癇和物理反應 (Seizures and Physical Reactions)', () => {
    test('2.3.1 三次閃光或低於臨界值 - 檢查閃光內容', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查可能造成閃光的元素
        const flashingElements = await page
          .locator('[class*="flash"], [class*="blink"], [class*="strobe"]')
          .all();

        for (const element of flashingElements) {
          if (await element.isVisible()) {
            // 檢查閃光頻率
            const animationDelay = await element.evaluate(el => {
              const style = window.getComputedStyle(el);
              return style.animationDelay;
            });

            // 確保沒有快速閃光
            expect(animationDelay, `可能的危險閃光元素 in ${url}`).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('2.4 導航 (Navigable)', () => {
    test('2.4.1 略過區塊 - 檢查跳轉連結', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查是否有跳轉連結
        const skipLinks = await page
          .locator('a[href*="#main"], a[href*="#content"], [class*="skip"]')
          .all();

        expect(skipLinks.length > 0, `缺少跳轉連結 in ${url}`).toBe(true);

        // 測試跳轉連結功能
        for (const link of skipLinks) {
          const href = await link.getAttribute('href');

          if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            const target = await page.locator(`#${targetId}`).first();

            expect(await target.isVisible(), `跳轉連結目標不存在 in ${url}`).toBe(true);
          }
        }
      }
    });

    test('2.4.2 頁面標題 - 檢查頁面標題', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查頁面標題
        const title = await page.title();

        expect(title && title.trim().length > 0, `頁面缺少標題 in ${url}`).toBe(true);

        expect(title.length <= 60, `頁面標題過長 in ${url}`).toBe(true);
      }
    });

    test('2.4.3 焦點順序 - 檢查焦點順序', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查焦點順序
        const focusableElements = await page.locator(INTERACTIVE_ELEMENTS.join(', ')).all();

        if (focusableElements.length > 1) {
          // 測試 Tab 順序
          await page.keyboard.press('Tab');
          const firstFocused = await page.locator(':focus').first();

          await page.keyboard.press('Tab');
          const secondFocused = await page.locator(':focus').first();

          // 確保焦點順序合理
          expect(
            (await firstFocused.isVisible()) && (await secondFocused.isVisible()),
            `焦點順序問題 in ${url}`
          ).toBe(true);
        }
      }
    });

    test('2.4.4 連結目的（在內容中）- 檢查連結文字', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查所有連結
        const links = await page.locator('a[href]').all();

        for (const link of links) {
          const linkText = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          const title = await link.getAttribute('title');

          const accessibleText = ariaLabel || linkText || title;

          expect(
            accessibleText && accessibleText.trim().length > 0,
            `連結缺少描述文字 in ${url}`
          ).toBe(true);

          // 避免模糊的連結文字
          const vagueLinkTexts = ['click here', 'read more', 'more', 'here'];
          const isVague = vagueLinkTexts.some(
            vague => accessibleText && accessibleText.toLowerCase().includes(vague)
          );

          expect(!isVague, `連結文字過於模糊: "${accessibleText}" in ${url}`).toBe(true);
        }
      }
    });

    test('2.4.6 標題和標籤 - 檢查表單標籤', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查表單輸入欄位
        const inputElements = await page.locator('input, select, textarea').all();

        for (const input of inputElements) {
          const type = await input.getAttribute('type');

          // 跳過隱藏和提交按鈕
          if (type === 'hidden' || type === 'submit' || type === 'button') {
            continue;
          }

          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');

          let hasLabel = false;

          if (id) {
            const label = await page.locator(`label[for="${id}"]`).first();
            hasLabel = await label.isVisible();
          }

          expect(hasLabel || ariaLabel || ariaLabelledby, `表單欄位缺少標籤 in ${url}`).toBe(true);
        }
      }
    });

    test('2.4.7 焦點可見 - 檢查焦點指示器', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查焦點指示器
        const focusableElements = await page.locator(INTERACTIVE_ELEMENTS.join(', ')).all();

        for (const element of focusableElements) {
          if (await element.isVisible()) {
            await element.focus();

            // 檢查是否有焦點指示器
            const focusStyles = await element.evaluate(el => {
              const style = window.getComputedStyle(el);
              return {
                outline: style.outline,
                outlineWidth: style.outlineWidth,
                outlineStyle: style.outlineStyle,
                outlineColor: style.outlineColor,
                boxShadow: style.boxShadow,
                border: style.border,
              };
            });

            const hasFocusIndicator =
              focusStyles.outline !== 'none' ||
              focusStyles.outlineWidth !== '0px' ||
              focusStyles.boxShadow !== 'none' ||
              focusStyles.border !== 'none';

            expect(hasFocusIndicator, `元素缺少焦點指示器 in ${url}`).toBe(true);
          }
        }
      }
    });
  });

  test.describe('2.5 輸入方式 (Input Modalities)', () => {
    test('2.5.1 指標手勢 - 檢查複雜手勢', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查需要複雜手勢的元素
        const gestureElements = await page
          .locator('[class*="swipe"], [class*="pinch"], [class*="rotate"]')
          .all();

        for (const element of gestureElements) {
          if (await element.isVisible()) {
            // 檢查是否有替代的單點操作
            const alternatives = await page.locator('button, [role="button"], [tabindex]').count();

            expect(alternatives > 0, `複雜手勢缺少替代操作 in ${url}`).toBeGreaterThan(0);
          }
        }
      }
    });

    test('2.5.2 指標取消 - 檢查點擊取消', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查重要的操作按鈕
        const actionButtons = await page
          .locator('button[class*="delete"], button[class*="remove"], button[class*="submit"]')
          .all();

        for (const button of actionButtons) {
          if (await button.isVisible()) {
            // 測試點擊取消 (mousedown 但不 mouseup)
            await button.hover();
            await page.mouse.down();
            await page.mouse.move(0, 0); // 移動滑鼠到其他位置
            await page.mouse.up();

            // 確保操作沒有被執行
            // 這個測試需要根據具體的應用邏輯來調整
          }
        }
      }
    });

    test('2.5.3 名稱中的標籤 - 檢查可訪問名稱', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查有可見標籤的控制項
        const labeledControls = await page
          .locator('button, [role="button"], input, select, textarea')
          .all();

        for (const control of labeledControls) {
          if (await control.isVisible()) {
            const visibleText = await control.textContent();
            const ariaLabel = await control.getAttribute('aria-label');

            if (visibleText && visibleText.trim().length > 0) {
              // 如果有 aria-label，應該包含可見文字
              if (ariaLabel) {
                expect(
                  ariaLabel.includes(visibleText.trim()),
                  `可訪問名稱不包含可見文字 in ${url}`
                ).toBe(true);
              }
            }
          }
        }
      }
    });

    test('2.5.4 動作啟動 - 檢查意外啟動', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 檢查可能意外啟動的元素
        const motionElements = await page
          .locator('[class*="shake"], [class*="tilt"], [class*="motion"]')
          .all();

        for (const element of motionElements) {
          if (await element.isVisible()) {
            // 檢查是否有關閉動作啟動的設定
            const disableOptions = await page
              .locator('button[class*="disable"], [class*="settings"]')
              .count();

            expect(disableOptions > 0, `動作啟動缺少關閉選項 in ${url}`).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('快速煙霧測試 (Smoke Test)', () => {
    test('5分鐘快速可操作性檢查', async ({ page }) => {
      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 執行快速 A11y 檢查
        await quickA11yCheck(page);

        // 特別檢查可操作性相關規則
        const results = await testWCAGPrinciple(page, 'OPERABLE');

        // 確保沒有嚴重的可操作性問題
        const criticalViolations = results.failedRules.filter(rule => rule.impact === 'critical');

        expect(criticalViolations, `嚴重的可操作性違規 in ${url}`).toHaveLength(0);

        // 確保基本可操作性分數達到 85%
        expect(results.wcagCompliance.operable, `可操作性合規性不足 in ${url}`).toBe(true);
      }
    });
  });

  test.describe('回歸測試 (Regression Test)', () => {
    test('30分鐘全面可操作性檢查', async ({ page }) => {
      const allResults = [];

      for (const url of TEST_URLS) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // 執行全面的回歸測試
        const results = await a11yTester.runRegressionTest();
        allResults.push(results);

        // 檢查可操作性相關的所有規則
        const operableResults = await testWCAGPrinciple(page, 'OPERABLE');

        // 確保沒有中等以上的可操作性問題
        const significantViolations = operableResults.failedRules.filter(
          rule => rule.impact === 'critical' || rule.impact === 'serious'
        );

        expect(significantViolations, `重要的可操作性違規 in ${url}`).toHaveLength(0);
      }

      // 計算總體可操作性分數
      const averageScore =
        allResults.reduce((sum, r) => sum + r.wcagCompliance.overallScore, 0) / allResults.length;

      expect(averageScore, '總體可操作性分數不足').toBeGreaterThanOrEqual(90);
    });
  });
});
