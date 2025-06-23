const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Login
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    
    // Wait for widgets to load - try multiple selectors
    try {
      await page.waitForSelector('.grid-stack-item', { timeout: 10000 });
    } catch (e) {
      console.log('No grid-stack items found, trying alternative selector...');
      await page.waitForSelector('[class*="widget"]', { timeout: 5000 });
    }
    
    // Wait a bit more for everything to render
    await page.waitForTimeout(2000);
    
    // Get all widgets with their positions
    const widgets = await page.evaluate(() => {
      // Try multiple selectors to find widgets
      const widgetSelectors = [
        '.grid-stack-item',
        '[data-widget-type]',
        '[class*="WidgetCard"]',
        'div[class*="rounded-xl"][class*="bg-"]'
      ];
      
      let widgetElements = [];
      for (const selector of widgetSelectors) {
        widgetElements = document.querySelectorAll(selector);
        if (widgetElements.length > 0) break;
      }
      
      const widgetInfo = [];
      
      widgetElements.forEach(widget => {
        const rect = widget.getBoundingClientRect();
        // Try multiple ways to find title
        const titleElement = widget.querySelector('.text-slate-200') || 
                           widget.querySelector('.text-base') ||
                           widget.querySelector('[class*="CardTitle"]') ||
                           widget.querySelector('h3') ||
                           widget.querySelector('h2');
        const title = titleElement?.textContent || 'Unknown';
        
        // Skip if widget is not visible
        if (rect.width === 0 || rect.height === 0) return;
        
        widgetInfo.push({
          title: title.trim(),
          type: widget.getAttribute('data-widget-type') || 'unknown',
          position: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          classList: widget.className
        });
      });
      
      // Sort by position (top to bottom, left to right)
      return widgetInfo.sort((a, b) => {
        if (Math.abs(a.position.y - b.position.y) > 50) {
          return a.position.y - b.position.y;
        }
        return a.position.x - b.position.x;
      });
    });
    
    console.log('Current Widget Layout:');
    console.log('======================');
    widgets.forEach((widget, index) => {
      console.log(`${index + 1}. ${widget.title}`);
      console.log(`   Type: ${widget.type}`);
      console.log(`   Position: x=${widget.position.x}, y=${widget.position.y}`);
      console.log(`   Size: ${widget.position.width}x${widget.position.height}`);
      console.log('');
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'upload-widgets-layout.png',
      fullPage: true 
    });
    
    console.log('Screenshot saved as upload-widgets-layout.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();