const puppeteer = require('puppeteer');

async function testAdminAnalysisComprehensive() {
  console.log('🔍 Starting Comprehensive Admin Analysis Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // 監聽網絡請求
  const requestCounts = {};
  const errorLogs = [];
  
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/admin/dashboard')) {
      const key = url.split('?')[0];
      requestCounts[key] = (requestCounts[key] || 0) + 1;
    }
  });
  
  // 監聽控制台錯誤
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('originalFactory.call') || text.includes('undefined is not an object')) {
        errorLogs.push(text);
      }
    }
  });
  
  // 監聽頁面錯誤
  page.on('pageerror', (error) => {
    if (error.message.includes('originalFactory.call') || error.message.includes('undefined is not an object')) {
      errorLogs.push(error.message);
    }
  });
  
  try {
    console.log('📍 Step 1: Navigating to admin analysis page...');
    await page.goto('http://localhost:3000/admin/analysis', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('⏳ Step 2: Waiting for initial page load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 檢查頁面是否正常載入
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    
    // 檢查是否有 originalFactory.call 錯誤
    const initialErrorCount = errorLogs.length;
    console.log(`❌ Initial originalFactory.call errors: ${initialErrorCount}`);
    
    // 檢查 API 請求數量
    const initialRequestCount = requestCounts['http://localhost:3000/api/admin/dashboard'] || 0;
    console.log(`📊 Initial dashboard API requests: ${initialRequestCount}`);
    
    console.log('⏳ Step 3: Monitoring for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 檢查是否有新的錯誤
    const finalErrorCount = errorLogs.length;
    const newErrors = finalErrorCount - initialErrorCount;
    console.log(`❌ New originalFactory.call errors: ${newErrors}`);
    
    // 檢查 API 請求是否穩定
    const finalRequestCount = requestCounts['http://localhost:3000/api/admin/dashboard'] || 0;
    const newRequests = finalRequestCount - initialRequestCount;
    console.log(`📊 New dashboard API requests: ${newRequests}`);
    
    // 檢查頁面元素是否正常渲染
    console.log('🔍 Step 4: Checking page elements...');
    
    // 等待主要組件載入
    try {
      await page.waitForSelector('[data-testid="analysis-content"], .analysis-content, .admin-dashboard-content', {
        timeout: 5000
      });
      console.log('✅ Main content area found');
    } catch (error) {
      console.log('⚠️  Main content area not found, checking for any content...');
    }
    
    // 檢查是否有錯誤邊界顯示
    const errorBoundaryElements = await page.$$('.error-boundary, [data-testid="error-boundary"]');
    console.log(`🛡️  Error boundary elements found: ${errorBoundaryElements.length}`);
    
    // 檢查是否有載入中的元素
    const loadingElements = await page.$$('.loading, .skeleton, .animate-pulse');
    console.log(`⏳ Loading elements found: ${loadingElements.length}`);
    
    // 檢查頁面是否有內容
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.length > 100;
    console.log(`📝 Page has content: ${hasContent} (${bodyText.length} chars)`);
    
    console.log('⏳ Step 5: Testing page interaction...');
    
    // 嘗試滾動頁面
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 檢查滾動後是否有新的錯誤
    const scrollErrorCount = errorLogs.length;
    const scrollErrors = scrollErrorCount - finalErrorCount;
    console.log(`❌ Errors after scrolling: ${scrollErrors}`);
    
    // 最終檢查
    const finalFinalRequestCount = requestCounts['http://localhost:3000/api/admin/dashboard'] || 0;
    const totalRequests = finalFinalRequestCount;
    
    console.log('\n📊 Final Test Results:');
    console.log(`==========================================`);
    console.log(`Total originalFactory.call errors: ${errorLogs.length}`);
    console.log(`Total dashboard API requests: ${totalRequests}`);
    console.log(`Page has content: ${hasContent}`);
    console.log(`Error boundary elements: ${errorBoundaryElements.length}`);
    console.log(`Loading elements: ${loadingElements.length}`);
    
    // 評估測試結果
    let testsPassed = 0;
    let totalTests = 5;
    
    // Test 1: 沒有 originalFactory.call 錯誤
    if (errorLogs.length === 0) {
      console.log('✅ Test 1 PASSED: No originalFactory.call errors');
      testsPassed++;
    } else {
      console.log(`❌ Test 1 FAILED: ${errorLogs.length} originalFactory.call errors found`);
      console.log('First few errors:', errorLogs.slice(0, 3));
    }
    
    // Test 2: API 請求數量合理
    if (totalRequests < 50) {
      console.log('✅ Test 2 PASSED: API request count is reasonable');
      testsPassed++;
    } else {
      console.log(`❌ Test 2 FAILED: Too many API requests (${totalRequests})`);
    }
    
    // Test 3: 頁面有內容
    if (hasContent) {
      console.log('✅ Test 3 PASSED: Page has content');
      testsPassed++;
    } else {
      console.log('❌ Test 3 FAILED: Page has no content');
    }
    
    // Test 4: 錯誤邊界數量合理
    if (errorBoundaryElements.length < 3) {
      console.log('✅ Test 4 PASSED: Error boundary count is reasonable');
      testsPassed++;
    } else {
      console.log(`❌ Test 4 FAILED: Too many error boundaries (${errorBoundaryElements.length})`);
    }
    
    // Test 5: 載入狀態合理
    if (loadingElements.length < 10) {
      console.log('✅ Test 5 PASSED: Loading element count is reasonable');
      testsPassed++;
    } else {
      console.log(`❌ Test 5 FAILED: Too many loading elements (${loadingElements.length})`);
    }
    
    console.log(`\n📈 Overall Result: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Admin Analysis fix is working!');
      return true;
    } else {
      console.log('💥 SOME TESTS FAILED - Issues still exist');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// 運行測試
testAdminAnalysisComprehensive().then(success => {
  if (success) {
    console.log('\n🎉 COMPREHENSIVE TEST PASSED');
    process.exit(0);
  } else {
    console.log('\n💥 COMPREHENSIVE TEST FAILED');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Test error:', error);
  process.exit(1);
}); 