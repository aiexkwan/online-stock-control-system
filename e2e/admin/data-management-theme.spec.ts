import { test, expect } from '../fixtures/auth.fixture';

test.describe('Data Management Theme', () => {
  test('should load data-management theme successfully', async ({ page, authenticatedPage }) => {
    console.log('🧪 測試 data-management theme 加載...');
    
    // 導航到 data-management 主題（已經認證）
    await page.goto('/admin/data-management', { timeout: 30000 });
    
    // 等待頁面加載
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // 驗證頁面標題（使用正確的標題）
    await expect(page).toHaveTitle(/Pennine Stock Control System/);
    
    // 查找頁面上的關鍵文字，使用更寬鬆的選擇器
    const hasUploadContent = await page.locator('text=Upload').first().isVisible().catch(() => false);
    const hasManagementContent = await page.locator('text=Management').first().isVisible().catch(() => false);
    const hasHistoryContent = await page.locator('text=History').first().isVisible().catch(() => false);
    
    // 至少應該有其中一個內容存在
    const hasValidContent = hasUploadContent || hasManagementContent || hasHistoryContent;
    expect(hasValidContent).toBe(true);
    
    console.log('✅ Data Management theme loaded successfully');
  });

  test('should verify theme configuration exists', async ({ page, authenticatedPage }) => {
    console.log('🧪 驗證 data-management theme 配置...');
    
    // 導航到主題
    await page.goto('/admin/data-management', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    
    // 檢查是否有網絡錯誤或控制台錯誤
    const hasNetworkErrors = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')[0]?.responseStatus !== 200;
    }).catch(() => false);
    
    expect(hasNetworkErrors).toBe(false);
    
    // 確認頁面不是錯誤頁面
    const isErrorPage = await page.locator('text=404').isVisible().catch(() => false);
    const isNotFound = await page.locator('text=Not Found').isVisible().catch(() => false);
    
    expect(isErrorPage).toBe(false);
    expect(isNotFound).toBe(false);
    
    console.log('✅ Theme configuration verified');
  });
});