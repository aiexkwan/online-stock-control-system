const puppeteer = require('puppeteer');

async function testWidgetFixes() {
  console.log('🔍 測試 widget 修復...\n');
  
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

    // 清空 dashboard
    console.log('\n🧹 清空 dashboard...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(btn => btn.textContent?.includes('Reset Dashboard'));
      if (resetBtn) resetBtn.click();
    });
    page.once('dialog', async dialog => await dialog.accept());
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 測試 1: 加入 widget 檢查雙層問題
    console.log('\n🧪 測試 1: 加入 widget 檢查雙層問題');
    console.log('========================================');
    
    // 點擊 Add Widget
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 選擇第一個 widget
    await page.evaluate(() => {
      const widgetButtons = Array.from(document.querySelectorAll('button.p-4'));
      if (widgetButtons[0]) widgetButtons[0].click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 檢查是否有雙層
    let layerCheck = await page.evaluate(() => {
      const gridItems = document.querySelectorAll('.grid-stack-item');
      const widgetContainers = document.querySelectorAll('.widget-container');
      const duplicateContent = [];
      
      // 檢查每個 grid item 內部
      gridItems.forEach((item, i) => {
        const containers = item.querySelectorAll('.widget-container');
        const contents = item.querySelectorAll('.grid-stack-item-content');
        duplicateContent.push({
          index: i,
          id: item.getAttribute('gs-id'),
          containersInside: containers.length,
          contentsInside: contents.length
        });
      });
      
      return {
        gridItems: gridItems.length,
        totalWidgetContainers: widgetContainers.length,
        details: duplicateContent
      };
    });

    console.log(`  Grid items 數量: ${layerCheck.gridItems}`);
    console.log(`  Widget containers 總數: ${layerCheck.totalWidgetContainers}`);
    console.log(`  單層測試: ${layerCheck.gridItems === 1 && layerCheck.totalWidgetContainers === 1 ? '✅ 成功' : '❌ 失敗'}`);
    
    if (layerCheck.details.length > 0) {
      console.log('\n  詳細分析:');
      layerCheck.details.forEach(d => {
        console.log(`    Widget ${d.index + 1} (ID: ${d.id}):`);
        console.log(`      - 內部 containers: ${d.containersInside}`);
        console.log(`      - 內部 contents: ${d.contentsInside}`);
        console.log(`      - 狀態: ${d.containersInside === 1 && d.contentsInside === 1 ? '✅ 正常' : '❌ 異常'}`);
      });
    }

    // 測試 2: 刪除 widget
    console.log('\n🧪 測試 2: 刪除 widget 乾淨度');
    console.log('================================');
    
    // 點擊刪除按鈕
    const deleteClicked = await page.evaluate(() => {
      const deleteBtn = document.querySelector('.widget-remove-btn');
      if (deleteBtn) {
        deleteBtn.click();
        return true;
      }
      return false;
    });
    console.log(`  刪除按鈕點擊: ${deleteClicked ? '✅ 成功' : '❌ 失敗'}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 檢查是否完全刪除
    const deleteCheck = await page.evaluate(() => {
      const gridItems = document.querySelectorAll('.grid-stack-item');
      const orphanedContainers = document.querySelectorAll('.grid-stack > .widget-container');
      const orphanedContent = document.querySelectorAll('.grid-stack > .grid-stack-item-content');
      const totalChildren = document.querySelector('.grid-stack')?.children.length || 0;
      
      return {
        remainingGridItems: gridItems.length,
        orphanedContainers: orphanedContainers.length,
        orphanedContent: orphanedContent.length,
        totalGridChildren: totalChildren
      };
    });

    console.log(`  剩餘 grid items: ${deleteCheck.remainingGridItems}`);
    console.log(`  孤立 containers: ${deleteCheck.orphanedContainers}`);
    console.log(`  孤立 content: ${deleteCheck.orphanedContent}`);
    console.log(`  Grid 總子元素: ${deleteCheck.totalGridChildren}`);
    console.log(`  刪除測試: ${deleteCheck.remainingGridItems === 0 && deleteCheck.totalGridChildren === 0 ? '✅ 成功' : '❌ 失敗'}`);

    // 測試 3: Resize 和保存
    console.log('\n🧪 測試 3: Resize 和保存功能');
    console.log('================================');
    
    // 添加一個新 widget
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.evaluate(() => {
      const widgetButtons = Array.from(document.querySelectorAll('button.p-4'));
      if (widgetButtons[0]) widgetButtons[0].click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 獲取原始大小
    const originalSize = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (widget) {
        return {
          w: parseInt(widget.getAttribute('gs-w')),
          h: parseInt(widget.getAttribute('gs-h'))
        };
      }
      return null;
    });
    console.log(`  原始大小: ${originalSize ? `${originalSize.w}×${originalSize.h}` : 'N/A'}`);

    // 嘗試 resize widget (模擬拖拽)
    const resizeSuccess = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      const handle = widget?.querySelector('.ui-resizable-se');
      
      if (widget && handle && window.gridstack) {
        // 使用 Gridstack API 來 resize
        const grid = window.gridstack;
        const gridEl = document.querySelector('.grid-stack').gridstack;
        if (gridEl) {
          gridEl.resize(widget, 5, 5);
          return true;
        }
      }
      return false;
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 獲取 resize 後的大小
    const resizedSize = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (widget) {
        return {
          w: parseInt(widget.getAttribute('gs-w')),
          h: parseInt(widget.getAttribute('gs-h'))
        };
      }
      return null;
    });
    console.log(`  Resize 後大小: ${resizedSize ? `${resizedSize.w}×${resizedSize.h}` : 'N/A'}`);

    // 保存變更 (點擊 Done Editing)
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

    const savedSize = await page.evaluate(() => {
      const widget = document.querySelector('.grid-stack-item');
      if (widget) {
        return {
          w: parseInt(widget.getAttribute('gs-w')),
          h: parseInt(widget.getAttribute('gs-h'))
        };
      }
      return null;
    });
    console.log(`  保存後大小: ${savedSize ? `${savedSize.w}×${savedSize.h}` : 'N/A'}`);
    
    // 判斷是否成功保存
    const saveSuccess = savedSize && resizedSize && 
                       savedSize.w === resizedSize.w && 
                       savedSize.h === resizedSize.h;
    console.log(`  保存測試: ${saveSuccess ? '✅ 成功' : '❌ 失敗'}`);

    // 最終總結
    console.log('\n📊 測試總結');
    console.log('============');
    console.log(`  1. 單層 widget 渲染: ${layerCheck.gridItems === 1 && layerCheck.totalWidgetContainers === 1 ? '✅' : '❌'}`);
    console.log(`  2. 完全刪除 widget: ${deleteCheck.remainingGridItems === 0 && deleteCheck.totalGridChildren === 0 ? '✅' : '❌'}`);
    console.log(`  3. Resize 和保存: ${saveSuccess ? '✅' : '❌'}`);

    // 截圖
    await page.screenshot({ 
      path: '/tmp/widget-fixes-test.png',
      fullPage: true 
    });
    console.log('\n📸 截圖已保存到 /tmp/widget-fixes-test.png');

  } catch (error) {
    console.error('❌ 測試錯誤:', error);
  } finally {
    console.log('\n🎯 測試完成！瀏覽器保持開啟供檢查...');
    // 保持瀏覽器開啟
    await new Promise(() => {});
  }
}

// 執行測試
testWidgetFixes();