const puppeteer = require('puppeteer');

async function testAddWidgetContent() {
  console.log('🚀 Testing widget addition and content display...');
  
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
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
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

    // Click Edit Dashboard
    console.log('\n🎨 Entering edit mode...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click Add Your First Widget
    console.log('\n➕ Adding widget...');
    const addClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => 
        btn.textContent?.includes('Add Your First Widget') || 
        btn.textContent?.includes('Add Widget')
      );
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (!addClicked) {
      console.log('❌ Could not find Add Widget button');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Select LARGE size (5×5)
    console.log('📏 Selecting LARGE (5×5) size...');
    await page.evaluate(() => {
      const sizeButtons = Array.from(document.querySelectorAll('button'));
      const largeBtn = sizeButtons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('5×5') || text.includes('LARGE');
      });
      if (largeBtn) largeBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));

    // Select OUTPUT_STATS widget
    console.log('📊 Selecting Output Statistics widget...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[role="button"], .cursor-pointer'));
      const outputCard = cards.find(card => 
        card.textContent?.includes('Output Statistics') ||
        card.textContent?.includes('Production Output')
      );
      if (outputCard) outputCard.click();
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if widget was added
    console.log('\n🔍 Checking widget...');
    const widgetInfo = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (!widget) return null;
      
      const mount = widget.querySelector('.widget-content-mount');
      const container = widget.querySelector('.widget-container');
      const reactRoot = mount?.querySelector('[data-reactroot], div > div');
      
      return {
        exists: true,
        id: widget.getAttribute('gs-id'),
        size: {
          width: widget.getBoundingClientRect().width,
          height: widget.getBoundingClientRect().height
        },
        hasMount: !!mount,
        mountChildren: mount ? mount.children.length : 0,
        hasReactRoot: !!reactRoot,
        hasContent: mount ? mount.textContent.length > 0 : false,
        contentPreview: mount ? mount.textContent.substring(0, 100) : '',
        sizeBadge: widget.querySelector('.widget-size-badge')?.textContent,
        hasDeleteBtn: !!widget.querySelector('.widget-remove-btn')
      };
    });

    if (widgetInfo) {
      console.log('Widget Added:');
      console.log(`  ID: ${widgetInfo.id}`);
      console.log(`  Size: ${Math.round(widgetInfo.size.width)}×${Math.round(widgetInfo.size.height)}px`);
      console.log(`  Has mount point: ${widgetInfo.hasMount ? '✅' : '❌'}`);
      console.log(`  Mount children: ${widgetInfo.mountChildren}`);
      console.log(`  Has React root: ${widgetInfo.hasReactRoot ? '✅' : '❌'}`);
      console.log(`  Has content: ${widgetInfo.hasContent ? '✅' : '❌'}`);
      console.log(`  Content preview: "${widgetInfo.contentPreview}"`);
      console.log(`  Size badge: ${widgetInfo.sizeBadge || 'N/A'}`);
      console.log(`  Delete button: ${widgetInfo.hasDeleteBtn ? '✅' : '❌'}`);
    } else {
      console.log('❌ No widget found');
    }

    // Save dashboard
    console.log('\n💾 Saving dashboard...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent?.includes('Save Dashboard'));
      if (saveBtn) saveBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check widget in view mode
    console.log('\n👁️ Checking widget in view mode...');
    const viewModeInfo = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (!widget) return null;
      
      const mount = widget.querySelector('.widget-content-mount');
      
      return {
        hasContent: mount && mount.textContent.length > 0,
        contentPreview: mount ? mount.textContent.substring(0, 100) : '',
        hasDeleteBtn: !!widget.querySelector('.widget-remove-btn'),
        hasSizeBadge: !!widget.querySelector('.widget-size-badge')
      };
    });

    if (viewModeInfo) {
      console.log('View Mode Widget:');
      console.log(`  Has content: ${viewModeInfo.hasContent ? '✅' : '❌'}`);
      console.log(`  Content: "${viewModeInfo.contentPreview}"`);
      console.log(`  Delete button hidden: ${!viewModeInfo.hasDeleteBtn ? '✅' : '❌'}`);
      console.log(`  Size badge hidden: ${!viewModeInfo.hasSizeBadge ? '✅' : '❌'}`);
    }

    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/widget-content-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/widget-content-test.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Keeping browser open for manual inspection...');
    await new Promise(() => {});
  }
}

testAddWidgetContent();