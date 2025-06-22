const puppeteer = require('puppeteer');

async function testLayoutSave() {
  console.log('🔍 Testing layout save after resize...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Quick login
    await page.goto('http://localhost:3000/main-login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Clear and setup
    console.log('📦 Setting up test widget...');
    
    // Enter edit mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clear dashboard
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(btn => btn.textContent?.includes('Reset Dashboard'));
      if (resetBtn) resetBtn.click();
    });
    page.once('dialog', async dialog => await dialog.accept());
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Add a widget
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.p-4'));
      if (buttons[0]) buttons[0].click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get initial size
    let widgetInfo = await getWidgetInfo(page);
    console.log('Initial widget state:');
    console.log(`  Size badge: ${widgetInfo.sizeBadge}`);
    console.log(`  Grid size: ${widgetInfo.gsW}×${widgetInfo.gsH}`);
    console.log(`  Actual dimensions: ${widgetInfo.width}×${widgetInfo.height}px`);

    // Resize widget to 5×5
    console.log('\n📐 Resizing widget to 5×5...');
    await page.evaluate(() => {
      const grid = document.querySelector('.grid-stack');
      if (grid && grid.gridstack) {
        const widget = document.querySelector('.grid-stack-item');
        if (widget) {
          grid.gridstack.update(widget, { w: 5, h: 5 });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check after resize
    widgetInfo = await getWidgetInfo(page);
    console.log('\nAfter resize:');
    console.log(`  Size badge: ${widgetInfo.sizeBadge}`);
    console.log(`  Grid size: ${widgetInfo.gsW}×${widgetInfo.gsH}`);
    console.log(`  Actual dimensions: ${widgetInfo.width}×${widgetInfo.height}px`);

    // Save changes
    console.log('\n💾 Saving changes...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent?.includes('Save Changes'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check after save
    widgetInfo = await getWidgetInfo(page);
    console.log('\nAfter save:');
    console.log(`  Grid size: ${widgetInfo.gsW}×${widgetInfo.gsH}`);
    console.log(`  Actual dimensions: ${widgetInfo.width}×${widgetInfo.height}px`);
    console.log(`  Size preserved: ${widgetInfo.gsW === '5' && widgetInfo.gsH === '5' ? '✅' : '❌'}`);

    // Enter edit mode again to verify
    console.log('\n🔄 Re-entering edit mode to verify...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Final check
    widgetInfo = await getWidgetInfo(page);
    console.log('\nFinal verification:');
    console.log(`  Size badge: ${widgetInfo.sizeBadge}`);
    console.log(`  Grid size: ${widgetInfo.gsW}×${widgetInfo.gsH}`);
    console.log(`  Actual dimensions: ${widgetInfo.width}×${widgetInfo.height}px`);
    console.log(`  Layout saved correctly: ${widgetInfo.gsW === '5' && widgetInfo.gsH === '5' ? '✅' : '❌'}`);

    await page.screenshot({ 
      path: '/tmp/layout-save-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/layout-save-test.png');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n✅ Test completed');
    console.log('🔄 Keeping browser open...');
    await new Promise(() => {});
  }
}

async function getWidgetInfo(page) {
  return await page.evaluate(() => {
    const widget = document.querySelector('.grid-stack-item');
    if (!widget) return { found: false };

    const badge = widget.querySelector('.widget-size-badge');
    const rect = widget.getBoundingClientRect();
    
    return {
      found: true,
      sizeBadge: badge?.textContent,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      gsW: widget.getAttribute('gs-w'),
      gsH: widget.getAttribute('gs-h')
    };
  });
}

testLayoutSave();