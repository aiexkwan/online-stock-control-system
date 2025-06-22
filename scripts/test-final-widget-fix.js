const puppeteer = require('puppeteer');

async function testFinalWidgetFix() {
  console.log('🚀 Testing final widget fixes...\n');
  
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

    // Check grid configuration
    console.log('📐 Grid Configuration Check:');
    const gridConfig = await page.evaluate(() => {
      const grid = document.querySelector('.grid-stack');
      if (!grid || !grid.gridstack) return null;
      
      const opts = grid.gridstack.opts;
      const rect = grid.getBoundingClientRect();
      const totalWidth = rect.width - (opts.margin * (opts.column - 1));
      const cellWidth = totalWidth / opts.column;
      
      return {
        columns: opts.column,
        cellHeight: opts.cellHeight,
        cellWidth: Math.round(cellWidth),
        aspectRatio: (cellWidth / opts.cellHeight).toFixed(2)
      };
    });

    if (gridConfig) {
      console.log(`  Columns: ${gridConfig.columns}`);
      console.log(`  Cell Height: ${gridConfig.cellHeight}px`);
      console.log(`  Cell Width: ${gridConfig.cellWidth}px`);
      console.log(`  Aspect Ratio: ${gridConfig.aspectRatio}`);
      console.log(`  ${Math.abs(gridConfig.aspectRatio - 1) < 0.1 ? '✅ Cells are approximately square' : '❌ Cells are not square'}`);
    }

    // Clear and setup test
    console.log('\n🧹 Setting up test widgets...');
    
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

    // Test different widget sizes
    const testCases = [
      { name: 'Production Statistics', expectedSize: '3×3', resize: '5×5' },
      { name: 'Transfer Statistics', expectedSize: '3×3', resize: '1×1' }
    ];

    for (const test of testCases) {
      console.log(`\n📦 Testing "${test.name}":`);
      
      // Add widget
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
        if (addBtn) addBtn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Select widget
      await page.evaluate((name) => {
        const buttons = Array.from(document.querySelectorAll('button.p-4'));
        const targetBtn = buttons.find(btn => btn.textContent?.includes(name));
        if (targetBtn) targetBtn.click();
      }, test.name);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check initial state
      let widgetInfo = await getLastWidgetInfo(page);
      console.log(`  Initial size: ${widgetInfo.sizeBadge} (expected: ${test.expectedSize})`);
      console.log(`  Dimensions: ${widgetInfo.width}×${widgetInfo.height}px`);
      console.log(`  Aspect ratio: ${widgetInfo.aspectRatio}`);
      console.log(`  Square: ${widgetInfo.isSquare ? '✅' : '❌'}`);
      console.log(`  Content level: ${widgetInfo.contentLevel}`);

      // Resize if needed
      if (test.resize) {
        const [w, h] = test.resize.split('×').map(n => parseInt(n));
        await page.evaluate((index, w, h) => {
          const grid = document.querySelector('.grid-stack');
          const widgets = document.querySelectorAll('.grid-stack-item');
          if (grid && grid.gridstack && widgets[index]) {
            grid.gridstack.update(widgets[index], { w, h });
          }
        }, testCases.indexOf(test), w, h);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check after resize
        widgetInfo = await getLastWidgetInfo(page);
        console.log(`\n  After resize to ${test.resize}:`);
        console.log(`  Size badge: ${widgetInfo.sizeBadge}`);
        console.log(`  Dimensions: ${widgetInfo.width}×${widgetInfo.height}px`);
        console.log(`  Aspect ratio: ${widgetInfo.aspectRatio}`);
        console.log(`  Square: ${widgetInfo.isSquare ? '✅' : '❌'}`);
        console.log(`  Content level: ${widgetInfo.contentLevel}`);
        console.log(`  Has chart: ${widgetInfo.hasChart ? '✅' : '❌'} ${test.resize === '5×5' ? '(should have chart)' : ''}`);
      }
    }

    // Exit edit mode to see actual content
    console.log('\n🔍 Checking content display...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent?.includes('Save Changes'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Final check
    const finalCheck = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      return Array.from(widgets).map((widget, index) => {
        const rect = widget.getBoundingClientRect();
        const hasChart = widget.querySelector('svg') !== null || 
                        widget.querySelector('.recharts-wrapper') !== null;
        const contentText = widget.textContent || '';
        
        return {
          index,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          hasChart,
          hasContent: contentText.length > 50
        };
      });
    });

    console.log('\nFinal widget states:');
    finalCheck.forEach((widget, i) => {
      console.log(`  Widget ${i + 1}:`);
      console.log(`    Dimensions: ${widget.width}×${widget.height}px`);
      console.log(`    Has chart: ${widget.hasChart ? '✅' : '❌'}`);
      console.log(`    Has content: ${widget.hasContent ? '✅' : '❌'}`);
    });

    // Take screenshots
    await page.screenshot({ 
      path: '/tmp/widget-final-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/widget-final-test.png');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n✅ Test completed');
    console.log('🔄 Keeping browser open...');
    await new Promise(() => {});
  }
}

async function getLastWidgetInfo(page) {
  return await page.evaluate(() => {
    const widgets = document.querySelectorAll('.grid-stack-item');
    const lastWidget = widgets[widgets.length - 1];
    if (!lastWidget) return null;

    const badge = lastWidget.querySelector('.widget-size-badge');
    const rect = lastWidget.getBoundingClientRect();
    const aspectRatio = (rect.width / rect.height).toFixed(2);
    
    // Check content level indicator
    const contentLevelEl = lastWidget.querySelector('.text-blue-400.text-xs');
    const hasChart = lastWidget.querySelector('svg') !== null || 
                    lastWidget.querySelector('.recharts-wrapper') !== null;
    
    return {
      sizeBadge: badge?.textContent,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      aspectRatio,
      isSquare: Math.abs(aspectRatio - 1) < 0.1,
      contentLevel: contentLevelEl?.textContent || 'unknown',
      hasChart
    };
  });
}

testFinalWidgetFix();