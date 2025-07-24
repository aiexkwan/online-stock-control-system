const puppeteer = require('puppeteer');
require('dotenv').config({ path: './.env.local' });

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 先登入
    console.log('導航到登入頁面...');
    await page.goto('http://localhost:3000/main-login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // 等待登入表單出現並填寫
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', process.env.SYS_LOGIN || process.env.PUPPETEER_LOGIN || 'admin@test.com');
      await page.type('input[type="password"]', process.env.SYS_PASSWORD || process.env.PUPPETEER_PASSWORD || 'password');
      
      // 點擊登入按鈕
      await page.click('button[type="submit"]');
      console.log('已提交登入表單，等待頁面跳轉...');
      
      // 等待跳轉完成
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    } catch (e) {
      console.log('登入可能不需要或已經登入，繼續測試...');
    }
    
    // 導航到Operations頁面
    console.log('導航到Operations頁面...');
    await page.goto('http://localhost:3000/admin/operations', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // 等待页面内容加载
    console.log('等待頁面內容載入...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 檢查頁面基本內容
    const pageContent = await page.evaluate(() => {
      const body = document.body;
      return {
        hasBody: !!body,
        bodyContent: body ? body.textContent.substring(0, 200) : 'No body',
        containsAdmin: body ? body.textContent.includes('Admin') : false,
        containsOperations: body ? body.textContent.includes('Operations') : false,
        hasDashboard: !!document.querySelector('[class*="dashboard"]'),
        hasGrid: !!document.querySelector('[style*="grid"]'),
        elementCount: document.querySelectorAll('*').length
      };
    });
    
    console.log('📄 頁面內容檢查:', pageContent);
    
    // 等待grid容器出現
    console.log('等待Operations Grid容器載入...');
    try {
      await page.waitForSelector('.operations-grid-container', { timeout: 5000 });
      console.log('✅ Operations Grid容器找到');
    } catch (e) {
      console.log('❌ Operations Grid容器未找到，檢查默認grid...');
      try {
        await page.waitForSelector('[style*="grid-template-areas"]', { timeout: 5000 });
        console.log('✅ 默認Grid容器找到');
      } catch (e2) {
        console.log('❌ 沒有找到任何Grid容器，檢查所有元素...');
        
        const allElements = await page.evaluate(() => {
          const elements = [];
          document.querySelectorAll('*').forEach(el => {
            const className = el.className || '';
            if (el.style.display === 'grid' || 
                (typeof className === 'string' && className.includes('grid')) || 
                el.style.gridTemplateAreas) {
              elements.push({
                tagName: el.tagName,
                className: className.toString(),
                id: el.id,
                style: el.style.cssText.substring(0, 100)
              });
            }
          });
          return elements.slice(0, 10); // 只取前10個
        });
        
        console.log('📋 找到的Grid相關元素:', allElements);
      }
    }
    
    // 檢查網格結構
    const gridInfo = await page.evaluate(() => {
      const gridContainer = document.querySelector('.operations-grid-container') || 
                           document.querySelector('[style*="grid-template-areas"]');
      
      if (!gridContainer) return { error: 'No grid container found' };
      
      const computedStyle = window.getComputedStyle(gridContainer);
      return {
        display: computedStyle.display,
        gridTemplateColumns: computedStyle.gridTemplateColumns,
        gridTemplateRows: computedStyle.gridTemplateRows,
        gap: computedStyle.gap,
        childrenCount: gridContainer.children.length,
        hasGridAreas: computedStyle.gridTemplateAreas !== 'none'
      };
    });
    
    console.log('📊 Grid結構信息:', gridInfo);
    
    // 檢查卡片元素
    console.log('檢查各個卡片組件...');
    
    const cards = await page.evaluate(() => {
      const cardElements = [];
      
      // 檢查Department Selector
      const deptSelector = document.querySelector('[style*="dept-sel"]') ||
                          document.querySelector('[aria-label*="Department"]');
      if (deptSelector) {
        cardElements.push({
          name: 'Department Selector',
          found: true,
          gridArea: deptSelector.style.gridArea || 'unknown'
        });
      }
      
      // 檢查Stats Cards
      const statsCards = document.querySelectorAll('[style*="stats-"]');
      cardElements.push({
        name: 'Stats Cards',
        found: statsCards.length > 0,
        count: statsCards.length
      });
      
      // 檢查Chart Cards
      const chartCards = document.querySelectorAll('[style*="chart-"]');
      cardElements.push({
        name: 'Chart Cards',
        found: chartCards.length > 0,
        count: chartCards.length
      });
      
      // 檢查History Tree
      const historyTree = document.querySelector('[style*="hist"]') ||
                         document.querySelector('[aria-label*="history"]');
      if (historyTree) {
        cardElements.push({
          name: 'History Tree',
          found: true,
          gridArea: historyTree.style.gridArea || 'unknown'
        });
      }
      
      return cardElements;
    });
    
    cards.forEach(card => {
      if (card.found) {
        console.log(`✅ ${card.name} 找到`, card.count ? `(${card.count}個)` : '');
      } else {
        console.log(`❌ ${card.name} 未找到`);
      }
    });
    
    // 檢查響應式設計
    console.log('測試響應式設計...');
    
    // 桌面版 (1920x1080)
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const desktopGrid = await page.evaluate(() => {
      const grid = document.querySelector('.operations-grid-container') || 
                  document.querySelector('[style*="grid-template-areas"]');
      return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
    });
    console.log('🖥️  桌面版 Grid Columns:', desktopGrid);
    
    // 平板版 (1200x800)
    await page.setViewport({ width: 1200, height: 800 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const tabletGrid = await page.evaluate(() => {
      const grid = document.querySelector('.operations-grid-container') || 
                  document.querySelector('[style*="grid-template-areas"]');
      return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
    });
    console.log('📱 平板版 Grid Columns:', tabletGrid);
    
    // 手機版 (768x600)
    await page.setViewport({ width: 768, height: 600 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mobileGrid = await page.evaluate(() => {
      const grid = document.querySelector('.operations-grid-container') || 
                  document.querySelector('[style*="grid-template-areas"]');
      return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
    });
    console.log('📱 手機版 Grid Columns:', mobileGrid);
    
    // 截圖保存
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ 
      path: './operations-grid-test.png',
      fullPage: true 
    });
    console.log('📸 截圖保存到: ./operations-grid-test.png');
    
    console.log('✅ Operations頁面測試完成');
    
  } catch (error) {
    console.error('❌ 測試過程中出現錯誤:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();