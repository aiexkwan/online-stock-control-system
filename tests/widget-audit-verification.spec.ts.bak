import { test, expect } from '@playwright/test';

test.describe('Widget Audit Verification', () => {
  test('System login and dashboard access', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/main-login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Fill login credentials
    await page.fill('input[name="email"]', 'akwan@pennineindustries.com');
    await page.fill('input[name="password"]', 'X315Y316');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/admin/**', { timeout: 10000 });

    // Verify dashboard loaded
    const dashboardElement = await page.locator('[data-testid="admin-dashboard"]').first();
    await expect(dashboardElement).toBeVisible({ timeout: 10000 });

    // Check if HistoryTree widget is visible (most used widget)
    const historyWidget = await page.locator('text=History').first();
    await expect(historyWidget).toBeVisible({ timeout: 5000 });

    // Take screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/dashboard-after-audit.png' });

    console.log('✓ Login successful');
    console.log('✓ Dashboard loaded');
    console.log('✓ Widgets visible');
  });

  test('Check multiple dashboard themes', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/main-login');
    await page.fill('input[name="email"]', 'akwan@pennineindustries.com');
    await page.fill('input[name="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });

    // Test different themes
    const themes = ['injection', 'warehouse', 'stock-management'];

    for (const theme of themes) {
      await page.goto(`http://localhost:3000/admin/${theme}`);
      await page.waitForLoadState('networkidle');

      // Verify page loaded
      const pageTitle = await page.title();
      console.log(`✓ ${theme} theme loaded - Title: ${pageTitle}`);

      // Take screenshot
      await page.screenshot({ path: `tests/screenshots/dashboard-${theme}.png` });
    }
  });
});
