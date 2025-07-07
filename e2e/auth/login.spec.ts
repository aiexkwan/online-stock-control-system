import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { testConfig } from '../utils/test-data';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form', async ({ page }) => {
    // 驗證登入表單元素
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    
    // 驗證頁面標題
    await expect(page).toHaveTitle(/Login|Sign In/i);
  });

  test('should login with valid credentials', async ({ page }) => {
    // 執行登入
    await loginPage.login(
      testConfig.credentials.user.email,
      testConfig.credentials.user.password
    );

    // 驗證成功登入
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 檢查是否有用戶資訊顯示
    const userInfo = page.locator('[data-testid="user-info"]');
    await expect(userInfo).toBeVisible();
  });

  test('should show error with invalid credentials', async () => {
    // 使用錯誤憑證登入
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // 驗證錯誤訊息
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Invalid credentials');
  });

  test('should validate email format', async () => {
    // 輸入無效電郵格式
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('password123');
    await loginPage.submitButton.click();

    // 驗證表單驗證錯誤
    const emailError = await loginPage.emailInput.evaluate((el: HTMLInputElement) => 
      el.validationMessage
    );
    expect(emailError).toBeTruthy();
  });

  test('should handle empty form submission', async () => {
    // 直接提交空表單
    await loginPage.submitButton.click();

    // 驗證必填欄位提示
    await expect(loginPage.emailInput).toHaveAttribute('required');
    await expect(loginPage.passwordInput).toHaveAttribute('required');
  });

  test('should redirect to requested page after login', async ({ page }) => {
    // 先訪問需要認證的頁面
    await page.goto('/inventory?redirect=true');
    
    // 應該被重定向到登入頁
    await expect(page).toHaveURL(/\/login/);
    
    // 登入
    await loginPage.login(
      testConfig.credentials.user.email,
      testConfig.credentials.user.password
    );
    
    // 應該返回原本要訪問的頁面
    await expect(page).toHaveURL(/\/inventory/);
  });

  test('should maintain session across page reloads', async ({ page, context }) => {
    // 登入
    await loginPage.login(
      testConfig.credentials.user.email,
      testConfig.credentials.user.password
    );
    
    // 等待登入完成
    await page.waitForURL(/\/dashboard/);
    
    // 重新載入頁面
    await page.reload();
    
    // 應該仍然保持登入狀態
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 檢查 cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    expect(sessionCookie).toBeTruthy();
  });

  test('should logout successfully', async ({ page }) => {
    // 先登入
    await loginPage.login(
      testConfig.credentials.user.email,
      testConfig.credentials.user.password
    );
    await page.waitForURL(/\/dashboard/);
    
    // 執行登出
    await loginPage.logout();
    
    // 驗證返回登入頁
    await expect(page).toHaveURL(/\/login/);
    
    // 嘗試訪問需要認證的頁面
    await page.goto('/dashboard');
    
    // 應該被重定向回登入頁
    await expect(page).toHaveURL(/\/login/);
  });
});