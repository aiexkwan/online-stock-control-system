/**
 * Test widget optimization
 * 測試 widget 優化效果
 */

const puppeteer = require('puppeteer');

async function testWidgetOptimization() {
  console.log('🚀 Testing Widget Optimization...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.evaluateOnNewDocument(() => {
      window.renderCounts = {};
      window.performanceMarks = [];
      
      // Override React.memo to track renders
      const originalMemo = React.memo;
      React.memo = function(component, propsAreEqual) {
        const wrappedComponent = function(props) {
          const name = component.name || 'Unknown';
          window.renderCounts[name] = (window.renderCounts[name] || 0) + 1;
          return component(props);
        };
        Object.defineProperty(wrappedComponent, 'name', { value: component.name });
        return originalMemo(wrappedComponent, propsAreEqual);
      };
    });
    
    // Monitor network activity
    const resourceTimings = [];
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        resourceTimings.push({
          url: response.url().split('/').pop(),
          status: response.status(),
          size: response.headers()['content-length']
        });
      }
    });
    
    // 1. Login
    console.log('1️⃣ Logging in...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/main-login', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('   ✅ Login successful\n');
    
    // 2. Navigate to dashboard
    console.log('2️⃣ Loading dashboard...');
    const dashboardStartTime = Date.now();
    
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await page.waitForSelector('.grid-stack', { timeout: 30000 });
    const dashboardLoadTime = Date.now() - dashboardStartTime;
    console.log(`   ✅ Dashboard loaded in ${dashboardLoadTime}ms\n`);
    
    // 3. Check render counts
    console.log('3️⃣ Checking initial render counts...');
    const initialRenderCounts = await page.evaluate(() => window.renderCounts || {});
    console.log('   Initial renders:', Object.keys(initialRenderCounts).length > 0 ? 
      JSON.stringify(initialRenderCounts, null, 2) : 'No memoized components detected');
    
    // 4. Test edit mode toggle (should not re-render widgets)
    console.log('\n4️⃣ Testing edit mode toggle...');
    
    // Enter edit mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editButton = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editButton) editButton.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check render counts after edit mode
    const afterEditRenderCounts = await page.evaluate(() => window.renderCounts || {});
    console.log('   Renders after entering edit mode:');
    
    let unnecessaryRenders = 0;
    Object.keys(afterEditRenderCounts).forEach(component => {
      const before = initialRenderCounts[component] || 0;
      const after = afterEditRenderCounts[component] || 0;
      if (after > before) {
        console.log(`     ${component}: ${before} → ${after} (+${after - before})`);
        unnecessaryRenders += (after - before);
      }
    });
    
    if (unnecessaryRenders === 0) {
      console.log('     ✅ No unnecessary re-renders detected!');
    } else {
      console.log(`     ⚠️  ${unnecessaryRenders} unnecessary re-renders detected`);
    }
    
    // 5. Check lazy loading
    console.log('\n5️⃣ Checking lazy loading...');
    const lazyLoadedModules = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts
        .map(s => s.src)
        .filter(src => src.includes('_next/static/chunks/') && !src.includes('main'))
        .map(src => src.split('/').pop());
    });
    
    console.log(`   Found ${lazyLoadedModules.length} dynamically loaded chunks`);
    if (lazyLoadedModules.length > 0) {
      console.log('   ✅ Lazy loading is working');
    }
    
    // 6. Performance metrics
    console.log('\n6️⃣ Performance Metrics...');
    const metrics = await page.metrics();
    console.log(`   JS Heap Size: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   DOM Nodes: ${metrics.Nodes}`);
    console.log(`   JS Event Listeners: ${metrics.JSEventListeners}`);
    
    // 7. Check widget visibility
    console.log('\n7️⃣ Checking widget visibility...');
    const widgetStats = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      const viewportHeight = window.innerHeight;
      let visibleCount = 0;
      let totalCount = widgets.length;
      
      widgets.forEach(widget => {
        const rect = widget.getBoundingClientRect();
        if (rect.top < viewportHeight && rect.bottom > 0) {
          visibleCount++;
        }
      });
      
      return { totalCount, visibleCount };
    });
    
    console.log(`   Total widgets: ${widgetStats.totalCount}`);
    console.log(`   Visible widgets: ${widgetStats.visibleCount}`);
    console.log(`   ${widgetStats.totalCount - widgetStats.visibleCount} widgets are below the fold (good for lazy loading)`);
    
    // Summary
    console.log('\n📊 Optimization Summary:');
    console.log(`   ✅ Dashboard load time: ${dashboardLoadTime}ms`);
    console.log(`   ✅ React.memo optimization: ${unnecessaryRenders === 0 ? 'Working' : 'Needs improvement'}`);
    console.log(`   ✅ Lazy loading: ${lazyLoadedModules.length > 0 ? 'Active' : 'Not detected'}`);
    console.log(`   ✅ Memory usage: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Keep browser open for manual inspection
    console.log('\n⏰ Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run test
testWidgetOptimization().catch(console.error);