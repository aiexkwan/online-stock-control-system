const puppeteer = require('puppeteer');

async function testWidgetReset() {
  console.log('🚀 Testing widget reset and configuration...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/main-login', {
      waitUntil: 'networkidle0'
    });

    // Login
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to admin
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle0'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check localStorage data
    console.log('\n📦 Checking localStorage data...');
    const localStorageData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const dashboardKeys = keys.filter(k => k.includes('dashboard'));
      const data = {};
      dashboardKeys.forEach(key => {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      });
      return data;
    });
    
    console.log('LocalStorage dashboard data:', JSON.stringify(localStorageData, null, 2));

    // Click Edit Dashboard
    console.log('\n🎨 Entering edit mode...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reset dashboard
    console.log('\n🔄 Resetting dashboard...');
    const resetClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(btn => btn.textContent?.includes('Reset Dashboard'));
      if (resetBtn) {
        resetBtn.click();
        return true;
      }
      return false;
    });
    
    if (resetClicked) {
      console.log('✅ Reset button clicked');
      
      // Handle confirm dialog
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.on('dialog', async dialog => {
        console.log('📋 Confirm dialog:', dialog.message());
        await dialog.accept();
      });
    }

    // Now add a new 5x5 widget
    console.log('\n➕ Adding new 5×5 widget...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click Add Widget
    const addClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget') || btn.textContent?.includes('Add Your First Widget'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (addClicked) {
      console.log('✅ Add widget dialog opened');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Select LARGE size
      await page.evaluate(() => {
        const sizeButtons = Array.from(document.querySelectorAll('button'));
        const largeBtn = sizeButtons.find(btn => btn.textContent?.includes('5×5'));
        if (largeBtn) largeBtn.click();
      });
      
      // Select OUTPUT_STATS widget
      await page.evaluate(() => {
        const widgetCards = Array.from(document.querySelectorAll('.cursor-pointer'));
        const outputStats = widgetCards.find(card => card.textContent?.includes('Output Statistics'));
        if (outputStats) outputStats.click();
      });
      
      console.log('✅ Selected 5×5 Output Statistics widget');
    }

    // Wait and check final result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check widget sizes
    const finalWidgets = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      return Array.from(widgets).map(w => {
        const rect = w.getBoundingClientRect();
        return {
          id: w.getAttribute('gs-id'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          sizeBadge: w.querySelector('.widget-size-badge')?.textContent
        };
      });
    });
    
    console.log('\n📊 Final widget state:');
    finalWidgets.forEach(widget => {
      console.log(`Widget ${widget.id}:`);
      console.log(`  Actual size: ${widget.width}×${widget.height}px`);
      console.log(`  Size badge: ${widget.sizeBadge || 'N/A'}`);
      console.log(`  Height check: ${widget.height >= 900 ? '✅' : '❌'} (expected ~964px for 5×5)`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Keeping browser open for manual inspection...');
    await new Promise(() => {});
  }
}

testWidgetReset();