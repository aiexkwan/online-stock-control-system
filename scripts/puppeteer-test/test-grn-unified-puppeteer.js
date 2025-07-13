const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bbmkuiplnzvpudszrend.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyODI2MDMsImV4cCI6MjA1MDg1ODYwM30.Fc0Xr71cJXV-IgdZ6Ww8x5wOVGYi0aNNVLCTJjkrT5k';
const supabase = createClient(supabaseUrl, supabaseKey);

// 測試配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  login: {
    email: process.env.PUPPERTEER_LOGIN || 'akwan@pennineindustries.com',
    password: process.env.PUPPERTEER_PASSWORD || 'X315Y316'
  },
  clockNumber: '5997',
  grnNumber: '7894589',
  materialSupplier: 'AM',
  tests: [
    {
      name: 'Test 1 - X01A2680 Quantity Mode',
      productCode: 'X01A2680',
      countMethod: 'quantity',
      grossWeights: [100, 100, 100], // 3個棧板，每個100kg
      expectedPallets: 3
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
    console.error(`❌ Selector not found: ${selector}`);
    return false;
  }
};

const takeScreenshot = async (page, name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot-${name}-${timestamp}.png`;
  await page.screenshot({ path: `test-output/${filename}`, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
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

// 導航到 GRN Label 頁面
const navigateToGrnLabel = async (page) => {
  console.log('🧭 導航到 GRN Label 頁面...');
  
  await page.goto(`${TEST_CONFIG.baseURL}/print-grnlabel`);
  await delay(3000);
  
  // 確保頁面載入完成
  await waitForSelector(page, 'form', 5000);
  
  console.log('✅ GRN Label 頁面載入完成');
};

// 填寫基本表單字段
const fillBasicForm = async (page, testConfig) => {
  console.log('📝 填寫基本表單字段...');
  
  // 等待表單載入
  await delay(2000);
  
  try {
    // 獲取所有輸入框，按順序填寫
    const allInputs = await page.$$('input[type="text"]');
    console.log(`📋 找到 ${allInputs.length} 個文本輸入框`);
    
    if (allInputs.length >= 3) {
      // 第一個通常是 GRN Number
      console.log('📝 填寫 GRN Number...');
      await allInputs[0].click();
      await allInputs[0].evaluate(input => input.value = '');
      await allInputs[0].type(TEST_CONFIG.grnNumber);
      await delay(1000);
      
      // 第二個通常是 Material Supplier
      console.log('📝 填寫 Material Supplier...');
      await allInputs[1].click();
      await allInputs[1].evaluate(input => input.value = '');
      await allInputs[1].type(TEST_CONFIG.materialSupplier);
      await delay(2000); // 等待搜索結果
      
      // 第三個通常是 Product Code
      console.log('📝 填寫 Product Code...');
      await allInputs[2].click();
      await allInputs[2].evaluate(input => input.value = '');
      await allInputs[2].type(testConfig.productCode);
      await delay(3000); // 等待產品信息載入
    } else {
      // 備用方法：通過標籤文本查找
      console.log('📝 使用備用方法填寫表單...');
      
      // 填寫 GRN Number
      const grnInput = await page.evaluateHandle(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const grnLabel = labels.find(label => label.textContent?.includes('GRN'));
        return grnLabel?.closest('div')?.querySelector('input') || document.querySelector('input');
      });
      
      if (grnInput) {
        await grnInput.click();
        await grnInput.evaluate(input => input.value = '');
        await grnInput.type(TEST_CONFIG.grnNumber);
        await delay(1000);
      }
    }
  } catch (error) {
    console.error('❌ 填寫基本表單字段時發生錯誤:', error);
  }
  
  console.log('✅ 基本表單字段填寫完成');
};

// 選擇計數方法並填寫相關數據
const fillCountMethodData = async (page, testConfig) => {
  console.log(`📝 設置計數方法: ${testConfig.countMethod}`);
  
  try {
    // 所有測試都使用 Quantity 模式
    console.log('📝 選擇 Quantity 模式...');
    const quantityRadio = await page.evaluateHandle(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      return radios.find(radio => 
        radio.value === 'qty' || 
        radio.value === 'quantity' ||
        radio.id?.includes('qty') ||
        radio.closest('label')?.textContent?.includes('Quantity')
      );
    });
    
    if (quantityRadio) {
      await quantityRadio.click();
      await delay(1000);
    }
    
    // 填寫重量數據（在 Quantity 模式下當作重量處理）
    console.log('📝 填寫重量數據...');
    for (let i = 0; i < testConfig.grossWeights.length; i++) {
      const weight = testConfig.grossWeights[i];
      
      // 查找重量輸入框
      const weightInputs = await page.$$('input[type="number"], input[inputmode="decimal"]');
      
      if (weightInputs && weightInputs[i]) {
        console.log(`📝 填寫第 ${i + 1} 個重量: ${weight}kg`);
        await weightInputs[i].click();
        await weightInputs[i].evaluate(input => input.value = '');
        await weightInputs[i].type(weight.toString());
        await delay(1000); // 等待自動添加新行
      }
    }
    
    console.log('✅ 重量數據填寫完成');
  } catch (error) {
    console.error('❌ 填寫計數方法數據時發生錯誤:', error);
  }
  
  console.log('✅ 計數方法和數據填寫完成');
};

// 填寫認證ID
const fillClockNumber = async (page) => {
  console.log('📝 填寫認證ID...');
  
  const clockInput = await page.$('input[placeholder*="clock"], input[name*="clock"], input[id*="clock"]');
  if (clockInput) {
    await clockInput.click();
    await clockInput.evaluate(input => input.value = '');
    await clockInput.type(TEST_CONFIG.clockNumber);
  }
  
  console.log('✅ 認證ID填寫完成');
};

// 提交表單並監控網絡請求
const submitFormAndMonitorRequests = async (page, testConfig) => {
  console.log('🚀 提交表單並監控RPC請求...');
  
  // 監聽網絡請求和控制台輸出
  const rpcCalls = [];
  const consoleLogs = [];
  
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/rest/v1/rpc/')) {
      rpcCalls.push({
        url,
        method: request.method(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // 監聽控制台輸出
  page.on('console', (msg) => {
    const text = msg.text();
    // 捕獲更多相關的日誌
    if (text.includes('grnActions') || 
        text.includes('統一') || 
        text.includes('unified') || 
        text.includes('RPC') ||
        text.includes('useGrnLabelBusinessV2') ||
        text.includes('createGrnDatabaseEntries') ||
        text.includes('batch') ||
        text.includes('回退') ||
        text.includes('Failed') ||
        (msg.type() === 'error' && text.includes('supabase'))) {
      consoleLogs.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // 點擊提交按鈕（GRN Label 頁面的按鈕）
  let submitButton = null;
  
  // 首先通過按鈕內容查找
  submitButton = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(button => {
      const text = button.textContent?.trim() || '';
      return text.includes('Print GRN Label') ||
             text.includes('Print') ||
             button.innerHTML?.includes('Print GRN Label');
    });
  });
  
  // 如果還是找不到，嘗試通過類名查找
  if (!submitButton || !submitButton.asElement()) {
    submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => 
        button.className?.includes('bg-gradient-to-r') &&
        button.className?.includes('from-orange')
      );
    });
  }
  
  // 最後嘗試查找任何啟用的按鈕
  if (!submitButton || !submitButton.asElement()) {
    submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
      return buttons.length > 0 ? buttons[buttons.length - 1] : null; // 通常最後一個按鈕是提交按鈕
    });
  }
  
  if (submitButton && submitButton.asElement()) {
    console.log('📋 找到提交按鈕，準備點擊...');
    const buttonElement = submitButton.asElement();
    await buttonElement.click();
    
    // 等待 Clock Number 對話框出現
    console.log('📋 等待 Clock Number 對話框...');
    await delay(2000);
    
    // 查找 Clock Number 輸入框和確認按鈕
    const clockNumberInput = await page.evaluateHandle(() => {
      // 查找可能的 clock number 輸入框
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]'));
      return inputs.find(input => 
        input.placeholder?.toLowerCase().includes('clock') ||
        input.id?.toLowerCase().includes('clock') ||
        input.name?.toLowerCase().includes('clock') ||
        input.closest('div')?.textContent?.includes('clock number') ||
        input.closest('div')?.textContent?.includes('Clock Number')
      );
    });
    
    if (clockNumberInput && clockNumberInput.asElement()) {
      console.log('📋 找到 Clock Number 輸入框，填寫認證ID...');
      const inputElement = clockNumberInput.asElement();
      await inputElement.click();
      await inputElement.type(TEST_CONFIG.clockNumber);
      await delay(1000);
      
      // 查找確認按鈕
      const confirmButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => {
          const text = button.textContent?.trim().toLowerCase() || '';
          return text.includes('confirm') ||
                 text.includes('submit') ||
                 text.includes('ok') ||
                 text.includes('proceed') ||
                 button.type === 'submit';
        });
      });
      
      if (confirmButton && confirmButton.asElement()) {
        console.log('📋 找到確認按鈕，提交表單...');
        const confirmElement = confirmButton.asElement();
        await confirmElement.click();
      } else {
        console.log('❌ 找不到確認按鈕');
      }
    } else {
      console.log('📋 未找到 Clock Number 對話框，可能表單直接提交了');
    }
  } else {
    console.error('❌ 找不到提交按鈕');
    
    // 打印頁面上所有按鈕的信息以便調試
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        className: btn.className,
        disabled: btn.disabled,
        id: btn.id
      }))
    );
    console.log('📋 頁面上的所有按鈕:', buttons);
    
    return { success: false, rpcCalls };
  }
  
  // 等待處理完成
  await delay(8000);
  
  console.log(`📊 檢測到 ${rpcCalls.length} 個 RPC 調用`);
  
  // 顯示控制台日誌
  if (consoleLogs.length > 0) {
    console.log('📋 相關控制台輸出:');
    consoleLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
    });
  }
  
  // 檢查是否使用了統一 RPC
  const unifiedRpcCall = rpcCalls.find(call => 
    call.url.includes('process_grn_label_unified')
  );
  
  if (unifiedRpcCall) {
    console.log('✅ 成功使用統一 GRN RPC 功能');
    console.log('📝 統一 RPC 調用詳情:', {
      url: unifiedRpcCall.url,
      method: unifiedRpcCall.method,
      timestamp: unifiedRpcCall.timestamp
    });
    
    // 解析 postData 以查看參數
    if (unifiedRpcCall.postData) {
      try {
        const postData = JSON.parse(unifiedRpcCall.postData);
        console.log('📋 RPC 參數:', JSON.stringify(postData, null, 2));
      } catch (e) {
        console.log('📋 RPC 原始數據:', unifiedRpcCall.postData);
      }
    }
  } else {
    console.log('❌ 未檢測到統一 GRN RPC 調用');
    console.log('📋 檢測到的 RPC 調用:');
    rpcCalls.forEach((call, index) => {
      console.log(`  ${index + 1}. ${call.url}`);
    });
  }
  
  return {
    success: !!unifiedRpcCall,
    rpcCalls,
    unifiedRpcCall,
    consoleLogs
  };
};

// 驗證數據庫記錄
const verifyDatabaseRecords = async (testConfig, startTime) => {
  console.log('🔍 驗證數據庫記錄...');
  
  try {
    // 查詢最近創建的記錄（測試開始後的記錄）
    const { data: palletInfo } = await supabase
      .from('record_palletinfo')
      .select('*')
      .gte('generate_time', startTime)
      .eq('product_code', testConfig.productCode)
      .order('generate_time', { ascending: false });
    
    if (!palletInfo || palletInfo.length === 0) {
      console.log('❌ 未找到 record_palletinfo 記錄');
      return { success: false };
    }
    
    console.log(`✅ 找到 ${palletInfo.length} 條 record_palletinfo 記錄`);
    
    const palletNumbers = palletInfo.map(p => p.plt_num);
    
    // 查詢相關的 GRN 記錄
    const { data: grnRecords } = await supabase
      .from('record_grn')
      .select('*')
      .in('plt_num', palletNumbers)
      .eq('grn_ref', parseInt(TEST_CONFIG.grnNumber));
    
    console.log(`✅ 找到 ${grnRecords?.length || 0} 條 record_grn 記錄`);
    
    // 查詢歷史記錄
    const { data: historyRecords } = await supabase
      .from('record_history')
      .select('*')
      .in('plt_num', palletNumbers)
      .eq('action', 'GRN Receiving');
    
    console.log(`✅ 找到 ${historyRecords?.length || 0} 條 record_history 記錄`);
    
    // 查詢庫存記錄
    const { data: inventoryRecords } = await supabase
      .from('record_inventory')
      .select('*')
      .in('plt_num', palletNumbers);
    
    console.log(`✅ 找到 ${inventoryRecords?.length || 0} 條 record_inventory 記錄`);
    
    // 驗證棧板編號狀態
    const { data: palletBufferStatus } = await supabase
      .from('pallet_number_buffer')
      .select('*')
      .in('pallet_number', palletNumbers);
    
    console.log(`✅ 找到 ${palletBufferStatus?.length || 0} 條 pallet_number_buffer 記錄`);
    
    const usedPallets = palletBufferStatus?.filter(p => p.used === 'True') || [];
    console.log(`✅ 其中 ${usedPallets.length} 個棧板已標記為已使用`);
    
    // 檢查記錄完整性
    const allTablesHaveRecords = 
      palletInfo.length > 0 &&
      grnRecords?.length > 0 &&
      historyRecords?.length > 0 &&
      inventoryRecords?.length > 0;
    
    if (allTablesHaveRecords) {
      console.log('✅ 所有相關表格都有正確的記錄');
    } else {
      console.log('❌ 部分表格缺少記錄');
    }
    
    return {
      success: allTablesHaveRecords,
      palletInfo,
      grnRecords,
      historyRecords,
      inventoryRecords,
      palletBufferStatus,
      palletNumbers
    };
    
  } catch (error) {
    console.error('❌ 數據庫驗證錯誤:', error);
    return { success: false, error };
  }
};

// 清理測試數據
const cleanupTestData = async (palletNumbers) => {
  if (!palletNumbers || palletNumbers.length === 0) return;
  
  console.log('🧹 清理測試數據...');
  
  try {
    // 按正確順序刪除記錄（避免外鍵約束錯誤）
    await supabase.from('record_inventory').delete().in('plt_num', palletNumbers);
    await supabase.from('record_history').delete().in('plt_num', palletNumbers);
    await supabase.from('record_grn').delete().in('plt_num', palletNumbers);
    await supabase.from('record_palletinfo').delete().in('plt_num', palletNumbers);
    
    // 釋放棧板編號
    await supabase
      .from('pallet_number_buffer')
      .update({ used: 'False' })
      .in('pallet_number', palletNumbers);
    
    console.log('✅ 測試數據清理完成');
  } catch (error) {
    console.error('❌ 清理測試數據時發生錯誤:', error);
  }
};

// 執行單個測試
const runSingleTest = async (page, testConfig) => {
  console.log(`\n🧪 開始執行 ${testConfig.name}`);
  console.log(`   Product Code: ${testConfig.productCode}`);
  console.log(`   Count Method: ${testConfig.countMethod}`);
  
  const startTime = new Date().toISOString();
  
  try {
    // 導航到 GRN Label 頁面
    await navigateToGrnLabel(page);
    await takeScreenshot(page, `${testConfig.name}-start`);
    
    // 填寫表單
    await fillBasicForm(page, testConfig);
    await fillCountMethodData(page, testConfig);
    
    await takeScreenshot(page, `${testConfig.name}-form-filled`);
    
    // 提交表單並監控 RPC 請求
    const submitResult = await submitFormAndMonitorRequests(page, testConfig);
    
    await delay(3000);
    await takeScreenshot(page, `${testConfig.name}-after-submit`);
    
    // 驗證數據庫記錄
    const dbResult = await verifyDatabaseRecords(testConfig, startTime);
    
    // 生成測試結果
    const testResult = {
      testName: testConfig.name,
      success: submitResult.success && dbResult.success,
      usedUnifiedRpc: submitResult.success,
      databaseRecordsComplete: dbResult.success,
      palletNumbers: dbResult.palletNumbers || [],
      rpcCalls: submitResult.rpcCalls || [],
      timestamp: new Date().toISOString()
    };
    
    console.log(`\n📊 ${testConfig.name} 測試結果:`);
    console.log(`   ✅ 使用統一 RPC: ${testResult.usedUnifiedRpc ? '是' : '否'}`);
    console.log(`   ✅ 數據庫記錄完整: ${testResult.databaseRecordsComplete ? '是' : '否'}`);
    console.log(`   📦 生成棧板數量: ${testResult.palletNumbers.length}`);
    console.log(`   🔗 RPC 調用次數: ${testResult.rpcCalls.length}`);
    
    // 清理測試數據
    await cleanupTestData(dbResult.palletNumbers);
    
    return testResult;
    
  } catch (error) {
    console.error(`❌ 測試 ${testConfig.name} 執行失敗:`, error);
    await takeScreenshot(page, `${testConfig.name}-error`);
    
    return {
      testName: testConfig.name,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// 主測試函數
const runTests = async () => {
  console.log('🚀 開始 GRN Label 統一 RPC 功能測試\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 設置頁面配置
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // 登入
    await login(page);
    
    const testResults = [];
    
    // 執行所有測試
    for (const testConfig of TEST_CONFIG.tests) {
      const result = await runSingleTest(page, testConfig);
      testResults.push(result);
      
      // 測試間隔
      await delay(2000);
    }
    
    // 生成最終報告
    console.log('\n📋 測試總結報告:');
    console.log('='.repeat(50));
    
    const successfulTests = testResults.filter(r => r.success);
    const failedTests = testResults.filter(r => !r.success);
    
    console.log(`✅ 成功測試: ${successfulTests.length}/${testResults.length}`);
    console.log(`❌ 失敗測試: ${failedTests.length}/${testResults.length}`);
    
    testResults.forEach(result => {
      console.log(`\n📝 ${result.testName}:`);
      console.log(`   狀態: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
      if (result.usedUnifiedRpc !== undefined) {
        console.log(`   統一 RPC: ${result.usedUnifiedRpc ? '✅ 是' : '❌ 否'}`);
      }
      if (result.databaseRecordsComplete !== undefined) {
        console.log(`   數據庫記錄: ${result.databaseRecordsComplete ? '✅ 完整' : '❌ 不完整'}`);
      }
      if (result.palletNumbers && result.palletNumbers.length > 0) {
        console.log(`   棧板數量: ${result.palletNumbers.length}`);
      }
      if (result.error) {
        console.log(`   錯誤: ${result.error}`);
      }
    });
    
    console.log('\n🎯 測試目標達成情況:');
    console.log(`📌 是否已使用新的統一RPC功能: ${successfulTests.some(r => r.usedUnifiedRpc) ? '✅ 是' : '❌ 否'}`);
    console.log(`📌 是否所有有關表格都有更新/新增紀錄: ${successfulTests.some(r => r.databaseRecordsComplete) ? '✅ 是' : '❌ 否'}`);
    
  } catch (error) {
    console.error('❌ 測試執行錯誤:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 測試完成');
  }
};

// 執行測試
runTests().catch(console.error); 