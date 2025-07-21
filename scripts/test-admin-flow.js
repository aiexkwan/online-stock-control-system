/**
 * Puppeteer Admin Flow Test
 * 測試登入 → admin/analysis → 切換子頁面的完整流程
 * 檢測並修復任何發現的錯誤
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 測試配置
const config = {
  baseUrl: 'http://localhost:3000',
  email: 'akwan@pennineindustries.com',
  password: 'X315Y316',
  timeout: 30000,
  headless: false, // 設為 false 可以看到瀏覽器操作
  screenshot: true,
  verbose: true
};

// 日誌函數
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '📍'
  }[type] || '📝';

  console.log(`${prefix} [${timestamp}] ${message}`);
};

// 創建結果目錄
const resultsDir = path.join(__dirname, '../test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// 測試報告
const testReport = {
  timestamp: new Date().toISOString(),
  steps: [],
  errors: [],
  consoleMessages: [],
  screenshots: [],
  originalFactoryErrors: 0,
  authErrors: 0,
  networkErrors: 0,
  success: false,
  pages: {
    login: { success: false, errors: [] },
    access: { success: false, errors: [] },
    adminAnalysis: { success: false, errors: [] },
    subPages: []
  }
};

// Admin 子頁面列表
const adminSubPages = [
  '/admin',
  '/admin/analysis',
  '/admin/upload',
  '/admin/transfer',
  '/admin/users',
  '/admin/settings'
];

async function waitWithTimeout(page, condition, timeout = 10000) {
  try {
    await page.waitForFunction(condition, { timeout });
    return true;
  } catch (error) {
    log(`Timeout waiting for condition: ${condition}`, 'warning');
    return false;
  }
}

async function takeScreenshot(page, name, description = '') {
  if (!config.screenshot) return;

  try {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(resultsDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true
    });

    testReport.screenshots.push({
      name,
      filename,
      filepath,
      description,
      timestamp: new Date().toISOString()
    });

    log(`Screenshot saved: ${filename} - ${description}`, 'success');
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'error');
  }
}

async function runAdminFlowTest() {
  let browser;
  let page;

  try {
    log('🚀 Starting Puppeteer Admin Flow Test', 'step');

    // 啟動瀏覽器
    browser = await puppeteer.launch({
      headless: config.headless,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    page = await browser.newPage();

    // 設置事件監聽器
    page.on('console', (msg) => {
      const message = `[${msg.type()}] ${msg.text()}`;
      testReport.consoleMessages.push(message);

      if (config.verbose) {
        console.log(`💬 Console: ${message}`);
      }

      // 檢查關鍵錯誤
      if (msg.text().includes('originalFactory.call')) {
        testReport.originalFactoryErrors++;
        log(`🚨 originalFactory.call error detected: ${msg.text()}`, 'error');
      }

      if (msg.text().includes('auth_check_failed')) {
        testReport.authErrors++;
        log(`🚨 Auth error detected: ${msg.text()}`, 'error');
      }
    });

    page.on('pageerror', (error) => {
      const errorMessage = error.message;
      testReport.errors.push({
        type: 'pageerror',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      log(`🚨 Page error: ${errorMessage}`, 'error');
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        testReport.networkErrors++;
        log(`❌ HTTP ${response.status()}: ${response.url()}`, 'error');
      }
    });

    // 設置更長的超時時間
    page.setDefaultTimeout(config.timeout);

    // ===== 步驟 1: 導航到登入頁面 =====
    log('Step 1: 導航到登入頁面', 'step');
    testReport.steps.push('Navigate to login page');

    await page.goto(`${config.baseUrl}/main-login`, {
      waitUntil: 'networkidle2',
      timeout: config.timeout
    });

    await takeScreenshot(page, 'step1-login-page', '登入頁面');

    // 檢查登入頁面元素
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');

    if (!emailInput || !passwordInput) {
      throw new Error('Login form elements not found');
    }

    testReport.pages.login.success = true;
    log('Login page loaded successfully', 'success');

    // ===== 步驟 2: 執行登入 =====
    log('Step 2: 執行登入', 'step');
    testReport.steps.push('Perform login');

    await page.type('input[type="email"], input[name="email"]', config.email);
    await page.type('input[type="password"], input[name="password"]', config.password);

    await takeScreenshot(page, 'step2-login-form-filled', '填寫登入表單');

    // 尋找並點擊登入按鈕
    const loginButton = await page.$('button[type="submit"], input[type="submit"], .login-button, .btn-login');
    if (!loginButton) {
      throw new Error('Login button not found');
    }

    await loginButton.click();
    log('Login button clicked', 'success');

    // ===== 步驟 3: 等待登入成功 =====
    log('Step 3: 等待登入成功', 'step');
    testReport.steps.push('Wait for login success');

    // 等待重定向到 /access 頁面
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: config.timeout
      });

      const currentUrl = page.url();
      log(`Current URL after login: ${currentUrl}`, 'info');

      if (currentUrl.includes('/access')) {
        testReport.pages.access.success = true;
        log('Successfully redirected to /access page', 'success');
      } else if (currentUrl.includes('main-login')) {
        throw new Error('Login failed - still on login page');
      }

    } catch (error) {
      log(`Login navigation error: ${error.message}`, 'error');
      await takeScreenshot(page, 'step3-login-error', '登入錯誤');
    }

    await takeScreenshot(page, 'step3-post-login', '登入後頁面');

    // ===== 步驟 4: 導航到 admin/analysis 頁面 =====
    log('Step 4: 導航到 admin/analysis 頁面', 'step');
    testReport.steps.push('Navigate to admin/analysis');

    await page.goto(`${config.baseUrl}/admin/analysis`, {
      waitUntil: 'networkidle2',
      timeout: config.timeout
    });

    // 等待頁面完全加載
    await new Promise(resolve => setTimeout(resolve, 3000));

    const analysisUrl = page.url();
    if (analysisUrl.includes('/admin/analysis')) {
      testReport.pages.adminAnalysis.success = true;
      log('Successfully loaded admin/analysis page', 'success');
    } else {
      throw new Error(`Failed to load admin/analysis page. Current URL: ${analysisUrl}`);
    }

    await takeScreenshot(page, 'step4-admin-analysis', 'Admin Analysis 頁面');

    // 檢查頁面內容
    const mainContent = await page.$('main, [role="main"], .dashboard, .admin-content, .container');
    if (mainContent) {
      log('Main content found on admin/analysis page', 'success');
    } else {
      log('Warning: Main content not found on admin/analysis page', 'warning');
    }

    // ===== 步驟 5: 測試各個 admin 子頁面 =====
    log('Step 5: 測試各個 admin 子頁面', 'step');
    testReport.steps.push('Test admin sub-pages');

    for (const subPage of adminSubPages) {
      log(`Testing sub-page: ${subPage}`, 'step');

      const pageTest = {
        url: subPage,
        success: false,
        errors: [],
        timestamp: new Date().toISOString()
      };

      try {
        await page.goto(`${config.baseUrl}${subPage}`, {
          waitUntil: 'networkidle2',
          timeout: config.timeout
        });

        // 等待頁面渲染
        await new Promise(resolve => setTimeout(resolve, 2000));

        const currentUrl = page.url();
        if (currentUrl.includes(subPage) || currentUrl.includes('/admin')) {
          pageTest.success = true;
          log(`✅ ${subPage} loaded successfully`, 'success');
        } else {
          pageTest.errors.push(`Unexpected redirect to: ${currentUrl}`);
          log(`⚠️  ${subPage} redirected to: ${currentUrl}`, 'warning');
        }

        await takeScreenshot(page, `step5-${subPage.replace(/\//g, '-')}`, `子頁面: ${subPage}`);

      } catch (error) {
        pageTest.errors.push(error.message);
        log(`❌ Failed to load ${subPage}: ${error.message}`, 'error');
      }

      testReport.pages.subPages.push(pageTest);
    }

    // ===== 步驟 6: 最終檢查 =====
    log('Step 6: 最終檢查和報告', 'step');
    testReport.steps.push('Final checks and report');

    // 檢查是否有關鍵錯誤
    const hasOriginalFactoryErrors = testReport.originalFactoryErrors > 0;
    const hasAuthErrors = testReport.authErrors > 0;
    const hasNetworkErrors = testReport.networkErrors > 5; // 容許少量網絡錯誤

    if (!hasOriginalFactoryErrors && !hasAuthErrors && !hasNetworkErrors) {
      testReport.success = true;
      log('🎉 All tests passed successfully!', 'success');
    } else {
      log('⚠️  Some issues were detected', 'warning');
    }

    await takeScreenshot(page, 'final-state', '最終頁面狀態');

  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'error');
    testReport.errors.push({
      type: 'test_failure',
      message: error.message,
      timestamp: new Date().toISOString()
    });

    if (page) {
      await takeScreenshot(page, 'error-state', '錯誤狀態');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function generateReport() {
  const reportPath = path.join(resultsDir, `test-report-${Date.now()}.json`);
  const htmlReportPath = path.join(resultsDir, `test-report-${Date.now()}.html`);

  // 保存 JSON 報告
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

  // 生成 HTML 報告
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Admin Flow Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .screenshot { max-width: 300px; margin: 10px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Admin Flow Test Report</h1>
    <p><strong>Timestamp:</strong> ${testReport.timestamp}</p>
    <p><strong>Overall Success:</strong> <span class="${testReport.success ? 'success' : 'error'}">${testReport.success ? 'PASS' : 'FAIL'}</span></p>

    <div class="section">
        <h2>Key Metrics</h2>
        <div class="metric">
            <strong>originalFactory.call Errors:</strong>
            <span class="${testReport.originalFactoryErrors === 0 ? 'success' : 'error'}">${testReport.originalFactoryErrors}</span>
        </div>
        <div class="metric">
            <strong>Auth Errors:</strong>
            <span class="${testReport.authErrors === 0 ? 'success' : 'error'}">${testReport.authErrors}</span>
        </div>
        <div class="metric">
            <strong>Network Errors:</strong>
            <span class="${testReport.networkErrors <= 5 ? 'success' : 'error'}">${testReport.networkErrors}</span>
        </div>
    </div>

    <div class="section">
        <h2>Page Tests</h2>
        <p><strong>Login:</strong> <span class="${testReport.pages.login.success ? 'success' : 'error'}">${testReport.pages.login.success ? 'PASS' : 'FAIL'}</span></p>
        <p><strong>Access:</strong> <span class="${testReport.pages.access.success ? 'success' : 'error'}">${testReport.pages.access.success ? 'PASS' : 'FAIL'}</span></p>
        <p><strong>Admin Analysis:</strong> <span class="${testReport.pages.adminAnalysis.success ? 'success' : 'error'}">${testReport.pages.adminAnalysis.success ? 'PASS' : 'FAIL'}</span></p>
        <p><strong>Sub-pages Tested:</strong> ${testReport.pages.subPages.length}</p>
        <p><strong>Sub-pages Successful:</strong> ${testReport.pages.subPages.filter(p => p.success).length}</p>
    </div>

    <div class="section">
        <h2>Screenshots</h2>
        ${testReport.screenshots.map(s => `
            <div>
                <h4>${s.name} - ${s.description}</h4>
                <img src="${s.filename}" alt="${s.description}" class="screenshot" />
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Errors</h2>
        ${testReport.errors.length === 0 ? '<p class="success">No errors detected!</p>' :
          testReport.errors.map(e => `<p class="error">[${e.timestamp}] ${e.type}: ${e.message}</p>`).join('')}
    </div>
</body>
</html>
  `;

  fs.writeFileSync(htmlReportPath, htmlReport);

  log(`📊 Test report saved to: ${reportPath}`, 'success');
  log(`📊 HTML report saved to: ${htmlReportPath}`, 'success');

  // 輸出摘要
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Overall Result: ${testReport.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`originalFactory.call Errors: ${testReport.originalFactoryErrors}`);
  console.log(`Auth Errors: ${testReport.authErrors}`);
  console.log(`Network Errors: ${testReport.networkErrors}`);
  console.log(`Total Console Messages: ${testReport.consoleMessages.length}`);
  console.log(`Total JavaScript Errors: ${testReport.errors.length}`);
  console.log(`Screenshots Captured: ${testReport.screenshots.length}`);
  console.log('='.repeat(60));

  return testReport;
}

// 主執行函數
async function main() {
  try {
    await runAdminFlowTest();
    await generateReport();
  } catch (error) {
    log(`❌ Test runner failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 如果直接執行這個腳本
if (require.main === module) {
  main();
}

module.exports = { runAdminFlowTest, generateReport, testReport };
