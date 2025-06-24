import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  pdfFile: string;
  success: boolean;
  accuracy: number;
  errors: string[];
  extractedData: any;
  executionTime: number;
}

interface PromptOptimizationSuggestion {
  issue: string;
  suggestion: string;
  examples: string[];
}

export class ReportGenerator {
  static generateHTMLReport(results: TestResult[], outputPath: string) {
    const summary = this.calculateSummary(results);
    const suggestions = this.analyzeAndSuggestOptimizations(results);
    
    const html = `
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
    .success {
      color: #28a745;
    }
    .failed {
      color: #dc3545;
    }
    .test-result {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .test-result.success {
      border-left: 5px solid #28a745;
    }
    .test-result.failed {
      border-left: 5px solid #dc3545;
    }
    .errors {
      background-color: #f8d7da;
      color: #721c24;
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
    }
    .suggestion {
      background-color: #d1ecf1;
      color: #0c5460;
      padding: 15px;
      border-radius: 5px;
      margin: 10px 0;
    }
    .code {
      background-color: #f4f4f4;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      overflow-x: auto;
    }
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
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Order PDF Upload Test Report</h1>
    <p>Generated: ${new Date().toLocaleString('zh-TW')}</p>
    
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
        <div>平均準確率</div>
        <div class="metric-value">${summary.averageAccuracy.toFixed(1)}%</div>
      </div>
    </div>
    
    <h2>詳細測試結果</h2>
    ${results.map(result => `
      <div class="test-result ${result.success ? 'success' : 'failed'}">
        <h3>${result.pdfFile} ${result.success ? '✅' : '❌'}</h3>
        <p><strong>準確率:</strong> ${result.accuracy.toFixed(1)}%</p>
        <p><strong>執行時間:</strong> ${(result.executionTime / 1000).toFixed(2)}秒</p>
        
        ${result.errors.length > 0 ? `
          <div class="errors">
            <strong>錯誤:</strong>
            <ul>
              ${result.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${result.extractedData ? `
          <details>
            <summary>提取嘅數據</summary>
            <div class="code">
              <pre>${JSON.stringify(result.extractedData, null, 2)}</pre>
            </div>
          </details>
        ` : ''}
      </div>
    `).join('')}
    
    <h2>OpenAI Prompt 優化建議</h2>
    ${suggestions.map(suggestion => `
      <div class="suggestion">
        <h3>問題: ${suggestion.issue}</h3>
        <p><strong>建議:</strong> ${suggestion.suggestion}</p>
        ${suggestion.examples.length > 0 ? `
          <p><strong>例子:</strong></p>
          <ul>
            ${suggestion.examples.map(example => `<li>${example}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}
    
    <h2>常見錯誤統計</h2>
    <table>
      <thead>
        <tr>
          <th>錯誤類型</th>
          <th>出現次數</th>
          <th>百分比</th>
        </tr>
      </thead>
      <tbody>
        ${this.getErrorStatistics(results).map(stat => `
          <tr>
            <td>${stat.type}</td>
            <td>${stat.count}</td>
            <td>${stat.percentage.toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(outputPath, html);
  }
  
  private static calculateSummary(results: TestResult[]) {
    return {
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageAccuracy: results.reduce((acc, r) => acc + r.accuracy, 0) / results.length,
      totalExecutionTime: results.reduce((acc, r) => acc + r.executionTime, 0)
    };
  }
  
  private static analyzeAndSuggestOptimizations(results: TestResult[]): PromptOptimizationSuggestion[] {
    const suggestions: PromptOptimizationSuggestion[] = [];
    
    // 分析常見錯誤
    const allErrors = results.flatMap(r => r.errors);
    
    // 訂單號錯誤
    const orderRefErrors = allErrors.filter(e => e.includes('訂單號'));
    if (orderRefErrors.length > 0) {
      suggestions.push({
        issue: '訂單號提取錯誤',
        suggestion: '加強 prompt 中關於訂單號格式嘅說明，確保去除前置零',
        examples: orderRefErrors.slice(0, 3)
      });
    }
    
    // 數量錯誤
    const quantityErrors = allErrors.filter(e => e.includes('數量'));
    if (quantityErrors.length > 0) {
      suggestions.push({
        issue: '產品數量識別錯誤',
        suggestion: '改進 prompt 中關於數量識別嘅規則，避免同重量或價格混淆',
        examples: quantityErrors.slice(0, 3)
      });
    }
    
    // 產品缺失
    const missingProductErrors = allErrors.filter(e => e.includes('缺少產品'));
    if (missingProductErrors.length > 0) {
      suggestions.push({
        issue: '產品識別遺漏',
        suggestion: '優化產品行識別規則，確保所有產品格式都能被正確識別',
        examples: missingProductErrors.slice(0, 3)
      });
    }
    
    // 地址錯誤
    const addressErrors = allErrors.filter(e => e.includes('送貨地址'));
    if (addressErrors.length > 0) {
      suggestions.push({
        issue: '送貨地址提取不完整',
        suggestion: '改進地址提取規則，確保多行地址能完整提取',
        examples: addressErrors.slice(0, 3)
      });
    }
    
    return suggestions;
  }
  
  private static getErrorStatistics(results: TestResult[]) {
    const errorTypes = new Map<string, number>();
    const allErrors = results.flatMap(r => r.errors);
    
    allErrors.forEach(error => {
      let type = '其他';
      if (error.includes('訂單號')) type = '訂單號錯誤';
      else if (error.includes('帳號')) type = '帳號錯誤';
      else if (error.includes('送貨地址')) type = '地址錯誤';
      else if (error.includes('數量')) type = '數量錯誤';
      else if (error.includes('缺少產品')) type = '產品遺漏';
      
      errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
    });
    
    const total = allErrors.length;
    return Array.from(errorTypes.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }
}