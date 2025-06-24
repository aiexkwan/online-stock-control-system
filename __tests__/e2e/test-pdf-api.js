#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// 測試配置
const testConfig = {
  apiUrl: 'http://localhost:3000/api/analyze-order-pdf-new',
  pdfDirectory: 'public/pdf',
  uploadedBy: '1' // 假設用戶 ID
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

// 主測試函數
async function runTests() {
  console.log('🚀 開始 Order PDF Upload API 測試...\n');
  
  const results = [];
  
  // 測試每個 PDF
  for (const pdfFile of testPDFs) {
    const result = await testSinglePDF(pdfFile);
    results.push(result);
    
    // 等待一下避免太快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 生成報告
  generateReport(results);
}

// 測試單個 PDF
async function testSinglePDF(pdfFile) {
  const startTime = Date.now();
  console.log(`📄 測試 PDF: ${pdfFile}`);
  
  try {
    // 準備文件
    const pdfPath = path.join(process.cwd(), testConfig.pdfDirectory, pdfFile);
    const fileContent = fs.readFileSync(pdfPath);
    
    // 創建 FormData
    const formData = new FormData();
    formData.append('file', fileContent, pdfFile);
    formData.append('uploadedBy', testConfig.uploadedBy);
    formData.append('saveToStorage', 'true');
    
    // 發送請求
    const response = await axios.post(testConfig.apiUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // 60 秒超時
    });
    
    const data = response.data;
    
    if (data.success) {
      console.log(`✅ 成功提取 ${data.recordCount} 條記錄`);
      console.log(`   Token 使用: ${data.totalTokensUsed || 'N/A'}`);
      console.log(`   文本縮減: ${data.textProcessing?.reductionPercentage || 'N/A'}%`);
      
      // 顯示提取嘅數據
      if (data.extractedData && data.extractedData.length > 0) {
        console.log(`   提取數據樣本:`);
        data.extractedData.slice(0, 3).forEach(order => {
          console.log(`   - ${order.order_ref}: ${order.product_code} x ${order.product_qty}`);
        });
      }
    } else {
      console.log(`❌ 分析失敗: ${data.message}`);
    }
    
    return {
      pdfFile,
      success: data.success,
      recordCount: data.recordCount || 0,
      extractedData: data.extractedData,
      tokenUsed: data.totalTokensUsed || 0,
      textReduction: data.textProcessing?.reductionPercentage || 0,
      executionTime: Date.now() - startTime,
      error: data.error || null,
      cached: data.cached || false
    };
    
  } catch (error) {
    console.error(`❌ 測試失敗: ${error.message}`);
    return {
      pdfFile,
      success: false,
      recordCount: 0,
      extractedData: null,
      tokenUsed: 0,
      textReduction: 0,
      executionTime: Date.now() - startTime,
      error: error.message,
      cached: false
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
    totalTokens: results.reduce((sum, r) => sum + (r.tokenUsed || 0), 0),
    averageTextReduction: results.reduce((sum, r) => sum + (r.textReduction || 0), 0) / results.length,
    totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
    cachedCount: results.filter(r => r.cached).length,
    results
  };
  
  // 保存 JSON 報告
  const jsonPath = path.join(reportDir, `api-test-report-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  
  // 生成 HTML 報告
  const htmlPath = path.join(reportDir, `api-test-report-${Date.now()}.html`);
  const html = generateHTMLReport(summary);
  fs.writeFileSync(htmlPath, html);
  
  // 打印總結
  console.log('\n📊 測試總結:');
  console.log(`總測試數: ${summary.totalTests}`);
  console.log(`成功: ${summary.passed}`);
  console.log(`失敗: ${summary.failed}`);
  console.log(`總提取記錄數: ${summary.totalRecords}`);
  console.log(`總 Token 使用: ${summary.totalTokens}`);
  console.log(`平均文本縮減: ${summary.averageTextReduction.toFixed(1)}%`);
  console.log(`緩存命中: ${summary.cachedCount}`);
  console.log(`總執行時間: ${(summary.totalExecutionTime / 1000).toFixed(2)}秒`);
  console.log(`\nJSON 報告: ${jsonPath}`);
  console.log(`HTML 報告: ${htmlPath}`);
  console.log(`\n打開 HTML 報告: open "${htmlPath}"`);
  
  // 分析同建議
  analyzeResults(summary);
}

// 分析結果並提供建議
function analyzeResults(summary) {
  console.log('\n💡 分析同建議:');
  
  // Token 效率分析
  const avgTokenPerRecord = summary.totalTokens / summary.totalRecords;
  console.log(`\n1. Token 效率:`);
  console.log(`   - 平均每條記錄消耗: ${avgTokenPerRecord.toFixed(1)} tokens`);
  console.log(`   - 文本預處理平均縮減: ${summary.averageTextReduction.toFixed(1)}%`);
  
  // 錯誤分析
  if (summary.failed > 0) {
    console.log(`\n2. 錯誤分析:`);
    const errors = summary.results
      .filter(r => !r.success)
      .map(r => ({ file: r.pdfFile, error: r.error }));
    
    errors.forEach(e => {
      console.log(`   - ${e.file}: ${e.error}`);
    });
  }
  
  // 性能分析
  const avgTime = summary.totalExecutionTime / summary.totalTests / 1000;
  console.log(`\n3. 性能分析:`);
  console.log(`   - 平均處理時間: ${avgTime.toFixed(2)}秒`);
  console.log(`   - 緩存命中率: ${((summary.cachedCount / summary.totalTests) * 100).toFixed(1)}%`);
  
  // 數據質量分析
  console.log(`\n4. 數據質量:`);
  const recordCounts = summary.results.map(r => r.recordCount);
  const minRecords = Math.min(...recordCounts);
  const maxRecords = Math.max(...recordCounts);
  console.log(`   - 最少記錄數: ${minRecords}`);
  console.log(`   - 最多記錄數: ${maxRecords}`);
  console.log(`   - 平均記錄數: ${(summary.totalRecords / summary.totalTests).toFixed(1)}`);
}

// 生成 HTML 報告
function generateHTMLReport(summary) {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order PDF API Test Report</title>
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
    h1, h2, h3 {
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
    .cached { color: #6c757d; font-style: italic; }
    .details {
      margin: 10px 0;
      padding: 10px;
      background-color: #f4f4f4;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
    }
    .chart {
      margin: 20px 0;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Order PDF API Test Report</h1>
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
      <div class="metric">
        <div>總 Token 使用</div>
        <div class="metric-value">${summary.totalTokens}</div>
      </div>
      <div class="metric">
        <div>平均文本縮減</div>
        <div class="metric-value">${summary.averageTextReduction.toFixed(1)}%</div>
      </div>
    </div>
    
    <h2>詳細結果</h2>
    <table>
      <thead>
        <tr>
          <th>PDF 文件</th>
          <th>狀態</th>
          <th>提取記錄數</th>
          <th>Token 使用</th>
          <th>文本縮減</th>
          <th>執行時間</th>
          <th>緩存</th>
          <th>錯誤信息</th>
        </tr>
      </thead>
      <tbody>
        ${summary.results.map(result => `
          <tr class="${result.success ? 'success-row' : 'failed-row'}">
            <td>${result.pdfFile}</td>
            <td>${result.success ? '✅ 成功' : '❌ 失敗'}</td>
            <td>${result.recordCount}</td>
            <td>${result.tokenUsed}</td>
            <td>${result.textReduction}%</td>
            <td>${(result.executionTime / 1000).toFixed(2)}秒</td>
            <td>${result.cached ? '<span class="cached">是</span>' : '否'}</td>
            <td>${result.error || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>提取數據詳情</h2>
    ${summary.results.filter(r => r.success && r.extractedData).map(result => `
      <h3>${result.pdfFile} ${result.cached ? '<span class="cached">(緩存)</span>' : ''}</h3>
      <div class="details">
        <pre>${JSON.stringify(result.extractedData, null, 2)}</pre>
      </div>
    `).join('')}
    
    <div class="chart">
      <h2>性能指標</h2>
      <p><strong>平均每條記錄 Token 消耗:</strong> ${(summary.totalTokens / summary.totalRecords).toFixed(1)} tokens</p>
      <p><strong>緩存命中率:</strong> ${((summary.cachedCount / summary.totalTests) * 100).toFixed(1)}%</p>
      <p><strong>平均處理時間:</strong> ${(summary.totalExecutionTime / summary.totalTests / 1000).toFixed(2)}秒</p>
    </div>
  </div>
</body>
</html>
  `;
}

// 運行測試
runTests().catch(console.error);