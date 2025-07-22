import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

/**
 * Admin Analysis Page Error Check Test
 *
 * This test specifically checks for JavaScript errors on the admin/analysis page,
 * particularly the "TypeError: undefined is not an object (evaluating 'originalFactory.call')" error
 * that was reported in the enhanced-registry.ts file.
 */
test.describe('Admin Analysis Page - Error Monitoring', () => {
  let loginPage: LoginPage;
  let consoleMessages: string[] = [];
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    errors = [];

    // Listen for console messages
    page.on('console', msg => {
      const message = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(message);

      // Capture warnings about critical dependencies
      if (
        msg.text().includes('Critical dependency') ||
        msg.text().includes('the request of a dependency')
      ) {
        console.log('🚨 Critical dependency warning:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      const errorMessage = error.message;
      errors.push(errorMessage);
      console.log('🚨 Page error:', errorMessage);
    });

    // Listen for response failures
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
      }
    });

    loginPage = new LoginPage(page);
  });

  test('should login and navigate to admin/analysis without originalFactory.call error', async ({
    page,
  }) => {
    console.log('🚀 Starting admin/analysis error check test...');

    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page');
    await loginPage.goto();
    await expect(page).toHaveURL(/\/main-login/);

    // Step 2: Login with provided credentials
    console.log('📍 Step 2: Logging in with credentials');
    const email = 'akwan@pennineindustries.com';
    const password = 'X315Y316';

    await loginPage.login(email, password);

    // Wait for successful login - should redirect to /access
    console.log('📍 Step 3: Waiting for successful login');
    await page.waitForURL(/\/access/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/access/);
    console.log('✅ Login successful');

    // Step 4: Navigate to admin/analysis page
    console.log('📍 Step 4: Navigating to admin/analysis page');
    await page.goto('/admin/analysis');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Step 5: Check if page loaded successfully
    console.log('📍 Step 5: Checking if admin/analysis page loaded');
    await expect(page).toHaveURL(/\/admin\/analysis/);

    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(3000);

    // Step 6: Take screenshot
    console.log('📍 Step 6: Taking screenshot');
    await page.screenshot({
      path: 'test-results/admin-analysis-page.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved to test-results/admin-analysis-page.png');

    // Step 7: Check for specific JavaScript errors
    console.log('📍 Step 7: Analyzing console messages and errors');

    // Check for the specific originalFactory.call error
    const originalFactoryError = errors.find(
      error =>
        error.includes('originalFactory.call') || error.includes('undefined is not an object')
    );

    // Check for critical dependency warnings
    const criticalDependencyWarnings = consoleMessages.filter(
      msg => msg.includes('Critical dependency') || msg.includes('the request of a dependency')
    );

    // Log all console messages for debugging
    console.log('\n📝 Console Messages Summary:');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Total errors: ${errors.length}`);
    console.log(`Critical dependency warnings: ${criticalDependencyWarnings.length}`);

    if (consoleMessages.length > 0) {
      console.log('\n📄 Recent console messages:');
      consoleMessages.slice(-10).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n🚨 JavaScript Errors:');
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    if (criticalDependencyWarnings.length > 0) {
      console.log('\n⚠️ Critical Dependency Warnings:');
      criticalDependencyWarnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }

    // Step 8: Assert that the specific error is NOT present
    expect(originalFactoryError, 'originalFactory.call error should be resolved').toBeUndefined();

    // Step 9: Check that the page loaded without major errors
    const hasPageTitle = await page.title();
    expect(hasPageTitle).toBeTruthy();
    console.log(`📄 Page title: "${hasPageTitle}"`);

    // Check if main content is visible (look for common dashboard elements)
    const hasMainContent =
      (await page.locator('main, [role="main"], .dashboard, .admin-content').count()) > 0;
    expect(hasMainContent, 'Admin analysis page should have main content').toBe(true);

    console.log(
      '✅ Test completed successfully - admin/analysis page loaded without originalFactory.call error'
    );
  });

  test('should monitor for specific webpack/module loading errors', async ({ page }) => {
    console.log('🔍 Starting specific webpack error monitoring...');

    // Navigate and login
    await loginPage.goto();
    await loginPage.login('akwan@pennineindustries.com', 'X315Y316');
    await page.waitForURL(/\/access/);

    // Navigate to admin/analysis
    await page.goto('/admin/analysis');
    await page.waitForLoadState('networkidle');

    // Wait for potential lazy-loaded modules
    await page.waitForTimeout(5000);

    // Check for specific error patterns related to dynamic imports
    const moduleErrors = errors.filter(
      error =>
        error.includes('Cannot read') ||
        error.includes('undefined is not') ||
        error.includes('originalFactory') ||
        error.includes('dynamic import') ||
        error.includes('registry')
    );

    console.log('\n🔍 Module-related errors found:', moduleErrors.length);
    moduleErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });

    // The test should pass if no module-related errors are found
    expect(moduleErrors).toHaveLength(0);

    console.log('✅ No module-related errors detected');
  });

  test.afterEach(async ({ page }) => {
    // Generate test report
    const report = {
      timestamp: new Date().toISOString(),
      consoleMessages: consoleMessages.length,
      errors: errors.length,
      criticalWarnings: consoleMessages.filter(msg => msg.includes('Critical dependency')).length,
      specificErrors: {
        originalFactoryCall: errors.filter(e => e.includes('originalFactory.call')).length,
        undefinedIsNotObject: errors.filter(e => e.includes('undefined is not an object')).length,
      },
      allErrors: errors,
      recentConsoleMessages: consoleMessages.slice(-20),
    };

    console.log('\n📊 Final Test Report:');
    console.log('====================');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Console Messages: ${report.consoleMessages}`);
    console.log(`JavaScript Errors: ${report.errors}`);
    console.log(`Critical Warnings: ${report.criticalWarnings}`);
    console.log(`originalFactory.call errors: ${report.specificErrors.originalFactoryCall}`);
    console.log(`undefined is not object errors: ${report.specificErrors.undefinedIsNotObject}`);
    console.log('====================\n');
  });
});
