/**
 * Test unified CSS implementation
 * 確認統一 CSS 文件正常工作
 */

const puppeteer = require('puppeteer');

async function testUnifiedCSS() {
  console.log('🎨 Testing Unified CSS Implementation...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // 監聽 CSS 錯誤
    page.on('response', response => {
      if (response.url().includes('.css') && response.status() !== 200) {
        console.error('❌ CSS load error:', response.url(), response.status());
      }
    });
    
    // 監聽 console errors
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('CSS')) {
        console.error('❌ Console CSS error:', msg.text());
      }
    });
    
    // 1. 登入
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/main-login', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('   ✅ Login successful\n');
    
    // 2. 前往 admin 頁面
    console.log('2️⃣ Navigating to admin dashboard...');
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await page.waitForSelector('.grid-stack', { timeout: 30000 });
    console.log('   ✅ Dashboard loaded\n');
    
    // 3. 檢查 CSS 加載
    console.log('3️⃣ Checking CSS files...');
    const cssFiles = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.map(link => ({
        href: link.href,
        loaded: link.sheet !== null
      }));
    });
    
    const dashboardCSS = cssFiles.filter(css => 
      css.href.includes('unified-dashboard.css') || 
      css.href.includes('gridstack')
    );
    
    dashboardCSS.forEach(css => {
      console.log(`   ${css.loaded ? '✅' : '❌'} ${css.href.split('/').pop()}`);
    });
    
    // 4. 檢查視覺樣式
    console.log('\n4️⃣ Checking visual styles...');
    const styles = await page.evaluate(() => {
      const grid = document.querySelector('.grid-stack');
      const widget = document.querySelector('.widget-container-wrapper');
      
      return {
        grid: grid ? {
          background: getComputedStyle(grid).background,
          border: getComputedStyle(grid).border,
          borderRadius: getComputedStyle(grid).borderRadius
        } : null,
        widget: widget ? {
          background: getComputedStyle(widget).background,
          border: getComputedStyle(widget).border,
          borderRadius: getComputedStyle(widget).borderRadius
        } : null
      };
    });
    
    if (styles.grid) {
      console.log('   Grid styles applied:', 
        styles.grid.background.includes('gradient') ? '✅ Gradient' : '❌ No gradient',
        styles.grid.border !== 'none' ? '✅ Border' : '❌ No border',
        styles.grid.borderRadius !== '0px' ? '✅ Rounded' : '❌ Not rounded'
      );
    }
    
    if (styles.widget) {
      console.log('   Widget styles applied:', 
        styles.widget.background.includes('gradient') ? '✅ Gradient' : '❌ No gradient',
        styles.widget.border !== 'none' ? '✅ Border' : '❌ No border',
        styles.widget.borderRadius !== '0px' ? '✅ Rounded' : '❌ Not rounded'
      );
    }
    
    // 5. 測試編輯模式樣式
    console.log('\n5️⃣ Testing edit mode styles...');
    
    // 進入編輯模式
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editButton = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editButton) editButton.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const editModeStyles = await page.evaluate(() => {
      const dashboard = document.querySelector('.gridstack-dashboard');
      const widget = document.querySelector('.widget-container-wrapper');
      
      return {
        hasEditClass: dashboard?.classList.contains('edit-mode'),
        widgetCursor: widget ? getComputedStyle(widget).cursor : null,
        resizeHandle: document.querySelector('.ui-resizable-se') !== null
      };
    });
    
    console.log('   Edit mode active:', editModeStyles.hasEditClass ? '✅' : '❌');
    console.log('   Widget cursor:', editModeStyles.widgetCursor === 'move' ? '✅ Move cursor' : '❌ Wrong cursor');
    console.log('   Resize handle:', editModeStyles.resizeHandle ? '✅ Visible' : '❌ Not visible');
    
    // 6. 檢查雙層問題
    console.log('\n6️⃣ Checking for double-layer issues...');
    const doubleLayerCheck = await page.evaluate(() => {
      const items = document.querySelectorAll('.grid-stack-item');
      let hasNestedItems = false;
      
      items.forEach(item => {
        if (item.querySelector('.grid-stack-item')) {
          hasNestedItems = true;
        }
      });
      
      return {
        totalItems: items.length,
        hasNestedItems
      };
    });
    
    console.log(`   Total grid items: ${doubleLayerCheck.totalItems}`);
    console.log(`   Double-layer issue: ${doubleLayerCheck.hasNestedItems ? '❌ Found nested items' : '✅ No nested items'}`);
    
    console.log('\n✅ CSS test completed!');
    
    // 截圖
    await page.screenshot({ 
      path: 'unified-css-test.png',
      fullPage: false 
    });
    console.log('📸 Screenshot saved as unified-css-test.png');
    
    // 保持開啟 5 秒
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// 執行測試
testUnifiedCSS().catch(console.error);