import { test, expect } from '@playwright/test';

// Test configuration from environment variables
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const LOGIN_EMAIL = process.env.TEST_LOGIN_EMAIL || process.env.SYS_LOGIN || '';
const LOGIN_PASSWORD = process.env.TEST_LOGIN_PASSWORD || process.env.SYS_PASSWORD || '';

// Validate required environment variables
if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  throw new Error('Test credentials not found. Please set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD in .env.test.local');
}

test.describe('Simple Stock Transfer Test', () => {
  test('Single stock transfer', async ({ page }) => {
    // Login
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/main-login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15000 });
    console.log('Logged in successfully');
    
    // Navigate to Stock Transfer
    console.log('Navigating to Stock Transfer...');
    await page.waitForTimeout(2000);
    
    // Click Operation tab - use first one with exact text
    const operationTab = await page.getByRole('button', { name: 'Operation', exact: true }).first();
    if (await operationTab.isVisible()) {
      await operationTab.click();
      console.log('Clicked Operation tab');
      await page.waitForTimeout(1000);
    }
    
    // Click Stock Transfer - use role button to get the clickable element
    await page.getByRole('button', { name: 'Stock Transfer', exact: true }).click();
    console.log('Clicked Stock Transfer');
    await page.waitForTimeout(2000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'stock-transfer-page.png', fullPage: true });
    console.log('Screenshot saved as stock-transfer-page.png');
    
    // Try to find destination options
    console.log('Looking for destination options...');
    
    // Look for any visible text containing our destinations
    const destinations = ['Fold Mill', 'Production', 'PipeLine'];
    for (const dest of destinations) {
      const element = await page.getByText(dest, { exact: true }).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`Found destination option: ${dest}`);
      }
    }
    
    // Try to select Fold Mill
    try {
      await page.getByText('Fold Mill', { exact: true }).click();
      console.log('Selected Fold Mill');
    } catch (e) {
      console.log('Could not select Fold Mill');
    }
    
    // Enter operator number
    console.log('Entering operator number...');
    const operatorInput = await page.getByPlaceholder(/clock number|operator/i).first();
    if (await operatorInput.isVisible()) {
      await operatorInput.fill('5997');
      console.log('Entered operator 5997');
      await page.waitForTimeout(2000);
    }
    
    // Enter pallet number
    console.log('Entering pallet number...');
    const palletInput = await page.getByPlaceholder(/pallet|scan/i).first();
    if (await palletInput.isVisible()) {
      await palletInput.fill('110825/22');
      console.log('Entered pallet 110825/22, clicking search button...');
      
      // Find and click the search/magnifying glass button
      const searchButton = await page.getByRole('button').filter({ has: page.locator('svg') }).last();
      await searchButton.click();
      console.log('Clicked search button, waiting for transfer to complete...');
      await page.waitForTimeout(5000); // Wait longer for transfer to complete
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'stock-transfer-final.png', fullPage: true });
    console.log('Final screenshot saved');
    
    // Check for success or error messages
    const successMsg = await page.getByText(/success|transferred|moved/i).first();
    if (await successMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Transfer successful!');
    } else {
      console.log('No success message found');
    }
  });
});