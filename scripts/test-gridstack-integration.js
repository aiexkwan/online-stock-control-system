const puppeteer = require('puppeteer');

async function testGridstackIntegration() {
  console.log('🚀 Starting Gridstack integration test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to admin page
    console.log('📍 Navigating to admin page...');
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle0'
    });

    // Wait for Gridstack to initialize
    await page.waitForFunction(() => document.readyState === 'complete');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if we're using Gridstack
    const hasGridstack = await page.evaluate(() => {
      return !!document.querySelector('.grid-stack');
    });

    if (hasGridstack) {
      console.log('✅ Gridstack is loaded on admin page!');
      
      // Check for existing widgets
      const widgetCount = await page.evaluate(() => {
        return document.querySelectorAll('.grid-stack-item').length;
      });
      
      console.log(`📊 Found ${widgetCount} widgets on dashboard`);
      
      // If there are 5×5 widgets, check their height
      const largeWidgets = await page.evaluate(() => {
        const widgets = document.querySelectorAll('.grid-stack-item[gs-w="5"][gs-h="5"]');
        return Array.from(widgets).map(w => ({
          id: w.getAttribute('gs-id'),
          height: w.getBoundingClientRect().height,
          computedHeight: window.getComputedStyle(w).height
        }));
      });
      
      if (largeWidgets.length > 0) {
        console.log('\n🔍 Checking 5×5 widget heights:');
        largeWidgets.forEach(widget => {
          const isCorrect = widget.height >= 964;
          console.log(`  Widget ${widget.id}: ${widget.height}px ${isCorrect ? '✅' : '❌'} (expected: 964px)`);
        });
        
        const allCorrect = largeWidgets.every(w => w.height >= 964);
        if (allCorrect) {
          console.log('\n🎉 SUCCESS: All 5×5 widgets have correct height!');
        } else {
          console.log('\n⚠️  Some widgets still have incorrect height');
        }
      } else {
        console.log('\n⚠️  No 5×5 widgets found on dashboard');
        console.log('💡 Try adding a 5×5 widget through Edit Dashboard mode');
      }
      
    } else {
      console.log('❌ Gridstack not found - page might still be using React Grid Layout');
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

testGridstackIntegration();