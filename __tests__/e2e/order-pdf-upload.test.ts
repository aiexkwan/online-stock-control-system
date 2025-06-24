import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { testConfig, selectors, testPDFs } from './config/test-config';
import { extractPDFData, compareResults, expectedData } from './helpers/pdf-data-extractor';

interface TestResult {
  pdfFile: string;
  success: boolean;
  accuracy: number;
  errors: string[];
  extractedData: any;
  executionTime: number;
}

describe('Order PDF Upload E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  const results: TestResult[] = [];

  beforeAll(async () => {
    console.log('🚀 啟動 Puppeteer...');
    browser = await puppeteer.launch(testConfig.puppeteer);
    page = await browser.newPage();
    
    // 設置默認超時
    page.setDefaultTimeout(testConfig.timeout.default);
    
    // 登入系統
    await login(page);
  }, testConfig.timeout.navigation);

  afterAll(async () => {
    // 生成測試報告
    await generateReport(results);
    
    // 關閉瀏覽器
    await browser.close();
  });

  // 為每個 PDF 創建測試
  testPDFs.forEach((pdfFile) => {
    it(`should upload and analyze ${pdfFile}`, async () => {
      const startTime = Date.now();
      
      try {
        console.log(`\n📄 測試 PDF: ${pdfFile}`);
        
        // 開啟上傳對話框
        await openUploadDialog(page);
        
        // 上傳 PDF
        const pdfPath = path.join(process.cwd(), testConfig.pdfDirectory, pdfFile);
        await uploadPDF(page, pdfPath);
        
        // 點擊分析按鈕
        await page.click(selectors.uploadDialog.analyzeButton);
        
        // 等待分析完成
        await page.waitForSelector(selectors.uploadDialog.successMessage, {
          timeout: testConfig.timeout.analysis
        });
        
        // 提取顯示嘅數據
        const extractedData = await extractDisplayedData(page);
        console.log('📊 提取到嘅數據:', JSON.stringify(extractedData, null, 2));
        
        // 比較結果
        const expected = expectedData[pdfFile];
        let testResult: TestResult;
        
        if (expected) {
          const comparison = compareResults(extractedData, expected);
          testResult = {
            pdfFile,
            success: comparison.success,
            accuracy: comparison.accuracy,
            errors: comparison.errors,
            extractedData,
            executionTime: Date.now() - startTime
          };
        } else {
          // 如果沒有預期數據，只記錄提取結果
          testResult = {
            pdfFile,
            success: true,
            accuracy: 100,
            errors: [],
            extractedData,
            executionTime: Date.now() - startTime
          };
        }
        
        results.push(testResult);
        
        // 關閉對話框
        await page.click(selectors.uploadDialog.closeButton);
        await page.waitForSelector(selectors.uploadDialog.dialog, {
          state: 'hidden'
        });
        
        // 等待一下避免太快
        await page.waitForTimeout(2000);
        
      } catch (error) {
        console.error(`❌ 測試失敗 ${pdfFile}:`, error);
        results.push({
          pdfFile,
          success: false,
          accuracy: 0,
          errors: [error.toString()],
          extractedData: null,
          executionTime: Date.now() - startTime
        });
      }
    }, testConfig.timeout.analysis + 10000);
  });
});

// 輔助函數

async function login(page: Page) {
  console.log('🔐 登入系統...');
  await page.goto(testConfig.baseUrl);
  
  // 填寫登入表單
  await page.waitForSelector(selectors.login.emailInput);
  await page.type(selectors.login.emailInput, testConfig.credentials.email);
  await page.type(selectors.login.passwordInput, testConfig.credentials.password);
  
  // 提交表單
  await page.click(selectors.login.submitButton);
  
  // 等待登入完成（通過檢查 URL 變化或特定元素）
  await page.waitForNavigation();
  console.log('✅ 登入成功');
}

async function openUploadDialog(page: Page) {
  // 點擊 Admin Panel 按鈕
  await page.waitForSelector(selectors.adminPanel.menuButton);
  await page.click(selectors.adminPanel.menuButton);
  
  // 等待菜單出現
  await page.waitForTimeout(500);
  
  // 點擊 Upload Order PDF
  await page.waitForSelector(selectors.adminPanel.uploadOrderPDFButton);
  await page.click(selectors.adminPanel.uploadOrderPDFButton);
  
  // 等待對話框出現
  await page.waitForSelector(selectors.uploadDialog.dialog);
}

async function uploadPDF(page: Page, pdfPath: string) {
  // 找到文件輸入
  const fileInput = await page.$(selectors.uploadDialog.fileInput);
  if (!fileInput) {
    throw new Error('找唔到文件輸入元素');
  }
  
  // 上傳文件
  await fileInput.uploadFile(pdfPath);
  
  // 等待文件被處理
  await page.waitForTimeout(1000);
}

async function extractDisplayedData(page: Page) {
  // 等待數據顯示
  await page.waitForSelector(selectors.uploadDialog.extractedDataSection);
  
  // 提取所有訂單數據
  const orders = await page.evaluate(() => {
    const orderElements = document.querySelectorAll('div[class*="bg-slate-600/40"]');
    const extractedOrders = [];
    
    orderElements.forEach(element => {
      const orderData: any = {};
      
      // 提取訂單號
      const orderRefElement = element.querySelector('span:has(+ span.text-white)');
      if (orderRefElement?.textContent?.includes('Order Number:')) {
        orderData.order_ref = orderRefElement.nextElementSibling?.textContent?.trim();
      }
      
      // 提取產品代碼
      const productCodeElement = element.querySelector('span.text-cyan-300');
      if (productCodeElement) {
        orderData.product_code = productCodeElement.textContent?.trim();
      }
      
      // 提取數量
      const quantityElement = element.querySelector('span.text-yellow-300');
      if (quantityElement) {
        orderData.product_qty = quantityElement.textContent?.trim();
      }
      
      // 提取描述
      const descElements = element.querySelectorAll('span.text-white');
      descElements.forEach(el => {
        const prevText = el.previousElementSibling?.textContent;
        if (prevText?.includes('Product Description:')) {
          orderData.product_desc = el.textContent?.trim();
        }
      });
      
      if (Object.keys(orderData).length > 0) {
        extractedOrders.push(orderData);
      }
    });
    
    // 假設所有產品都有相同嘅送貨地址同帳號
    // 實際上需要從其他地方提取
    return {
      orders: extractedOrders,
      // 這些值需要從 API 響應或其他地方獲取
      delivery_add: '-',
      account_num: '-'
    };
  });
  
  return orders;
}

async function generateReport(results: TestResult[]) {
  const reportPath = path.join(testConfig.report.outputDir, `test-report-${Date.now()}.json`);
  
  const summary = {
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    averageAccuracy: results.reduce((acc, r) => acc + r.accuracy, 0) / results.length,
    totalExecutionTime: results.reduce((acc, r) => acc + r.executionTime, 0),
    timestamp: new Date().toISOString(),
    results
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  
  console.log('\n📊 測試總結:');
  console.log(`總測試數: ${summary.totalTests}`);
  console.log(`成功: ${summary.passed}`);
  console.log(`失敗: ${summary.failed}`);
  console.log(`平均準確率: ${summary.averageAccuracy.toFixed(2)}%`);
  console.log(`總執行時間: ${(summary.totalExecutionTime / 1000).toFixed(2)}秒`);
  console.log(`\n報告已保存到: ${reportPath}`);
}