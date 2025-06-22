const puppeteer = require('puppeteer');

async function testWidgetDisplay() {
  console.log('🚀 Testing widget content display and edit controls...');
  
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

    // Check widget content in normal mode
    console.log('\n📊 Checking widget content display...');
    const normalModeInfo = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      return Array.from(widgets).map(w => {
        const mount = w.querySelector('.widget-content-mount');
        const content = mount ? mount.textContent : 'No content';
        const hasReactContent = mount && mount.children.length > 0;
        return {
          id: w.getAttribute('gs-id'),
          hasContent: hasReactContent,
          contentPreview: content?.substring(0, 50) + '...',
          deleteButton: !!w.querySelector('.widget-remove-btn'),
          sizeBadge: !!w.querySelector('.widget-size-badge')
        };
      });
    });

    console.log('Normal Mode Widgets:');
    normalModeInfo.forEach(widget => {
      console.log(`  Widget ${widget.id}:`);
      console.log(`    Has content: ${widget.hasContent ? '✅' : '❌'}`);
      console.log(`    Content preview: ${widget.contentPreview}`);
      console.log(`    Delete button: ${widget.deleteButton ? '❌ (should not show)' : '✅'}`);
      console.log(`    Size badge: ${widget.sizeBadge ? '❌ (should not show)' : '✅'}`);
    });

    // Enter edit mode
    console.log('\n🎨 Entering edit mode...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check widget content in edit mode
    console.log('\n📊 Checking edit mode controls...');
    const editModeInfo = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      return Array.from(widgets).map(w => {
        const mount = w.querySelector('.widget-content-mount');
        const hasReactContent = mount && mount.children.length > 0;
        const deleteBtn = w.querySelector('.widget-remove-btn');
        const sizeBadge = w.querySelector('.widget-size-badge');
        return {
          id: w.getAttribute('gs-id'),
          hasContent: hasReactContent,
          deleteButton: !!deleteBtn,
          deleteButtonText: deleteBtn?.textContent,
          sizeBadge: !!sizeBadge,
          sizeBadgeText: sizeBadge?.textContent
        };
      });
    });

    console.log('Edit Mode Widgets:');
    editModeInfo.forEach(widget => {
      console.log(`  Widget ${widget.id}:`);
      console.log(`    Has content: ${widget.hasContent ? '✅' : '❌'}`);
      console.log(`    Delete button: ${widget.deleteButton ? '✅' : '❌'} ${widget.deleteButtonText ? `(${widget.deleteButtonText})` : ''}`);
      console.log(`    Size badge: ${widget.sizeBadge ? '✅' : '❌'} ${widget.sizeBadgeText ? `(${widget.sizeBadgeText})` : ''}`);
    });

    // Test delete button functionality
    if (editModeInfo.length > 0 && editModeInfo[0].deleteButton) {
      console.log('\n🗑️ Testing delete button functionality...');
      const widgetCountBefore = await page.evaluate(() => document.querySelectorAll('.grid-stack-item').length);
      
      await page.evaluate(() => {
        const firstWidget = document.querySelector('.grid-stack-item');
        const deleteBtn = firstWidget?.querySelector('.widget-remove-btn');
        if (deleteBtn) deleteBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const widgetCountAfter = await page.evaluate(() => document.querySelectorAll('.grid-stack-item').length);
      console.log(`  Widgets before: ${widgetCountBefore}`);
      console.log(`  Widgets after: ${widgetCountAfter}`);
      console.log(`  Delete works: ${widgetCountAfter < widgetCountBefore ? '✅' : '❌'}`);
    }

    // Screenshot
    await page.screenshot({ 
      path: '/tmp/widget-display-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/widget-display-test.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Keeping browser open for manual inspection...');
    await new Promise(() => {});
  }
}

testWidgetDisplay();