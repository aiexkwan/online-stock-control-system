const puppeteer = require('puppeteer');

async function testManualWidgetAdd() {
  console.log('🚀 Testing manual widget addition with detailed logging...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    devtools: true // Open DevTools
  });

  try {
    const page = await browser.newPage();
    
    // Enable all console logging
    page.on('console', msg => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
    
    // Login
    console.log('\n📍 Logging in...');
    await page.goto('http://localhost:3000/main-login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Enter edit mode
    console.log('\n🎨 Entering edit mode...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) {
        console.log('Clicking Edit Dashboard button');
        editBtn.click();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click Add Widget
    console.log('\n➕ Clicking Add Widget...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) {
        console.log('Clicking Add Widget button');
        addBtn.click();
      } else {
        console.error('Add Widget button not found');
      }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if dialog is open
    const dialogState = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const dialogContent = dialog?.textContent || '';
      return {
        isOpen: !!dialog,
        hasTitle: dialogContent.includes('Add Widget'),
        widgetCount: document.querySelectorAll('.grid-cols-2 button').length
      };
    });
    
    console.log('\n📋 Dialog state:');
    console.log(`  Dialog open: ${dialogState.isOpen ? '✅' : '❌'}`);
    console.log(`  Has title: ${dialogState.hasTitle ? '✅' : '❌'}`);
    console.log(`  Widget options: ${dialogState.widgetCount}`);

    if (dialogState.isOpen) {
      // Click first widget option
      console.log('\n🎯 Selecting Production Statistics...');
      await page.evaluate(() => {
        const widgetButtons = Array.from(document.querySelectorAll('.grid-cols-2 button'));
        const productionBtn = widgetButtons.find(btn => btn.textContent?.includes('Production Statistics'));
        if (productionBtn) {
          console.log('Clicking Production Statistics');
          productionBtn.click();
        } else {
          console.error('Production Statistics button not found');
          // Click first available widget
          if (widgetButtons[0]) {
            console.log('Clicking first widget option');
            widgetButtons[0].click();
          }
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Select 5×5 size
      console.log('\n📏 Selecting 5×5 size...');
      const sizeSelected = await page.evaluate(() => {
        // Try different selectors
        const sizeButtons = Array.from(document.querySelectorAll('button'));
        const largeBtn = sizeButtons.find(btn => {
          const text = btn.textContent || '';
          return text.includes('5×5') || text.includes('Large') || text.includes('LARGE');
        });
        
        if (largeBtn) {
          console.log('Found and clicking 5×5 button');
          largeBtn.click();
          return true;
        } else {
          console.error('5×5 size button not found');
          // Log all button texts for debugging
          console.log('Available buttons:', sizeButtons.map(b => b.textContent));
          return false;
        }
      });
      
      console.log(`Size selected: ${sizeSelected ? '✅' : '❌'}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Check if widget was added
    console.log('\n🔍 Checking for widgets...');
    const widgetStatus = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      const gridstack = document.querySelector('.grid-stack');
      return {
        widgetCount: widgets.length,
        hasGridstack: !!gridstack,
        gridstackChildren: gridstack?.children.length || 0,
        firstWidgetInfo: widgets[0] ? {
          id: widgets[0].getAttribute('gs-id'),
          hasContent: !!widgets[0].querySelector('.widget-content-mount'),
          size: widgets[0].querySelector('.widget-size-badge')?.textContent
        } : null
      };
    });

    console.log('\n📊 Widget status:');
    console.log(`  Gridstack present: ${widgetStatus.hasGridstack ? '✅' : '❌'}`);
    console.log(`  Widget count: ${widgetStatus.widgetCount}`);
    console.log(`  Gridstack children: ${widgetStatus.gridstackChildren}`);
    if (widgetStatus.firstWidgetInfo) {
      console.log(`  First widget:`);
      console.log(`    ID: ${widgetStatus.firstWidgetInfo.id}`);
      console.log(`    Has content: ${widgetStatus.firstWidgetInfo.hasContent ? '✅' : '❌'}`);
      console.log(`    Size badge: ${widgetStatus.firstWidgetInfo.size || 'N/A'}`);
    }

    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/manual-widget-add-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/manual-widget-add-test.png');

    // Log any errors in console
    await page.evaluate(() => {
      console.log('=== Final page state ===');
      console.log('Dialog still open:', !!document.querySelector('[role="dialog"]'));
      console.log('Edit mode active:', document.querySelector('.gridstack-dashboard.edit-mode') !== null);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Browser open with DevTools for debugging...');
    console.log('Check Console tab for detailed logs');
    await new Promise(() => {});
  }
}

testManualWidgetAdd();