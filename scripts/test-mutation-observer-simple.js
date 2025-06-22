/**
 * Simple test to check MutationObserver implementation
 * 簡單測試檢查 MutationObserver 係咪正常工作
 */

const puppeteer = require('puppeteer');

async function testMutationObserver() {
  console.log('🧪 Testing MutationObserver Implementation...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // 設置 console 事件監聽
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[MutationObserver]') || text.includes('grid')) {
        console.log('🖥️  Browser console:', text);
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
    
    // 3. 檢查初始狀態
    console.log('3️⃣ Checking initial state...');
    const initialState = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      return {
        count: widgets.length,
        firstWidget: widgets[0] ? {
          draggable: widgets[0].classList.contains('ui-draggable'),
          resizable: widgets[0].classList.contains('ui-resizable')
        } : null
      };
    });
    
    console.log(`   📊 Found ${initialState.count} widgets`);
    if (initialState.firstWidget) {
      console.log(`   Widget state: draggable=${initialState.firstWidget.draggable}, resizable=${initialState.firstWidget.resizable}\n`);
    }
    
    // 4. 點擊編輯按鈕
    console.log('4️⃣ Entering edit mode...');
    
    // 使用更可靠嘅方法找到並點擊按鈕
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editButton = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editButton) editButton.click();
    });
    
    // 等待一秒鐘
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. 檢查編輯模式狀態
    console.log('5️⃣ Checking edit mode state...');
    const editModeState = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      const results = [];
      
      widgets.forEach((widget, index) => {
        results.push({
          index,
          draggable: widget.classList.contains('ui-draggable'),
          resizable: widget.classList.contains('ui-resizable'),
          hasHandles: widget.querySelector('.ui-resizable-handle') !== null
        });
      });
      
      // 檢查 gridstack instance 狀態
      const gridElement = document.querySelector('.grid-stack');
      const isDisabled = gridElement?.classList.contains('grid-stack-static');
      
      return { widgets: results, gridDisabled: isDisabled };
    });
    
    console.log(`   Grid disabled: ${editModeState.gridDisabled}`);
    editModeState.widgets.forEach(({ index, draggable, resizable, hasHandles }) => {
      console.log(`   Widget ${index + 1}: draggable=${draggable}, resizable=${resizable}, hasHandles=${hasHandles}`);
    });
    
    // 6. 手動測試 MutationObserver
    console.log('\n6️⃣ Testing MutationObserver directly...');
    const observerTest = await page.evaluate(() => {
      // 檢查是否有 MutationObserver 在運行
      const gridElement = document.querySelector('.grid-stack');
      if (!gridElement) return { error: 'No grid element found' };
      
      // 嘗試添加一個測試元素
      const testDiv = document.createElement('div');
      testDiv.className = 'grid-stack-item test-widget';
      testDiv.innerHTML = '<div class="grid-stack-item-content">Test Widget</div>';
      
      gridElement.appendChild(testDiv);
      
      // 等待一下看看有沒有反應
      return new Promise((resolve) => {
        setTimeout(() => {
          const addedWidget = gridElement.querySelector('.test-widget');
          if (addedWidget) {
            resolve({
              added: true,
              draggable: addedWidget.classList.contains('ui-draggable'),
              resizable: addedWidget.classList.contains('ui-resizable')
            });
          } else {
            resolve({ added: false });
          }
        }, 500);
      });
    });
    
    console.log('   MutationObserver test result:', observerTest);
    
    // 7. 檢查 console errors
    console.log('\n7️⃣ Checking for console errors...');
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    
    if (logs.length > 0) {
      console.log('   Console logs:', logs);
    }
    
    console.log('\n✅ Test completed!');
    
    // 保持瀏覽器開啟 10 秒方便觀察
    console.log('\n⏰ Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // 截圖
    if (page) {
      await page.screenshot({ 
        path: 'mutation-observer-test-error-simple.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved');
    }
  } finally {
    await browser.close();
  }
}

// 設置 console 捕獲
async function setupConsoleCapture(page) {
  await page.evaluateOnNewDocument(() => {
    window.console.logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      window.console.logs.push({ type: 'log', args });
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      window.console.logs.push({ type: 'error', args });
      originalError.apply(console, args);
    };
  });
}

// 執行測試
testMutationObserver().catch(console.error);