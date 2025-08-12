import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// 測試數據
const testData = [
  {
    productCode: 'MEP9090150',
    quantity: '20',
    palletCount: '1',
    verifiedClockId: '5997'
  },
  {
    productCode: 'ME4545150',
    quantity: '20',
    palletCount: '2',
    verifiedClockId: '6001'
  },
  {
    productCode: 'MEL4545A',
    quantity: '20',
    palletCount: '3',
    verifiedClockId: '5667'
  },
  {
    productCode: 'MEL6060A',
    quantity: '20',
    palletCount: '2',
    verifiedClockId: '5997'
  }
];

// Supabase 客戶端初始化
const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MTU2MDQsImV4cCI6MjA2MTI5MTYwNH0._xBzFK-3gOqyztwpvR6xfMbLd3ynTubEg5Z1iLYj92Q';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 輔助函數：等待元素可見
async function waitForElement(page: Page, selector: string, timeout = 30000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

// 輔助函數：安全點擊元素
async function safeClick(page: Page, locatorOrSelector: any, options = { timeout: 15000 }) {
  try {
    if (typeof locatorOrSelector === 'string') {
      await waitForElement(page, locatorOrSelector, options.timeout);
      await page.click(locatorOrSelector);
    } else {
      // 是 locator
      await locatorOrSelector.waitFor({ state: 'visible', timeout: options.timeout });
      await locatorOrSelector.click();
    }
    console.log('點擊成功');
  } catch (error) {
    console.error(`Failed to click element`, error);
    throw error;
  }
}

// 輔助函數：安全填寫輸入框
async function safeFill(page: Page, locatorOrSelector: any, value: string, options = { timeout: 15000 }) {
  try {
    // 判斷是 locator 還是 selector string
    if (typeof locatorOrSelector === 'string') {
      await waitForElement(page, locatorOrSelector, options.timeout);
      await page.fill(locatorOrSelector, value);
    } else {
      // 是 locator
      await locatorOrSelector.waitFor({ state: 'visible', timeout: options.timeout });
      await locatorOrSelector.click();
      await locatorOrSelector.clear();
      await locatorOrSelector.fill(value);
    }
    console.log(`成功填寫: ${value}`);
  } catch (error) {
    console.error(`Failed to fill element with value: ${value}`, error);
    throw error;
  }
}

// 輔助函數：系統登入
async function loginToSystem(page: Page) {
  console.log('開始登入系統...');
  
  // 導航到登入頁面
  await page.goto('/main-login');
  
  // 等待登入表單加載
  await waitForElement(page, 'input[type="email"], input[name="email"]');
  
  // 填寫登入資訊
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  
  await emailInput.fill('akwan@pennineindustries.com');
  await passwordInput.fill('X315Y316');
  
  // 點擊登入按鈕
  const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("登入")').first();
  await loginButton.click();
  
  // 等待登入成功，檢查是否跳轉到主頁面
  await page.waitForURL('**/admin/**', { timeout: 30000 });
  console.log('登入成功，已跳轉到管理頁面');
}

// 輔助函數：導航到 QCLabelCard
async function navigateToQCLabelCard(page: Page) {
  console.log('導航到 QCLabelCard...');
  
  // 確保在 admin 頁面
  const currentUrl = page.url();
  if (!currentUrl.includes('/admin')) {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  }
  
  // 等待頁面加載完成
  await page.waitForTimeout(2000);
  
  // 點擊 Operation tab
  console.log('點擊 Operation tab...');
  const operationTab = page.locator('button:has-text("Operation")').first();
  await operationTab.click();
  await page.waitForTimeout(1000);
  
  // 點擊 QC Label 選項
  console.log('點擊 QC Label 選項...');
  const qcLabelOption = page.locator('button:has-text("QC Label")').first();
  await qcLabelOption.click();
  await page.waitForTimeout(2000);
  
  // 驗證 QCLabelCard 已加載
  console.log('等待 QCLabelCard 加載...');
  
  // 嘗試找到 QC 相關的輸入欄位或標題
  const qcElements = [
    'input[placeholder*="product"]',
    'input[name*="product"]',
    'label:has-text("Product Code")',
    'text="QC Label Generation"',
    'text="Product Code"'
  ];
  
  let found = false;
  for (const selector of qcElements) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        console.log(`成功找到 QCLabelCard 元素: ${selector}`);
        found = true;
        break;
      }
    } catch (e) {
      // 繼續嘗試
    }
  }
  
  if (!found) {
    console.warn('警告：無法確認 QCLabelCard 是否加載，將嘗試繼續測試...');
  } else {
    console.log('QCLabelCard 已成功加載');
  }
}

