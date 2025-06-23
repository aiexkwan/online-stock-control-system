const { test, expect } = require('@playwright/test');

test.describe('Sidebar Navigation', () => {
  test('Login and verify sidebar navigation', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/main-login');
    
    // Login with provided credentials
    await page.fill('input[type="email"]', 'akwan@pennineindustries.com');
    await page.fill('input[type="password"]', 'X315Y316');
    await page.press('input[type="password"]', 'Enter');
    
    // Wait for navigation
    await page.waitForURL('**/home', { timeout: 30000 });
    
    // Check if sidebar is visible
    const sidebar = page.locator('div').filter({ hasText: 'Pennine Stock' }).first();
    await expect(sidebar).toBeVisible();
    
    // Test navigation links
    console.log('Testing Print Labels link...');
    const printLabelLink = page.locator('a[href="/print-label"]');
    if (await printLabelLink.isVisible()) {
      await printLabelLink.click();
      await page.waitForURL('**/print-label');
      console.log('✅ Successfully navigated to Print Label page');
      
      // Verify print label sidebar
      const printSidebar = page.locator('div').filter({ hasText: 'Print Labels' }).first();
      await expect(printSidebar).toBeVisible();
      console.log('✅ Print Label sidebar is visible');
    }
    
    // Go back to home
    await page.goto('http://localhost:3000/home');
    
    // Test Stock Transfer link
    console.log('Testing Stock Transfer link...');
    const stockTransferLink = page.locator('a[href="/stock-transfer"]');
    if (await stockTransferLink.isVisible()) {
      await stockTransferLink.click();
      await page.waitForURL('**/stock-transfer');
      console.log('✅ Successfully navigated to Stock Transfer page');
    }
    
    // Test logout
    console.log('Testing logout functionality...');
    const logoutButton = page.locator('button').filter({ hasText: 'Logout' });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('**/main-login');
      console.log('✅ Successfully logged out');
    }
  });
});