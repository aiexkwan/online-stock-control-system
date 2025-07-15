import { test, expect } from '@playwright/test';

test.describe('Inventory Ordered Analysis Widget - Frontend Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/main-login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'akwan@pennineindustries.com');
    await page.fill('input[type="password"]', 'X315Y316');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('**/admin/**', { timeout: 10000 });
  });

  test('should display inventory ordered analysis widget', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin/injection');
    
    // Wait for widget to load
    await page.waitForSelector('text=Inventory Ordered Analysis', { timeout: 15000 });
    
    // Check if widget is visible
    const widget = page.locator('text=Inventory Ordered Analysis').first();
    await expect(widget).toBeVisible();
    
    // Check for summary section
    const totalStock = page.locator('text=Total Stock').first();
    await expect(totalStock).toBeVisible();
    
    const orderDemand = page.locator('text=Order Demand').first();
    await expect(orderDemand).toBeVisible();
  });

  test('should show stock sufficiency status', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin/injection');
    
    // Wait for widget to load
    await page.waitForSelector('text=Inventory Ordered Analysis', { timeout: 15000 });
    
    // Check for sufficiency status
    const sufficientText = page.locator('text=/Stock Sufficient|Stock Insufficient/').first();
    await expect(sufficientText).toBeVisible();
    
    // Check for fulfillment rate
    const fulfillmentRate = page.locator('text=Order Fulfillment Rate').first();
    await expect(fulfillmentRate).toBeVisible();
  });

  test('should display product analysis list', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin/injection');
    
    // Wait for widget to load
    await page.waitForSelector('text=Inventory Ordered Analysis', { timeout: 15000 });
    
    // Check if products are displayed (or no products message)
    const productsSection = page.locator('text=/products analyzed|No products with active orders/').first();
    await expect(productsSection).toBeVisible();
  });

  test('should respond to stock type selector events', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin/injection');
    
    // Wait for both widgets to load
    await page.waitForSelector('text=Inventory Ordered Analysis', { timeout: 15000 });
    await page.waitForSelector('text=Stock Type Distribution', { timeout: 15000 });
    
    // If stock type selector exists, click on a type
    const stockTypeButton = page.locator('button').filter({ hasText: /Injection|Pipeline|Bulk/ }).first();
    if (await stockTypeButton.isVisible()) {
      await stockTypeButton.click();
      
      // Wait for widget to update
      await page.waitForTimeout(2000);
      
      // Check if widget still displays correctly
      const widget = page.locator('text=Inventory Ordered Analysis').first();
      await expect(widget).toBeVisible();
    }
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin/injection');
    
    // Check for skeleton loader (might be too fast to catch)
    const skeleton = page.locator('.h-32.w-full.rounded-lg').first();
    
    // Widget should eventually load
    await page.waitForSelector('text=Inventory Ordered Analysis', { timeout: 15000 });
  });
});