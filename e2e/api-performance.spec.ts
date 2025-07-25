/**
 * API 性能測試套件
 * 測量 REST API 性能並生成基準報告
 */

import { test, expect } from '@playwright/test';
import { performanceBenchmark } from '@/lib/performance/performance-benchmark';
import * as fs from 'fs/promises';
import * as path from 'path';

// 性能測試配置
const PERFORMANCE_CONFIG = {
  reportPath: 'test-results/api-performance-report.json',
  markdownPath: 'test-results/api-performance-report.md',
  thresholds: {
    responseTime: {
      good: 500,
      warning: 2000,
      critical: 5000,
    },
    errorRate: {
      good: 1,
      warning: 5,
      critical: 10,
    },
  },
};

test.describe('API Performance Tests', () => {
  // 只在 chromium 上運行以確保一致性
  test.skip(({ browserName }) => browserName !== 'chromium');

  test.beforeAll(async () => {
    console.log('🚀 Initializing API performance tests...');
    performanceBenchmark.startTest();
  });

  test.afterAll(async () => {
    console.log('📊 Generating performance reports...');
    await generatePerformanceReports();
  });

  test('Dashboard API Performance Benchmark', async () => {
    console.log('📊 Testing Dashboard API performance...');

    const result = await performanceBenchmark.benchmarkDashboardAPI();

    // 驗證測試完成
    expect(result.metrics.length).toBeGreaterThan(0);
    expect(result.summary.totalTests).toBeGreaterThan(0);

    // 性能閾值檢查
    console.log(
      `Dashboard API - Avg Response Time: ${result.summary.avgResponseTime.toFixed(2)}ms`
    );
    console.log(`Dashboard API - Error Rate: ${result.summary.errorRate.toFixed(2)}%`);

    // 軟性檢查（記錄但不失敗）
    if (result.summary.avgResponseTime > PERFORMANCE_CONFIG.thresholds.responseTime.critical) {
      console.warn(
        `⚠️ Dashboard API response time (${result.summary.avgResponseTime}ms) exceeds critical threshold`
      );
    }

    if (result.summary.errorRate > PERFORMANCE_CONFIG.thresholds.errorRate.critical) {
      console.warn(
        `⚠️ Dashboard API error rate (${result.summary.errorRate}%) exceeds critical threshold`
      );
    }

    // 檢查基本功能
    expect(result.testName).toBe('Dashboard API Benchmark');
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  test('Inventory Analysis API Performance Benchmark', async () => {
    console.log('📈 Testing Inventory Analysis API performance...');

    const result = await performanceBenchmark.benchmarkInventoryAPI();

    // 驗證測試完成
    expect(result.metrics.length).toBeGreaterThan(0);
    expect(result.summary.totalTests).toBeGreaterThan(0);

    // 性能指標記錄
    console.log(
      `Inventory API - Avg Response Time: ${result.summary.avgResponseTime.toFixed(2)}ms`
    );
    console.log(`Inventory API - Error Rate: ${result.summary.errorRate.toFixed(2)}%`);

    // 檢查是否有 filtering 性能測試
    const filteringMetrics = result.metrics.filter(m => m.endpoint.includes('filtering'));
    if (filteringMetrics.length > 0) {
      const avgFilteringTime =
        filteringMetrics.reduce((sum, m) => sum + m.responseTime, 0) / filteringMetrics.length;
      console.log(`Client-side Filtering - Avg Time: ${avgFilteringTime.toFixed(2)}ms`);

      if (avgFilteringTime > 1000) {
        console.warn('⚠️ Client-side filtering time suggests server-side optimization needed');
      }
    }

    expect(result.testName).toBe('Inventory Analysis API Benchmark');
    expect(result.recommendations).toBeDefined();
  });

  test('Comprehensive Performance Analysis', async () => {
    console.log('🔍 Running comprehensive performance analysis...');

    const report = await performanceBenchmark.generateComprehensiveReport();

    // 驗證報告完整性
    expect(report.dashboard).toBeDefined();
    expect(report.inventory).toBeDefined();
    expect(report.overallRecommendations).toBeDefined();
    expect(report.performanceGrade).toMatch(/^[ABCDF]$/);

    console.log(`📊 Overall Performance Grade: ${report.performanceGrade}`);
    console.log(`📈 Dashboard Tests: ${report.dashboard.summary.totalTests}`);
    console.log(`📈 Inventory Tests: ${report.inventory.summary.totalTests}`);

    // 性能等級警告
    if (report.performanceGrade === 'D' || report.performanceGrade === 'F') {
      console.warn(
        `⚠️ Performance grade ${report.performanceGrade} indicates significant optimization needed`
      );
    }

    // 檢查建議數量
    expect(report.overallRecommendations.length).toBeGreaterThan(0);

    // 存儲報告供後續使用
    (global as any).performanceReport = report;
  });

  test('Performance Monitoring Integration', async () => {
    console.log('🔧 Testing performance monitoring integration...');

    // 測試性能監控功能
    const testMetrics = await performanceBenchmark.measureAPICall(
      'test-endpoint',
      async () => {
        // 模擬 API 調用
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        return { data: 'test' };
      },
      1
    );

    expect(testMetrics).toBeDefined();

    // 驗證匯出功能
    const exportData = performanceBenchmark.exportResults();
    expect(exportData).toBeDefined();
    expect(typeof exportData).toBe('string');

    // 驗證 JSON 格式
    const parsedData = JSON.parse(exportData);
    expect(parsedData.timestamp).toBeDefined();
    expect(parsedData.results).toBeDefined();
    expect(parsedData.summary).toBeDefined();
  });
});

/**
 * 生成詳細的性能報告
 */
async function generatePerformanceReports(): Promise<void> {
  try {
    // 獲取綜合報告
    const report =
      (global as any).performanceReport ||
      (await performanceBenchmark.generateComprehensiveReport());

    // 創建報告目錄
    const reportDir = path.dirname(PERFORMANCE_CONFIG.reportPath);
    await fs.mkdir(reportDir, { recursive: true });

    // 生成 JSON 報告
    const jsonReport = {
      timestamp: new Date().toISOString(),
      performanceGrade: report.performanceGrade,
      dashboard: report.dashboard,
      inventory: report.inventory,
      overallRecommendations: report.overallRecommendations,
      systemInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        timestamp: Date.now(),
      },
    };

    await fs.writeFile(PERFORMANCE_CONFIG.reportPath, JSON.stringify(jsonReport, null, 2));

    // 生成 Markdown 報告
    const markdownReport = generateMarkdownReport(jsonReport);
    await fs.writeFile(PERFORMANCE_CONFIG.markdownPath, markdownReport);

    console.log(`📄 Performance reports saved:`);
    console.log(`   JSON: ${PERFORMANCE_CONFIG.reportPath}`);
    console.log(`   Markdown: ${PERFORMANCE_CONFIG.markdownPath}`);
  } catch (error) {
    console.error('Failed to generate performance reports:', error);
  }
}

/**
 * 生成 Markdown 格式的性能報告
 */
function generateMarkdownReport(report: any): string {
  const grade = report.performanceGrade;
  const gradeEmoji =
    {
      A: '🏆',
      B: '✅',
      C: '⚠️',
      D: '❌',
      F: '🚨',
    }[grade] || '❓';

  return `# 🚀 API 性能基準測試報告

## 📊 整體評級
**性能等級**: ${gradeEmoji} **${grade}** 

## 測試概要
- **測試時間**: ${report.timestamp}
- **Dashboard API 測試**: ${report.dashboard.summary.totalTests} 次
- **Inventory API 測試**: ${report.inventory.summary.totalTests} 次

## 📈 Dashboard API 性能分析

### 關鍵指標
- **平均響應時間**: ${report.dashboard.summary.avgResponseTime.toFixed(2)}ms
- **95% 響應時間**: ${report.dashboard.summary.p95ResponseTime.toFixed(2)}ms
- **最大響應時間**: ${report.dashboard.summary.maxResponseTime.toFixed(2)}ms
- **錯誤率**: ${report.dashboard.summary.errorRate.toFixed(2)}%

### 性能狀態
${getPerformanceStatus(report.dashboard.summary.avgResponseTime, report.dashboard.summary.errorRate)}

### Dashboard 優化建議
${report.dashboard.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## 📊 Inventory Analysis API 性能分析

### 關鍵指標
- **平均響應時間**: ${report.inventory.summary.avgResponseTime.toFixed(2)}ms
- **95% 響應時間**: ${report.inventory.summary.p95ResponseTime.toFixed(2)}ms
- **最大響應時間**: ${report.inventory.summary.maxResponseTime.toFixed(2)}ms
- **錯誤率**: ${report.inventory.summary.errorRate.toFixed(2)}%

### 性能狀態
${getPerformanceStatus(report.inventory.summary.avgResponseTime, report.inventory.summary.errorRate)}

### Inventory 優化建議
${report.inventory.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## 🎯 整體優化建議

${report.overallRecommendations.join('\n')}

## 📋 性能閾值參考

| 指標 | 優秀 | 警告 | 嚴重 |
|------|------|------|------|
| 響應時間 | < 500ms | < 2s | < 5s |
| 錯誤率 | < 1% | < 5% | < 10% |

## 🔄 後續行動

### 立即處理 (1週內)
${
  grade === 'D' || grade === 'F'
    ? `- 🚨 **緊急**: 性能等級為 ${grade}，需要立即優化
- 🔍 識別最慢的 API 端點
- ⚡ 實施基本緩存機制`
    : `- 📊 建立持續性能監控
- 🔧 優化識別的性能瓶頸`
}

### 中期優化 (2-4週)
- 📈 實施批量查詢優化
- 🏪 建立多層次緩存系統
- 🔄 遷移客戶端處理至服務器端

### 長期策略 (1-3個月)
- 🚀 評估 GraphQL 遷移價值
- 📊 建立 APM 監控系統
- 🎯 設定性能 SLA 指標

---

**報告生成時間**: ${new Date().toISOString()}
**測試環境**: ${report.systemInfo.userAgent}
**文檔版本**: 1.0
`;
}

/**
 * 根據性能指標生成狀態描述
 */
function getPerformanceStatus(avgResponseTime: number, errorRate: number): string {
  if (avgResponseTime < 500 && errorRate < 1) {
    return '🏆 **優秀** - 性能表現卓越';
  } else if (avgResponseTime < 1000 && errorRate < 3) {
    return '✅ **良好** - 性能表現令人滿意';
  } else if (avgResponseTime < 2000 && errorRate < 5) {
    return '⚠️ **普通** - 性能有改進空間';
  } else if (avgResponseTime < 5000 && errorRate < 10) {
    return '❌ **需要改進** - 性能問題明顯';
  } else {
    return '🚨 **嚴重** - 需要立即優化';
  }
}
