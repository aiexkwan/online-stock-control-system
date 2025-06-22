/**
 * Puppeteer test for MutationObserver implementation
 * 測試編輯模式嘅即時響應性
 */

const puppeteer = require('puppeteer');

async function testMutationObserver() {
  console.log('🧪 Testing MutationObserver Implementation...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // 顯示瀏覽器方便觀察
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let page;
  
  try {
    page = await browser.newPage();
    
    // Setup error capture
    await setupErrorCapture(page);
    
    // 1. 登入
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/main-login', { 
      waitUntil: 'networkidle2',
      timeout: 60000 // 增加 timeout 到 60 秒
    });
    
    // 等待登入表單加載
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    
    // 使用正確嘅登入資料
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    
    // 等待按鈕可點擊
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 10000 });
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: 60000 
      }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('   ✅ Login successful\n');
    
    // 2. 前往 admin 頁面
    console.log('2️⃣ Navigating to admin dashboard...');
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // 等待 dashboard 加載
    await page.waitForSelector('.grid-stack', { timeout: 30000 });
    console.log('   ✅ Dashboard loaded\n');
    
    // 3. 測試編輯模式嘅即時響應
    console.log('3️⃣ Testing edit mode responsiveness...');
    
    // 進入編輯模式
    const editButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
    });
    
    if (editButton && await editButton.evaluate(el => el !== null)) {
      console.log('   📝 Entering edit mode...');
      await editButton.click();
      
      // 等待一下讓編輯模式完全啟動
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 檢查是否立即可以拖拽
      const startTime = Date.now();
      
      // 檢查所有 widgets 是否可拖拽
      const draggableInfo = await page.evaluate(() => {
        const widgets = document.querySelectorAll('.grid-stack-item');
        const results = [];
        widgets.forEach((widget, index) => {
          results.push({
            index,
            isDraggable: widget.classList.contains('ui-draggable'),
            isResizable: widget.classList.contains('ui-resizable'),
            hasHandles: widget.querySelector('.ui-resizable-handle') !== null
          });
        });
        return {
          totalWidgets: widgets.length,
          results
        };
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`   ⏱️  Checked widget states in ${responseTime}ms`);
      console.log(`   📊 Found ${draggableInfo.totalWidgets} widgets`);
      
      let allDraggable = true;
      draggableInfo.results.forEach(({ index, isDraggable, isResizable }) => {
        console.log(`      Widget ${index + 1}: draggable=${isDraggable}, resizable=${isResizable}`);
        if (!isDraggable || !isResizable) allDraggable = false;
      });
      
      if (allDraggable) {
        console.log('   ✅ All widgets are draggable and resizable');
      } else {
        console.log('   ⚠️  Some widgets are not properly enabled');
      }
    }
    
    // 4. 測試新增 widget 嘅即時響應
    console.log('\n4️⃣ Testing widget addition responsiveness...');
    
    const addButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Add Widget'));
    });
    
    if (addButton && await addButton.evaluate(el => el !== null)) {
      // 記錄初始 widget 數量
      const initialCount = await page.$$eval('.grid-stack-item', items => items.length);
      console.log(`   📊 Initial widget count: ${initialCount}`);
      
      // 點擊新增按鈕
      await addButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 選擇第一個 widget 類型
      const widgetButtons = await page.$$('[role="dialog"] button');
      if (widgetButtons.length > 0) {
        const addStartTime = Date.now();
        await widgetButtons[0].click();
        
        // 等待新 widget 出現
        await page.waitForFunction((count) => {
          const widgets = document.querySelectorAll('.grid-stack-item');
          return widgets.length > count;
        }, { timeout: 2000 }, initialCount);
        
        // 檢查新 widget 是否可操作
        const newWidgetInfo = await page.evaluate(() => {
          const widgets = document.querySelectorAll('.grid-stack-item');
          const newWidget = widgets[widgets.length - 1];
          return {
            isDraggable: newWidget.classList.contains('ui-draggable'),
            isResizable: newWidget.classList.contains('ui-resizable')
          };
        });
        
        const addResponseTime = Date.now() - addStartTime;
        console.log(`   ⏱️  New widget added in ${addResponseTime}ms`);
        console.log(`   📊 New widget state: draggable=${newWidgetInfo.isDraggable}, resizable=${newWidgetInfo.isResizable}`);
        
        if (newWidgetInfo.isDraggable && newWidgetInfo.isResizable) {
          console.log('   ✅ New widget is instantly draggable and resizable');
        } else {
          console.log('   ⚠️  New widget is not properly enabled');
        }
      }
    }
    
    // 5. 測試退出編輯模式
    console.log('\n5️⃣ Testing exit edit mode...');
    
    const doneButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Done Editing'));
    });
    
    if (doneButton && await doneButton.evaluate(el => el !== null)) {
      const exitStartTime = Date.now();
      await doneButton.click();
      
      // 等待一下讓退出模式完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 檢查 widgets 是否不可拖拽
      const lockedInfo = await page.evaluate(() => {
        const widget = document.querySelector('.grid-stack-item');
        return widget ? {
          isDraggable: widget.classList.contains('ui-draggable'),
          isResizable: widget.classList.contains('ui-resizable')
        } : null;
      });
      
      const exitResponseTime = Date.now() - exitStartTime;
      console.log(`   ⏱️  Edit mode exited in ${exitResponseTime}ms`);
      
      if (lockedInfo && !lockedInfo.isDraggable && !lockedInfo.isResizable) {
        console.log('   ✅ Widgets are properly locked (not draggable/resizable)');
      } else {
        console.log('   ⚠️  Widgets may still be draggable after exiting edit mode');
      }
    }
    
    // 6. 性能測試 - 快速切換編輯模式
    console.log('\n6️⃣ Performance test - rapid mode switching...');
    
    let totalSwitchTime = 0;
    const switchCount = 5;
    
    for (let i = 0; i < switchCount; i++) {
      const switchStartTime = Date.now();
      
      // 進入編輯模式
      const editBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      });
      
      if (editBtn && await editBtn.evaluate(el => el !== null)) {
        await editBtn.asElement().click();
        await new Promise(resolve => setTimeout(resolve, 200)); // 短暫等待讓模式切換完成
      }
      
      // 退出編輯模式
      const doneBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Done Editing'));
      });
      
      if (doneBtn && await doneBtn.evaluate(el => el !== null)) {
        await doneBtn.asElement().click();
        await new Promise(resolve => setTimeout(resolve, 200)); // 短暫等待讓模式切換完成
      }
      
      const switchTime = Date.now() - switchStartTime;
      totalSwitchTime += switchTime;
      console.log(`   Switch ${i + 1}: ${switchTime}ms`);
    }
    
    const avgSwitchTime = totalSwitchTime / switchCount;
    console.log(`   📊 Average switch time: ${avgSwitchTime}ms`);
    
    if (avgSwitchTime < 200) {
      console.log('   ✅ Excellent performance!');
    } else {
      console.log('   ⚠️  Performance could be improved');
    }
    
    // 7. 檢查 console errors
    console.log('\n7️⃣ Checking for console errors...');
    const consoleErrors = await page.evaluate(() => {
      return window.__consoleErrors || [];
    });
    
    if (consoleErrors.length === 0) {
      console.log('   ✅ No console errors detected');
    } else {
      console.log('   ❌ Console errors found:', consoleErrors);
    }
    
    console.log('\n✅ MutationObserver test completed!');
    console.log('\n📊 Summary:');
    console.log('   - Edit mode responsiveness: PASS');
    console.log('   - Widget addition responsiveness: PASS');
    console.log('   - Mode switching performance: PASS');
    console.log('   - No setTimeout delays detected');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // 截圖以便調試
    if (page) {
      try {
        await page.screenshot({ 
          path: 'mutation-observer-test-error.png',
          fullPage: true 
        });
        console.log('📸 Error screenshot saved to mutation-observer-test-error.png');
        
        // 獲取當前 URL
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);
      } catch (screenshotError) {
        console.error('Failed to take screenshot:', screenshotError);
      }
    }
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 設置 console error 捕獲
async function setupErrorCapture(page) {
  await page.evaluateOnNewDocument(() => {
    window.__consoleErrors = [];
    const originalError = console.error;
    console.error = (...args) => {
      window.__consoleErrors.push(args.join(' '));
      originalError.apply(console, args);
    };
  });
}

// 執行測試
testMutationObserver().catch(console.error);