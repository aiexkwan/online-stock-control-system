/**
 * 自定義 A11y 測試報告器
 * 
 * 基於專家協作方案的報告系統：
 * - 系統架構專家：可擴展的報告架構
 * - Backend工程師：資料完整性和安全性
 * - 優化專家：高效的報告生成
 * - QA專家：全面的測試覆蓋率報告
 */

import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface A11yViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
}

interface A11yTestReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
    timestamp: string;
  };
  wcagCompliance: {
    perceivable: {
      passed: number;
      failed: number;
      violations: A11yViolation[];
    };
    operable: {
      passed: number;
      failed: number;
      violations: A11yViolation[];
    };
    understandable: {
      passed: number;
      failed: number;
      violations: A11yViolation[];
    };
    robust: {
      passed: number;
      failed: number;
      violations: A11yViolation[];
    };
  };
  performanceMetrics: {
    averageTestDuration: number;
    totalA11yCheckTime: number;
    slowestTest: string;
    fastestTest: string;
  };
  detailedResults: Array<{
    testName: string;
    url: string;
    status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
    duration: number;
    violations: A11yViolation[];
    wcagScore: number;
  }>;
}

export default class A11yReporter implements Reporter {
  private testResults: Array<{
    testName: string;
    url: string;
    status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
    duration: number;
    violations: A11yViolation[];
    wcagScore: number;
  }> = [];
  
  private startTime: number = Date.now();
  private outputDir: string;

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || 'test-results/a11y';
    
    // 確保輸出目錄存在
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // 提取 A11y 測試結果
    const violations = this.extractA11yViolations(result);
    const wcagScore = this.calculateWCAGScore(violations);
    
    // 提取 URL 從測試名稱或附件
    const url = this.extractUrlFromTest(test);
    
