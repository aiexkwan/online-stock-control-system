const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Login
    await page.goto('http://localhost:3000/login');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Go to admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    console.log('Waiting for dashboard to load...');
    await new Promise(r => setTimeout(r, 5000));

    // Try to enter edit mode with evaluate
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent && btn.textContent.includes('EDIT')) {
          btn.click();
          break;
        }
      }
    });
    
    await new Promise(r => setTimeout(r, 2000));

    // Check all widgets and find the OUTPUT_STATS widget
    const analysis = await page.evaluate(() => {
      // Find all grid items
      const gridItems = document.querySelectorAll('.react-grid-item');
      console.log('Found grid items:', gridItems.length);
      
      // Also check for widgets in general
      const widgets = document.querySelectorAll('[class*="widget"]');
      console.log('Found widgets:', widgets.length);
      
      const results = [];
      
      gridItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const badge = item.querySelector('.widget-size-badge');
        const widgetContent = item.querySelector('.widget-content');
        
        // Check if this is an OUTPUT_STATS widget
        const isOutputStats = item.innerHTML.includes('Production Output') || 
                             item.innerHTML.includes('OUTPUT_STATS');
        
        results.push({
          size: badge ? badge.textContent.trim() : 'No badge',
          width: rect.width,
          height: rect.height,
          isOutputStats: isOutputStats,
          hasChart: !!item.querySelector('svg.recharts-surface'),
          contentLevel: item.querySelector('[class*="COMPACT"]') ? 'COMPACT' : 
                       item.querySelector('[class*="STANDARD"]') ? 'STANDARD' : 
                       item.querySelector('[class*="DETAILED"]') ? 'DETAILED' : 'UNKNOWN'
        });
      });
      
      return results;
    });

    console.log('\n=== Widget Analysis ===');
    analysis.forEach((widget, i) => {
      if (widget.isOutputStats || widget.size === '5 × 5') {
        console.log(`\nWidget ${i + 1}: ${widget.size}`);
        console.log(`- Type: ${widget.isOutputStats ? 'OUTPUT_STATS' : 'Other'}`);
        console.log(`- Dimensions: ${widget.width}px × ${widget.height}px`);
        console.log(`- Has Chart: ${widget.hasChart}`);
        console.log(`- Content Level: ${widget.contentLevel}`);
        
        if (widget.size === '5 × 5' && widget.height < 800) {
          console.log('❌ HEIGHT ISSUE: Widget should be ~900px but is only', widget.height + 'px');
        }
      }
    });

    // Take screenshot
    await page.screenshot({ path: 'widget-analysis.png', fullPage: true });
    console.log('\nScreenshot saved as widget-analysis.png');

    await new Promise(r => setTimeout(r, 5000));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();