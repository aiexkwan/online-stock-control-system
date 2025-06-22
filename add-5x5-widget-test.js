const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Go to admin
    console.log('Going to admin page...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));

    // Enter edit mode
    console.log('Entering edit mode...');
    await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent && b.textContent.includes('EDIT DASHBOARD')
      );
      if (editBtn) {
        editBtn.click();
        console.log('Clicked edit button');
      }
    });
    
    await new Promise(r => setTimeout(r, 2000));

    // Click Add Widget button
    console.log('Looking for Add Widget button...');
    const addWidgetClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      console.log('Found buttons:', buttons.map(b => b.textContent).filter(t => t));
      
      // Look for button with Plus icon or Add text
      const addBtn = buttons.find(b => {
        const text = b.textContent || '';
        const hasPlus = b.querySelector('[class*="Plus"], svg');
        return text.includes('Add') || text.includes('Widget') || hasPlus;
      });
      
      if (addBtn) {
        console.log('Found Add button:', addBtn.textContent);
        addBtn.click();
        return true;
      }
      return false;
    });

    if (!addWidgetClicked) {
      console.log('Could not find Add Widget button');
      return;
    }

    console.log('Add Widget dialog opened');
    await new Promise(r => setTimeout(r, 2000));

    // Select OUTPUT_STATS widget
    console.log('Looking for OUTPUT_STATS widget...');
    const widgetSelected = await page.evaluate(() => {
      // Look for OUTPUT_STATS in the widget selection dialog
      const widgets = document.querySelectorAll('[class*="widget-option"], [class*="widget-item"], button');
      for (const widget of widgets) {
        if (widget.textContent && (widget.textContent.includes('OUTPUT_STATS') || widget.textContent.includes('Production Output'))) {
          widget.click();
          return true;
        }
      }
      return false;
    });

    if (!widgetSelected) {
      console.log('Could not find OUTPUT_STATS widget option');
      // Take screenshot to see what's available
      await page.screenshot({ path: 'widget-dialog.png' });
      console.log('Screenshot saved as widget-dialog.png');
      return;
    }

    console.log('Selected OUTPUT_STATS widget');
    await new Promise(r => setTimeout(r, 1000));

    // Select LARGE size (5x5)
    console.log('Looking for size selector...');
    const sizeSelected = await page.evaluate(() => {
      // Look for size options
      const sizeOptions = document.querySelectorAll('[class*="size"], button');
      for (const option of sizeOptions) {
        if (option.textContent && (option.textContent.includes('Large') || option.textContent.includes('5×5'))) {
          option.click();
          return true;
        }
      }
      return false;
    });

    if (sizeSelected) {
      console.log('Selected LARGE (5x5) size');
    }

    await new Promise(r => setTimeout(r, 1000));

    // Click confirm/add button
    const confirmClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => 
        b.textContent && (b.textContent.includes('Add') || b.textContent.includes('Confirm') || b.textContent.includes('OK'))
      );
      if (confirmBtn && !confirmBtn.textContent.includes('Add Widget')) {
        confirmBtn.click();
        return true;
      }
      return false;
    });

    if (confirmClicked) {
      console.log('Widget added!');
    }

    await new Promise(r => setTimeout(r, 3000));

    // Check the widget size
    const widgetInfo = await page.evaluate(() => {
      const badge = document.querySelector('.widget-size-badge');
      const gridItem = document.querySelector('.react-grid-item');
      
      if (!gridItem) return { found: false };
      
      const rect = gridItem.getBoundingClientRect();
      const diagnostic = gridItem.querySelector('[class*="diagnostic"]');
      
      return {
        found: true,
        badgeText: badge ? badge.textContent : 'No badge',
        dimensions: {
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        diagnosticInfo: diagnostic ? diagnostic.textContent : 'No diagnostic'
      };
    });

    console.log('\n=== Widget Added ===');
    if (widgetInfo.found) {
      console.log('Size Badge:', widgetInfo.badgeText);
      console.log('Actual Dimensions:', `${widgetInfo.dimensions.width}×${widgetInfo.dimensions.height}px`);
      console.log('Diagnostic:', widgetInfo.diagnosticInfo);
      
      const expectedHeight = 964; // 5 * 180 + 4 * 16
      if (widgetInfo.dimensions.height >= expectedHeight - 50) {
        console.log('✅ Widget height is correct!');
      } else {
        console.log(`❌ Widget height issue: ${widgetInfo.dimensions.height}px (expected ~${expectedHeight}px)`);
      }
    } else {
      console.log('Widget not found after adding');
    }

    await page.screenshot({ path: 'widget-added.png', fullPage: true });
    console.log('\nScreenshot saved as widget-added.png');

    await new Promise(r => setTimeout(r, 30000));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();