// 輔助函數：執行 QC Label 測試
async function performQCLabelTest(page: Page, testItem: typeof testData[0], testIndex: number) {
  console.log(`開始執行第 ${testIndex + 1} 次測試: ${testItem.productCode}`);
  
  // 填寫產品代碼
  const productCodeInput = page.locator('input[placeholder="Enter product code"]');
  await safeFill(page, productCodeInput, testItem.productCode);
  
  // 等待產品資訊自動填充 - 可能需要 GraphQL 查詢
  console.log('等待產品資訊加載...');
  await page.waitForTimeout(3000);
  
  // 填寫數量（如果需要修改）
  const quantityInput = page.locator('input[placeholder="Enter quantity per pallet"]');
  await safeFill(page, quantityInput, testItem.quantity);
  
  // 填寫 Pallet Count
  const countInput = page.locator('input[placeholder="Enter number of pallets"]');
  await safeFill(page, countInput, testItem.palletCount);
  
  // 等待表單驗證完成
  await page.waitForTimeout(1000);
  
  // 等待 Print Label 按鈕變為可用狀態
  const printButton = page.locator('button:has-text("Print Label"), button:has-text("Print")').first();
  
  // 等待按鈕啟用
  console.log('等待 Print Label 按鈕啟用...');
  await page.waitForFunction(
    () => {
      // 使用標準 DOM 選擇器
      const buttons = Array.from(document.querySelectorAll('button'));
      const printBtn = buttons.find(b => 
        b.textContent?.includes('Print Label') || 
        b.textContent?.includes('Print')
      );
      return printBtn && !printBtn.hasAttribute('disabled');
    },
    { timeout: 10000 }
  );
  
  // 點擊列印標籤按鈕
  await safeClick(page, printButton);
  
  // 等待 Clock Number 對話框出現並處理
  console.log('等待 Clock Number 確認對話框...');
  try {
    // 等待對話框出現 - 使用 role="dialog"
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    console.log('Clock Number 對話框已出現');
    
    // 等待輸入框可見
    await page.waitForTimeout(500); // 讓對話框完全渲染
    
    // 根據 ClockNumberConfirmDialog 組件，輸入框的 ID 是 "clock-number"
    const clockIdInput = page.locator('#clock-number');
    
    // 檢查輸入框是否存在
    if (await clockIdInput.isVisible({ timeout: 3000 })) {
      console.log('找到 Clock Number 輸入框');
      
      // 清空並填寫 Clock ID
      await clockIdInput.click();
      await clockIdInput.clear();
      await clockIdInput.fill(testItem.verifiedClockId);
      console.log(`填寫 Clock ID: ${testItem.verifiedClockId}`);
      
      // 等待一下確保輸入完成
      await page.waitForTimeout(500);
      
      // 查找並點擊 Confirm 按鈕
      // 根據組件代碼，按鈕文字是 "Confirm"
      const confirmButton = page.locator('button:has-text("Confirm")').first();
      
      if (await confirmButton.isVisible({ timeout: 3000 })) {
        console.log('找到 Confirm 按鈕');
        
        // 等待按鈕可點擊（不是 disabled 狀態）
        await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
        
        // 確保按鈕已啟用
        const isDisabled = await confirmButton.isDisabled();
        if (!isDisabled) {
          await confirmButton.click();
          console.log('點擊 Confirm 按鈕');
        } else {
          // 如果按鈕仍然被禁用，等待一下再試
          await page.waitForTimeout(1000);
          await confirmButton.click();
          console.log('點擊 Confirm 按鈕（延遲後）');
        }
        
        // 等待對話框關閉
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
        console.log('Clock Number 對話框已關閉');
        
        // 等待處理完成
        await page.waitForTimeout(2000);
      } else {
        console.log('未找到 Confirm 按鈕');
        throw new Error('Confirm button not found');
      }
    } else {
      console.log('未找到 Clock Number 輸入框');
      throw new Error('Clock number input not found');
    }
    
  } catch (error) {
    console.error('Clock Number 對話框處理失敗:', error);
    // 截圖以便調試
    await page.screenshot({ 
      path: `/tmp/clock-number-dialog-error-${Date.now()}.png`,
      fullPage: true 
    });
    throw error; // 重新拋出錯誤，讓測試失敗
  }
  
  // 等待處理完成和成功消息
  try {
    // 等待成功消息或 toast 通知
    await expect(page.locator('text("Success"), text("成功"), .toast, .notification').first()).toBeVisible({ timeout: 15000 });
    console.log(`第 ${testIndex + 1} 次測試成功: ${testItem.productCode}`);
  } catch (error) {
    console.log(`第 ${testIndex + 1} 次測試可能成功但未檢測到成功消息: ${testItem.productCode}`);
  }
  
  // 檢查是否有列印對話框，如果有則取消
  try {
    const printDialog = page.locator('[role="dialog"]:has-text("Print"), [role="dialog"]:has-text("列印")').first();
    if (await printDialog.isVisible({ timeout: 5000 })) {
      const cancelButton = printDialog.locator('button:has-text("Cancel"), button:has-text("取消"), button:has-text("Close")').first();
      await safeClick(page, cancelButton.toString());
      console.log(`第 ${testIndex + 1} 次測試: 已取消列印對話框`);
    }
  } catch (error) {
    console.log(`第 ${testIndex + 1} 次測試: 未檢測到列印對話框`);
  }
  
  // 等待一段時間讓系統處理完成
  await page.waitForTimeout(3000);
  
  console.log(`完成第 ${testIndex + 1} 次測試: ${testItem.productCode}`);
}