    this.testResults.push({
      testName: test.title,
      url,
      status: result.status,
      duration: result.duration,
      violations,
      wcagScore,
    });
  }

  onEnd(result: FullResult) {
    const report = this.generateReport(result);
    
    // 生成 JSON 報告
    this.writeJsonReport(report);
    
    // 生成 HTML 報告
    this.writeHtmlReport(report);
    
    // 生成 CSV 報告
    this.writeCsvReport(report);
    
    // 輸出控制台摘要
    this.printConsoleSummary(report);
  }

  private extractA11yViolations(result: TestResult): A11yViolation[] {
    const violations: A11yViolation[] = [];
    
    // 從測試錯誤中提取 A11y 違規
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        if (error.message && error.message.includes('axe')) {
          try {
            // 嘗試解析 axe 結果
            const axeMatch = error.message!.match(/violations: (\[.*\])/);
            if (axeMatch) {
              const axeViolations = JSON.parse(axeMatch[1]);
              violations.push(...axeViolations);
            }
          } catch (e) {
            // 如果解析失敗，創建一個通用違規
            violations.push({
              id: 'unknown',
              impact: 'moderate' as const,
              description: error.message || 'Unknown error',
              help: 'Unknown accessibility violation',
              helpUrl: '',
              tags: [],
              nodes: [],
            });
          }
        }
      });
    }
    
    return violations;
  }

  private calculateWCAGScore(violations: A11yViolation[]): number {
    if (violations.length === 0) return 100;
    
    // 根據違規嚴重程度計算分數
    const impactWeights = {
      critical: 25,
      serious: 15,
      moderate: 10,
      minor: 5,
    };
    
    const totalPenalty = violations.reduce((sum, violation) => {
      return sum + impactWeights[violation.impact];
    }, 0);
    
    return Math.max(0, 100 - totalPenalty);
  }

  private extractUrlFromTest(test: TestCase): string {
    // 嘗試從測試標題中提取 URL
    const urlMatch = test.title.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
    
    // 如果沒有找到，返回測試檔案名稱
    return test.location.file;
  }

  private generateReport(result: FullResult): A11yTestReport {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const skippedTests = this.testResults.filter(t => t.status === 'skipped').length;
    
    // 按 WCAG 原則分類違規
    const wcagCompliance = this.categorizeViolationsByWCAG();
    
    // 計算性能指標
    const performanceMetrics = this.calculatePerformanceMetrics();
    
    return {
      summary: {
        totalTests: this.testResults.length,
        passedTests,
        failedTests,
        skippedTests,
        duration,
        timestamp: new Date().toISOString(),
      },
      wcagCompliance,
      performanceMetrics,
      detailedResults: this.testResults,
    };
  }

  private categorizeViolationsByWCAG() {
    const categories = {
      perceivable: { passed: 0, failed: 0, violations: [] as A11yViolation[] },
      operable: { passed: 0, failed: 0, violations: [] as A11yViolation[] },
      understandable: { passed: 0, failed: 0, violations: [] as A11yViolation[] },
      robust: { passed: 0, failed: 0, violations: [] as A11yViolation[] },
    };
    
    // WCAG 原則標籤映射
    const principleTagMap = {
      perceivable: ['wcag111', 'wcag121', 'wcag131', 'wcag141', 'wcag143'],
      operable: ['wcag211', 'wcag212', 'wcag221', 'wcag241', 'wcag245'],
      understandable: ['wcag311', 'wcag312', 'wcag321', 'wcag331'],
      robust: ['wcag411', 'wcag412'],
    };
    
    this.testResults.forEach(test => {
      test.violations.forEach(violation => {
        let categorized = false;
        
        // 根據標籤分類違規
        Object.entries(principleTagMap).forEach(([principle, tags]) => {
          if (tags.some(tag => violation.tags.includes(tag))) {
            categories[principle as keyof typeof categories].violations.push(violation);
            categories[principle as keyof typeof categories].failed++;
            categorized = true;
          }
        });
        
        // 如果沒有分類，根據規則 ID 推斷
        if (!categorized) {
          if (violation.id.includes('color') || violation.id.includes('contrast')) {
            categories.perceivable.violations.push(violation);
            categories.perceivable.failed++;
          } else if (violation.id.includes('keyboard') || violation.id.includes('focus')) {
            categories.operable.violations.push(violation);
            categories.operable.failed++;
          } else if (violation.id.includes('label') || violation.id.includes('heading')) {
            categories.understandable.violations.push(violation);
            categories.understandable.failed++;
          } else if (violation.id.includes('aria') || violation.id.includes('role')) {
            categories.robust.violations.push(violation);
            categories.robust.failed++;
          }
        }
      });
      
      // 計算通過的測試
      if (test.status === 'passed') {
        Object.keys(categories).forEach(key => {
          categories[key as keyof typeof categories].passed++;
        });
      }
    });
    
    return categories;
  }

  private calculatePerformanceMetrics() {
    const durations = this.testResults.map(t => t.duration);
    const averageTestDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const slowestTest = this.testResults.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
    
    const fastestTest = this.testResults.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );
    
    return {
      averageTestDuration,
      totalA11yCheckTime: durations.reduce((sum, d) => sum + d, 0),
      slowestTest: slowestTest.testName,
      fastestTest: fastestTest.testName,
    };
  }

  private writeJsonReport(report: A11yTestReport) {
    const filePath = join(this.outputDir, 'a11y-report.json');
    writeFileSync(filePath, JSON.stringify(report, null, 2));
  }

  private writeHtmlReport(report: A11yTestReport) {
    const html = this.generateHtmlReport(report);
    const filePath = join(this.outputDir, 'a11y-report.html');
    writeFileSync(filePath, html);
  }

  private writeCsvReport(report: A11yTestReport) {
    const csvData = this.generateCsvReport(report);
    const filePath = join(this.outputDir, 'a11y-report.csv');
    writeFileSync(filePath, csvData);
  }

  private generateHtmlReport(report: A11yTestReport): string {
    const passRate = (report.summary.passedTests / report.summary.totalTests * 100).toFixed(1);
    const avgScore = (report.detailedResults.reduce((sum, r) => sum + r.wcagScore, 0) / report.detailedResults.length).toFixed(1);
    
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A11y 測試報告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .metric-label { font-size: 0.9em; color: #666; }
        .section { margin: 20px 0; }
        .wcag-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .wcag-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .wcag-title { font-weight: bold; margin-bottom: 10px; }
        .violation { background: #ffebee; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .violation-critical { border-left: 4px solid #f44336; }
        .violation-serious { border-left: 4px solid #ff9800; }
        .violation-moderate { border-left: 4px solid #ffeb3b; }
        .violation-minor { border-left: 4px solid #4caf50; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-passed { color: #4caf50; font-weight: bold; }
        .status-failed { color: #f44336; font-weight: bold; }
        .status-skipped { color: #ff9800; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 A11y 測試報告</h1>
        <p>生成時間: ${new Date(report.summary.timestamp).toLocaleString('zh-TW')}</p>
        
        <div class="metric">
            <div class="metric-value">${report.summary.totalTests}</div>
            <div class="metric-label">總測試數</div>
        </div>
        
        <div class="metric">
            <div class="metric-value">${passRate}%</div>
            <div class="metric-label">通過率</div>
        </div>
        
        <div class="metric">
            <div class="metric-value">${avgScore}</div>
            <div class="metric-label">平均分數</div>
        </div>
        
        <div class="metric">
            <div class="metric-value">${(report.summary.duration / 1000).toFixed(1)}s</div>
            <div class="metric-label">執行時間</div>
        </div>
    </div>

    <div class="section">
        <h2>📊 WCAG 2.1 AA 合規性</h2>
        <div class="wcag-grid">
            ${Object.entries(report.wcagCompliance).map(([principle, data]) => `
                <div class="wcag-card">
                    <div class="wcag-title">${this.translatePrinciple(principle)}</div>
                    <p>通過: ${data.passed} | 失敗: ${data.failed}</p>
                    <p>違規數: ${data.violations.length}</p>
                    ${data.violations.slice(0, 3).map(v => `
                        <div class="violation violation-${v.impact}">
                            <strong>${v.id}</strong>: ${v.description}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>⚡ 性能指標</h2>
        <ul>
            <li>平均測試時間: ${(report.performanceMetrics.averageTestDuration / 1000).toFixed(2)}s</li>
            <li>總 A11y 檢查時間: ${(report.performanceMetrics.totalA11yCheckTime / 1000).toFixed(2)}s</li>
            <li>最慢測試: ${report.performanceMetrics.slowestTest}</li>
            <li>最快測試: ${report.performanceMetrics.fastestTest}</li>
        </ul>
    </div>

    <div class="section">
        <h2>📋 詳細結果</h2>
        <table>
            <thead>
                <tr>
                    <th>測試名稱</th>
                    <th>URL</th>
                    <th>狀態</th>
                    <th>分數</th>
                    <th>時間</th>
                    <th>違規數</th>
                </tr>
            </thead>
            <tbody>
                ${report.detailedResults.map(result => `
                    <tr>
                        <td>${result.testName}</td>
                        <td>${result.url}</td>
                        <td class="status-${result.status}">${result.status.toUpperCase()}</td>
                        <td>${result.wcagScore}</td>
                        <td>${(result.duration / 1000).toFixed(2)}s</td>
                        <td>${result.violations.length}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
    `;
  }

  private generateCsvReport(report: A11yTestReport): string {
    const headers = ['測試名稱', 'URL', '狀態', 'WCAG分數', '時間(秒)', '違規數', '違規詳情'];
    const rows = report.detailedResults.map(result => [
      result.testName,
      result.url,
      result.status,
      result.wcagScore.toString(),
      (result.duration / 1000).toFixed(2),
      result.violations.length.toString(),
      result.violations.map(v => `${v.id}(${v.impact})`).join(';')
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private translatePrinciple(principle: string): string {
    const translations = {
      perceivable: '🎯 可感知性',
      operable: '⚡ 可操作性',
      understandable: '📚 可理解性',
      robust: '🛡️ 強健性',
    };
    
    return translations[principle as keyof typeof translations] || principle;
  }

  private printConsoleSummary(report: A11yTestReport) {
    console.log('\n🌟 A11y 測試報告摘要');
    console.log('================================');
    console.log(`總測試數: ${report.summary.totalTests}`);
    console.log(`通過: ${report.summary.passedTests}`);
    console.log(`失敗: ${report.summary.failedTests}`);
    console.log(`跳過: ${report.summary.skippedTests}`);
    console.log(`執行時間: ${(report.summary.duration / 1000).toFixed(1)}s`);
    
    const avgScore = (report.detailedResults.reduce((sum, r) => sum + r.wcagScore, 0) / report.detailedResults.length).toFixed(1);
    console.log(`平均 WCAG 分數: ${avgScore}`);
    
    console.log('\n📊 WCAG 原則合規性:');
    Object.entries(report.wcagCompliance).forEach(([principle, data]) => {
      console.log(`${this.translatePrinciple(principle)}: ${data.passed} 通過, ${data.failed} 失敗`);
    });
    
    console.log('\n📁 報告檔案:');
    console.log(`- JSON: ${join(this.outputDir, 'a11y-report.json')}`);
    console.log(`- HTML: ${join(this.outputDir, 'a11y-report.html')}`);
    console.log(`- CSV: ${join(this.outputDir, 'a11y-report.csv')}`);
  }
}