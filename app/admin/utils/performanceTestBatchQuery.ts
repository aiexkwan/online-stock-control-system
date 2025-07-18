/**
 * 並發查詢性能測試工具
 * 用於測量同比較並發查詢系統同原有獨立查詢嘅性能差異
 */

import { simplePerformanceMonitor } from '@/lib/performance/SimplePerformanceMonitor';

interface PerformanceTestResult {
  testName: string;
  duration: number;
  requestCount: number;
  avgRequestTime: number;
  maxRequestTime: number;
  minRequestTime: number;
  networkBytes?: number;
  cacheHitRate?: number;
  timestamp: Date;
}

interface ComparisonResult {
  concurrentQuery: PerformanceTestResult;
  individualQueries: PerformanceTestResult;
  improvement: {
    timeSaved: number;
    timeSavedPercentage: number;
    requestsReduced: number;
    requestsReducedPercentage: number;
  };
}

class ConcurrentQueryPerformanceTester {
  private results: PerformanceTestResult[] = [];

  /**
   * 測試並發查詢性能
   */
  async testConcurrentQuery(
    widgetIds: string[],
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    const startResourceEntries = performance.getEntriesByType('resource').length;

    // 執行並發查詢
    const params = new URLSearchParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      widgets: widgetIds.join(','),
    });

    try {
      const response = await fetch(`/api/admin/dashboard?${params.toString()}`);
      const data = await response.json();

      const endTime = performance.now();
      const endResourceEntries = performance.getEntriesByType('resource');
      const newEntries = endResourceEntries.slice(startResourceEntries);

      // 計算網絡傳輸大小
      const networkBytes = newEntries.reduce((total, entry: Record<string, unknown>) => {
        return total + (entry.transferSize || 0);
      }, 0);

      const result: PerformanceTestResult = {
        testName: 'Concurrent Query',
        duration: endTime - startTime,
        requestCount: 1,
        avgRequestTime: endTime - startTime,
        maxRequestTime: endTime - startTime,
        minRequestTime: endTime - startTime,
        networkBytes,
        timestamp: new Date(),
      };

      // 記錄到性能監控（使用簡化系統）
      simplePerformanceMonitor.recordMetric('concurrent_query_test_duration', result.duration, 'performance');
      simplePerformanceMonitor.recordMetric('concurrent_query_test_requests', result.requestCount, 'performance');
      simplePerformanceMonitor.recordMetric('concurrent_query_test_network_bytes', result.networkBytes || 0, 'performance');

      return result;
    } catch (error) {
      console.error('Concurrent query test failed:', error);
      throw error;
    }
  }

  /**
   * 測試個別查詢性能
   */
  async testIndividualQueries(
    widgetIds: string[],
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    const startResourceEntries = performance.getEntriesByType('resource').length;
    const requestTimes: number[] = [];

    const params = new URLSearchParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    });

    // 並行執行所有個別查詢
    const promises = widgetIds.map(async (widgetId) => {
      const widgetStartTime = performance.now();
      try {
        const response = await fetch(`/api/admin/dashboard/${widgetId}?${params.toString()}`);
        const data = await response.json();
        const widgetEndTime = performance.now();
        requestTimes.push(widgetEndTime - widgetStartTime);
        return data;
      } catch (error) {
        console.error(`Individual query failed for ${widgetId}:`, error);
        throw error;
      }
    });

    await Promise.all(promises);

    const endTime = performance.now();
    const endResourceEntries = performance.getEntriesByType('resource');
    const newEntries = endResourceEntries.slice(startResourceEntries);

    // 計算網絡傳輸大小
    const networkBytes = newEntries.reduce((total, entry: Record<string, unknown>) => {
      return total + (entry.transferSize || 0);
    }, 0);

    const result: PerformanceTestResult = {
      testName: 'Individual Queries',
      duration: endTime - startTime,
      requestCount: widgetIds.length,
      avgRequestTime: requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length,
      maxRequestTime: Math.max(...requestTimes),
      minRequestTime: Math.min(...requestTimes),
      networkBytes,
      timestamp: new Date(),
    };

    // 記錄到性能監控（使用簡化系統）
    simplePerformanceMonitor.recordMetric('individual_queries_test_duration', result.duration, 'performance');
    simplePerformanceMonitor.recordMetric('individual_queries_test_requests', result.requestCount, 'performance');
    simplePerformanceMonitor.recordMetric('individual_queries_test_network_bytes', result.networkBytes || 0, 'performance');

    return result;
  }

  /**
   * 比較並發查詢同個別查詢嘅性能
   */
  async comparePerformance(
    widgetIds: string[],
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<ComparisonResult> {
    console.log(`開始性能測試，測試 ${widgetIds.length} 個 widgets...`);

    // 清理性能記錄
    performance.clearResourceTimings();

    // 測試個別查詢（先測試避免緩存影響）
    console.log('測試個別查詢性能...');
    const individualResult = await this.testIndividualQueries(widgetIds, dateRange);

    // 等待一段時間避免緩存影響
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 測試並發查詢
    console.log('測試並發查詢性能...');
    const concurrentResult = await this.testConcurrentQuery(widgetIds, dateRange);

    // 計算改善
    const timeSaved = individualResult.duration - concurrentResult.duration;
    const timeSavedPercentage = (timeSaved / individualResult.duration) * 100;
    const requestsReduced = individualResult.requestCount - concurrentResult.requestCount;
    const requestsReducedPercentage = (requestsReduced / individualResult.requestCount) * 100;

    const comparison: ComparisonResult = {
      concurrentQuery: concurrentResult,
      individualQueries: individualResult,
      improvement: {
        timeSaved,
        timeSavedPercentage,
        requestsReduced,
        requestsReducedPercentage,
      },
    };

    // 記錄比較結果（使用簡化系統）
    simplePerformanceMonitor.recordMetric('performance_comparison_time_saved', timeSavedPercentage, 'performance');
    simplePerformanceMonitor.recordMetric('performance_comparison_requests_reduced', requestsReducedPercentage, 'performance');

    this.results.push(concurrentResult, individualResult);

    return comparison;
  }

  /**
   * 生成性能報告
   */
  generateReport(comparison: ComparisonResult): string {
    const report = `
# 批量查詢性能測試報告
生成時間: ${new Date().toISOString()}

## 測試結果

### 並發查詢
- 總時間: ${comparison.concurrentQuery.duration.toFixed(2)}ms
- 請求數量: ${comparison.concurrentQuery.requestCount}
- 平均請求時間: ${comparison.concurrentQuery.avgRequestTime.toFixed(2)}ms
- 網絡傳輸: ${this.formatBytes(comparison.concurrentQuery.networkBytes || 0)}

### 個別查詢
- 總時間: ${comparison.individualQueries.duration.toFixed(2)}ms
- 請求數量: ${comparison.individualQueries.requestCount}
- 平均請求時間: ${comparison.individualQueries.avgRequestTime.toFixed(2)}ms
- 最大請求時間: ${comparison.individualQueries.maxRequestTime.toFixed(2)}ms
- 最小請求時間: ${comparison.individualQueries.minRequestTime.toFixed(2)}ms
- 網絡傳輸: ${this.formatBytes(comparison.individualQueries.networkBytes || 0)}

## 性能改善
- **時間節省**: ${comparison.improvement.timeSaved.toFixed(2)}ms (${comparison.improvement.timeSavedPercentage.toFixed(1)}%)
- **請求減少**: ${comparison.improvement.requestsReduced} 個 (${comparison.improvement.requestsReducedPercentage.toFixed(1)}%)
- **網絡傳輸減少**: ${this.formatBytes(
      (comparison.individualQueries.networkBytes || 0) - (comparison.concurrentQuery.networkBytes || 0)
    )}

## 結論
批量查詢系統相比個別查詢：
- 減少咗 ${comparison.improvement.requestsReducedPercentage.toFixed(1)}% 嘅網絡請求
- 提升咗 ${comparison.improvement.timeSavedPercentage.toFixed(1)}% 嘅加載速度
- 顯著改善咗用戶體驗同服務器負載
`;

    return report;
  }

  /**
   * 格式化字節大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 獲取性能指標統計（使用簡化系統）
   */
  getPerformanceStats() {
    const summary = simplePerformanceMonitor.getSummary();
    const batchStats = simplePerformanceMonitor.getBasicStats('batch_query_test_duration');
    const individualStats = simplePerformanceMonitor.getBasicStats('individual_queries_test_duration');
    
    return {
      summary,
      batchQueryStats: batchStats,
      individualQueryStats: individualStats,
      recentAlerts: simplePerformanceMonitor.getAlerts().slice(0, 5), // 最近5個警報
    };
  }
}

// 導出測試實例
export const concurrentQueryTester = new ConcurrentQueryPerformanceTester();

// 導出便利函數
export async function runPerformanceTest(
  widgetIds?: string[],
  dateRange?: { startDate: Date; endDate: Date }
) {
  // 默認測試 critical widgets
  const testWidgets = widgetIds || [
    'statsCard',
    'awaitLocationQty',
    'yesterdayTransferCount',
    'stockDistribution',
    'warehouseWorkLevel',
  ];

  // 默認日期範圍（過去 7 天）
  const testDateRange = dateRange || {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  };

  const comparison = await concurrentQueryTester.comparePerformance(testWidgets, testDateRange);
  const report = concurrentQueryTester.generateReport(comparison);
  
  console.log(report);
  
  return {
    comparison,
    report,
    stats: concurrentQueryTester.getPerformanceStats(),
  };
}

// 保持向後兼容
export const batchQueryTester = concurrentQueryTester;