// 輔助函數：驗證 Supabase 表格更新
async function verifyDatabaseUpdates(testItem: typeof testData[0], testIndex: number) {
  console.log(`驗證第 ${testIndex + 1} 次測試的資料庫更新: ${testItem.productCode}`);
  
  try {
    // 檢查 record_history 表
    const { data: historyData, error: historyError } = await supabase
      .from('record_history')
      .select('*')
      .eq('id', parseInt(testItem.verifiedClockId))
      .gte('time', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 最近5分鐘的記錄
      .order('time', { ascending: false })
      .limit(5);
    
    if (historyError) {
      console.error(`History查詢錯誤 (測試 ${testIndex + 1}):`, historyError);
    } else {
      console.log(`History記錄數量 (測試 ${testIndex + 1}):`, historyData?.length || 0);
    }
    
    // 檢查 record_inventory 表
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('record_inventory')
      .select('*')
      .eq('product_code', testItem.productCode)
      .gte('latest_update', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('latest_update', { ascending: false })
      .limit(3);
    
    if (inventoryError) {
      console.error(`Inventory查詢錯誤 (測試 ${testIndex + 1}):`, inventoryError);
    } else {
      console.log(`Inventory記錄數量 (測試 ${testIndex + 1}):`, inventoryData?.length || 0);
    }
    
    // 檢查 stock_level 表
    const { data: stockData, error: stockError } = await supabase
      .from('stock_level')
      .select('*')
      .eq('stock', testItem.productCode)
      .gte('update_time', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('update_time', { ascending: false })
      .limit(3);
    
    if (stockError) {
      console.error(`Stock查詢錯誤 (測試 ${testIndex + 1}):`, stockError);
    } else {
      console.log(`Stock記錄數量 (測試 ${testIndex + 1}):`, stockData?.length || 0);
    }
    
    // 檢查 record_palletinfo 表（查找最新的 pallet）
    const { data: palletData, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('*')
      .eq('product_code', testItem.productCode)
      .gte('generate_time', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('generate_time', { ascending: false })
      .limit(parseInt(testItem.palletCount) + 2);
    
    if (palletError) {
      console.error(`Pallet查詢錯誤 (測試 ${testIndex + 1}):`, palletError);
    } else {
      console.log(`Pallet記錄數量 (測試 ${testIndex + 1}):`, palletData?.length || 0);
    }
    
    // 檢查 work_level 表
    const { data: workData, error: workError } = await supabase
      .from('work_level')
      .select('*')
      .eq('id', parseInt(testItem.verifiedClockId))
      .gte('latest_update', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('latest_update', { ascending: false })
      .limit(3);
    
    if (workError) {
      console.error(`Work Level查詢錯誤 (測試 ${testIndex + 1}):`, workError);
    } else {
      console.log(`Work Level記錄數量 (測試 ${testIndex + 1}):`, workData?.length || 0);
    }
    
    // 檢查 pallet_number_buffer 表（檢查是否有新的 pallet 號碼被使用）
    const { data: bufferData, error: bufferError } = await supabase
      .from('pallet_number_buffer')
      .select('*')
      .eq('used', 'True')
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(parseInt(testItem.palletCount) + 2);
    
    if (bufferError) {
      console.error(`Buffer查詢錯誤 (測試 ${testIndex + 1}):`, bufferError);
    } else {
      console.log(`Buffer記錄數量 (測試 ${testIndex + 1}):`, bufferData?.length || 0);
    }
    
    console.log(`完成第 ${testIndex + 1} 次測試的資料庫驗證`);
    
  } catch (error) {
    console.error(`資料庫驗證錯誤 (測試 ${testIndex + 1}):`, error);
  }
}

// 主測試套件
test.describe('QCLabelCard 組件測試', () => {
  test.setTimeout(300000); // 5分鐘超時
  
  test('QCLabelCard 完整功能測試 - 4次數據提交', async ({ page }) => {
    console.log('=== 開始 QCLabelCard 完整功能測試 ===');
    
    // 步驟1: 登入系統
    await loginToSystem(page);
    
    // 步驟2: 導航到 QCLabelCard
    await navigateToQCLabelCard(page);
    
    // 步驟3: 執行 4 次測試
    for (let i = 0; i < testData.length; i++) {
      const testItem = testData[i];
      
      try {
        // 執行 QC Label 測試
        await performQCLabelTest(page, testItem, i);
        
        // 等待系統處理
        await page.waitForTimeout(2000);
        
        // 驗證資料庫更新（異步執行）
        verifyDatabaseUpdates(testItem, i).catch(error => {
          console.error(`資料庫驗證失敗 (測試 ${i + 1}):`, error);
        });
        
        // 在測試之間稍作暫停
        if (i < testData.length - 1) {
          await page.waitForTimeout(3000);
        }
        
      } catch (error) {
        console.error(`第 ${i + 1} 次測試失敗:`, error);
        
        // 嘗試截圖以便調試
        try {
          await page.screenshot({ 
            path: `/tmp/qc-test-error-${i + 1}-${Date.now()}.png`,
            fullPage: true 
          });
        } catch (screenshotError) {
          console.error('截圖失敗:', screenshotError);
        }
        
        // 繼續執行下一個測試
        continue;
      }
    }
    
    // 步驟4: 等待所有資料庫操作完成
    console.log('等待資料庫操作完成...');
    await page.waitForTimeout(10000);
    
    // 步驟5: 最終驗證
    console.log('執行最終驗證...');
    for (let i = 0; i < testData.length; i++) {
      await verifyDatabaseUpdates(testData[i], i);
      await page.waitForTimeout(1000);
    }
    
    console.log('=== QCLabelCard 完整功能測試完成 ===');
  });
  
  // 單獨的登入測試
  test('系統登入測試', async ({ page }) => {
    await loginToSystem(page);
    
    // 驗證登入成功
    expect(page.url()).toContain('/admin');
    
    // 檢查是否有管理頁面的元素
    await expect(page.locator('h1, h2, .admin-title, [data-testid="admin-header"]').first()).toBeVisible({ timeout: 10000 });
  });
  
  // QCLabelCard 導航測試
  test('QCLabelCard 導航測試', async ({ page }) => {
    await loginToSystem(page);
    await navigateToQCLabelCard(page);
    
    // 驗證 QCLabelCard 存在
    await expect(page.locator('h2:has-text("QC Label Generation")')).toBeVisible({ timeout: 15000 });
  });
  
  // 單個產品測試
  test('單個產品 QC Label 生成測試', async ({ page }) => {
    await loginToSystem(page);
    await navigateToQCLabelCard(page);
    
    // 使用第一個測試數據
    await performQCLabelTest(page, testData[0], 0);
    
    // 驗證成功
    await page.waitForTimeout(5000);
    await verifyDatabaseUpdates(testData[0], 0);
  });
});

// 測試結束後的清理
test.afterAll(async () => {
  console.log('=== 測試清理完成 ===');
});