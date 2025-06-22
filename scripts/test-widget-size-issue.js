const puppeteer = require('puppeteer');

async function testWidgetSizeIssue() {
  console.log('🔍 Testing widget size issue...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // Quick login
    console.log('📍 Logging in...');
    await page.goto('http://localhost:3000/main-login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Go to admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clear dashboard
    console.log('🧹 Clearing dashboard...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(btn => btn.textContent?.includes('Reset Dashboard'));
      if (resetBtn) resetBtn.click();
    });
    
    page.once('dialog', async dialog => await dialog.accept());
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Enter edit mode again
    console.log('\n🎯 Testing specific widgets...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test adding different widgets
    const widgetsToTest = [
      'Production Statistics',  // Should be 3×3
      'Production History',     // Defaults to 5×5 in config
      'Transfer Statistics'     // Should be 3×3
    ];

    for (const widgetName of widgetsToTest) {
      console.log(`\n📦 Adding "${widgetName}"...`);
      
      // Open dialog
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
        if (addBtn) addBtn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Click specific widget
      const clicked = await page.evaluate((name) => {
        const buttons = Array.from(document.querySelectorAll('button.p-4'));
        const targetBtn = buttons.find(btn => btn.textContent?.includes(name));
        if (targetBtn) {
          targetBtn.click();
          return true;
        }
        return false;
      }, widgetName);

      if (!clicked) {
        console.log(`  ❌ Could not find widget "${widgetName}"`);
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check what was added
      const widgetInfo = await page.evaluate(() => {
        const widgets = document.querySelectorAll('.grid-stack-item');
        const lastWidget = widgets[widgets.length - 1];
        if (!lastWidget) return null;

        const badge = lastWidget.querySelector('.widget-size-badge');
        const rect = lastWidget.getBoundingClientRect();
        
        return {
          sizeBadge: badge?.textContent,
          actualWidth: Math.round(rect.width),
          actualHeight: Math.round(rect.height),
          gridW: lastWidget.getAttribute('gs-w'),
          gridH: lastWidget.getAttribute('gs-h')
        };
      });

      if (widgetInfo) {
        console.log(`  ✅ Added successfully`);
        console.log(`     Badge shows: ${widgetInfo.sizeBadge}`);
        console.log(`     Grid size: ${widgetInfo.gridW}×${widgetInfo.gridH}`);
        console.log(`     Actual pixels: ${widgetInfo.actualWidth}×${widgetInfo.actualHeight}`);
        console.log(`     Expected: 3×3 (from dialog)`);
        console.log(`     Correct size: ${widgetInfo.sizeBadge === '3 × 3' ? '✅' : '❌'}`);
      }
    }

    // Check dialog behavior
    console.log('\n🔍 Checking dialog behavior...');
    
    // Open dialog one more time
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log what happens in console
    await page.evaluate(() => {
      // Override onSelect to log parameters
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        console.log('Dialog found, checking for widget buttons...');
        const buttons = dialog.querySelectorAll('button.p-4');
        console.log(`Found ${buttons.length} widget buttons`);
      }
    });

    await page.screenshot({ 
      path: '/tmp/widget-size-debug.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/widget-size-debug.png');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🔄 Keeping browser open...');
    await new Promise(() => {});
  }
}

testWidgetSizeIssue();