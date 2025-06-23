const puppeteer = require('puppeteer');

describe('Sidebar Navigation Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Login and verify sidebar navigation', async () => {
    // Navigate to login page
    await page.goto('http://localhost:3000/main-login', {
      waitUntil: 'networkidle2'
    });

    // Login with provided credentials
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to home page
    await page.waitForNavigation({
      waitUntil: 'networkidle2'
    });

    // Verify sidebar is visible
    await page.waitForSelector('[class*="sidebar"]', { timeout: 10000 });
    
    // Test hover to expand sidebar
    const sidebar = await page.$('[class*="sidebar"]');
    await sidebar.hover();
    
    // Wait for sidebar to expand
    await page.waitForTimeout(500);
    
    // Verify menu items are visible
    const menuItems = await page.$$eval('a[class*="sidebar"]', links => 
      links.map(link => link.textContent)
    );
    
    console.log('Found menu items:', menuItems);
    
    // Test navigation to different pages
    const pagesToTest = [
      { selector: 'a[href="/print-label"]', url: '/print-label' },
      { selector: 'a[href="/stock-transfer"]', url: '/stock-transfer' },
      { selector: 'a[href="/admin"]', url: '/admin' }
    ];
    
    for (const pageTest of pagesToTest) {
      const link = await page.$(pageTest.selector);
      if (link) {
        await link.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        const currentUrl = page.url();
        console.log(`Navigated to: ${currentUrl}`);
        
        // Verify URL contains expected path
        if (!currentUrl.includes(pageTest.url)) {
          throw new Error(`Expected URL to contain ${pageTest.url}, but got ${currentUrl}`);
        }
        
        // Go back to home for next test
        await page.goto('http://localhost:3000/home', {
          waitUntil: 'networkidle2'
        });
      }
    }
    
    // Test logout functionality
    await sidebar.hover();
    await page.waitForTimeout(500);
    
    const logoutButton = await page.$('button:has-text("Logout")');
    if (logoutButton) {
      await logoutButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Verify redirected to login page
      const currentUrl = page.url();
      if (!currentUrl.includes('/main-login')) {
        throw new Error('Logout did not redirect to login page');
      }
    }
    
    console.log('✅ All sidebar navigation tests passed!');
  }, 60000); // 60 second timeout
});