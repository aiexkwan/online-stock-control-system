import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { getUnifiedCredentials, hasValidCredentials } from '../utils/test-data';

/**
 * 認證測試 Fixture
 * 提供已登入狀態的測試環境
 */
type AuthFixtures = {
  authenticatedPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // 檢查憑證可用性
    if (!hasValidCredentials()) {
      throw new Error(
        'No valid test credentials available. Set SYS_LOGIN/SYS_PASSWORD in .env.local'
      );
    }

    const loginPage = new LoginPage(page);
    const credentials = getUnifiedCredentials();

    try {
      // 執行登入流程
      await loginPage.goto();
      await loginPage.login(credentials.email, credentials.password);

      // 等待登入成功後的重定向到 /access
      await page.waitForURL('**/access', { timeout: 10000 });

      console.log(`✅ Authentication successful for: ${credentials.email}`);

      // 提供已認證的頁面給測試使用
      await use(loginPage);
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    } finally {
      // 測試後清理
      await page.context().clearCookies();
    }
  },
});

export { expect } from '@playwright/test';
