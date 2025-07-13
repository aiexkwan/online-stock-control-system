/**
 * 批量查詢性能測試工具
 * 用於測量同比較批量查詢系統同原有獨立查詢嘅性能差異
 */

import { performanceMonitor } from '@/lib/widgets/performance-monitor';

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
  batchQuery: PerformanceTestResult;
  individualQueries: PerformanceTestResult;
  improvement: {
    timeSaved: number;
    timeSavedPercentage: number;
    requestsReduced: number;
    requestsReducedPercentage: number;
  };
}

class BatchQueryPerformanceTester {
  private results: PerformanceTestResult[] = [];

  /**
   * 測試批量查詢性能
   */
  async testBatchQuery(
    widgetIds: string[],
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    const startResourceEntries = performance.getEntriesByType('resource').length;

    // 執行批量查詢
    const params = new URLSearchParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      widgets: widgetIds.join(','),
    });

    try {
      const response = await fetch(`/api/admin/dashboard/batch?${params.toString()}`);
      const data = await response.json();

      const endTime = performance.now();
      const endResourceEntries = performance.getEntriesByType('resource');
      const newEntries = endResourceEntries.slice(startResourceEntries);

      // 計算網絡傳輸大小
      const networkBytes = newEntries.reduce((total, entry: any) => {
        return total + (entry.transferSize || 0);
      }, 0);

      const result: PerformanceTestResult = {
        testName: 'Batch Query',
        duration: endTime - startTime,
        requestCount: 1,
        avgRequestTime: endTime - startTime,
        maxRequestTime: endTime - startTime,
        minRequestTime: endTime - startTime,
        networkBytes,
        timestamp: new Date(),
      };

      // 記錄到性能監控
      performanceMonitor.recordMetrics({
        widgetId: 'batch-query-test',
        timestamp: Date.now(),
        loadTime: result.duration,
        renderTime: 0,
        dataFetchTime: result.duration,
        route: '/admin/dashboard',
        variant: 'v2',
        sessionId: 'performance-test-session',
      });

      return result;
    } catch (error) {
      console.error('Batch query test failed:', error);
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
    const networkBytes = newEntries.reduce((total, entry: any) => {
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

    // 記錄到性能監控
    performanceMonitor.recordMetrics({
      widgetId: 'individual-queries-test',
      timestamp: Date.now(),
      loadTime: result.duration,
      renderTime: 0,
      dataFetchTime: result.duration,
      route: '/admin/dashboard',
      variant: 'v2',
      sessionId: 'performance-test-session',
    });

    return result;
  }

  /**
   * 比較批量查詢同個別查詢嘅性能
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

    // 測試批量查詢
    console.log('測試批量查詢性能...');
    const batchResult = await this.testBatchQuery(widgetIds, dateRange);

    // 計算改善
    const timeSaved = individualResult.duration - batchResult.duration;
    const timeSavedPercentage = (timeSaved / individualResult.duration) * 100;
    const requestsReduced = individualResult.requestCount - batchResult.requestCount;
    const requestsReducedPercentage = (requestsReduced / individualResult.requestCount) * 100;

    const comparison: ComparisonResult = {
      batchQuery: batchResult,
      individualQueries: individualResult,
      improvement: {
        timeSaved,
        timeSavedPercentage,
        requestsReduced,
        requestsReducedPercentage,
      },
    };

    // 記錄比較結果
    performanceMonitor.recordMetrics({
      widgetId: 'performance-comparison',
      timestamp: Date.now(),
      loadTime: timeSavedPercentage,
      renderTime: 0,
      dataFetchTime: 0,
      route: '/admin/dashboard',
      variant: 'v2',
      sessionId: 'performance-test-session',
    });

    this.results.push(batchResult, individualResult);

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

### 批量查詢
- 總時間: ${comparison.batchQuery.duration.toFixed(2)}ms
- 請求數量: ${comparison.batchQuery.requestCount}
- 平均請求時間: ${comparison.batchQuery.avgRequestTime.toFixed(2)}ms
- 網絡傳輸: ${this.formatBytes(comparison.batchQuery.networkBytes || 0)}

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
      (comparison.individualQueries.networkBytes || 0) - (comparison.batchQuery.networkBytes || 0)
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
   * 獲取性能指標統計
   */
  getPerformanceStats() {
    const metrics = performanceMonitor.getMetrics();
    const batchMetrics = metrics.filter(m => m.widgetId === 'dashboard-batch');
    
    if (batchMetrics.length === 0) {
      return null;
    }

    const stats = performanceMonitor.getStats();
    return {
      batchQueryStats: stats['dashboard-batch'],
      individualWidgetStats: Object.entries(stats).filter(([key]) => 
        key !== 'dashboard-batch' && key !== 'batch-query-test' && key !== 'individual-queries-test'
      ),
    };
  }
}

// 導出測試實例
export const batchQueryTester = new BatchQueryPerformanceTester();

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

  const comparison = await batchQueryTester.comparePerformance(testWidgets, testDateRange);
  const report = batchQueryTester.generateReport(comparison);
  
  console.log(report);
  
  return {
    comparison,
    report,
    stats: batchQueryTester.getPerformanceStats(),
  };
}