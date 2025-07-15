import { chromium, FullConfig } from '@playwright/test';

/**
 * Playwright 全局設置
 * 在所有測試開始前執行
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 開始 Playwright 全局設置...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 等待後端 API 服務器啟動
    console.log('⏳ 等待後端 API 服務器啟動...');
    await page.waitForLoadState('networkidle');
    
    // 檢查後端健康狀態
    console.log('🔍 檢查後端健康狀態...');
    const healthResponse = await page.goto('http://localhost:3001/api/v1/health');
    
    if (!healthResponse?.ok()) {
      throw new Error('後端 API 服務器未正常啟動');
    }
    
    console.log('✅ 後端 API 服務器正常運行');

    // 檢查前端服務器
    console.log('🔍 檢查前端服務器...');
    const frontendResponse = await page.goto('http://localhost:3000');
    
    if (!frontendResponse?.ok()) {
      console.warn('⚠️ 前端服務器可能未啟動，某些測試可能會失敗');
    } else {
      console.log('✅ 前端服務器正常運行');
    }

    // 預先登入並保存認證狀態
    console.log('🔐 執行預登入設置...');
    await page.goto('http://localhost:3000/auth/login');
    
    // 填入系統憑據
    await page.fill('#email', 'akwan@pennineindustries.com');
    await page.fill('#password', 'X315Y316');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    
    // 保存認證狀態
    await context.storageState({ path: 'test/playwright/auth-state.json' });
    console.log('✅ 認證狀態已保存');

  } catch (error) {
    console.error('❌ 全局設置失敗:', error);
    // 不拋出錯誤，讓個別測試決定如何處理
  } finally {
    await browser.close();
  }

  console.log('✅ Playwright 全局設置完成');
}

export default globalSetup;