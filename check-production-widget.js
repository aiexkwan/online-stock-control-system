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

    // Navigate to admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    
    // Wait for widgets to render
    console.log('Waiting for widgets to fully load...');
    await new Promise(r => setTimeout(r, 8000));

    // Check widget in normal mode (not edit mode)
    const analysis = await page.evaluate(() => {
      const widget = document.querySelector('.widget-container');
      if (!widget) return { found: false };
      
      const parent = widget.parentElement;
      const rect = parent.getBoundingClientRect();
      
      // Check content levels
      const hasMinimalContent = widget.textContent.includes('pallets') && !widget.querySelector('h3');
      const hasCompactContent = !!widget.querySelector('h3') && !widget.querySelector('svg');
      const hasStandardContent = !!widget.querySelector('svg') || !!widget.querySelector('.recharts-wrapper');
      const hasDetailedContent = widget.querySelectorAll('.bg-slate-800').length > 3;
      
      // Get specific content
      const title = widget.querySelector('h3')?.textContent || '';
      const mainNumber = widget.querySelector('.text-4xl, .text-3xl, .text-2xl')?.textContent || '';
      const hasChart = !!widget.querySelector('svg');
      const hasTimeSelector = !!widget.querySelector('button[class*="slate"]');
      
      return {
        found: true,
        dimensions: {
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        content: {
          title,
          mainNumber,
          hasChart,
          hasTimeSelector,
          hasMinimalContent,
          hasCompactContent,
          hasStandardContent,
          hasDetailedContent
        },
        contentLevel: hasDetailedContent ? 'DETAILED/FULL' :
                     hasStandardContent ? 'STANDARD' :
                     hasCompactContent ? 'COMPACT' :
                     hasMinimalContent ? 'MINIMAL' : 'UNKNOWN'
      };
    });

    console.log('\n=== Production Output Widget Analysis ===');
    if (!analysis.found) {
      console.log('Widget not found!');
    } else {
      console.log('Widget Dimensions:', `${analysis.dimensions.width}px × ${analysis.dimensions.height}px`);
      console.log('Content Level:', analysis.contentLevel);
      console.log('\nContent Details:');
      console.log('- Title:', analysis.content.title || 'None');
      console.log('- Main Number:', analysis.content.mainNumber || 'None');
      console.log('- Has Chart:', analysis.content.hasChart);
      console.log('- Has Time Selector:', analysis.content.hasTimeSelector);
      
      // Expected for 5×5 widget
      const expectedHeight = 5 * 180 + 4 * 16; // 964px
      if (analysis.dimensions.height >= expectedHeight - 50) {
        console.log('\n✅ SUCCESS: Widget height is correct for 5×5!');
        if (analysis.content.hasChart || analysis.contentLevel === 'STANDARD' || analysis.contentLevel === 'DETAILED/FULL') {
          console.log('✅ SUCCESS: Widget is showing appropriate content for its size!');
        } else {
          console.log('⚠️  WARNING: Widget should show charts at this size but is showing', analysis.contentLevel, 'content');
        }
      } else {
        console.log('\n❌ ISSUE: Widget height is still constrained');
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'production-widget-final.png', fullPage: true });
    console.log('\nScreenshot saved as production-widget-final.png');

    // Enter edit mode to verify size badge
    await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const editModeInfo = await page.evaluate(() => {
      const badge = document.querySelector('.widget-size-badge');
      return badge ? badge.textContent.trim() : 'No badge found';
    });
    
    console.log('\nEdit Mode Size Badge:', editModeInfo);

    await new Promise(r => setTimeout(r, 5000));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();