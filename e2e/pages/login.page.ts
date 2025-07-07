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
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"]');
    this.successMessage = page.locator('.success-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForURL('**/dashboard', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    await this.page.locator('[data-testid="logout-button"]').click();
    await this.page.waitForURL('**/login');
  }
}