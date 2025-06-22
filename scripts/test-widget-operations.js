const puppeteer = require('puppeteer');

async function testWidgetOperations() {
  console.log('🚀 Testing widget operations...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('widget')) {
        console.log('Browser:', msg.text());
      }
    });
    
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

    // Enter edit mode
    console.log('\n🎨 Entering edit mode...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Add 5x5 widget
    console.log('\n📦 Test 1: Adding 5×5 widget...');
    let addSuccess = await addWidget(page, '5×5', 'Output Statistics');
    console.log(`Add 5×5 widget: ${addSuccess ? '✅' : '❌'}`);
    
    if (addSuccess) {
      // Check widget size
      const widgetInfo = await page.evaluate(() => {
        const widget = document.querySelector('.grid-stack-item');
        if (!widget) return null;
        const rect = widget.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          aspectRatio: (rect.width / rect.height).toFixed(2)
        };
      });
      
      if (widgetInfo) {
        console.log(`  Size: ${widgetInfo.width}×${widgetInfo.height}px`);
        console.log(`  Aspect ratio: ${widgetInfo.aspectRatio} ${Math.abs(widgetInfo.aspectRatio - 1) < 0.1 ? '✅ (square)' : '❌ (not square)'}`);
      }
    }

    // Test 2: Add 2x5 widget
    console.log('\n📦 Test 2: Adding 2×5 widget...');
    addSuccess = await addWidget(page, '2×5', 'Transfer Statistics');
    console.log(`Add 2×5 widget: ${addSuccess ? '✅' : '❌'}`);
    
    // Check all widgets
    const allWidgets = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      return Array.from(widgets).map(w => {
        const rect = w.getBoundingClientRect();
        const badge = w.querySelector('.widget-size-badge');
        return {
          id: w.getAttribute('gs-id'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          aspectRatio: (rect.width / rect.height).toFixed(2),
          sizeBadge: badge?.textContent || 'N/A'
        };
      });
    });

    console.log('\n📊 All widgets on dashboard:');
    allWidgets.forEach((widget, i) => {
      console.log(`Widget ${i + 1}:`);
      console.log(`  Size: ${widget.width}×${widget.height}px`);
      console.log(`  Badge: ${widget.sizeBadge}`);
      console.log(`  Aspect: ${widget.aspectRatio} ${widget.aspectRatio < 0.5 ? '(tall rectangle)' : widget.aspectRatio > 0.9 ? '(square)' : '(rectangle)'}`);
    });

    // Test 3: Delete widget
    console.log('\n🗑️ Test 3: Testing delete functionality...');
    const widgetsBefore = await page.evaluate(() => document.querySelectorAll('.grid-stack-item').length);
    
    // Click delete on first widget
    await page.evaluate(() => {
      const deleteBtn = document.querySelector('.widget-remove-btn');
      if (deleteBtn) deleteBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const widgetsAfter = await page.evaluate(() => document.querySelectorAll('.grid-stack-item').length);
    console.log(`Widgets before delete: ${widgetsBefore}`);
    console.log(`Widgets after delete: ${widgetsAfter}`);
    console.log(`Delete successful: ${widgetsAfter < widgetsBefore ? '✅' : '❌'}`);

    // Test 4: Grid capacity - Add multiple 5x5 widgets
    console.log('\n📐 Test 4: Testing grid capacity (15×13)...');
    console.log('Adding 4 more 5×5 widgets to test row capacity...');
    
    for (let i = 0; i < 4; i++) {
      await addWidget(page, '5×5', 'Output Statistics');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check widget positions
    const gridInfo = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      const grid = document.querySelector('.grid-stack');
      return {
        totalWidgets: widgets.length,
        gridWidth: grid?.getBoundingClientRect().width,
        widgets: Array.from(widgets).map(w => {
          const rect = w.getBoundingClientRect();
          const badge = w.querySelector('.widget-size-badge');
          return {
            sizeBadge: badge?.textContent || 'N/A',
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        })
      };
    });

    console.log(`\nTotal widgets: ${gridInfo.totalWidgets}`);
    console.log('Widget positions:');
    
    // Group by rows
    const rows = {};
    gridInfo.widgets.forEach((w, i) => {
      const row = Math.floor(w.top / 180);
      if (!rows[row]) rows[row] = [];
      rows[row].push({ ...w, index: i + 1 });
    });

    Object.keys(rows).sort((a, b) => Number(a) - Number(b)).forEach(rowNum => {
      console.log(`\nRow ${Number(rowNum) + 1}:`);
      rows[rowNum].forEach(w => {
        console.log(`  Widget ${w.index} (${w.sizeBadge}): Left=${w.left}px`);
      });
    });

    // Calculate max widgets per row (15 columns, 5×5 takes 5 columns + margins)
    const maxWidgetsPerRow = Math.floor(15 / 5);
    console.log(`\n📏 Grid capacity analysis:`);
    console.log(`  Max 5×5 widgets per row: ${maxWidgetsPerRow} (15 columns ÷ 5 = 3)`);
    console.log(`  Max 5×5 widgets per column: 2 (13 rows ÷ 5 = 2.6)`);

    // Take final screenshot
    await page.screenshot({ 
      path: '/tmp/widget-operations-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/widget-operations-test.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n✅ All tests completed');
    console.log('🔄 Keeping browser open for manual inspection...');
    await new Promise(() => {});
  }
}

// Helper function to add widget
async function addWidget(page, size, widgetName) {
  try {
    // Click Add Widget
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Select size
    await page.evaluate((targetSize) => {
      const sizeButtons = Array.from(document.querySelectorAll('button'));
      const sizeBtn = sizeButtons.find(btn => {
        const text = btn.textContent || '';
        return text.includes(targetSize);
      });
      if (sizeBtn) sizeBtn.click();
    }, size);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Select widget
    await page.evaluate((name) => {
      const cards = Array.from(document.querySelectorAll('[role="button"], .cursor-pointer'));
      const widgetCard = cards.find(card => card.textContent?.includes(name));
      if (widgetCard) widgetCard.click();
    }, widgetName);
    await new Promise(resolve => setTimeout(resolve, 2000));

    return true;
  } catch (error) {
    console.error('Error adding widget:', error);
    return false;
  }
}

testWidgetOperations();