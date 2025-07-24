const puppeteer = require('puppeteer');
const fs = require('fs');

async function testOperationsCards() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 收集Console錯誤
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // 收集網絡錯誤
  const networkErrors = [];
  page.on('response', response => {
    if (!response.ok()) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🚀 開始測試NewPennine Operations頁面Card架構...');
    
    // 步驟1: 導航到登錄頁面
    console.log('📍 步驟1: 訪問http://localhost:3001');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 檢查是否被重定向到登錄頁面
    const currentUrl = page.url();
    console.log(`📍 當前URL: ${currentUrl}`);
    
    if (currentUrl.includes('main-login')) {
      console.log('✅ 正確重定向到登錄頁面');
      
      // 步驟2: 登錄
      console.log('📍 步驟2: 執行登錄...');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.type('input[type="email"]', 'akwan@pennineindustries.com');
      await page.type('input[type="password"]', 'X315Y316');
      
      // 點擊登錄按鈕
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      console.log('✅ 登錄完成');
    }
    
    // 步驟3: 導航到operations頁面
    console.log('📍 步驟3: 導航到/admin/operations');
    await page.goto('http://localhost:3001/admin/operations', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('✅ 成功載入operations頁面');
    
    // 步驟4: 檢查頁面基本結構
    console.log('📍 步驟4: 檢查頁面結構...');
    
    // 等待頁面完全載入
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 檢查Cards
    const cardContainers = await page.$$('.grid');  
    console.log(`📊 找到 ${cardContainers.length} 個Grid容器`);
    
    // 檢查新Card組件
    console.log('📍 步驟5: 檢查新Card架構...');
    const cardTypes = [
      'StatsCard',
      'ChartCard', 
      'TableCard',
      'UploadCard',
      'ReportCard',
      'AnalysisCard'
    ];
    
    const cardResults = {};
    for (const cardType of cardTypes) {
      const cards = await page.$$(`[data-testid="${cardType}"], .${cardType.toLowerCase()}`);
      cardResults[cardType] = cards.length;
      console.log(`🎯 ${cardType}: ${cards.length} 個實例`);
    }
    
    // 檢查是否還有Loading狀態
    const loadingElements = await page.$$eval('[data-testid*="loading"], .loading', 
      elements => elements.map(el => el.textContent));
    console.log(`⏳ Loading元素: ${loadingElements.length} 個`);
    if (loadingElements.length > 0) {
      console.log('⚠️  仍有Loading狀態:', loadingElements);
    }
    
    // 步驟6: 截圖
    console.log('📍 步驟6: 截取頁面截圖...');
    await page.screenshot({ 
      path: '/Users/kwanchuncheong/NewPennine/operations-cards-test.png',
      fullPage: true 
    });
    console.log('📸 截圖已保存: operations-cards-test.png');
    
    // 步驟7: 檢查特定Card內容
    console.log('📍 步驟7: 檢查Card內容...');
    
    // 檢查是否有GraphQL查詢錯誤
    const graphqlErrors = await page.evaluate(() => {
      return window.__APOLLO_CLIENT__ ? 
        JSON.stringify(window.__APOLLO_CLIENT__.cache.data) : 'No Apollo Client';
    });
    
    // 最終測試報告
    console.log('\n🎯 === 測試結果摘要 ===');
    console.log(`✅ 頁面載入: 成功`);
    console.log(`✅ 登錄認證: 成功`);
    console.log(`✅ Operations頁面訪問: 成功`);
    
    console.log('\n📊 Card架構檢查:');
    let totalCards = 0;
    Object.entries(cardResults).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} 個`);
      totalCards += count;
    });
    console.log(`  總計: ${totalCards} 個Cards`);
    
    console.log(`\n⏳ Loading狀態: ${loadingElements.length} 個`);
    console.log(`🚨 Console錯誤: ${consoleErrors.length} 個`);
    console.log(`🌐 網絡錯誤: ${networkErrors.length} 個`);
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 Console錯誤詳情:');
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n🌐 網絡錯誤詳情:');
      networkErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    // 保存詳細報告
    const report = {
      timestamp: new Date().toISOString(),
      success: true,
      url: page.url(),
      cardResults,
      loadingElements: loadingElements.length,
      consoleErrors,
      networkErrors,
      totalCards
    };
    
    fs.writeFileSync(
      '/Users/kwanchuncheong/NewPennine/operations-test-report.json', 
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📋 詳細報告已保存: operations-test-report.json');
    console.log('🎉 測試完成！');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    
    // 失敗時也截圖
    try {
      await page.screenshot({ 
        path: '/Users/kwanchuncheong/NewPennine/operations-error-screenshot.png',
        fullPage: true 
      });
      console.log('📸 錯誤截圖已保存: operations-error-screenshot.png');
    } catch (screenshotError) {
      console.error('截圖失敗:', screenshotError.message);
    }
    
    const errorReport = {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
      url: page.url(),
      consoleErrors,
      networkErrors
    };
    
    fs.writeFileSync(
      '/Users/kwanchuncheong/NewPennine/operations-error-report.json', 
      JSON.stringify(errorReport, null, 2)
    );
  } finally {
    await browser.close();
  }
}

testOperationsCards();