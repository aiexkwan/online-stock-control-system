import { test, expect, Page } from '@playwright/test';

interface ProductData {
  code: string;
  description: string;
  colour: string;
  standard_qty: number;
  type: string;
}

class FormCardMigrationTestHelper {
  constructor(private page: Page) {}

  async navigateToTestPage() {
    await this.page.goto('/admin/test-form-card-migration');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForComponentsToLoad() {
    // 等待兩個表單組件都載入完成
    await expect(this.page.locator('[data-testid="original-form"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="form-card"]')).toBeVisible();
  }

  async runAllTests() {
    await this.page.click('text=開始測試');

    // 等待測試完成
    await this.page.waitForSelector('[data-testid="test-completed"]', {
      timeout: 30000,
    });
  }

  async fillOriginalForm(data: ProductData) {
    const originalForm = this.page.locator('[data-testid="original-form"]');

    await originalForm.locator('input[name="code"]').fill(data.code);
    await originalForm.locator('input[name="description"]').fill(data.description);
    await originalForm.locator('select[name="colour"]').selectOption(data.colour);
    await originalForm.locator('input[name="standard_qty"]').fill(data.standard_qty.toString());
    await originalForm.locator('select[name="type"]').selectOption(data.type);
  }

  async fillFormCard(data: ProductData) {
    const formCard = this.page.locator('[data-testid="form-card"]');

    await formCard.locator('input[name="code"]').fill(data.code);
    await formCard.locator('input[name="description"]').fill(data.description);
    await formCard.locator('[role="combobox"]').first().click();
    await this.page.locator(`text=${data.colour}`).click();
    await formCard.locator('input[name="standard_qty"]').fill(data.standard_qty.toString());
    await formCard.locator('[role="combobox"]').last().click();
    await this.page.locator(`text=${data.type}`).click();
  }

  async submitOriginalForm() {
    const originalForm = this.page.locator('[data-testid="original-form"]');
    await originalForm.locator('button[type="submit"]').click();
  }

  async submitFormCard() {
    const formCard = this.page.locator('[data-testid="form-card"]');
    await formCard.locator('button[type="submit"]').click();
  }

  async getValidationErrors(formSelector: string) {
    const form = this.page.locator(`[data-testid="${formSelector}"]`);
    const errors = await form.locator('.text-red-400, .text-red-300').allTextContents();
    return errors;
  }

  async getFormProgress() {
    const formCard = this.page.locator('[data-testid="form-card"]');
    const progressText = await formCard.locator('text=/\\d+%/').textContent();
    return progressText ? parseInt(progressText.replace('%', '')) : 0;
  }

  async getTestResults() {
    const results = await this.page.locator('[data-testid="test-result-item"]').all();
    const testResults = [];

    for (const result of results) {
      const name = await result.locator('.test-name').textContent();
      const status = await result.locator('.test-status').textContent();
      const duration = await result.locator('.test-duration').textContent();

      testResults.push({
        name: name?.trim(),
        status: status?.trim(),
        duration: duration?.trim(),
      });
    }

    return testResults;
  }

  async checkAccessibility() {
    // 檢查基本的可訪問性元素
    const originalForm = this.page.locator('[data-testid="original-form"]');
    const formCard = this.page.locator('[data-testid="form-card"]');

    // 檢查標籤
    const originalLabels = await originalForm.locator('label').count();
    const formCardLabels = await formCard.locator('label').count();

    // 檢查ARIA屬性
    const originalInputs = await originalForm.locator('input, select').count();
    const formCardInputs = await formCard.locator('input, [role="combobox"]').count();

    return {
      originalLabels,
      formCardLabels,
      originalInputs,
      formCardInputs,
    };
  }

  async measurePerformance() {
    // 開始性能測量
    await this.page.evaluate(() => {
      performance.mark('form-render-start');
    });

    // 觸發表單重新渲染
    await this.page.locator('text=重置測試').click();
    await this.waitForComponentsToLoad();

    // 結束性能測量
    const performanceMetrics = await this.page.evaluate(() => {
      performance.mark('form-render-end');
      performance.measure('form-render-time', 'form-render-start', 'form-render-end');

      const measure = performance.getEntriesByName('form-render-time')[0];
      return {
        renderTime: measure.duration,
        navigationTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      };
    });

    return performanceMetrics;
  }
}

test.describe('FormCard 遷移驗證測試', () => {
  let helper: FormCardMigrationTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new FormCardMigrationTestHelper(page);
    await helper.navigateToTestPage();
    await helper.waitForComponentsToLoad();
  });

  test('頁面載入和組件渲染', async ({ page }) => {
    // 驗證頁面標題
    await expect(page.locator('h1')).toHaveText('FormCard 遷移驗證測試');

    // 驗證兩個表單組件都存在
    await expect(page.locator('[data-testid="original-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-card"]')).toBeVisible();

    // 驗證控制面板存在
    await expect(page.locator('text=測試控制面板')).toBeVisible();
    await expect(page.locator('text=開始測試')).toBeVisible();
  });

  test('基本表單功能對比', async ({ page }) => {
    const validData: ProductData = {
      code: 'TEST-001',
      description: 'Test Product for Migration',
      colour: 'BLUE',
      standard_qty: 100,
      type: 'FINISHED_GOODS',
    };

    // 填寫原始表單
    await helper.fillOriginalForm(validData);

    // 填寫FormCard
    await helper.fillFormCard(validData);

    // 驗證兩個表單的值都已填寫
    const originalCodeValue = await page
      .locator('[data-testid="original-form"] input[name="code"]')
      .inputValue();
    const formCardCodeValue = await page
      .locator('[data-testid="form-card"] input[name="code"]')
      .inputValue();

    expect(originalCodeValue).toBe(validData.code);
    expect(formCardCodeValue).toBe(validData.code);
  });

