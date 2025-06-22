const puppeteer = require('puppeteer');

async function testSimpleWidgets() {
  console.log('🔍 測試簡單 widget 功能...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
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

    // 進入編輯模式
    console.log('\n📝 進入編輯模式...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 清空 dashboard (如果有 widgets)
    const hasWidgets = await page.evaluate(() => {
      return document.querySelectorAll('.widget-container').length > 0;
    });
    
    if (hasWidgets) {
      console.log('🧹 清空現有 widgets...');
      await page.evaluate(() => {
        const deleteButtons = document.querySelectorAll('.widget-container button');
        deleteButtons.forEach(btn => {
          if (btn.textContent === '×') btn.click();
        });
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 測試 1: 加入 widget
    console.log('\n🧪 測試 1: 加入 widget');
    console.log('========================');
    
    // 點擊 Add Widget
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 檢查對話框
    const dialogState = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const widgetOptions = dialog ? dialog.querySelectorAll('div[class*="rounded-lg"][class*="border"]') : [];
      return {
        hasDialog: !!dialog,
        optionCount: widgetOptions.length,
        firstOptionText: widgetOptions[0]?.textContent || ''
      };
    });
    
    console.log(`  對話框開啟: ${dialogState.hasDialog ? '✅' : '❌'}`);
    console.log(`  可選 widgets: ${dialogState.optionCount}`);

    // 選擇第一個 widget (Production Statistics)
    if (dialogState.optionCount > 0) {
      await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const firstOption = dialog?.querySelector('div[class*="rounded-lg"][class*="border"]');
        if (firstOption) firstOption.click();
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 檢查是否成功添加
      const widgetCount = await page.evaluate(() => {
        return document.querySelectorAll('.widget-container').length;
      });
      
      console.log(`  Widget 數量: ${widgetCount}`);
      console.log(`  添加測試: ${widgetCount === 1 ? '✅ 成功' : '❌ 失敗'}`);

      // 測試 2: 刪除 widget
      if (widgetCount > 0) {
        console.log('\n🧪 測試 2: 刪除 widget');
        console.log('========================');
        
        await page.evaluate(() => {
          const deleteBtn = document.querySelector('.widget-container button');
          if (deleteBtn && deleteBtn.textContent === '×') {
            deleteBtn.click();
          }
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        const remainingWidgets = await page.evaluate(() => {
          return document.querySelectorAll('.widget-container').length;
        });
        
        console.log(`  剩餘 widgets: ${remainingWidgets}`);
        console.log(`  刪除測試: ${remainingWidgets === 0 ? '✅ 成功' : '❌ 失敗'}`);
      }

      // 測試 3: 添加多個 widgets
      console.log('\n🧪 測試 3: 添加多個 widgets');
      console.log('==============================');
      
      const widgetTypes = ['Production Statistics', 'Transfer Statistics', 'Operation History'];
      
      for (let i = 0; i < widgetTypes.length; i++) {
        // 點擊 Add Widget
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
          if (addBtn) addBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 選擇對應的 widget
        const selected = await page.evaluate((widgetName) => {
          const dialog = document.querySelector('[role="dialog"]');
          const options = Array.from(dialog?.querySelectorAll('div[class*="rounded-lg"][class*="border"]') || []);
          const target = options.find(opt => opt.textContent?.includes(widgetName));
          if (target) {
            target.click();
            return true;
          }
          return false;
        }, widgetTypes[i]);
        
        console.log(`  添加 ${widgetTypes[i]}: ${selected ? '✅' : '❌'}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 檢查最終狀態
      const finalState = await page.evaluate(() => {
        const widgets = document.querySelectorAll('.widget-container');
        return {
          count: widgets.length,
          positions: Array.from(widgets).map((w, i) => {
            const parent = w.parentElement;
            return {
              index: i + 1,
              left: parent?.style.left || '',
              top: parent?.style.top || '',
              width: parent?.style.width || '',
              height: parent?.style.height || ''
            };
          })
        };
      });

      console.log(`\n  最終 widget 數量: ${finalState.count}`);
      console.log('  Widget 位置:');
      finalState.positions.forEach(pos => {
        console.log(`    Widget ${pos.index}: 位置(${pos.left}, ${pos.top}), 大小(${pos.width} × ${pos.height})`);
      });

      // 保存變更
      console.log('\n💾 保存變更...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const doneBtn = buttons.find(btn => btn.textContent?.includes('Done Editing'));
        if (doneBtn) doneBtn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 重新進入編輯模式檢查是否保存
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
        if (editBtn) editBtn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1500));

      const savedWidgetCount = await page.evaluate(() => {
        return document.querySelectorAll('.widget-container').length;
      });

      console.log(`  保存後 widget 數量: ${savedWidgetCount}`);
      console.log(`  保存測試: ${savedWidgetCount === finalState.count ? '✅ 成功' : '❌ 失敗'}`);
    }

    // 截圖
    await page.screenshot({ 
      path: '/tmp/widget-simple-test.png',
      fullPage: true 
    });
    console.log('\n📸 截圖已保存到 /tmp/widget-simple-test.png');

    // 總結
    console.log('\n📊 測試總結');
    console.log('============');
    console.log('✅ 簡單版本測試完成');

  } catch (error) {
    console.error('❌ 測試錯誤:', error);
  } finally {
    console.log('\n🎯 測試完成！瀏覽器保持開啟供檢查...');
    // 保持瀏覽器開啟
    await new Promise(() => {});
  }
}

// 執行測試
testSimpleWidgets();