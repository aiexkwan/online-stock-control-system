const puppeteer = require('puppeteer');

async function testWithFullDebug() {
  console.log('🔍 測試 widget 完整除錯...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    devtools: true
  });

  try {
    const page = await browser.newPage();
    
    // 捕獲所有 console 訊息
    const consoleLogs = [];
    page.on('console', msg => {
      const log = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      consoleLogs.push(log);
      
      if (msg.type() === 'error') {
        console.log('❌ Console 錯誤:', msg.text());
      } else if (msg.type() === 'warning') {
        console.log('⚠️  Console 警告:', msg.text());
      } else if (msg.type() === 'log' && msg.text().includes('widget')) {
        console.log('📝 Widget 相關:', msg.text());
      }
    });

    // 捕獲頁面錯誤
    page.on('pageerror', error => {
      console.log('💥 頁面錯誤:', error.message);
      console.log('   堆疊:', error.stack);
    });

    // 捕獲請求失敗
    page.on('requestfailed', request => {
      console.log('🚫 請求失敗:', request.url());
      console.log('   原因:', request.failure()?.errorText);
    });

    // 登入
    console.log('📝 登入系統...');
    await page.goto('http://localhost:3000/main-login', { waitUntil: 'networkidle0' });
    
    // 等待並檢查登入頁面
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.type('input[type="email"]', 'akwan@pennineindustries.com');
      await page.type('input[type="password"]', 'X315Y316');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log('✅ 登入成功');
    } catch (e) {
      console.log('❌ 登入失敗:', e.message);
      
      // 檢查是否有錯誤訊息
      const pageContent = await page.content();
      if (pageContent.includes('Something went wrong')) {
        console.log('🔴 頁面顯示錯誤訊息');
        
        // 檢查錯誤詳情
        const errorDetails = await page.evaluate(() => {
          const errorEl = document.querySelector('.text-red-500');
          const refreshButton = document.querySelector('button');
          return {
            errorText: errorEl?.textContent || '',
            hasRefreshButton: !!refreshButton,
            pageTitle: document.title,
            bodyText: document.body.innerText.substring(0, 500)
          };
        });
        
        console.log('\n錯誤詳情:');
        console.log('  標題:', errorDetails.pageTitle);
        console.log('  錯誤文字:', errorDetails.errorText);
        console.log('  有重新整理按鈕:', errorDetails.hasRefreshButton);
        console.log('\n頁面內容預覽:');
        console.log(errorDetails.bodyText);
      }
    }
    
    // 前往 admin 頁面
    console.log('\n📍 前往 admin 頁面...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 檢查頁面狀態
    const pageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasError: document.body.textContent?.includes('Something went wrong'),
        hasAdminContent: !!document.querySelector('.admin-page') || 
                        !!document.querySelector('[class*="admin"]') ||
                        !!document.querySelector('.grid-stack'),
        bodyClasses: document.body.className,
        mainContent: document.querySelector('main')?.innerHTML?.substring(0, 200)
      };
    });

    console.log('\n頁面狀態:');
    console.log('  URL:', pageState.url);
    console.log('  標題:', pageState.title);
    console.log('  有錯誤:', pageState.hasError);
    console.log('  有 Admin 內容:', pageState.hasAdminContent);
    console.log('  Body classes:', pageState.bodyClasses);

    if (pageState.hasError) {
      console.log('\n🔴 Admin 頁面有錯誤！');
      
      // 輸出所有 console logs
      console.log('\n所有 Console 訊息:');
      consoleLogs.forEach((log, i) => {
        console.log(`${i + 1}. [${log.type}] ${log.text}`);
        if (log.location.url) {
          console.log(`   位置: ${log.location.url}:${log.location.lineNumber}`);
        }
      });
      
      // 嘗試找出錯誤來源
      const errorInfo = await page.evaluate(() => {
        // 檢查 React 錯誤邊界
        const errorBoundary = document.querySelector('[class*="error"]');
        
        // 檢查網路請求
        const scripts = Array.from(document.querySelectorAll('script')).map(s => ({
          src: s.src,
          hasError: s.onerror !== null
        }));
        
        return {
          errorBoundaryText: errorBoundary?.textContent || '',
          scriptsWithErrors: scripts.filter(s => s.hasError),
          windowError: window.__errorMessage || null
        };
      });
      
      console.log('\n錯誤分析:');
      console.log('  錯誤邊界文字:', errorInfo.errorBoundaryText);
      console.log('  有錯誤的腳本:', errorInfo.scriptsWithErrors);
      console.log('  Window 錯誤:', errorInfo.windowError);
    } else {
      console.log('✅ Admin 頁面載入成功');
      
      // 繼續測試 widget 功能
      console.log('\n開始測試 widget 功能...');
      
      // 這裡可以加入之前的 widget 測試邏輯
    }

    // 截圖
    await page.screenshot({ 
      path: '/tmp/widget-full-debug.png',
      fullPage: true 
    });
    console.log('\n📸 截圖已保存到 /tmp/widget-full-debug.png');

  } catch (error) {
    console.error('❌ 測試錯誤:', error);
    console.error('堆疊:', error.stack);
  } finally {
    console.log('\n🎯 測試完成！瀏覽器保持開啟供檢查...');
    // 保持瀏覽器開啟
    await new Promise(() => {});
  }
}

// 執行測試
testWithFullDebug();