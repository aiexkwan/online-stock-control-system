const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iubrmjztlwnghlfzxhqt.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YnJtanp0bHduZ2hsZnp4aHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNzYxNTAsImV4cCI6MjA0Njk1MjE1MH0.Yp8UPjG7bvDwNgGkpBL-Zfm-CgvwVT0kBvTXTuJBw6w';

const supabase = createClient(supabaseUrl, supabaseKey);

// 測試配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  login: {
    email: 'akwan@pennineindustries.com',
    password: 'X315Y316'
  },
  clockNumber: '5997',
  tests: [
    {
      name: 'Test 1 - MEP9090150',
      productCode: 'MEP9090150',
      count: 3
    },
    {
      name: 'Test 2 - MEL4545A', 
      productCode: 'MEL4545A',
      count: 5
    }
  ]
};

// 輔助函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForSelector = async (page, selector, timeout = 10000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`Selector not found: ${selector}`);
    return false;
  }
};

const takeScreenshot = async (page, name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot-${name}-${timestamp}.png`;
  await page.screenshot({ path: `scripts/test-output/${filename}`, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
};

// 數據庫查詢函數
const getLatestRecords = async (productCode = null, testName = '') => {
  try {
    console.log('🔍 查詢數據庫記錄...');
    
    // 查詢最近的 record_palletinfo（最近 5 分鐘內的記錄）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    let palletInfoQuery = supabase
      .from('record_palletinfo')
      .select('*')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (productCode) {
      palletInfoQuery = palletInfoQuery.eq('product_code', productCode);
    }
    
    const { data: palletInfo } = await palletInfoQuery;
    
    const palletNumbers = palletInfo?.map(p => p.plt_num) || [];
    
    // 查詢 record_history  
    const { data: history } = await supabase
      .from('record_history')
      .select('*')
      .in('plt_num', palletNumbers)
      .order('time', { ascending: false });

    // 查詢 record_inventory
    const { data: inventory } = await supabase
      .from('record_inventory')
      .select('*')
      .in('plt_num', palletNumbers)
      .order('created_at', { ascending: false });

    // 查詢 stock_level
    const productCodes = [...new Set(palletInfo?.map(p => p.product_code) || [])];
    const { data: stockLevel } = await supabase
      .from('stock_level')
      .select('*')
      .in('product_code', productCodes)
      .order('updated_at', { ascending: false });

    // 查詢 work_level
    const { data: workLevel } = await supabase
      .from('work_level')
      .select('*')
      .eq('id', '5997')
      .order('updated_at', { ascending: false })
      .limit(1);

    return {
      palletInfo: palletInfo || [],
      history: history || [],
      inventory: inventory || [],
      stockLevel: stockLevel || [],
      workLevel: workLevel || [],
      palletNumbers
    };
  } catch (error) {
    console.error('❌ 數據庫查詢錯誤:', error);
    return null;
  }
};

// 登入函數
const login = async (page) => {
  console.log('🔐 正在登入...');
  
  await page.goto(`${TEST_CONFIG.baseURL}/main-login`);
  await delay(2000);

  // 填寫登入資料
  await page.type('#email', TEST_CONFIG.login.email);
  await page.type('#password', TEST_CONFIG.login.password);
  
  // 點擊登入按鈕
  await page.click('button[type="submit"]');
  
  // 等待登入完成
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  console.log('✅ 登入成功');
};

// 導航到 QC Label 頁面
const navigateToQcLabel = async (page) => {
  console.log('🧭 導航到 QC Label 頁面...');
  
  await page.goto(`${TEST_CONFIG.baseURL}/print-label`);
  await delay(3000);
  
  // 確保頁面載入完成
  await waitForSelector(page, 'form', 5000);
  
  console.log('✅ QC Label 頁面載入完成');
};

// 執行單個測試
const runSingleTest = async (page, testConfig) => {
  console.log(`\n🧪 開始執行 ${testConfig.name}`);
  console.log(`   Product Code: ${testConfig.productCode}`);
  console.log(`   Count: ${testConfig.count}`);
  
  try {
    // 清空表單
    await page.evaluate(() => {
      // 清空所有輸入框
      document.querySelectorAll('input').forEach(input => {
        if (input.type !== 'submit' && input.type !== 'button') {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });
    
    await delay(1000);

    // 填寫 Product Code
    console.log('📝 填寫 Product Code...');
    await waitForSelector(page, 'input[type="text"]', 5000);
    
    // 查找所有文本輸入框，通過索引或父級標籤選擇正確的
    const allInputs = await page.$$('input[type="text"]');
    
    if (allInputs.length >= 2) {
      // 第一個應該是 Product Code
      await allInputs[0].click();
      await allInputs[0].type(testConfig.productCode);
      await delay(3000); // 等待產品信息載入
      
      // 第二個應該是 Count (跳過 quantity，因為會自動填入)
      console.log('📝 填寫 Count...');
             // 查找 Count 輸入框 - 通常是第三個輸入框 (product code, quantity, count)
       if (allInputs.length >= 3) {
         await allInputs[2].click();
         await allInputs[2].evaluate(input => input.value = ''); // 清空輸入框
         await allInputs[2].type(testConfig.count.toString());
       } else {
         throw new Error('找不到 Count 輸入框');
       }
    } else {
      throw new Error('找不到足夠的輸入框');
    }

    await delay(1000);

    // 點擊 Print Label 按鈕
    console.log('🖨️ 點擊 Print Label...');
    
    // 查找包含 "PRINT" 文字的按鈕
    const printButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => 
        button.textContent?.includes('PRINT') || 
        button.textContent?.includes('Print') ||
        button.textContent?.includes('列印')
      );
    });
    
    if (printButton && printButton.asElement()) {
      await printButton.asElement().click();
    } else {
      throw new Error('找不到 Print 按鈕');
    }

    await delay(3000);

    // 處理 Clock Number 確認對話框
    console.log('🔢 等待並填寫 Clock Number...');
    
    // 等待對話框出現 - 尋找特定的 id
    const dialogAppeared = await waitForSelector(page, '#clock-number', 10000);
    
    if (dialogAppeared) {
      // 填寫 Clock Number
      await page.type('#clock-number', TEST_CONFIG.clockNumber);
      await delay(1000);
      
      console.log('🔢 查找確認按鈕...');
      
      // 查找確認按鈕
      const confirmButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => 
          button.textContent?.includes('確認') || 
          button.textContent?.includes('Confirm') ||
          button.textContent?.includes('Submit') ||
          (button.className && button.className.includes('bg-blue'))
        );
      });
      
      if (confirmButton && confirmButton.asElement()) {
        await confirmButton.asElement().click();
        console.log('✅ 已點擊確認按鈕');
      } else {
        // 嘗試按 Enter
        console.log('🔄 嘗試按 Enter 鍵');
        await page.keyboard.press('Enter');
      }
    } else {
      throw new Error('Clock Number 對話框未出現');
    }

    // 等待處理完成 (監聽 toast 通知或其他成功指標)
    console.log('⏳ 等待處理完成...');
    await delay(10000); // 給統一 RPC 足夠時間完成

    // 截圖記錄
    await takeScreenshot(page, `${testConfig.name.replace(/\s+/g, '-')}-completed`);

    console.log(`✅ ${testConfig.name} 執行完成`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ ${testConfig.name} 執行失敗:`, error);
    await takeScreenshot(page, `${testConfig.name.replace(/\s+/g, '-')}-error`);
    return false;
  }
};

