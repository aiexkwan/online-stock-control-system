const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Quick login
    await page.goto('http://localhost:3000/login');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Go directly to admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    console.log('On admin page, waiting for dashboard...');
    await new Promise(r => setTimeout(r, 10000));

    // Take screenshot of dashboard
    await page.screenshot({ 
      path: 'admin-dashboard-view.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    console.log('Screenshot taken: admin-dashboard-view.png');

    // Quick analysis
    const info = await page.evaluate(() => {
      const widget = document.querySelector('.widget-container');
      if (!widget) return 'No widget found';
      
      const rect = widget.parentElement.getBoundingClientRect();
      const hasChart = !!widget.querySelector('svg');
      const title = widget.querySelector('h3')?.textContent || 'No title';
      
      return {
        dimensions: `${Math.round(rect.width)}×${Math.round(rect.height)}px`,
        hasChart,
        title
      };
    });
    
    console.log('\nWidget Info:', info);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();