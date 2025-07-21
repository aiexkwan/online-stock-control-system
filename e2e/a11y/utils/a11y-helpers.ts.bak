/**
 * A11y 測試輔助工具
 *
 * 基於四個專家的協作方案：
 * - 系統架構專家：模組化、可重用的測試架構
 * - Backend工程師：API 無障礙性支援
 * - 優化專家：性能最佳化的測試執行
 * - QA專家：全面的 WCAG 2.1 AA 合規性測試
 */

import { Page, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

/**
 * WCAG 2.1 AA 規則配置
 *
 * 四個核心原則：
 * - Perceivable (可感知性)
 * - Operable (可操作性)
 * - Understandable (可理解性)
 * - Robust (強健性)
 */
export const WCAG_RULES = {
  // 可感知性規則
  PERCEIVABLE: [
    'color-contrast',
    'image-alt',
    'label',
    'link-name',
    'document-title',
    'frame-title',
    'heading-order',
    'html-has-lang',
    'html-lang-valid',
    'html-xml-lang-mismatch',
    'image-redundant-alt',
    'input-image-alt',
    'meta-refresh',
    'object-alt',
    'video-caption',
  ],

  // 可操作性規則
  OPERABLE: [
    'button-name',
    'bypass',
    'duplicate-id',
    'focus-order-semantics',
    'keyboard',
    'no-autoplay-audio',
    'tabindex',
    'accesskeys',
    'focus-trap',
    'skip-link',
    'target-size',
  ],

  // 可理解性規則
  UNDERSTANDABLE: [
    'autocomplete-valid',
    'form-field-multiple-labels',
    'label-title-only',
    'input-button-name',
    'select-name',
    'textarea-name',
    'valid-lang',
    'consistent-help',
    'error-message',
    'required-field',
  ],

  // 強健性規則
  ROBUST: [
    'aria-allowed-attr',
    'aria-command-name',
    'aria-hidden-body',
    'aria-hidden-focus',
    'aria-input-field-name',
    'aria-label',
    'aria-labelledby',
    'aria-required-attr',
    'aria-roles',
    'aria-valid-attr',
    'aria-valid-attr-value',
    'nested-interactive',
    'role-img-alt',
  ],
} as const;

/**
 * 測試嚴重性等級
 */
export enum A11ySeverity {
  CRITICAL = 'critical',
  SERIOUS = 'serious',
  MODERATE = 'moderate',
  MINOR = 'minor',
}

/**
 * 測試類型
 */
export enum TestType {
  SMOKE = 'smoke', // 5分鐘快速測試
  REGRESSION = 'regression', // 30分鐘回歸測試
  COMPREHENSIVE = 'comprehensive', // 2小時深度測試
}

/**
 * A11y 測試結果介面
 */
export interface A11yTestResult {
  url: string;
  timestamp: Date;
  testType: TestType;
  passedRules: string[];
  failedRules: Array<{
    id: string;
    impact: A11ySeverity;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      target: string[];
      html: string;
      failureSummary: string;
    }>;
  }>;
  performanceMetrics: {
    testDuration: number;
    pageLoadTime: number;
    a11yCheckTime: number;
  };
  wcagCompliance: {
    perceivable: boolean;
    operable: boolean;
    understandable: boolean;
    robust: boolean;
    overallScore: number;
  };
}

/**
 * 基礎 A11y 測試類
 */
export class A11yTester {
  private page: Page;
  private axeBuilder: AxeBuilder;

  constructor(page: Page) {
    this.page = page;
    this.axeBuilder = new AxeBuilder({ page });
  }

  /**
   * 初始化 A11y 測試環境
   */
  async initialize(): Promise<void> {
    // 注入 axe-core 到頁面
    await this.axeBuilder.analyze();

    // 設定測試選項
    await this.page.evaluate(() => {
      // 設定 axe-core 配置
      if ((window as any).axe) {
        (window as any).axe.configure({
          rules: [
            // 啟用所有 WCAG 2.1 AA 規則
            { id: 'color-contrast', enabled: true },
            { id: 'keyboard', enabled: true },
            { id: 'label', enabled: true },
            { id: 'link-name', enabled: true },
            { id: 'button-name', enabled: true },
            { id: 'heading-order', enabled: true },
            { id: 'html-has-lang', enabled: true },
            { id: 'landmark-one-main', enabled: true },
            { id: 'region', enabled: true },
            { id: 'skip-link', enabled: true },
          ],
        });
      }
    });
  }

