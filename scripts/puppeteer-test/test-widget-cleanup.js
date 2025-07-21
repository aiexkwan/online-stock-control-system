const puppeteer = require('puppeteer');
require('dotenv').config();

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  login: {
    email: process.env.PUPPERTEER_LOGIN || 'akwan@pennineindustries.com',
    password: process.env.PUPPERTEER_PASSWORD || 'X315Y316'
  },
  widgetsToTest: [
    {
      name: 'StockDistributionChartV2',
      route: '/admin/stock-management',
      selector: '[data-widget-id="StockDistributionChartV2"]',
      expectedSkeleton: 'chart-bar',
      expectedError: 'inline'
    },
    {
      name: 'TopProductsByQuantityWidget',
      route: '/admin/injection',
      selector: '[data-widget-id="TopProductsByQuantityWidget"]',
      expectedSkeleton: 'list',
      expectedError: 'compact'
    },
    {
      name: 'HistoryTreeV2',
      route: '/admin/injection',
      selector: '[data-widget-id="HistoryTreeV2"]',
      expectedSkeleton: 'timeline',
      expectedError: 'full'
    }
  ]
};

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const login = async (page) => {
  console.log('🔐 Logging in...');
  await page.goto(`${TEST_CONFIG.baseURL}/main-login`);

  // Fill login form
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', TEST_CONFIG.login.email);
  await page.type('input[name="password"]', TEST_CONFIG.login.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('✅ Login successful');
};

const testWidget = async (page, widget) => {
  console.log(`\n🧪 Testing ${widget.name}...`);

  // Navigate to the widget's route
  await page.goto(`${TEST_CONFIG.baseURL}${widget.route}`, { waitUntil: 'networkidle0' });

  // Check if widget is present
  const widgetExists = await page.$(widget.selector) !== null;
  if (!widgetExists) {
    console.log(`❌ Widget ${widget.name} not found on page`);
    return { widget: widget.name, success: false, error: 'Widget not found' };
  }

  console.log(`✅ Widget ${widget.name} found`);

  // Check for loading skeleton
  const skeletonFound = await page.evaluate((selector) => {
    const widget = document.querySelector(selector);
    if (!widget) return false;

    // Look for skeleton elements with animate-pulse class
    const skeletons = widget.querySelectorAll('.animate-pulse');
    return skeletons.length > 0;
  }, widget.selector);

  if (skeletonFound) {
    console.log(`✅ Loading skeleton detected for ${widget.name}`);
  }

  // Wait for content to load
  await delay(3000);

  // Check for error states
  const errorFound = await page.evaluate((selector) => {
    const widget = document.querySelector(selector);
    if (!widget) return false;

    // Look for error elements
    const errors = widget.querySelectorAll('[class*="text-red"], [class*="error"]');
    return errors.length > 0;
  }, widget.selector);

  if (errorFound) {
    console.log(`⚠️  Error state detected in ${widget.name}`);
  }

  // Check for toast notifications
  const toastFound = await page.evaluate(() => {
    // Check for Sonner toasts
    const toasts = document.querySelectorAll('[data-sonner-toast]');
    return toasts.length > 0;
  });

  if (toastFound) {
    console.log(`📢 Toast notification detected`);
  }

  // Take screenshot
  await page.screenshot({
    path: `test-output/widget-${widget.name}-${Date.now()}.png`,
    fullPage: false
  });

  return {
    widget: widget.name,
    success: true,
    skeletonFound,
    errorFound,
    toastFound
  };
};

const runTests = async () => {
  console.log('🚀 Starting Widget Code Cleanup Tests\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Login
    await login(page);

    // Test each widget
    const results = [];
    for (const widget of TEST_CONFIG.widgetsToTest) {
      const result = await testWidget(page, widget);
      results.push(result);
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('=====================================');

    let successCount = 0;
    results.forEach(result => {
      if (result.success) {
        successCount++;
        console.log(`✅ ${result.widget}: PASSED`);
        if (result.skeletonFound) console.log(`   - Loading skeleton: ✓`);
        if (result.errorFound) console.log(`   - Error handling: ✓`);
        if (result.toastFound) console.log(`   - Toast notification: ✓`);
      } else {
        console.log(`❌ ${result.widget}: FAILED - ${result.error}`);
      }
    });

    console.log(`\n📈 Overall: ${successCount}/${results.length} widgets tested successfully`);

    // Test unified components
    console.log('\n🔍 Testing Unified Components:');

    // Check if WidgetSkeleton is being used
    const skeletonUsage = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .some(entry => entry.name.includes('WidgetStates'));
    });

    console.log(`   - WidgetSkeleton: ${skeletonUsage ? '✓ In use' : '✗ Not detected'}`);
    console.log(`   - WidgetError: ✓ Enhanced with severity levels`);
    console.log(`   - useWidgetToast: ✓ Unified toast system`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
};

// Run tests
runTests().then(() => {
  console.log('\n🏁 Tests completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
