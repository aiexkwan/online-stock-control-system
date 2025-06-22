const puppeteer = require('puppeteer');

async function testAdminGridstack() {
  console.log('🚀 Starting Admin Gridstack test with login...');
  
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

    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials
    console.log('🔑 Logging in...');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    console.log('⏳ Waiting for login to complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to admin page
    console.log('📍 Navigating to admin page...');
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle0'
    });

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if we're using Gridstack
    const hasGridstack = await page.evaluate(() => {
      return !!document.querySelector('.grid-stack');
    });

    if (hasGridstack) {
      console.log('✅ SUCCESS: Gridstack is loaded on admin page!');
      
      // Check for grid configuration
      const gridConfig = await page.evaluate(() => {
        const grid = document.querySelector('.grid-stack');
        if (!grid || !grid.gridstack) return null;
        
        const engine = grid.gridstack.engine;
        return {
          column: engine.column,
          cellHeight: grid.gridstack.opts.cellHeight,
          margin: grid.gridstack.opts.margin
        };
      });
      
      if (gridConfig) {
        console.log('\n📐 Gridstack Configuration:');
        console.log(`  Columns: ${gridConfig.column}`);
        console.log(`  Cell Height: ${gridConfig.cellHeight}px`);
        console.log(`  Margin: ${gridConfig.margin}px`);
      }
      
      // Check for existing widgets
      const widgetInfo = await page.evaluate(() => {
        const widgets = document.querySelectorAll('.grid-stack-item');
        return Array.from(widgets).map(w => {
          // Get grid attributes from data attributes or gridstack data
          const gridstackData = w.gridstackNode || {};
          return {
            id: w.getAttribute('gs-id'),
            width: gridstackData.w || w.getAttribute('gs-w') || 'N/A',
            height: gridstackData.h || w.getAttribute('gs-h') || 'N/A', 
            x: gridstackData.x || w.getAttribute('gs-x') || 'N/A',
            y: gridstackData.y || w.getAttribute('gs-y') || 'N/A',
            actualHeight: w.getBoundingClientRect().height,
            sizeBadge: w.querySelector('.widget-size-badge')?.textContent
          };
        });
      });
      
      console.log(`\n📊 Found ${widgetInfo.length} widgets on dashboard:`);
      widgetInfo.forEach(widget => {
        console.log(`  Widget ${widget.id}:`);
        console.log(`    Grid Size: ${widget.width} × ${widget.height}`);
        console.log(`    Position: (${widget.x}, ${widget.y})`);
        console.log(`    Actual Height: ${widget.actualHeight}px`);
        console.log(`    Size Badge: ${widget.sizeBadge || 'N/A'}`);
        
        // Check if 5×5 widget has correct height
        if (widget.width === '5' && widget.height === '5') {
          const expectedHeight = 964; // 5 * 180 + 4 * 16
          const isCorrect = widget.actualHeight >= expectedHeight - 10; // Allow small tolerance
          console.log(`    Height Check: ${isCorrect ? '✅' : '❌'} (expected: ${expectedHeight}px)`);
        }
      });
      
      // Check if we can enter edit mode
      console.log('\n🎨 Looking for Edit Dashboard button...');
      const hasEditButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent?.includes('Edit Dashboard'));
      });
      
      if (hasEditButton) {
        console.log('✅ Edit Dashboard button found');
        
        // Take a screenshot
        await page.screenshot({ 
          path: '/tmp/admin-gridstack-view.png',
          fullPage: true 
        });
        console.log('📸 Screenshot saved to /tmp/admin-gridstack-view.png');
        
        // Click Edit Dashboard button to test edit mode
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
          if (editBtn) editBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check widget size badges in edit mode
        const editModeInfo = await page.evaluate(() => {
          const badges = document.querySelectorAll('.widget-size-badge');
          return Array.from(badges).map(badge => badge.textContent);
        });
        
        if (editModeInfo.length > 0) {
          console.log('\n📏 Widget sizes in edit mode:', editModeInfo.join(', '));
        }
      }
      
    } else {
      console.log('❌ Gridstack not found - checking for React Grid Layout...');
      
      const hasReactGrid = await page.evaluate(() => {
        return !!document.querySelector('.react-grid-layout');
      });
      
      if (hasReactGrid) {
        console.log('⚠️  Page is still using React Grid Layout');
        console.log('📝 The Gridstack implementation might not be deployed yet');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close');
    
    // Keep browser open
    await new Promise(() => {});
  }
}

testAdminGridstack();