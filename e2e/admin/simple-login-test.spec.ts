import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

/**
 * Simple Login and Dashboard Test
 * Verifies the enhanced-registry.ts fix for originalFactory.call error
 */
test.describe('Simple Login and Error Check', () => {
  let consoleMessages: string[] = [];
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    errors = [];

    // Listen for console messages
    page.on('console', msg => {
      const message = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(message);

      if (msg.text().includes('Critical dependency') || msg.text().includes('originalFactory')) {
        console.log('⚠️ Important message:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      const errorMessage = error.message;
      errors.push(errorMessage);
      console.log('🚨 Page error:', errorMessage);
    });
  });

  test('should login successfully and check for JavaScript errors', async ({ page }) => {
    console.log('🚀 Starting simple login test...');

    const loginPage = new LoginPage(page);

    // Step 1: Navigate to login page
    console.log('📍 Navigating to login page');
    await loginPage.goto();
    await expect(page).toHaveURL(/\/main-login/);

    // Step 2: Login
    console.log('📍 Logging in');
    await loginPage.login('akwan@pennineindustries.com', 'X315Y316');

    // Step 3: Wait for successful login
    console.log('📍 Waiting for login redirect');
    await page.waitForURL(/\/admin/, { timeout: 30000 });
    console.log('✅ Successfully logged in and redirected to /admin');

    // Step 4: Take screenshot of admin page
    console.log('📍 Taking screenshot of admin page');
    await page.screenshot({
      path: 'test-results/admin-page.png',
      fullPage: true,
    });

    // Step 5: Try to navigate to admin dashboard (not analysis which might not exist)
    console.log('📍 Navigating to admin dashboard');
    try {
      await page.goto('/admin', { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      console.log('✅ Admin page loaded successfully');

      // Take screenshot
      await page.screenshot({
        path: 'test-results/admin-dashboard.png',
        fullPage: true,
      });
    } catch (error) {
      console.log('⚠️ Admin page navigation failed:', error);
      // Continue with the test even if admin page fails
    }

    // Step 6: Wait for any lazy loading to complete
    await page.waitForTimeout(3000);

    // Step 7: Check for specific errors
    console.log('📍 Analyzing errors...');

    const originalFactoryErrors = errors.filter(
      error =>
        error.includes('originalFactory.call') ||
        error.includes("undefined is not an object (evaluating 'originalFactory.call')")
    );

    const criticalDependencyWarnings = consoleMessages.filter(msg =>
      msg.includes('Critical dependency')
    );

    // Report findings
    console.log('\n📊 Test Results Summary:');
    console.log('=======================');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total JavaScript errors: ${errors.length}`);
    console.log(`Critical dependency warnings: ${criticalDependencyWarnings.length}`);
    console.log(`originalFactory.call errors: ${originalFactoryErrors.length}`);

    if (originalFactoryErrors.length > 0) {
      console.log('\n🚨 originalFactory.call errors found:');
      originalFactoryErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ No originalFactory.call errors detected - fix is working!');
    }

    if (criticalDependencyWarnings.length > 0) {
      console.log('\n⚠️ Critical dependency warnings:');
      criticalDependencyWarnings.slice(0, 3).forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n🚨 Other JavaScript errors:');
      errors.slice(0, 5).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // The main assertion - no originalFactory.call errors
    expect(originalFactoryErrors).toHaveLength(0);

    console.log('\n✅ Test completed successfully!');
  });

  test.afterEach(async () => {
    // Generate final report
    const report = {
      timestamp: new Date().toISOString(),
      totalConsoleMessages: consoleMessages.length,
      totalErrors: errors.length,
      originalFactoryErrors: errors.filter(e => e.includes('originalFactory')).length,
      criticalWarnings: consoleMessages.filter(m => m.includes('Critical dependency')).length,
      testResult: errors.filter(e => e.includes('originalFactory')).length === 0 ? 'PASS' : 'FAIL',
    };

    console.log('\n📋 Final Report:');
    console.log('================');
    console.log(JSON.stringify(report, null, 2));
  });
});
