import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Basic Test', () => {
  test('Login and access dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:3000/main-login');

    // Login
    await page.fill('input[name="email"]', 'akwan@pennineindustries.com');
    await page.fill('input[name="password"]', 'X315Y316');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/admin/**', { timeout: 15000 });

    // Verify we're on admin page
    const url = page.url();
    expect(url).toContain('/admin');

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard-v1.0.png' });

    console.log('✓ Admin dashboard accessible');
  });
});
