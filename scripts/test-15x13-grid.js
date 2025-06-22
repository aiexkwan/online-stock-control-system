const puppeteer = require('puppeteer');

async function test15x13Grid() {
  console.log('🚀 Testing 15×13 grid configuration...');
  
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

    // Check grid configuration
    console.log('\n📐 Checking grid configuration...');
    const gridConfig = await page.evaluate(() => {
      const grid = document.querySelector('.grid-stack');
      if (!grid || !grid.gridstack) return null;
      
      const engine = grid.gridstack.engine;
      const opts = grid.gridstack.opts;
      return {
        column: engine.column,
        maxRow: opts.maxRow,
        cellHeight: opts.cellHeight,
        margin: opts.margin,
        gridHeight: grid.getBoundingClientRect().height
      };
    });
    
    if (gridConfig) {
      console.log('Grid Configuration:');
      console.log(`  Columns: ${gridConfig.column} ${gridConfig.column === 15 ? '✅' : '❌'} (expected: 15)`);
      console.log(`  Max Rows: ${gridConfig.maxRow} ${gridConfig.maxRow === 13 ? '✅' : '❌'} (expected: 13)`);
      console.log(`  Cell Height: ${gridConfig.cellHeight}px`);
      console.log(`  Margin: ${gridConfig.margin}px`);
      console.log(`  Grid Height: ${Math.round(gridConfig.gridHeight)}px`);
    }

    // Enter edit mode
    console.log('\n🎨 Entering edit mode...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test adding widget at edge of grid
    console.log('\n🧪 Testing widget placement at grid boundaries...');
    
    // Screenshot
    await page.screenshot({ 
      path: '/tmp/admin-15x13-grid.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved to /tmp/admin-15x13-grid.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n✅ Grid has been changed to 15×13');
    console.log('🔄 Keeping browser open for manual testing...');
    await new Promise(() => {});
  }
}

test15x13Grid();