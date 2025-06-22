const puppeteer = require('puppeteer');

async function testFixedDashboard() {
  console.log('🚀 Testing fixed dashboard functionality...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  try {
    const page = await browser.newPage();
    
    // Login
    console.log('📍 Logging in...');
    await page.goto('http://localhost:3000/main-login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check empty dashboard message position
    console.log('\n📍 Checking empty dashboard message...');
    const emptyMessage = await page.evaluate(() => {
      const msg = document.querySelector('h2')?.textContent;
      const container = document.querySelector('.grid-stack');
      const rect = container?.getBoundingClientRect();
      return {
        message: msg,
        containerTop: rect?.top,
        messageVisible: msg?.includes('DASHBOARD IS EMPTY')
      };
    });
    
    console.log(`Empty message visible: ${emptyMessage.messageVisible ? '✅' : '❌'}`);
    console.log(`Container position from top: ${Math.round(emptyMessage.containerTop)}px`);

    // Click Edit Dashboard
    console.log('\n🎨 Testing Edit Dashboard...');
    const editClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) {
        editBtn.click();
        return true;
      }
      return false;
    });
    
    console.log(`Edit Dashboard clicked: ${editClicked ? '✅' : '❌'}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if Add Widget button is visible
    const addWidgetVisible = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent?.includes('Add Widget'));
    });
    
    console.log(`Add Widget button visible: ${addWidgetVisible ? '✅' : '❌'}`);

    // Click Add Widget
    if (addWidgetVisible) {
      console.log('\n➕ Testing Add Widget dialog...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
        if (addBtn) addBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if dialog opened
      const dialogOpen = await page.evaluate(() => {
        // Check for dialog title or widget selection options
        const dialogTitle = document.querySelector('h2')?.textContent;
        return dialogTitle?.includes('Add Widget') || 
               !!document.querySelector('[role="dialog"]') ||
               !!document.querySelector('.fixed.inset-0');
      });
      
      console.log(`Widget selection dialog opened: ${dialogOpen ? '✅' : '❌'}`);
    }

    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/fixed-dashboard-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/fixed-dashboard-test.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n✅ Test completed');
    console.log('🔄 Keeping browser open for manual inspection...');
    await new Promise(() => {});
  }
}

testFixedDashboard();