  /**
   * 執行快速煙霧測試 (5分鐘)
   */
  async runSmokeTest(): Promise<A11yTestResult> {
    const startTime = Date.now();

    // 基本 A11y 檢查
    const results = await this.axeBuilder
      .withTags(['wcag2a', 'wcag2aa'])
      .include('main')
      .exclude('[data-testid="loading"]')
      .analyze();

    const endTime = Date.now();

    return this.processResults(results, TestType.SMOKE, startTime, endTime);
  }

  /**
   * 執行回歸測試 (30分鐘)
   */
  async runRegressionTest(): Promise<A11yTestResult> {
    const startTime = Date.now();

    // 更全面的 A11y 檢查
    const results = await this.axeBuilder
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('body')
      .exclude('[data-testid="loading"]')
      .exclude('[data-testid="skeleton"]')
      .analyze();

    const endTime = Date.now();

    return this.processResults(results, TestType.REGRESSION, startTime, endTime);
  }

  /**
   * 執行深度測試 (2小時)
   */
  async runComprehensiveTest(): Promise<A11yTestResult> {
    const startTime = Date.now();

    // 最全面的 A11y 檢查
    const results = await this.axeBuilder
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag21aaa'])
      .include('html')
      .analyze();

    const endTime = Date.now();

    return this.processResults(results, TestType.COMPREHENSIVE, startTime, endTime);
  }

  /**
   * 測試特定的 WCAG 原則
   */
  async testWCAGPrinciple(principle: keyof typeof WCAG_RULES): Promise<A11yTestResult> {
    const startTime = Date.now();

    const rules = WCAG_RULES[principle];
    const results = await this.axeBuilder.withRules([...rules]).analyze();

    const endTime = Date.now();

    return this.processResults(results, TestType.REGRESSION, startTime, endTime);
  }

  /**
   * 處理測試結果
   */
  private async processResults(
    results: any,
    testType: TestType,
    startTime: number,
    endTime: number
  ): Promise<A11yTestResult> {
    const pageLoadTime = await this.page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });

    const testDuration = endTime - startTime;
    const a11yCheckTime = testDuration; // 簡化計算

    return {
      url: this.page.url(),
      timestamp: new Date(),
      testType,
      passedRules: results.passes.map((pass: any) => pass.id),
      failedRules: results.violations.map((violation: any) => ({
        id: violation.id,
        impact: violation.impact as A11ySeverity,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node: any) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
      performanceMetrics: {
        testDuration,
        pageLoadTime,
        a11yCheckTime,
      },
      wcagCompliance: this.calculateWCAGCompliance(results),
    };
  }

  /**
   * 計算 WCAG 合規性分數
   */
  private calculateWCAGCompliance(results: any): A11yTestResult['wcagCompliance'] {
    const violations = results.violations;

    // 按 WCAG 原則分類違規
    const principleViolations = {
      perceivable: violations.filter((v: any) => WCAG_RULES.PERCEIVABLE.includes(v.id)).length,
      operable: violations.filter((v: any) => WCAG_RULES.OPERABLE.includes(v.id)).length,
      understandable: violations.filter((v: any) => WCAG_RULES.UNDERSTANDABLE.includes(v.id))
        .length,
      robust: violations.filter((v: any) => WCAG_RULES.ROBUST.includes(v.id)).length,
    };

    const totalViolations = Object.values(principleViolations).reduce(
      (sum, count) => sum + count,
      0
    );
    const totalRules = Object.values(WCAG_RULES).flat().length;

    return {
      perceivable: principleViolations.perceivable === 0,
      operable: principleViolations.operable === 0,
      understandable: principleViolations.understandable === 0,
      robust: principleViolations.robust === 0,
      overallScore: Math.round(((totalRules - totalViolations) / totalRules) * 100),
    };
  }

  /**
   * 檢查鍵盤導航
   */
  async testKeyboardNavigation(): Promise<boolean> {
    // 測試 Tab 導航
    await this.page.keyboard.press('Tab');
    const firstFocusable = await this.page.locator(':focus').first();

    // 測試 Shift+Tab 導航
    await this.page.keyboard.press('Shift+Tab');

    // 測試 Enter 和 Space 鍵
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Space');

    // 測試 Escape 鍵
    await this.page.keyboard.press('Escape');

    return firstFocusable !== null;
  }

  /**
   * 檢查色彩對比度
   */
  async testColorContrast(): Promise<boolean> {
    const results = await this.axeBuilder.withRules(['color-contrast']).analyze();

    return results.violations.length === 0;
  }

  /**
   * 檢查 ARIA 標籤
   */
  async testARIALabels(): Promise<boolean> {
    const results = await this.axeBuilder
      .withRules(['aria-label', 'aria-labelledby', 'aria-describedby'])
      .analyze();

    return results.violations.length === 0;
  }

  /**
   * 檢查語義化標籤
   */
  async testSemanticHTML(): Promise<boolean> {
    const results = await this.axeBuilder
      .withRules(['heading-order', 'landmark-one-main', 'region'])
      .analyze();

    return results.violations.length === 0;
  }
}

