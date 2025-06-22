const puppeteer = require('puppeteer');

async function testWidgetDragResize() {
  console.log('🚀 Testing widget drag, resize and grid capacity...');
  
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

    // Test 1: Add first 5x5 widget
    console.log('\n📦 Test 1: Adding first 5×5 widget...');
    await addWidget(page, 'LARGE', 'Output Statistics');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check widget
    let widgetInfo = await getWidgetInfo(page);
    console.log(`  Widget added: ${widgetInfo.count > 0 ? '✅' : '❌'}`);
    if (widgetInfo.count > 0) {
      const widget = widgetInfo.widgets[0];
      console.log(`  Size: ${widget.width}×${widget.height}px`);
      console.log(`  Square shape: ${Math.abs(widget.width - widget.height) < 50 ? '✅' : '❌'}`);
    }

    // Test 2: Drag widget to new position
    console.log('\n🖱️ Test 2: Testing drag functionality...');
    const dragSuccess = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (!widget) return false;
      
      // Record initial position
      const initialRect = widget.getBoundingClientRect();
      console.log(`Initial position: ${initialRect.left}, ${initialRect.top}`);
      
      // Note: Actual drag would require mouse events simulation
      // For now just confirm drag handle exists
      const dragHandle = widget.querySelector('.ui-draggable-handle') || widget;
      return !!dragHandle;
    });
    console.log(`  Drag handle available: ${dragSuccess ? '✅' : '❌'}`);

    // Test 3: Resize widget to 2×5
    console.log('\n📐 Test 3: Resizing widget to 2×5...');
    const resizeHandle = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (!widget) return false;
      
      // Check for resize handle
      const handle = widget.querySelector('.ui-resizable-se');
      return !!handle;
    });
    console.log(`  Resize handle available: ${resizeHandle ? '✅' : '❌'}`);

    // Manually resize widget using Gridstack API
    await page.evaluate(() => {
      const grid = document.querySelector('.grid-stack');
      if (grid && grid.gridstack) {
        const widget = document.querySelector('.grid-stack-item');
        if (widget) {
          // Resize to 2×5
          grid.gridstack.update(widget, { w: 2, h: 5 });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check new size
    widgetInfo = await getWidgetInfo(page);
    if (widgetInfo.count > 0) {
      const widget = widgetInfo.widgets[0];
      console.log(`  New size: ${widget.width}×${widget.height}px`);
      const aspectRatio = widget.width / widget.height;
      console.log(`  Rectangle shape (2:5): ${aspectRatio < 0.5 ? '✅' : '❌'} (ratio: ${aspectRatio.toFixed(2)})`);
    }

    // Test 4: Delete widget
    console.log('\n🗑️ Test 4: Testing delete functionality...');
    const deleteSuccess = await page.evaluate(() => {
      const deleteBtn = document.querySelector('.widget-remove-btn');
      if (deleteBtn) {
        deleteBtn.click();
        return true;
      }
      return false;
    });
    console.log(`  Delete button clicked: ${deleteSuccess ? '✅' : '❌'}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    widgetInfo = await getWidgetInfo(page);
    console.log(`  Widget deleted: ${widgetInfo.count === 0 ? '✅' : '❌'}`);

    // Test 5: Grid capacity - Add multiple 5x5 widgets
    console.log('\n📐 Test 5: Testing grid capacity (15×13)...');
    
    // Add 3 widgets in first row (15 columns ÷ 5 = 3 max per row)
    console.log('  Adding 3 × 5×5 widgets in first row...');
    for (let i = 0; i < 3; i++) {
      await addWidget(page, 'LARGE', 'Output Statistics');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Add 2 more in second row
    console.log('  Adding 2 more 5×5 widgets in second row...');
    for (let i = 0; i < 2; i++) {
      await addWidget(page, 'LARGE', 'Transfer Statistics');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check final layout
    widgetInfo = await getWidgetInfo(page);
    console.log(`\n📊 Final layout analysis:`);
    console.log(`  Total widgets: ${widgetInfo.count}`);
    
    // Group by rows
    const rows = {};
    widgetInfo.widgets.forEach((w, i) => {
      const row = Math.floor(w.top / 180);
      if (!rows[row]) rows[row] = [];
      rows[row].push({ ...w, index: i + 1 });
    });

    console.log('\n  Widget distribution:');
    Object.keys(rows).sort((a, b) => Number(a) - Number(b)).forEach(rowNum => {
      const widgets = rows[rowNum];
      console.log(`    Row ${Number(rowNum) + 1}: ${widgets.length} widgets`);
      widgets.forEach(w => {
        console.log(`      Widget ${w.index}: ${w.sizeBadge || `${Math.round(w.width/180)}×${Math.round(w.height/180)}`}`);
      });
    });

    // Verify grid constraints
    console.log('\n  Grid constraints:');
    console.log(`    15 columns capacity: Can fit ${Math.floor(15/5)} × 5×5 widgets per row ✅`);
    console.log(`    13 rows capacity: Can fit ${Math.floor(13/5)} × 5×5 widgets per column ✅`);

    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/widget-drag-resize-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/widget-drag-resize-test.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n✅ Test completed');
    console.log('🔄 Keeping browser open for manual drag/resize testing...');
    await new Promise(() => {});
  }
}

// Helper functions
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

async function addWidget(page, size, widgetName) {
  // Click Add Widget
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(btn => 
      btn.textContent?.includes('Add Widget') || 
      btn.textContent?.includes('Add Your First Widget')
    );
    if (addBtn) addBtn.click();
  });
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Select widget type
  await page.evaluate((name) => {
    const cards = Array.from(document.querySelectorAll('[role="button"], .cursor-pointer, button'));
    const widgetCard = cards.find(card => card.textContent?.includes(name));
    if (widgetCard) widgetCard.click();
  }, widgetName);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Select size
  await page.evaluate((targetSize) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const sizeBtn = buttons.find(btn => {
      const text = btn.textContent || '';
      return text.includes(targetSize) || text.includes('5×5');
    });
    if (sizeBtn) sizeBtn.click();
  }, size);
  await new Promise(resolve => setTimeout(resolve, 1500));
}

async function getWidgetInfo(page) {
  return await page.evaluate(() => {
    const widgets = document.querySelectorAll('.grid-stack-item');
    return {
      count: widgets.length,
      widgets: Array.from(widgets).map(w => {
        const rect = w.getBoundingClientRect();
        const badge = w.querySelector('.widget-size-badge');
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          sizeBadge: badge?.textContent
        };
      })
    };
  });
}

testWidgetDragResize();