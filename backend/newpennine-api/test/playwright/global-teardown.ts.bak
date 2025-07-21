import { FullConfig } from '@playwright/test';

/**
 * Playwright 全局清理
 * 在所有測試完成後執行
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 開始 Playwright 全局清理...');

  // 清理認證狀態文件
  try {
    const fs = require('fs');
    const authStatePath = 'test/playwright/auth-state.json';

    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('✅ 認證狀態文件已清理');
    }
  } catch (error) {
    console.warn('⚠️ 清理認證狀態文件時出錯:', error);
  }

  console.log('✅ Playwright 全局清理完成');
}

export default globalTeardown;
