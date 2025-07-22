/**
 * Puppeteer 測試：登入後認證狀態同步問題
 * 用於重現和分析登入後需要手動刷新的問題
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class AuthFlowTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🚀 啟動 Puppeteer 測試...');

    this.browser = await puppeteer.launch({
      headless: false, // 顯示瀏覽器便於觀察
      devtools: true, // 開啟開發工具
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security', // 避免 CORS 問題
      ],
      slowMo: 100, // 放慢操作便於觀察
    });

    this.page = await this.browser.newPage();

    // 設置視窗大小
    await this.page.setViewport({ width: 1920, height: 1080 });

    // 啟用控制台日誌收集
    this.page.on('console', msg => {
      console.log(`🖥️  [CONSOLE ${msg.type()}]:`, msg.text());
    });

    // 監聽網絡請求
    this.page.on('request', request => {
      if (request.url().includes('auth') || request.url().includes('supabase')) {
        console.log(`📡 [REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    // 監聽網絡響應
    this.page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('supabase')) {
        console.log(`📨 [RESPONSE]: ${response.status()} ${response.url()}`);
      }
    });

    console.log('✅ Puppeteer 設置完成');
  }

  async testAuthFlow() {
    console.log('\n🔐 開始測試認證流程...');

    try {
      // Step 1: 導航到主登入頁面
      console.log('📍 Step 1: 導航到登入頁面');
      await this.page.goto('http://localhost:3000/main-login', {
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      // 等待頁面載入並截圖
      await this.page.waitForSelector('form', { timeout: 5000 });
      await this.screenshot('01-login-page');

      // 檢查頁面元素
      const hasEmailInput = (await this.page.$('input[type="email"]')) !== null;
      const hasPasswordInput = (await this.page.$('input[type="password"]')) !== null;
      const hasSubmitButton = (await this.page.$('button[type="submit"]')) !== null;

      console.log(`📧 Email input exists: ${hasEmailInput}`);
      console.log(`🔑 Password input exists: ${hasPasswordInput}`);
      console.log(`🔘 Submit button exists: ${hasSubmitButton}`);

      if (!hasEmailInput || !hasPasswordInput || !hasSubmitButton) {
        throw new Error('登入表單元素缺失');
      }

      // Step 2: 填寫登入資料
      console.log('📍 Step 2: 填寫登入資料');
      const testEmail = process.env.SYS_LOGIN || 'test@newpennine.com';
      const testPassword = process.env.SYS_PASSWORD || 'test123';

      await this.page.type('input[type="email"]', testEmail, { delay: 50 });
      await this.page.type('input[type="password"]', testPassword, { delay: 50 });
      await this.screenshot('02-form-filled');

      // Step 3: 提交登入表單
      console.log('📍 Step 3: 提交登入表單');

      // 監聽導航變化
      const navigationPromise = this.page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      await this.page.click('button[type="submit"]');
      console.log('🔄 等待導航...');

      try {
        await navigationPromise;
        console.log(`✅ 導航完成，當前 URL: ${this.page.url()}`);
      } catch (error) {
        console.log(`⚠️  導航超時，當前 URL: ${this.page.url()}`);
      }

      await this.screenshot('03-after-login');

      // Step 4: 檢查認證狀態
      console.log('📍 Step 4: 檢查認證狀態');
      await this.checkAuthState('initial');

      // Step 5: 手動刷新頁面 (重現問題)
      console.log('📍 Step 5: 手動刷新頁面');
      await this.page.reload({ waitUntil: 'networkidle2' });
      await this.screenshot('04-after-refresh');
      await this.checkAuthState('after-refresh');

      // Step 6: 等待一段時間觀察變化
      console.log('📍 Step 6: 等待觀察狀態變化');
      await this.page.waitForTimeout(3000);
      await this.checkAuthState('after-wait');
      await this.screenshot('05-final-state');
    } catch (error) {
      console.error('❌ 測試過程中發生錯誤:', error);
      await this.screenshot('error-state');
      throw error;
    }
  }

  async checkAuthState(stage) {
    console.log(`🔍 檢查認證狀態 [${stage}]:`);

    try {
      // 檢查 localStorage 中的認證信息
      const authState = await this.page.evaluate(() => {
        const supabaseAuth = localStorage.getItem('sb-bbmkuiplnzvpudszrend-auth-token');
        const sessionData = localStorage.getItem('supabase.auth.token');

        return {
          hasSupabaseToken: !!supabaseAuth,
          hasSessionData: !!sessionData,
          url: window.location.href,
          userAgent: navigator.userAgent,
          cookies: document.cookie,
          localStorage: Object.keys(localStorage),
        };
      });

      console.log(`   📍 URL: ${authState.url}`);
      console.log(`   🗝️  Supabase Token: ${authState.hasSupabaseToken}`);
      console.log(`   📊 Session Data: ${authState.hasSessionData}`);
      console.log(`   🍪 Cookies: ${authState.cookies ? 'Present' : 'None'}`);
      console.log(`   💾 LocalStorage Keys: ${authState.localStorage.join(', ')}`);

      // 檢查頁面內容
      const pageContent = await this.page.evaluate(() => {
        const hasLoadingSpinner = !!document.querySelector('[data-testid="loading"]');
        const hasErrorMessage = !!document.querySelector('[data-testid="error"]');
        const hasMainContent =
          !!document.querySelector('main') || !!document.querySelector('[role="main"]');
        const pageTitle = document.title;
        const bodyText = document.body.innerText.substring(0, 200);

        return {
          hasLoadingSpinner,
          hasErrorMessage,
          hasMainContent,
          pageTitle,
          bodyText,
        };
      });

      console.log(`   📄 Page Title: ${pageContent.pageTitle}`);
      console.log(`   🎯 Has Main Content: ${pageContent.hasMainContent}`);
      console.log(`   ⏳ Loading Spinner: ${pageContent.hasLoadingSpinner}`);
      console.log(`   ❌ Error Message: ${pageContent.hasErrorMessage}`);
      console.log(`   📝 Body Text: ${pageContent.bodyText.substring(0, 100)}...`);

      this.testResults.push({
        stage,
        timestamp: new Date().toISOString(),
        authState,
        pageContent,
      });
    } catch (error) {
      console.error(`❌ 檢查認證狀態失敗 [${stage}]:`, error);
    }
  }

  async screenshot(filename) {
    try {
      const screenshotPath = path.join(process.cwd(), 'test-results', `auth-test-${filename}.png`);
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      console.log(`📸 截圖已保存: ${screenshotPath}`);
    } catch (error) {
      console.error('📸 截圖失敗:', error);
    }
  }

  async saveResults() {
    try {
      const resultsPath = path.join(process.cwd(), 'test-results', 'auth-flow-test-results.json');
      await fs.mkdir(path.dirname(resultsPath), { recursive: true });

      const report = {
        timestamp: new Date().toISOString(),
        testResults: this.testResults,
        summary: {
          totalStages: this.testResults.length,
          authTokenPresent: this.testResults.map(r => r.authState?.hasSupabaseToken),
          urlChanges: this.testResults.map(r => r.authState?.url),
        },
      };

      await fs.writeFile(resultsPath, JSON.stringify(report, null, 2));
      console.log(`📊 測試結果已保存: ${resultsPath}`);
    } catch (error) {
      console.error('💾 保存結果失敗:', error);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Puppeteer 清理完成');
    }
  }
}

// 主函數
async function runAuthTest() {
  const tester = new AuthFlowTester();

  try {
    await tester.setup();
    await tester.testAuthFlow();
    await tester.saveResults();

    console.log('\n✅ 認證流程測試完成！');
    console.log('📊 查看測試結果: test-results/auth-flow-test-results.json');
    console.log('📸 查看截圖: test-results/auth-test-*.png');
  } catch (error) {
    console.error('\n❌ 測試失敗:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  runAuthTest();
}

module.exports = { AuthFlowTester };
