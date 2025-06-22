const puppeteer = require('puppeteer');

async function testWidgetDialog() {
  console.log('🚀 Testing simplified widget dialog...');
  
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

    // Clear existing dashboard if any
    console.log('\n🧹 Clearing dashboard...');
    await clearDashboard(page);

    // Enter edit mode
    console.log('\n🎨 Entering edit mode...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Open widget dialog
    console.log('\n📦 Test 1: Opening widget dialog...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => 
        btn.textContent?.includes('Add Widget') || 
        btn.textContent?.includes('Add Your First Widget')
      );
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check dialog content
    const dialogInfo = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { found: false };

      const title = dialog.querySelector('h2')?.textContent;
      const description = dialog.querySelector('[id*="description"]')?.textContent;
      const tipText = dialog.querySelector('.bg-blue-500\\/10')?.textContent;
      
      // Count widget options
      const widgetButtons = dialog.querySelectorAll('button.p-4');
      const widgetNames = Array.from(widgetButtons).map(btn => 
        btn.querySelector('.font-medium')?.textContent || ''
      );

      // Check for size selection elements (should not exist)
      const sizeButtons = dialog.querySelectorAll('button.p-6');
      const hasSizeSelection = sizeButtons.length > 0;

      return {
        found: true,
        title,
        description,
        tipText,
        widgetCount: widgetButtons.length,
        widgetNames,
        hasSizeSelection
      };
    });

    console.log('\n📊 Dialog Analysis:');
    console.log(`  Dialog found: ${dialogInfo.found ? '✅' : '❌'}`);
    if (dialogInfo.found) {
      console.log(`  Title: "${dialogInfo.title}"`);
      console.log(`  Description: "${dialogInfo.description}"`);
      console.log(`  Tip message: ${dialogInfo.tipText ? '✅' : '❌'} "${dialogInfo.tipText}"`);
      console.log(`  Widget options: ${dialogInfo.widgetCount}`);
      console.log(`  Size selection removed: ${!dialogInfo.hasSizeSelection ? '✅' : '❌'}`);
    }

    // Test 2: Click a widget to add
    console.log('\n🖱️ Test 2: Adding widget (should use default 3×3 size)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.p-4'));
      const outputStatsBtn = buttons.find(btn => 
        btn.textContent?.includes('Output Statistics')
      );
      if (outputStatsBtn) outputStatsBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check widget was added
    const widgetInfo = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      if (widgets.length === 0) return { count: 0 };

      const widget = widgets[0];
      const badge = widget.querySelector('.widget-size-badge');
      const rect = widget.getBoundingClientRect();
      
      return {
        count: widgets.length,
        sizeBadge: badge?.textContent,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        isSquare: Math.abs(rect.width - rect.height) < 50
      };
    });

    console.log('\n📏 Widget Analysis:');
    console.log(`  Widget added: ${widgetInfo.count > 0 ? '✅' : '❌'}`);
    if (widgetInfo.count > 0) {
      console.log(`  Size badge shows: ${widgetInfo.sizeBadge}`);
      console.log(`  Actual size: ${widgetInfo.width}×${widgetInfo.height}px`);
      console.log(`  Default 3×3 size: ${widgetInfo.sizeBadge === '3 × 3' ? '✅' : '❌'}`);
      console.log(`  Square shape: ${widgetInfo.isSquare ? '✅' : '❌'}`);
    }

    // Test 3: Try to resize widget
    console.log('\n🔧 Test 3: Checking resize capability...');
    const resizeInfo = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (!widget) return { hasWidget: false };

      // Check for resize handle
      const resizeHandle = widget.querySelector('.ui-resizable-se') || 
                          widget.querySelector('.ui-resizable-handle');
      
      return {
        hasWidget: true,
        hasResizeHandle: !!resizeHandle,
        isEditMode: document.querySelector('.gridstack-dashboard.edit-mode') !== null
      };
    });

    console.log(`  Widget present: ${resizeInfo.hasWidget ? '✅' : '❌'}`);
    console.log(`  Resize handle available: ${resizeInfo.hasResizeHandle ? '✅' : '❌'}`);
    console.log(`  Edit mode active: ${resizeInfo.isEditMode ? '✅' : '❌'}`);

    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/widget-dialog-simple-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/widget-dialog-simple-test.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n✅ Test completed');
    console.log('🔄 Keeping browser open for manual testing...');
    await new Promise(() => {});
  }
}

// Helper function to clear dashboard
async function clearDashboard(page) {
  // Enter edit mode
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
    if (editBtn) editBtn.click();
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Click reset if available
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const resetBtn = buttons.find(btn => btn.textContent?.includes('Reset Dashboard'));
    if (resetBtn) resetBtn.click();
  });
  
  // Handle confirm dialog
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
}

testWidgetDialog();