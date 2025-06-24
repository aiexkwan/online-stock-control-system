#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// 測試配置
const testConfig = {
  credentials: {
    email: 'akwan@pennineindustries.com',
    password: 'X315Y316'
  },
  baseUrl: 'http://localhost:3000',
  puppeteer: {
    headless: false,
    slowMo: 100,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  },
  timeout: {
    navigation: 30000,
    analysis: 60000,
    default: 10000
  }
};

// 測試 PDF 文件
const testPDFs = [
  '280813-Picking List.pdf',
  '280831-Picking List.pdf',
  '280832-Picking List.pdf',
  '280833-Picking List.pdf',
  '280834-Picking List.pdf',
  '280835-Picking List.pdf',
  '280836-Picking List.pdf',
  '280858 Picking List.pdf',
  '280859 Picking List.pdf',
  '280860 Picking List.pdf',
  '280862 Picking List.pdf',
  'ACO - 280761 Picking List.pdf'
];

// 選擇器
const selectors = {
  login: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button[type="submit"]'
  },
  adminPanel: {
    menuButton: 'button:contains("Admin Panel"), button:has-text("Admin Panel")',
    uploadOrderPDFButton: 'button:contains("Upload Order PDF"), button:has-text("Upload Order PDF")'
  },
  uploadDialog: {
    dialog: '[role="dialog"]',
    fileInput: 'input[type="file"][accept=".pdf"]',
    analyzeButton: 'button:contains("Analyze PDF"), button:has-text("Analyze PDF")',
    closeButton: 'button:contains("Close"), button:has-text("Close")',
    successMessage: 'div:contains("Data Import Success"), div:has-text("Data Import Success")',
    errorMessage: '.text-red-300',
    extractedDataSection: 'div:contains("Extracted Order Data"), div:has-text("Extracted Order Data")'
  }
};

// 主測試函數
async function runTests() {
  console.log('🚀 開始 Order PDF Upload E2E 測試...\n');
  
  const browser = await puppeteer.launch(testConfig.puppeteer);
  const page = await browser.newPage();
  page.setDefaultTimeout(testConfig.timeout.default);
  
  const results = [];
  
  try {
    // 登入
    await login(page);
    
    // 測試每個 PDF
    for (const pdfFile of testPDFs) {
      const result = await testSinglePDF(page, pdfFile);
      results.push(result);
      
      // 等待一下避免太快
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('測試過程中出錯:', error);
  } finally {
    await browser.close();
    
    // 生成報告
    generateReport(results);
  }
}

// 登入函數
async function login(page) {
  console.log('🔐 登入系統...');
  await page.goto(testConfig.baseUrl);
  
  // 等待登入表單
  await page.waitForSelector(selectors.login.emailInput, { timeout: testConfig.timeout.navigation });
  
  // 填寫表單
  await page.type(selectors.login.emailInput, testConfig.credentials.email);
  await page.type(selectors.login.passwordInput, testConfig.credentials.password);
  
  // 提交
  await page.click(selectors.login.submitButton);
  
  // 等待導航完成
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('✅ 登入成功\n');
}

// 測試單個 PDF
async function testSinglePDF(page, pdfFile) {
  const startTime = Date.now();
  console.log(`📄 測試 PDF: ${pdfFile}`);
  
  try {
    // 打開 Admin Panel
    await page.waitForSelector('button', { timeout: 5000 });
    
    // 找到並點擊 Admin Panel 按鈕
    const adminButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Admin Panel'));
    });
    
    if (adminButton) {
      await adminButton.asElement().click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 找到並點擊 Upload Order PDF
    const uploadButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Upload Order PDF'));
    });
    
    if (uploadButton) {
      await uploadButton.asElement().click();
    }
    
    // 等待對話框
    await page.waitForSelector(selectors.uploadDialog.dialog, { timeout: 5000 });
    
    // 上傳文件
    const fileInput = await page.$(selectors.uploadDialog.fileInput);
    const pdfPath = path.join(process.cwd(), 'public/pdf', pdfFile);
    await fileInput.uploadFile(pdfPath);
    
    // 等待文件被處理
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 點擊分析按鈕
    const analyzeBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Analyze PDF'));
    });
    
    if (analyzeBtn) {
      await analyzeBtn.asElement().click();
    }
    
    // 等待分析完成
    await page.waitForFunction(
      () => {
        const text = document.body.textContent || '';
        return text.includes('Data Import Success') || text.includes('Analysis Complete');
      },
      { timeout: testConfig.timeout.analysis }
    );
    
    // 提取數據
    const extractedData = await page.evaluate(() => {
      const orderElements = document.querySelectorAll('div[class*="bg-slate-600/40"]');
      const orders = [];
      
      orderElements.forEach(element => {
        const orderData = {};
        
        // 提取各個字段
        const spans = element.querySelectorAll('span');
        spans.forEach((span, index) => {
          const text = span.textContent?.trim();
          const nextSpan = spans[index + 1];
          
          if (text?.includes('Order Number:') && nextSpan) {
            orderData.order_ref = nextSpan.textContent?.trim();
          } else if (text?.includes('Product Code:') && nextSpan) {
            orderData.product_code = nextSpan.textContent?.trim();
          } else if (text?.includes('Quantity:') && nextSpan) {
            orderData.product_qty = nextSpan.textContent?.trim();
          } else if (text?.includes('Product Description:') && nextSpan) {
            orderData.product_desc = nextSpan.textContent?.trim();
          }
        });
        
        if (Object.keys(orderData).length > 0) {
          orders.push(orderData);
        }
      });
      
      return orders;
    });
    
    console.log(`✅ 成功提取 ${extractedData.length} 條記錄`);
    
    // 關閉對話框
    const closeBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent === 'Close');
    });
    
    if (closeBtn) {
      await closeBtn.asElement().click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      pdfFile,
      success: true,
      recordCount: extractedData.length,
      extractedData,
      executionTime: Date.now() - startTime,
      error: null
    };
    
  } catch (error) {
    console.error(`❌ 測試失敗: ${error.message}`);
    return {
      pdfFile,
      success: false,
      recordCount: 0,
      extractedData: null,
      executionTime: Date.now() - startTime,
      error: error.message
    };
  }
}

