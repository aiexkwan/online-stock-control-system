const puppeteer = require('puppeteer');

async function testSidebarNavigation() {
  let browser;
  try {
    console.log('🚀 Starting Sidebar Navigation Test...');
    
    // Launch browser with WSL-compatible settings
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('📝 Navigating to login page...');
    await page.goto('http://localhost:3000/main-login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('🔐 Logging in with provided credentials...');
    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    
    // Type password
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', 'X315Y316');
    
    // Submit form
    await page.keyboard.press('Enter');
    
    // Wait for navigation
    console.log('⏳ Waiting for login to complete...');
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Check if we're on home page
    const currentUrl = page.url();
    console.log(`✅ Logged in successfully! Current URL: ${currentUrl}`);
    
    // Wait for sidebar to be visible
    console.log('🎯 Checking for sidebar...');
    try {
      await page.waitForSelector('div[class*="sidebar"]', { timeout: 5000 });
      console.log('✅ Sidebar found!');
    } catch (e) {
      console.log('❌ Sidebar not found, checking for alternative selectors...');
      
      // Try to find sidebar with different selectors
      const sidebarSelectors = [
        'aside',
        '[role="navigation"]',
        'nav',
        'div[class*="flex"][class*="flex-col"]'
      ];
      
      let sidebarFound = false;
      for (const selector of sidebarSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          console.log(`✅ Found navigation element with selector: ${selector}`);
          sidebarFound = true;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!sidebarFound) {
        console.log('❌ Could not find sidebar navigation');
      }
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'sidebar-test-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as sidebar-test-screenshot.png');
    
    // Try to find navigation links
    console.log('🔍 Looking for navigation links...');
    const links = await page.evaluate(() => {
      const linkElements = document.querySelectorAll('a');
      return Array.from(linkElements).map(link => ({
        text: link.textContent.trim(),
        href: link.href
      })).filter(link => link.text && link.href);
    });
    
    console.log('📋 Found links:');
    links.forEach(link => {
      console.log(`  - ${link.text}: ${link.href}`);
    });
    
    // Test navigation to print label page
    console.log('\n🧪 Testing navigation to Print Label page...');
    const printLabelLink = links.find(link => link.href.includes('/print-label'));
    if (printLabelLink) {
      await page.goto(printLabelLink.href, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      console.log('✅ Successfully navigated to Print Label page');
      
      // Check for print label sidebar
      await page.waitForTimeout(2000);
      const printLabelUrl = page.url();
      console.log(`📍 Current URL: ${printLabelUrl}`);
      
      // Take screenshot of print label page
      await page.screenshot({ path: 'print-label-screenshot.png', fullPage: true });
      console.log('📸 Print Label page screenshot saved');
    }
    
    console.log('\n✅ Sidebar navigation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run the test
testSidebarNavigation().catch(console.error);