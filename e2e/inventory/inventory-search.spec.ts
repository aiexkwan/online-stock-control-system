import { test, expect } from '../fixtures/auth.fixture';
import { InventoryPage } from '../pages/inventory.page';
import { generateTestData, waitFor } from '../utils/test-data';

test.describe('Inventory Search and Management', () => {
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page, authenticatedPage }) => {
    inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
  });

  test('should display search interface', async () => {
    // 驗證搜索界面元素
    await expect(inventoryPage.searchInput).toBeVisible();
    await expect(inventoryPage.searchButton).toBeVisible();
    await expect(inventoryPage.searchTypeSelect).toBeVisible();

    // 驗證搜索類型選項
    const options = await inventoryPage.searchTypeSelect.locator('option').allTextContents();
    expect(options).toContain('Series');
    expect(options).toContain('Pallet Number');
  });

  test('should search by pallet number', async ({ page }) => {
    // 使用測試數據搜索
    const testPalletNum = '240615/1'; // 假設這是測試數據庫中的數據

    await inventoryPage.searchPallet('pallet_num', testPalletNum);

    // 驗證搜索結果
    const results = await inventoryPage.getSearchResults();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].palletNum).toContain(testPalletNum);
  });

  test('should search by series', async ({ page }) => {
    // 使用系列號搜索
    const testSeries = 'PM-240615';

    await inventoryPage.searchPallet('series', testSeries);

    // 驗證搜索結果
    const results = await inventoryPage.getSearchResults();
    expect(results.length).toBeGreaterThan(0);

    // 驗證所有結果都屬於該系列
    results.forEach(result => {
      expect(result.palletNum).toContain('240615');
    });
  });

  test('should handle empty search results', async () => {
    // 搜索不存在的托盤
    await inventoryPage.searchPallet('pallet_num', 'NONEXISTENT/999');

    // 驗證空結果處理
    const results = await inventoryPage.getSearchResults();
    expect(results.length).toBe(0);

    // 應該顯示無結果訊息
    const noResultsMessage = inventoryPage.page.locator('text=No results found');
    await expect(noResultsMessage).toBeVisible();
  });

  test('should validate search input', async () => {
    // 嘗試空搜索
    await inventoryPage.searchInput.fill('');
    await inventoryPage.searchButton.click();

    // 應該顯示驗證錯誤
    const validationError = await inventoryPage.searchInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationError).toBeTruthy();
  });

  test('should perform stock transfer', async ({ page }) => {
    // 先搜索一個托盤
    await inventoryPage.searchPallet('pallet_num', '240615/1');

    // 等待結果
    const results = await inventoryPage.getSearchResults();
    expect(results.length).toBeGreaterThan(0);

    // 選擇第一個結果進行轉移
    const firstRow = inventoryPage.inventoryTable.locator('tbody tr').first();
    await firstRow.click();

    // 執行庫存轉移
    await inventoryPage.performTransfer('PRODUCTION', 'PIPELINE', '50');

    // 驗證成功訊息
    await expect(inventoryPage.successAlert).toBeVisible();
    const successMsg = await inventoryPage.getSuccessMessage();
    expect(successMsg).toContain('Transfer completed successfully');
  });

  test('should validate transfer quantity', async ({ page }) => {
    // 搜索托盤
    await inventoryPage.searchPallet('pallet_num', '240615/1');
    await inventoryPage.waitForSearchComplete();

    // 選擇結果
    const firstRow = inventoryPage.inventoryTable.locator('tbody tr').first();
    await firstRow.click();

    // 嘗試轉移超過可用數量
    await inventoryPage.performTransfer('PRODUCTION', 'PIPELINE', '999999');

    // 應該顯示錯誤
    await expect(inventoryPage.errorAlert).toBeVisible();
    const errorMsg = await inventoryPage.getErrorMessage();
    expect(errorMsg).toContain('Insufficient stock');
  });

  test('should handle concurrent searches', async ({ page }) => {
    // 快速連續執行多個搜索
    const searches = [
      inventoryPage.searchPallet('series', 'PM-240615'),
      inventoryPage.searchPallet('series', 'PM-240616'),
      inventoryPage.searchPallet('series', 'PM-240617'),
    ];

    // 等待所有搜索完成
    await Promise.all(searches);

    // 驗證最後一個搜索的結果顯示
    const results = await inventoryPage.getSearchResults();
    expect(results).toBeDefined();
  });

  test('should export search results', async ({ page }) => {
    // 執行搜索
    await inventoryPage.searchPallet('series', 'PM-240615');
    await inventoryPage.waitForSearchComplete();

    // 查找導出按鈕
    const exportButton = page.locator('[data-testid="export-results"]');

    if (await exportButton.isVisible()) {
      // 設置下載監聽
      const downloadPromise = page.waitForEvent('download');

      // 點擊導出
      await exportButton.click();

      // 等待下載
      const download = await downloadPromise;

      // 驗證文件名
      expect(download.suggestedFilename()).toMatch(/inventory.*\.(csv|xlsx)$/i);
    }
  });

  test('should maintain search state on page refresh', async ({ page }) => {
    // 執行搜索
    const searchValue = 'PM-240615';
    await inventoryPage.searchPallet('series', searchValue);
    await inventoryPage.waitForSearchComplete();

    // 重新載入頁面
    await page.reload();

    // 驗證搜索值仍然存在
    const inputValue = await inventoryPage.searchInput.inputValue();
    expect(inputValue).toBe(searchValue);
  });

  test('should handle barcode scanning', async ({ page }) => {
    // 點擊掃描按鈕
    if (await inventoryPage.scanButton.isVisible()) {
      await inventoryPage.scanButton.click();

      // 模擬掃描輸入
      const scanModal = page.locator('[role="dialog"]');
      await expect(scanModal).toBeVisible();

      // 模擬條碼掃描（快速輸入）
      const barcodeInput = scanModal.locator('input[type="text"]');
      await barcodeInput.fill('240615/1');
      await barcodeInput.press('Enter');

      // 驗證自動搜索
      await inventoryPage.waitForSearchComplete();
      const results = await inventoryPage.getSearchResults();
      expect(results.length).toBeGreaterThan(0);
    }
  });
});