// 分析數據庫記錄
const analyzeRecords = (records, testName) => {
  console.log(`\n📊 ${testName} 數據庫記錄分析:`);
  
  if (!records) {
    console.log('❌ 無法獲取數據庫記錄');
    return false;
  }

  console.log(`📦 Pallet Info 記錄: ${records.palletInfo.length} 筆`);
  console.log(`📜 History 記錄: ${records.history.length} 筆`);
  console.log(`📋 Inventory 記錄: ${records.inventory.length} 筆`);
  console.log(`📊 Stock Level 記錄: ${records.stockLevel.length} 筆`);
  console.log(`👤 Work Level 記錄: ${records.workLevel.length} 筆`);

  // 顯示托盤號碼
  if (records.palletInfo.length > 0) {
    const palletNumbers = records.palletInfo.map(p => p.plt_num);
    console.log(`🏷️ 生成的托盤號碼: ${palletNumbers.join(', ')}`);
  }

  // 檢查統一 RPC 的跡象
  const hasUnifiedRpcMarkers = records.history.some(h => 
    h.remark && (h.remark.includes('unified') || h.action === 'Finished QC')
  );

  console.log(`🔄 統一 RPC 使用跡象: ${hasUnifiedRpcMarkers ? '✅ 是' : '❌ 否'}`);

  return records.palletInfo.length > 0;
};