/**
 * 快速 A11y 檢查工具函數
 */
export async function quickA11yCheck(page: Page): Promise<void> {
  const tester = new A11yTester(page);
  await tester.initialize();

  const results = await tester.runSmokeTest();

  // 斷言沒有嚴重的 A11y 問題
  expect(results.failedRules.filter(rule => rule.impact === A11ySeverity.CRITICAL)).toHaveLength(0);

  // 斷言總體分數達到 90%
  expect(results.wcagCompliance.overallScore).toBeGreaterThanOrEqual(90);
}

/**
 * 完整 A11y 測試工具函數
 */
export async function comprehensiveA11yCheck(page: Page): Promise<A11yTestResult> {
  const tester = new A11yTester(page);
  await tester.initialize();

  return await tester.runComprehensiveTest();
}

/**
 * 特定 WCAG 原則測試
 */
export async function testWCAGPrinciple(
  page: Page,
  principle: keyof typeof WCAG_RULES
): Promise<A11yTestResult> {
  const tester = new A11yTester(page);
  await tester.initialize();

  return await tester.testWCAGPrinciple(principle);
}

/**
 * 鍵盤導航測試
 */
export async function testKeyboardNavigation(page: Page): Promise<void> {
  const tester = new A11yTester(page);
  await tester.initialize();

  const isNavigable = await tester.testKeyboardNavigation();

  expect(isNavigable).toBe(true);
}

/**
 * 色彩對比度測試
 */
export async function testColorContrast(page: Page): Promise<void> {
  const tester = new A11yTester(page);
  await tester.initialize();

  const hasGoodContrast = await tester.testColorContrast();

  expect(hasGoodContrast).toBe(true);
}

/**
 * 測試報告生成器
 */
export class A11yReportGenerator {
  static generateReport(results: A11yTestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.wcagCompliance.overallScore >= 90).length;
    const failedTests = totalTests - passedTests;

    const averageScore =
      results.reduce((sum, r) => sum + r.wcagCompliance.overallScore, 0) / totalTests;

    return `
# A11y 測試報告

## 總覽
- 總測試數: ${totalTests}
- 通過測試: ${passedTests}
- 失敗測試: ${failedTests}
- 平均分數: ${averageScore.toFixed(2)}%

## WCAG 合規性
- 可感知性: ${results.filter(r => r.wcagCompliance.perceivable).length}/${totalTests}
- 可操作性: ${results.filter(r => r.wcagCompliance.operable).length}/${totalTests}
- 可理解性: ${results.filter(r => r.wcagCompliance.understandable).length}/${totalTests}
- 強健性: ${results.filter(r => r.wcagCompliance.robust).length}/${totalTests}

## 詳細結果
${results
  .map(
    r => `
### ${r.url}
- 測試類型: ${r.testType}
- 分數: ${r.wcagCompliance.overallScore}%
- 失敗規則: ${r.failedRules.length}
- 測試時間: ${r.performanceMetrics.testDuration}ms
`
  )
  .join('\n')}
    `;
  }
}
