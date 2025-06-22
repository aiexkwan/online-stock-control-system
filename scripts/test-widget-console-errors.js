const puppeteer = require('puppeteer');

async function testWithConsoleLogging() {
  console.log('🔍 測試 widget 並捕獲 console 錯誤...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    devtools: true
  });

  try {
    const page = await browser.newPage();
    
    // 捕獲 console 日誌
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log('❌ Console 錯誤:', text);
      } else if (type === 'warning') {
        console.log('⚠️  Console 警告:', text);
      }
    });

    // 捕獲頁面錯誤
    page.on('pageerror', error => {
      console.log('💥 頁面錯誤:', error.message);
    });

    // 登入
    console.log('📝 登入系統...');
    await page.goto('http://localhost:3000/main-login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // 前往 admin 頁面
    console.log('📍 前往 admin 頁面...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 檢查頁面狀態
    console.log('\n🔍 檢查頁面狀態...');
    const pageInfo = await page.evaluate(() => {
      const dashboard = document.querySelector('.grid-stack');
      const editButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Edit Dashboard')
      );
      const gridstackLoaded = typeof window.GridStack !== 'undefined';
      
      return {
        hasDashboard: !!dashboard,
        hasEditButton: !!editButton,
        gridstackLoaded,
        dashboardChildren: dashboard?.children.length || 0,
        errorMessages: Array.from(document.querySelectorAll('.error')).map(e => e.textContent)
      };
    });

    console.log('  Dashboard 容器存在:', pageInfo.hasDashboard ? '✅' : '❌');
    console.log('  Edit Dashboard 按鈕存在:', pageInfo.hasEditButton ? '✅' : '❌');
    console.log('  Gridstack 已載入:', pageInfo.gridstackLoaded ? '✅' : '❌');
    console.log('  Dashboard 子元素數量:', pageInfo.dashboardChildren);
    if (pageInfo.errorMessages.length > 0) {
      console.log('  錯誤訊息:', pageInfo.errorMessages);
    }

    // 進入編輯模式
    console.log('\n📝 進入編輯模式...');
    const editClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) {
        editBtn.click();
        return true;
      }
      return false;
    });
    console.log('  點擊編輯按鈕:', editClicked ? '✅' : '❌');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 檢查編輯模式狀態
    const editModeInfo = await page.evaluate(() => {
      const addButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Add Widget')
      );
      const dashboard = document.querySelector('.grid-stack');
      const isEditMode = dashboard?.closest('.gridstack-dashboard')?.classList.contains('edit-mode');
      
      return {
        hasAddButton: !!addButton,
        isEditMode: !!isEditMode,
        addButtonVisible: addButton ? window.getComputedStyle(addButton).display !== 'none' : false
      };
    });

    console.log('\n編輯模式狀態:');
    console.log('  Add Widget 按鈕存在:', editModeInfo.hasAddButton ? '✅' : '❌');
    console.log('  編輯模式已啟用:', editModeInfo.isEditMode ? '✅' : '❌');
    console.log('  Add Widget 按鈕可見:', editModeInfo.addButtonVisible ? '✅' : '❌');

    // 嘗試添加 widget
    console.log('\n📦 嘗試添加 widget...');
    const addClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) {
        console.log('找到 Add Widget 按鈕，點擊中...');
        addBtn.click();
        return true;
      }
      console.log('找不到 Add Widget 按鈕');
      return false;
    });
    console.log('  點擊 Add Widget:', addClicked ? '✅' : '❌');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 檢查 dialog 狀態
    const dialogInfo = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const widgetButtons = dialog ? dialog.querySelectorAll('button.p-4') : [];
      
      return {
        hasDialog: !!dialog,
        widgetCount: widgetButtons.length,
        dialogVisible: dialog ? window.getComputedStyle(dialog).display !== 'none' : false
      };
    });

    console.log('\nWidget 選擇對話框:');
    console.log('  對話框存在:', dialogInfo.hasDialog ? '✅' : '❌');
    console.log('  對話框可見:', dialogInfo.dialogVisible ? '✅' : '❌');
    console.log('  可選 widget 數量:', dialogInfo.widgetCount);

    if (dialogInfo.widgetCount > 0) {
      // 選擇第一個 widget
      const widgetSelected = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const firstWidget = dialog?.querySelector('button.p-4');
        if (firstWidget) {
          console.log('選擇第一個 widget...');
          firstWidget.click();
          return true;
        }
        return false;
      });
      console.log('\n  選擇 widget:', widgetSelected ? '✅' : '❌');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 檢查 widget 是否成功添加
      const widgetInfo = await page.evaluate(() => {
        const gridItems = document.querySelectorAll('.grid-stack-item');
        const widgetContainers = document.querySelectorAll('.widget-container');
        
        const details = Array.from(gridItems).map(item => ({
          id: item.getAttribute('gs-id'),
          width: item.getAttribute('gs-w'),
          height: item.getAttribute('gs-h'),
          hasContent: !!item.querySelector('.grid-stack-item-content'),
          hasWidgetContainer: !!item.querySelector('.widget-container')
        }));
        
        return {
          gridItemCount: gridItems.length,
          widgetContainerCount: widgetContainers.length,
          details
        };
      });

      console.log('\nWidget 添加結果:');
      console.log('  Grid items 數量:', widgetInfo.gridItemCount);
      console.log('  Widget containers 數量:', widgetInfo.widgetContainerCount);
      
      if (widgetInfo.details.length > 0) {
        console.log('\n  Widget 詳情:');
        widgetInfo.details.forEach((w, i) => {
          console.log(`    Widget ${i + 1}:`);
          console.log(`      ID: ${w.id}`);
          console.log(`      尺寸: ${w.width}×${w.height}`);
          console.log(`      有內容: ${w.hasContent ? '✅' : '❌'}`);
          console.log(`      有容器: ${w.hasWidgetContainer ? '✅' : '❌'}`);
        });
      }
    }

    // 截圖
    await page.screenshot({ 
      path: '/tmp/widget-console-debug.png',
      fullPage: true 
    });
    console.log('\n📸 截圖已保存到 /tmp/widget-console-debug.png');

  } catch (error) {
    console.error('❌ 測試錯誤:', error);
  } finally {
    console.log('\n🎯 測試完成！瀏覽器保持開啟供檢查...');
    // 保持瀏覽器開啟
    await new Promise(() => {});
  }
}

// 執行測試
testWithConsoleLogging();