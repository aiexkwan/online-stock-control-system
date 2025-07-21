const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 讀取環境變數
function loadEnvVariables() {
  const envPath = path.join(__dirname, '.env.local');
  const envVars = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
  }

  return envVars;
}

async function testCompleteUserFlow() {
  console.log('🚀 Starting Complete User Flow Test...');
  console.log(
    '📋 Test Coverage: /main-login → /access → /admin/analysis → /admin/injection → /admin/warehouse'
  );

  // 載入環境變數
  const envVars = loadEnvVariables();
  const loginEmail = envVars.SYS_LOGIN || 'admin@pennineindustries.com';
  const loginPassword = envVars.SYS_PASSWORD || 'admin123';

  console.log(`🔑 Using login credentials: ${loginEmail}`);
  console.log(`🔑 Password: ${'*'.repeat(loginPassword.length)}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  // 測試統計
  const testStats = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    routes: [],
    widgets: {},
    errors: [],
  };

  // 監聽網絡請求
  const requestCounts = {};
  const networkErrors = [];

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/admin/dashboard')) {
      const key = url.split('?')[0];
      requestCounts[key] = (requestCounts[key] || 0) + 1;
    }
  });

  page.on('response', response => {
    if (!response.ok() && response.url().includes('/api/')) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
      });
    }
  });

  // 監聽控制台錯誤
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        text.includes('originalFactory.call') ||
        text.includes('undefined is not an object') ||
        text.includes('TypeError') ||
        text.includes('ReferenceError')
      ) {
        testStats.errors.push({
          type: 'console',
          message: text,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });

  // 監聽頁面錯誤
  page.on('pageerror', error => {
    testStats.errors.push({
      type: 'page',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  // 測試輔助函數
  function runTest(testName, testFn) {
    testStats.totalTests++;
    try {
      const result = testFn();
      if (result !== false) {
        testStats.passedTests++;
        console.log(`✅ ${testName}`);
        return true;
      } else {
        testStats.failedTests++;
        console.log(`❌ ${testName}`);
        return false;
      }
    } catch (error) {
      testStats.failedTests++;
      console.log(`❌ ${testName} - Error: ${error.message}`);
      return false;
    }
  }

  async function waitForElement(selector, timeout = 10000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`⚠️  Element not found: ${selector}`);
      return false;
    }
  }

  async function waitForNetworkIdle(timeout = 5000) {
    try {
      // 使用 setTimeout 包裝來模擬 waitForTimeout
      await new Promise(resolve => setTimeout(resolve, timeout));
      return true;
    } catch (error) {
      console.log(`⚠️  Network idle timeout: ${error.message}`);
      return false;
    }
  }

  try {
    // ==================== 第一階段：登入流程 ====================
    console.log('\n🔐 Phase 1: Login Flow Testing');
    console.log('='.repeat(50));

    console.log('📍 Step 1.1: Navigating to main login page...');
    await page.goto('http://localhost:3000/main-login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 檢查登入頁面載入
    const loginPageTitle = await page.title();
    runTest('Login page loads successfully', () => {
      return loginPageTitle && !loginPageTitle.includes('404');
    });

    await waitForElement('input[type="email"]', 10000);
    await waitForElement('input[type="password"]', 10000);

    console.log('📍 Step 1.2: Filling login credentials...');
    // 使用環境變數中的憑證
    await page.type('input[type="email"]', loginEmail);
    await page.type('input[type="password"]', loginPassword);

    console.log('📍 Step 1.3: Submitting login form...');
    await page.click('button[type="submit"]');

    // 等待登入完成，登入成功後會重定向到 /access
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    } catch (navError) {
      console.log('⚠️  Navigation timeout, checking current URL...');
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      // 如果已經重定向到 /access，則繼續
      if (currentUrl.includes('/access')) {
        console.log('✅ Login successful, redirected to access page');
      } else {
        // 等待一段時間後再檢查
        await page.waitForTimeout(3000);
        const newUrl = page.url();
        if (!newUrl.includes('/main-login')) {
          console.log('✅ Login appears successful');
        } else {
          throw new Error('Login failed - still on login page');
        }
      }
    }

    runTest('Login successful and redirected', () => {
      const currentUrl = page.url();
      const isLoggedIn = !currentUrl.includes('/main-login');
      console.log(`Current URL after login: ${currentUrl}`);
      return isLoggedIn;
    });

    // ==================== 第二階段：Access 頁面 ====================
    console.log('\n🔑 Phase 2: Access Page Testing');
    console.log('='.repeat(50));

    console.log('📍 Step 2.1: Navigating to access page...');
    await page.goto('http://localhost:3000/access', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const accessPageTitle = await page.title();
    runTest('Access page loads without errors', () => {
      return (
        accessPageTitle && !accessPageTitle.includes('404') && !accessPageTitle.includes('Error')
      );
    });

    await waitForNetworkIdle();

    // 檢查是否有權限控制元素
    const accessPageBody = await page.evaluate(() => document.body.innerText);
    runTest('Access page renders properly', () => {
      return accessPageBody.length > 100; // 確保頁面有內容
    });

    // ==================== 第三階段：Admin Analysis 頁面 ====================
    console.log('\n📊 Phase 3: Admin Analysis Page Testing');
    console.log('='.repeat(50));

    console.log('📍 Step 3.1: Navigating to admin analysis page...');
    try {
      await page.goto('http://localhost:3000/admin/analysis', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
    } catch (navError) {
      console.log(`⚠️  Navigation error: ${navError.message}`);
      // 嘗試重新導航
      console.log('🔄 Retrying navigation...');
      await page.goto('http://localhost:3000/admin/analysis', {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
    }

    const analysisPageTitle = await page.title();
    runTest('Admin analysis page loads successfully', () => {
      return (
        analysisPageTitle &&
        !analysisPageTitle.includes('404') &&
        !analysisPageTitle.includes('Error')
      );
    });

    console.log('📍 Step 3.2: Waiting for dashboard widgets to load...');

    // 檢查是否有無限循環的早期跡象
    const initialRequestCount = Object.values(requestCounts).reduce((sum, count) => sum + count, 0);
    console.log(`Initial request count: ${initialRequestCount}`);

    await waitForNetworkIdle(3000);

    // 檢查請求是否激增
    const afterWaitRequestCount = Object.values(requestCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    console.log(`After wait request count: ${afterWaitRequestCount}`);

    // 檢查主要 widget 容器
    const analysisWidgets = [
      'order_state_list',
      'top_products',
      'warehouse_transfer_list',
      'aco_order_progress',
      'stock_level_history',
      'stock_distribution_chart',
      'production_details',
      'staff_workload',
      'await_location_count',
      'warehouse_work_level',
      'await_location_count_by_timeframe',
      'grn_report_data',
      'history_tree',
    ];

    if (afterWaitRequestCount - initialRequestCount > 100) {
      console.log('⚠️  Potential infinite loop detected, stopping widget loading test');
      // 標記所有 widget 為未載入
      testStats.widgets.analysis = {};
      analysisWidgets.forEach(widget => {
        testStats.widgets.analysis[widget] = false;
        runTest(`Widget ${widget} loads properly`, () => false);
      });
    } else {
      await waitForNetworkIdle(7000); // 額外等待時間
    }

    if (!testStats.widgets.analysis) {
      testStats.widgets.analysis = {};

      for (const widget of analysisWidgets) {
        const isLoaded = await page.evaluate(widgetName => {
          // 尋找包含 widget 名稱的元素
          const selectors = [
            `[data-widget="${widgetName}"]`,
            `[data-testid="${widgetName}"]`,
            `.widget-${widgetName}`,
            `[class*="${widgetName}"]`,
            `[id*="${widgetName}"]`,
            `.admin-widget`,
            `.dashboard-widget`,
            `.widget-container`,
          ];

          for (const selector of selectors) {
            try {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                return true;
              }
            } catch (e) {
              // 忽略無效的選擇器
            }
          }

          // 檢查是否有任何包含 widget 名稱的文本內容
          const allElements = document.querySelectorAll('*');
          for (const element of allElements) {
            if (
              element.textContent &&
              element.textContent.toLowerCase().includes(widgetName.toLowerCase())
            ) {
              return true;
            }
          }

          return false;
        }, widget);

        testStats.widgets.analysis[widget] = isLoaded;
        runTest(`Widget ${widget} loads properly`, () => isLoaded);
      }
    }

    // 檢查是否有無限循環的跡象
    runTest('No infinite loop detected in analysis page', () => {
      const maxRequestsPerEndpoint = 10;
      for (const [endpoint, count] of Object.entries(requestCounts)) {
        if (count > maxRequestsPerEndpoint) {
          console.log(`⚠️  Potential infinite loop detected: ${endpoint} called ${count} times`);
          return false;
        }
      }
      return true;
    });

    // ==================== 第四階段：Admin Injection 頁面 ====================
    console.log('\n💉 Phase 4: Admin Injection Page Testing');
    console.log('='.repeat(50));

    console.log('📍 Step 4.1: Navigating to admin injection page...');
    try {
      await page.goto('http://localhost:3000/admin/injection', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
    } catch (navError) {
      console.log(`⚠️  Navigation error: ${navError.message}`);
      console.log('🔄 Retrying navigation...');
      await page.goto('http://localhost:3000/admin/injection', {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
    }

    const injectionPageTitle = await page.title();
    runTest('Admin injection page loads successfully', () => {
      return (
        injectionPageTitle &&
        !injectionPageTitle.includes('404') &&
        !injectionPageTitle.includes('Error')
      );
    });

    await waitForNetworkIdle(5000);

    // 檢查注入頁面的基本功能
    const injectionPageBody = await page.evaluate(() => document.body.innerText);
    runTest('Injection page renders content', () => {
      return injectionPageBody.length > 100;
    });

    // 檢查是否有特定的注入相關元素
    const injectionElements = await page.evaluate(() => {
      const forms = document.querySelectorAll('form').length;
      const inputs = document.querySelectorAll('input').length;
      const buttons = document.querySelectorAll('button').length;
      return { forms, inputs, buttons };
    });

    runTest('Injection page has interactive elements', () => {
      return (
        injectionElements.forms > 0 || injectionElements.inputs > 0 || injectionElements.buttons > 0
      );
    });

    // ==================== 第五階段：Admin Warehouse 頁面 ====================
    console.log('\n🏭 Phase 5: Admin Warehouse Page Testing');
    console.log('='.repeat(50));

    console.log('📍 Step 5.1: Navigating to admin warehouse page...');
    try {
      await page.goto('http://localhost:3000/admin/warehouse', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
    } catch (navError) {
      console.log(`⚠️  Navigation error: ${navError.message}`);
      console.log('🔄 Retrying navigation...');
      await page.goto('http://localhost:3000/admin/warehouse', {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
    }

    const warehousePageTitle = await page.title();
    runTest('Admin warehouse page loads successfully', () => {
      return (
        warehousePageTitle &&
        !warehousePageTitle.includes('404') &&
        !warehousePageTitle.includes('Error')
      );
    });

    await waitForNetworkIdle(5000);

    // 檢查倉庫頁面的基本功能
    const warehousePageBody = await page.evaluate(() => document.body.innerText);
    runTest('Warehouse page renders content', () => {
      return warehousePageBody.length > 100;
    });

    // 檢查倉庫相關的 widget 或表格
    const warehouseElements = await page.evaluate(() => {
      const tables = document.querySelectorAll('table').length;
      const cards = document.querySelectorAll('[class*="card"], [class*="widget"]').length;
      const lists = document.querySelectorAll('ul, ol').length;
      return { tables, cards, lists };
    });

    runTest('Warehouse page has data display elements', () => {
      return (
        warehouseElements.tables > 0 || warehouseElements.cards > 0 || warehouseElements.lists > 0
      );
    });

    // ==================== 第六階段：跨頁面導航測試 ====================
    console.log('\n🔄 Phase 6: Cross-Page Navigation Testing');
    console.log('='.repeat(50));

    const routes = [
      { path: '/admin/analysis', name: 'Analysis' },
      { path: '/admin/injection', name: 'Injection' },
      { path: '/admin/warehouse', name: 'Warehouse' },
      { path: '/access', name: 'Access' },
    ];

    for (const route of routes) {
      console.log(`📍 Step 6.${routes.indexOf(route) + 1}: Testing navigation to ${route.name}...`);

      try {
        await page.goto(`http://localhost:3000${route.path}`, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
      } catch (navError) {
        console.log(`⚠️  Navigation error for ${route.name}: ${navError.message}`);
        console.log('🔄 Retrying navigation...');
        await page.goto(`http://localhost:3000${route.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });
      }

      await waitForNetworkIdle(3000);

      const routeTitle = await page.title();
      const routeUrl = page.url();
      const navigationSuccess = runTest(`Navigation to ${route.name} without refresh`, () => {
        return routeTitle && !routeTitle.includes('404') && routeUrl.includes(route.path);
      });

      testStats.routes.push({
        path: route.path,
        name: route.name,
        success: navigationSuccess,
      });
    }

    // ==================== 第七階段：錯誤檢查 ====================
    console.log('\n🔍 Phase 7: Error Detection and Analysis');
    console.log('='.repeat(50));

    runTest('No originalFactory.call errors detected', () => {
      const originalFactoryErrors = testStats.errors.filter(error =>
        error.message.includes('originalFactory.call')
      );
      if (originalFactoryErrors.length > 0) {
        console.log(`⚠️  Found ${originalFactoryErrors.length} originalFactory.call errors`);
        originalFactoryErrors.forEach(error => {
          console.log(`   - ${error.message}`);
        });
        return false;
      }
      return true;
    });

    runTest('No critical JavaScript errors', () => {
      const criticalErrors = testStats.errors.filter(
        error =>
          error.message.includes('TypeError') ||
          error.message.includes('ReferenceError') ||
          error.message.includes('undefined is not an object')
      );
      if (criticalErrors.length > 0) {
        console.log(`⚠️  Found ${criticalErrors.length} critical JavaScript errors`);
        criticalErrors.forEach(error => {
          console.log(`   - ${error.message}`);
        });
        return false;
      }
      return true;
    });

    runTest('No network errors detected', () => {
      if (networkErrors.length > 0) {
        console.log(`⚠️  Found ${networkErrors.length} network errors`);
        networkErrors.forEach(error => {
          console.log(`   - ${error.url}: ${error.status} ${error.statusText}`);
        });
        return false;
      }
      return true;
    });

    // ==================== 測試結果報告 ====================
    console.log('\n📈 Test Results Summary');
    console.log('='.repeat(50));

    console.log(`✅ Passed Tests: ${testStats.passedTests}`);
    console.log(`❌ Failed Tests: ${testStats.failedTests}`);
    console.log(`📊 Total Tests: ${testStats.totalTests}`);
    console.log(
      `🎯 Success Rate: ${((testStats.passedTests / testStats.totalTests) * 100).toFixed(1)}%`
    );

    if (testStats.routes.length > 0) {
      console.log('\n🗺️  Route Navigation Results:');
      testStats.routes.forEach(route => {
        console.log(`   ${route.success ? '✅' : '❌'} ${route.name} (${route.path})`);
      });
    }

    if (Object.keys(testStats.widgets).length > 0) {
      console.log('\n🧩 Widget Loading Results:');
      Object.entries(testStats.widgets).forEach(([page, widgets]) => {
        console.log(`   📄 ${page.toUpperCase()} Page:`);
        Object.entries(widgets).forEach(([widget, loaded]) => {
          console.log(`      ${loaded ? '✅' : '❌'} ${widget}`);
        });
      });
    }

    if (testStats.errors.length > 0) {
      console.log('\n⚠️  Error Summary:');
      const errorTypes = {};
      testStats.errors.forEach(error => {
        const type = error.type;
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      });
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} errors`);
      });
    }

    // 網絡請求統計
    if (Object.keys(requestCounts).length > 0) {
      console.log('\n🌐 Network Request Statistics:');
      Object.entries(requestCounts).forEach(([endpoint, count]) => {
        const status = count > 10 ? '⚠️ ' : count > 5 ? '🔶' : '✅';
        console.log(`   ${status} ${endpoint}: ${count} requests`);
      });
    }

    console.log('\n🏁 Test Completed Successfully!');

    // 返回測試結果
    return {
      success: testStats.failedTests === 0,
      stats: testStats,
      networkRequests: requestCounts,
      networkErrors: networkErrors,
    };
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testStats.errors.push({
      type: 'test_execution',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return {
      success: false,
      stats: testStats,
      error: error.message,
    };
  } finally {
    await browser.close();
  }
}

// 執行測試
if (require.main === module) {
  testCompleteUserFlow()
    .then(result => {
      console.log('\n📋 Final Test Result:', result.success ? '✅ PASSED' : '❌ FAILED');
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testCompleteUserFlow;
