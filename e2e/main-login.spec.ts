import { test, expect } from '@playwright/test';

test.describe('Main Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/main-login');
  });

  test('should display login form with proper elements', async ({ page }) => {
    // Check page title and branding
    await expect(page.locator('h1')).toContainText('Pennine Manufacturing');
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click submit without filling fields
    await page.locator('button[type="submit"]').click();
    
    // Should show error message
    await expect(page.locator('text=Please fill in all fields')).toBeVisible();
  });

  test('should validate email domain', async ({ page }) => {
    // Fill form with invalid email domain
    await page.locator('input[type="email"]').fill('test@gmail.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Should show domain validation error
    await expect(
      page.locator('text=Only @pennineindustries.com email addresses are allowed')
    ).toBeVisible();
  });

  test('should handle authentication errors', async ({ page }) => {
    // Fill form with invalid credentials
    await page.locator('input[type="email"]').fill('invalid@pennineindustries.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    // Should show loading state
    await expect(page.locator('text=Signing in...')).toBeVisible();
    
    // Should show error message after failed authentication
    await expect(page.locator('[class*="border-red"]')).toBeVisible({ timeout: 10000 });
  });
});