// 主測試函數
const runTests = async () => {
  console.log('🚀 開始 QC Label 統一 RPC 測試');
  console.log('='.repeat(50));

  let browser;
  try {
    // 啟動瀏覽器
    browser = await puppeteer.launch({
      headless: false, // 顯示瀏覽器以便觀察
      defaultViewport: { width: 1366, height: 768 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // 設置 console 事件監聽
    page.on('console', msg => {
      if (msg.text().includes('[UnifiedDB]') || msg.text().includes('process_qc_label_unified')) {
        console.log(`🔍 瀏覽器日誌: ${msg.text()}`);
      }
    });

    // 登入
    await login(page);
    
    // 執行測試
    const testResults = [];
    
    for (const testConfig of TEST_CONFIG.tests) {
      await navigateToQcLabel(page);
      
      const success = await runSingleTest(page, testConfig);
      testResults.push({ test: testConfig.name, success });
      
      if (success) {
        // 等待一些時間確保數據庫更新
        await delay(5000);
        
        // 查詢並分析數據庫記錄
        const records = await getLatestRecords(testConfig.productCode, testConfig.name);
        analyzeRecords(records, testConfig.name);
      }
      
      // 測試間隔
      await delay(3000);
    }

    // 測試結果總結
    console.log('\n' + '='.repeat(50));
    console.log('📋 測試結果總結:');
    testResults.forEach(result => {
      console.log(`   ${result.test}: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
    });

    const successCount = testResults.filter(r => r.success).length;
    console.log(`\n🎯 總體結果: ${successCount}/${testResults.length} 個測試成功`);

  } catch (error) {
    console.error('❌ 測試執行錯誤:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// 確保輸出目錄存在
const fs = require('fs');
if (!fs.existsSync('scripts/test-output')) {
  fs.mkdirSync('scripts/test-output', { recursive: true });
}

// 執行測試
runTests().catch(console.error);

// 測試 search_product_code RPC 函數
// 此腳本測試產品代碼搜索功能

// 測試產品代碼
const testCodes = [
  'TAV1',     // 精確匹配
  'tav1',     // 小寫測試
  'TAV',      // 前綴匹配
  'NONEXIST', // 不存在的代碼
  '',         // 空字符串
];

// 執行測試
async function runTests() {
  console.log('開始測試 search_product_code RPC 函數...');
  console.log('----------------------------------------');
  
  for (const code of testCodes) {
    console.log(`測試產品代碼: "${code}"`);
    
    try {
      const startTime = performance.now();
      const { data, error } = await supabase.rpc('search_product_code', { p_code: code });
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      if (error) {
        console.error(`錯誤: ${error.message}`);
        continue;
      }
      
      console.log(`查詢耗時: ${duration}ms`);
      
      if (data) {
        console.log('結果:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log('未找到產品');
      }
    } catch (err) {
      console.error(`執行錯誤: ${err.message}`);
    }
    
    console.log('----------------------------------------');
  }
  
  console.log('測試完成');
}

// 執行測試
runTests()
  .catch(err => {
    console.error('測試過程中發生錯誤:', err);
    process.exit(1);
  }); 