  test('表單驗證功能測試', async ({ page }) => {
    const invalidData: ProductData = {
      code: '', // 缺少必填字段
      description: '',
      colour: 'RED',
      standard_qty: -1, // 無效數量
      type: 'RAW_MATERIALS',
    };

    // 填寫無效數據到兩個表單
    await helper.fillOriginalForm(invalidData);
    await helper.fillFormCard(invalidData);

    // 嘗試提交
    await helper.submitOriginalForm();
    await helper.submitFormCard();

    // 檢查驗證錯誤
    const originalErrors = await helper.getValidationErrors('original-form');
    const formCardErrors = await helper.getValidationErrors('form-card');

    // 兩個表單都應該顯示錯誤
    expect(originalErrors.length).toBeGreaterThan(0);
    expect(formCardErrors.length).toBeGreaterThan(0);
  });

  test('FormCard 進度指示器功能', async ({ page }) => {
    // 初始進度應該是0
    const initialProgress = await helper.getFormProgress();
    expect(initialProgress).toBeLessThanOrEqual(50); // 因為沒有填寫必填字段

    // 填寫必填字段
    const formCard = page.locator('[data-testid="form-card"]');
    await formCard.locator('input[name="code"]').fill('TEST-001');
    await formCard.locator('input[name="description"]').fill('Test Product');

    // 進度應該增加
    const updatedProgress = await helper.getFormProgress();
    expect(updatedProgress).toBeGreaterThan(initialProgress);
  });

  test('自動化測試套件執行', async ({ page }) => {
    // 執行自動化測試
    await helper.runAllTests();

    // 驗證測試結果
    const testResults = await helper.getTestResults();
    expect(testResults.length).toBeGreaterThan(0);

    // 檢查是否有通過的測試
    const passedTests = testResults.filter(result => result.status === '通過');
    expect(passedTests.length).toBeGreaterThan(0);
  });

  test('可訪問性檢查', async ({ page }) => {
    const accessibilityData = await helper.checkAccessibility();

    // 確保兩個表單都有適當的標籤
    expect(accessibilityData.originalLabels).toBeGreaterThan(0);
    expect(accessibilityData.formCardLabels).toBeGreaterThan(0);

    // 確保輸入字段數量合理
    expect(accessibilityData.originalInputs).toBeGreaterThan(0);
    expect(accessibilityData.formCardInputs).toBeGreaterThan(0);
  });

  test('性能測量', async ({ page }) => {
    const performanceMetrics = await helper.measurePerformance();

    // 驗證性能指標在合理範圍內
    expect(performanceMetrics.renderTime).toBeLessThan(1000); // 渲染時間小於1秒
    expect(performanceMetrics.navigationTime).toBeLessThan(5000); // 導航時間小於5秒
  });

  test('錯誤處理和恢復', async ({ page }) => {
    // 填寫無效數據
    const formCard = page.locator('[data-testid="form-card"]');
    await formCard.locator('input[name="code"]').fill('');
    await formCard.locator('input[name="description"]').fill('');

    // 嘗試提交
    await helper.submitFormCard();

    // 應該顯示錯誤訊息
    const errors = await helper.getValidationErrors('form-card');
    expect(errors.length).toBeGreaterThan(0);

    // 修正數據
    await formCard.locator('input[name="code"]').fill('VALID-001');
    await formCard.locator('input[name="description"]').fill('Valid Product');

    // 錯誤應該消失
    await page.waitForTimeout(500); // 等待驗證更新
    const errorsAfterFix = await helper.getValidationErrors('form-card');
    expect(errorsAfterFix.length).toBeLessThan(errors.length);
  });

  test('標籤頁導航功能', async ({ page }) => {
    // 測試所有標籤頁都可以正常切換
    const tabs = ['組件對比', '測試結果', '性能分析', '遷移報告'];

    for (const tab of tabs) {
      await page.click(`text=${tab}`);

      // 驗證對應的內容已顯示
      const tabContent = page.locator('[role="tabpanel"]');
      await expect(tabContent).toBeVisible();
    }
  });

  test('響應式設計驗證', async ({ page }) => {
    // 測試桌面視窗
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="original-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-card"]')).toBeVisible();

    // 測試平板視窗
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="original-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-card"]')).toBeVisible();

    // 測試手機視窗
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="original-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-card"]')).toBeVisible();
  });
});

test.describe('AdminWidgetRenderer 整合測試', () => {
  test('FormCard 在 AdminWidgetRenderer 中的渲染', async ({ page }) => {
    // 導航到管理面板
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // 檢查是否有 FormCard 類型的 widget 配置
    // 這需要根據實際的管理面板配置進行調整
    const widgets = page.locator('[data-widget-type="form-card"]');

    if ((await widgets.count()) > 0) {
      // 如果存在 FormCard widget，驗證其正常渲染
      await expect(widgets.first()).toBeVisible();
    }
  });
});

test.describe('性能回歸測試', () => {
  test('FormCard vs ProductEditForm 性能對比', async ({ page }) => {
    const helper = new FormCardMigrationTestHelper(page);
    await helper.navigateToTestPage();
    await helper.waitForComponentsToLoad();

    // 測量多次渲染的平均性能
    const measurements = [];

    for (let i = 0; i < 3; i++) {
      const metrics = await helper.measurePerformance();
      measurements.push(metrics.renderTime);

      // 等待一段時間再進行下一次測量
      await page.waitForTimeout(1000);
    }

    const averageRenderTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;

    // 渲染時間應該在合理範圍內
    expect(averageRenderTime).toBeLessThan(500); // 平均渲染時間小於500ms

    console.log(`平均渲染時間: ${averageRenderTime.toFixed(2)}ms`);
  });
});