// 生成報告
function generateReport(results) {
  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const summary = {
    timestamp,
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    totalRecords: results.reduce((sum, r) => sum + (r.recordCount || 0), 0),
    totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
    results
  };
  
  // 保存 JSON 報告
  const jsonPath = path.join(reportDir, `test-report-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  
  // 生成 HTML 報告
  const htmlPath = path.join(reportDir, `test-report-${Date.now()}.html`);
  const html = generateHTMLReport(summary);
  fs.writeFileSync(htmlPath, html);
  
  // 打印總結
  console.log('\n📊 測試總結:');
  console.log(`總測試數: ${summary.totalTests}`);
  console.log(`成功: ${summary.passed}`);
  console.log(`失敗: ${summary.failed}`);
  console.log(`總提取記錄數: ${summary.totalRecords}`);
  console.log(`總執行時間: ${(summary.totalExecutionTime / 1000).toFixed(2)}秒`);
  console.log(`\nJSON 報告: ${jsonPath}`);
  console.log(`HTML 報告: ${htmlPath}`);
  console.log(`\n打開 HTML 報告: open "${htmlPath}"`);
}

// 生成 HTML 報告
function generateHTMLReport(summary) {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order PDF Upload Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1, h2 {
      color: #333;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .metric {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #007bff;
    }
    .success { color: #28a745; }
    .failed { color: #dc3545; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    .success-row { background-color: #d4edda; }
    .failed-row { background-color: #f8d7da; }
    .details {
      margin: 10px 0;
      padding: 10px;
      background-color: #f4f4f4;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Order PDF Upload Test Report</h1>
    <p>Generated: ${new Date(summary.timestamp).toLocaleString('zh-TW')}</p>
    
    <h2>測試總結</h2>
    <div class="summary">
      <div class="metric">
        <div>總測試數</div>
        <div class="metric-value">${summary.totalTests}</div>
      </div>
      <div class="metric">
        <div>成功</div>
        <div class="metric-value success">${summary.passed}</div>
      </div>
      <div class="metric">
        <div>失敗</div>
        <div class="metric-value failed">${summary.failed}</div>
      </div>
      <div class="metric">
        <div>總提取記錄</div>
        <div class="metric-value">${summary.totalRecords}</div>
      </div>
    </div>
    
    <h2>詳細結果</h2>
    <table>
      <thead>
        <tr>
          <th>PDF 文件</th>
          <th>狀態</th>
          <th>提取記錄數</th>
          <th>執行時間</th>
          <th>錯誤信息</th>
        </tr>
      </thead>
      <tbody>
        ${summary.results.map(result => `
          <tr class="${result.success ? 'success-row' : 'failed-row'}">
            <td>${result.pdfFile}</td>
            <td>${result.success ? '✅ 成功' : '❌ 失敗'}</td>
            <td>${result.recordCount}</td>
            <td>${(result.executionTime / 1000).toFixed(2)}秒</td>
            <td>${result.error || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>提取數據詳情</h2>
    ${summary.results.filter(r => r.success && r.extractedData).map(result => `
      <h3>${result.pdfFile}</h3>
      <div class="details">
        <pre>${JSON.stringify(result.extractedData, null, 2)}</pre>
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;
}

// 運行測試
runTests().catch(console.error);