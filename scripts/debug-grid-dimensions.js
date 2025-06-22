const puppeteer = require('puppeteer');

async function debugGridDimensions() {
  console.log('🔍 Debugging grid dimensions...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Quick login and navigation
    await page.goto('http://localhost:3000/main-login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get grid info
    console.log('📐 Grid Configuration:');
    const gridInfo = await page.evaluate(() => {
      const grid = document.querySelector('.grid-stack');
      if (!grid || !grid.gridstack) return null;
      
      const opts = grid.gridstack.opts;
      const rect = grid.getBoundingClientRect();
      
      // Calculate actual cell dimensions
      const totalWidth = rect.width - (opts.margin * (opts.column - 1));
      const cellWidth = totalWidth / opts.column;
      
      return {
        totalWidth: rect.width,
        totalHeight: rect.height,
        columns: opts.column,
        cellHeight: opts.cellHeight,
        margin: opts.margin,
        calculatedCellWidth: cellWidth,
        cellAspectRatio: cellWidth / opts.cellHeight
      };
    });

    if (gridInfo) {
      console.log(`  Grid width: ${gridInfo.totalWidth}px`);
      console.log(`  Grid columns: ${gridInfo.columns}`);
      console.log(`  Cell height: ${gridInfo.cellHeight}px`);
      console.log(`  Cell margin: ${gridInfo.margin}px`);
      console.log(`  Calculated cell width: ${gridInfo.calculatedCellWidth.toFixed(2)}px`);
      console.log(`  Cell aspect ratio: ${gridInfo.cellAspectRatio.toFixed(2)} (1.0 = square)`);
      console.log(`  ${gridInfo.cellAspectRatio > 1.1 ? '❌ Cells are wider than tall (landscape)' : 
                       gridInfo.cellAspectRatio < 0.9 ? '❌ Cells are taller than wide (portrait)' : 
                       '✅ Cells are approximately square'}`);
    }

    // Add a 5x5 widget to test
    console.log('\n📦 Adding 5×5 widget for testing...');
    
    // Clear and enter edit mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear existing widgets
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(btn => btn.textContent?.includes('Reset Dashboard'));
      if (resetBtn) resetBtn.click();
    });
    page.once('dialog', async dialog => await dialog.accept());
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add widget
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Select first widget
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.p-4'));
      if (buttons[0]) buttons[0].click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Resize to 5x5
    await page.evaluate(() => {
      const grid = document.querySelector('.grid-stack');
      if (grid && grid.gridstack) {
        const widget = document.querySelector('.grid-stack-item');
        if (widget) {
          grid.gridstack.update(widget, { w: 5, h: 5 });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Measure the widget
    console.log('\n📏 5×5 Widget Dimensions:');
    const widgetInfo = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (!widget) return null;
      
      const rect = widget.getBoundingClientRect();
      const style = window.getComputedStyle(widget);
      const contentEl = widget.querySelector('.grid-stack-item-content');
      const contentRect = contentEl?.getBoundingClientRect();
      
      return {
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.width / rect.height,
        padding: style.padding,
        margin: style.margin,
        contentWidth: contentRect?.width,
        contentHeight: contentRect?.height,
        gsW: widget.getAttribute('gs-w'),
        gsH: widget.getAttribute('gs-h')
      };
    });

    if (widgetInfo) {
      console.log(`  Widget size: ${widgetInfo.gsW}×${widgetInfo.gsH}`);
      console.log(`  Actual dimensions: ${widgetInfo.width.toFixed(0)}×${widgetInfo.height.toFixed(0)}px`);
      console.log(`  Aspect ratio: ${widgetInfo.aspectRatio.toFixed(2)}`);
      console.log(`  ${widgetInfo.aspectRatio > 1.1 ? '❌ Widget is landscape (wider than tall)' :
                       widgetInfo.aspectRatio < 0.9 ? '❌ Widget is portrait (taller than wide)' :
                       '✅ Widget is approximately square'}`);
      
      if (widgetInfo.contentWidth && widgetInfo.contentHeight) {
        console.log(`  Content dimensions: ${widgetInfo.contentWidth.toFixed(0)}×${widgetInfo.contentHeight.toFixed(0)}px`);
      }
    }

    // Calculate what cell width should be for square cells
    console.log('\n💡 Recommended Configuration:');
    if (gridInfo) {
      const idealCellWidth = gridInfo.cellHeight;
      const totalWidthNeeded = (idealCellWidth * gridInfo.columns) + (gridInfo.margin * (gridInfo.columns - 1));
      console.log(`  For square cells with height ${gridInfo.cellHeight}px:`);
      console.log(`  - Grid container should be ${totalWidthNeeded}px wide`);
      console.log(`  - OR adjust cellHeight to ${Math.round(gridInfo.calculatedCellWidth)}px`);
    }

    await page.screenshot({ 
      path: '/tmp/grid-dimensions-debug.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/grid-dimensions-debug.png');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🔄 Keeping browser open...');
    await new Promise(() => {});
  }
}

debugGridDimensions();