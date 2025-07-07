import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

/**
 * 認證測試 Fixture
 * 提供已登入狀態的測試環境
 */
type AuthFixtures = {
  authenticatedPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    
    // 執行登入流程
    await loginPage.goto();
    await loginPage.login(
      process.env.E2E_TEST_EMAIL || 'test@example.com',
      process.env.E2E_TEST_PASSWORD || 'testpassword'
    );
    
    // 等待登入成功後的重定向
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // 提供已認證的頁面給測試使用
    await use(loginPage);
    
    // 測試後清理
    await page.context().clearCookies();
  },
});

export { expect } from '@playwright/test';