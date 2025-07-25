import { Page, Locator } from '@playwright/test';

/**
 * 登入頁面對象模型
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input#email');
    this.passwordInput = page.locator('input#password');
    this.submitButton = page.locator('button[type="submit"]');
    // Error message is displayed in a div with specific styling
    // Using a more robust selector that matches the error message structure
    this.errorMessage = page
      .locator(
        'div.rounded-xl.bg-red-900\\/50, div:has-text("error"), div:has-text("invalid"), div:has-text("Only @pennineindustries.com"), div:has-text("Please fill in all fields")'
      )
      .first();
    this.successMessage = page.locator('.success-message');
  }

  async goto() {
    await this.page.goto('/main-login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || '';
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      // 檢查是否重定向到 admin 頁面（成功登入的主要頁面）
      await this.page.waitForURL('**/admin/**', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    // The logout button might be in different locations depending on the page
    // Try common logout button selectors
    const logoutButton = this.page
      .locator(
        '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")'
      )
      .first();
    await logoutButton.click();
    await this.page.waitForURL('**/main-login');
  }
}
