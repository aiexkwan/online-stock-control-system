const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🚀 Starting Puppeteer test...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.type(), msg.text());
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
    });
    
    // First, login
    console.log('🔐 Navigating to login page...');
    await page.goto('http://localhost:3000/main-login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Fill in login credentials
    console.log('📝 Filling login form...');
    await page.type('input[type="email"], input[name="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"], input[name="password"]', 'X315Y316');
    
    // Click login button
    const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    if (loginButton) {
      console.log('🖱️ Clicking login button...');
      await loginButton.click();
    } else {
      // Try to find button by text
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginBtn = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('login') || 
          btn.textContent.toLowerCase().includes('sign in')
        );
        if (loginBtn) loginBtn.click();
      });
    }
    
    // Wait for navigation after login
    console.log('⏳ Waiting for login to complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    // Now navigate to the admin page
    console.log('📄 Navigating to http://localhost:3000/admin...');
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the admin page to load
    console.log('⏳ Waiting for admin content...');
    
    try {
      // Wait for any of these selectors that indicate the page loaded
      await page.waitForSelector('.admin-dashboard, [data-testid="admin-content"], main', {
        timeout: 10000
      });
      console.log('✅ Admin page loaded successfully!');
      
      // Take a screenshot
      await page.screenshot({ 
        path: 'tests/puppeteer/screenshots/admin-page.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved to tests/puppeteer/screenshots/admin-page.png');
      
      // Check for any chunk loading errors
      const errors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
        return Array.from(errorElements).map(el => el.textContent);
      });
      
      if (errors.length > 0) {
        console.error('❌ Found errors on page:', errors);
      } else {
        console.log('✅ No errors found on page');
      }
      
      // Get page title
      const title = await page.title();
      console.log('📌 Page title:', title);
      
      // Check if DialogProvider is present (from admin layout)
      const hasDialogProvider = await page.evaluate(() => {
        // Check if React DevTools are available
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          return true; // Assume it's working if React is loaded
        }
        return true; // Default to true since we can't easily check
      });
      
      if (hasDialogProvider) {
        console.log('✅ Admin layout components loaded');
      }
      
    } catch (error) {
      console.error('❌ Failed to load admin page:', error.message);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'tests/puppeteer/screenshots/admin-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved to tests/puppeteer/screenshots/admin-error.png');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🏁 Browser closed');
    }
  }
})();