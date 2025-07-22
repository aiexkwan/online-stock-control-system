import { test, expect } from '@playwright/test';

test.describe('Inventory Ordered Analysis Widget', () => {
  test('should access the application', async ({ page }) => {
    // Set longer timeout for initial navigation
    test.setTimeout(60000);

    // Try to navigate to main page first
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Check if we're redirected to login
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Take screenshot for debugging
    await page.screenshot({ path: 'homepage-screenshot.png' });

    // If we're on login page, fill the form
    if (currentUrl.includes('login') || currentUrl.includes('main-login')) {
      console.log('On login page, attempting to login...');

      // Wait for email input to be visible
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      await page.fill('input[type="email"]', 'akwan@pennineindustries.com');
      await page.fill('input[type="password"]', 'X315Y316');

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForURL('**/admin/**', { timeout: 15000 });
    }

    // Navigate to admin dashboard
    console.log('Navigating to admin dashboard...');
    await page.goto('http://localhost:3000/admin/injection', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for widget to load
    console.log('Waiting for widget...');
    const widgetTitle = page.locator('text=Inventory Ordered Analysis').first();
    await expect(widgetTitle).toBeVisible({ timeout: 20000 });

    console.log('Test completed successfully!');
  });
});
