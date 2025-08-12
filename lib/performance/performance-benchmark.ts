/**
 * 性能基準測試工具
 * 用於測量和比較 REST API 性能
 */

import {
  BenchmarkTest,
  PerformanceSummary,
  hasMemoryAPI,
  isJSONSerializable,
  PerformanceWithMemory,
} from '@/lib/types/performance.types';

export interface PerformanceMetrics {
  endpoint: string;
  responseTime: number;
  payloadSize: number;
  memoryUsage: number;
  networkRequests: number;
  dbQueries: number;
  timestamp: number;
  userAgent?: string;
  errorCount: number;
}

export interface BenchmarkResult {
  testName: string;
  metrics: PerformanceMetrics[];
  summary: {
    avgResponseTime: number;
    p95ResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    totalTests: number;
    errorRate: number;
  };
  recommendations: string[];
}

export class PerformanceBenchmark {
  private results: PerformanceMetrics[] = [];
  private testStartTime: number = 0;

  /**
   * 開始性能測試
   */
  startTest(): void {
    this.testStartTime = performance.now();
    this.results = [];
  }

  /**
   * 記錄 API 調用性能
   */
  async measureAPICall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    expectedDbQueries: number = 1
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    let result: T | undefined;
    let errorCount = 0;

    try {
      result = await apiCall();
    } catch (error) {
      errorCount = 1;
      throw error;
    } finally {
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metrics: PerformanceMetrics = {
        endpoint,
        responseTime: endTime - startTime,
        payloadSize: result ? this.calculatePayloadSize(result) : 0,
        memoryUsage: endMemory.used - startMemory.used,
        networkRequests: 1, // 假設單一網絡請求
        dbQueries: expectedDbQueries,
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        errorCount,
      };

      this.results.push(metrics);
    }

    if (result === undefined) {
      throw new Error('API call failed and result is undefined');
    }
    return result;
  }

  /**
   * 批量測試多個 API 端點
   */
  async runBenchmarkSuite<T = unknown>(tests: Array<BenchmarkTest<T>>): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const test of tests) {
      console.log(`Running benchmark: ${test.name}...`);

      const iterations = test.iterations || 5;
      const testMetrics: PerformanceMetrics[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          await this.measureAPICall(test.endpoint, test.apiCall, test.expectedDbQueries);
        } catch (error) {
          console.error(`Test ${test.name} iteration ${i + 1} failed:`, error);
        }
      }

      // 收集此測試的所有指標
      const currentTestMetrics = this.results.filter(metric => metric.endpoint === test.endpoint);

      const summary = this.calculateSummary(currentTestMetrics);
      const recommendations = this.generateRecommendations(currentTestMetrics, summary);

      results.push({
        testName: test.name,
        metrics: currentTestMetrics,
        summary,
        recommendations,
      });
    }

    return results;
  }

  /**
   * Dashboard API 專用基準測試
   */
  async benchmarkDashboardAPI(): Promise<BenchmarkResult> {
    const { createDashboardAPI } = await import('@/lib/api/admin/DashboardAPI');
    const dashboardAPI = createDashboardAPI();

    const testCases = [
      {
        name: 'Dashboard - 5 Widgets',
        widgetIds: [
          'total_pallets',
          'today_transfers',
          'active_products',
          'pending_orders',
          'await_location_count',
        ],
        expectedQueries: 5,
      },
      {
        name: 'Dashboard - 10 Widgets',
        widgetIds: [
          'total_pallets',
          'today_transfers',
          'active_products',
          'pending_orders',
          'await_location_count',
          'top_products',
          'production_details',
          'stock_distribution_chart',
          'production_stats',
          'stock_level_history',
        ],
        expectedQueries: 10,
      },
    ];

    const allMetrics: PerformanceMetrics[] = [];

    for (const testCase of testCases) {
      for (let i = 0; i < 3; i++) {
        await this.measureAPICall(
          `dashboard-${testCase.widgetIds.length}-widgets`,
          () => dashboardAPI.serverFetch({ widgetIds: testCase.widgetIds }),
          testCase.expectedQueries
        );
      }
    }

    const dashboardMetrics = this.results.filter(m => m.endpoint.startsWith('dashboard-'));
    const summary = this.calculateSummary(dashboardMetrics);
    const recommendations = this.generateDashboardRecommendations(dashboardMetrics, summary);

    return {
      testName: 'Dashboard API Benchmark',
      metrics: dashboardMetrics,
      summary,
      recommendations,
    };
  }

  /**
   * Inventory Analysis API 基準測試
   */
  async benchmarkInventoryAPI(): Promise<BenchmarkResult> {
    const { inventoryAnalysisAPI } = await import('@/lib/api/inventory/InventoryAnalysisAPI');

    const testMetrics: PerformanceMetrics[] = [];

    // 測試基本數據獲取
    for (let i = 0; i < 3; i++) {
      await this.measureAPICall(
        'inventory-analysis-fetch',
        () => inventoryAnalysisAPI.getInventoryOrderedAnalysis(),
        1
      );
    }

    // 模擬客戶端處理
    const analysisData = await inventoryAnalysisAPI.getInventoryOrderedAnalysis();
    if (analysisData && analysisData.products) {
      for (let i = 0; i < 3; i++) {
        await this.measureAPICall(
          'inventory-analysis-filtering',
          () =>
            Promise.resolve(
              inventoryAnalysisAPI.applyFilters(analysisData.products, {
                showInsufficientOnly: true,
                minFulfillmentRate: 50,
              })
            ),
          0 // 客戶端處理無數據庫查詢
        );
      }
    }

    const inventoryMetrics = this.results.filter(m => m.endpoint.startsWith('inventory-'));
    const summary = this.calculateSummary(inventoryMetrics);
    const recommendations = this.generateInventoryRecommendations(inventoryMetrics, summary);

    return {
      testName: 'Inventory Analysis API Benchmark',
      metrics: inventoryMetrics,
      summary,
      recommendations,
    };
  }

  /**
   * 生成綜合基準報告
   */
  async generateComprehensiveReport(): Promise<{
    dashboard: BenchmarkResult;
    inventory: BenchmarkResult;
    overallRecommendations: string[];
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  }> {
    console.log('🚀 Starting comprehensive performance benchmark...');

    const dashboard = await this.benchmarkDashboardAPI();
    console.log('✅ Dashboard API benchmark completed');

    const inventory = await this.benchmarkInventoryAPI();
    console.log('✅ Inventory API benchmark completed');

    const overallRecommendations = this.generateOverallRecommendations([dashboard, inventory]);
    const performanceGrade = this.calculatePerformanceGrade([dashboard, inventory]);

    console.log(`📊 Overall Performance Grade: ${performanceGrade}`);

    return {
      dashboard,
      inventory,
      overallRecommendations,
      performanceGrade,
    };
  }

  /**
   * 計算測試摘要統計
   */
  private calculateSummary(metrics: PerformanceMetrics[]) {
    if (metrics.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        totalTests: 0,
        errorRate: 0,
      };
    }

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errorCount = metrics.reduce((sum, m) => sum + m.errorCount, 0);

    return {
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      totalTests: metrics.length,
      errorRate: (errorCount / metrics.length) * 100,
    };
  }

  /**
   * 生成基本優化建議
   */
  private generateRecommendations(
    metrics: PerformanceMetrics[],
    summary: PerformanceSummary
  ): string[] {
    const recommendations: string[] = [];

    if (summary.avgResponseTime > 2000) {
      recommendations.push('⚠️ 平均響應時間超過 2 秒，建議優化數據庫查詢或加入緩存');
    }

    if (summary.p95ResponseTime > 5000) {
      recommendations.push('🚨 95% 響應時間超過 5 秒，需要立即優化');
    }

    if (summary.errorRate > 5) {
      recommendations.push('❌ 錯誤率超過 5%，需要改善錯誤處理');
    }

    const avgDbQueries = metrics.reduce((sum, m) => sum + m.dbQueries, 0) / metrics.length;
    if (avgDbQueries > 5) {
      recommendations.push('🔍 平均數據庫查詢數過多，建議實施批量查詢或緩存');
    }

    return recommendations.length > 0 ? recommendations : ['✅ 性能表現良好'];
  }

  /**
   * Dashboard 專用建議
   */
  private generateDashboardRecommendations(
    metrics: PerformanceMetrics[],
    summary: PerformanceSummary
  ): string[] {
    const recommendations = this.generateRecommendations(metrics, summary);

    // Dashboard 特定建議
    const widgetMetrics = metrics.filter(m => m.endpoint.includes('dashboard'));
    if (widgetMetrics.length > 0) {
      const avgTimePerWidget = summary.avgResponseTime / 5; // 假設 5 個 widgets
      if (avgTimePerWidget > 400) {
        recommendations.push('📊 建議實施 Widget 批量載入優化，減少並行查詢數量');
      }
    }

    return recommendations;
  }

  /**
   * Inventory 專用建議
   */
  private generateInventoryRecommendations(
    metrics: PerformanceMetrics[],
    summary: PerformanceSummary
  ): string[] {
    const recommendations = this.generateRecommendations(metrics, summary);

    // Inventory 特定建議
    const filteringMetrics = metrics.filter(m => m.endpoint.includes('filtering'));
    if (filteringMetrics.length > 0 && filteringMetrics[0].responseTime > 500) {
      recommendations.push('🔄 建議將 filtering 邏輯遷移至服務器端，減少客戶端處理時間');
    }

    return recommendations;
  }

  /**
   * 生成整體建議
   */
  private generateOverallRecommendations(results: BenchmarkResult[]): string[] {
    const allMetrics = results.flatMap(r => r.metrics);
    const overallSummary = this.calculateSummary(allMetrics);

    const recommendations: string[] = ['## 🎯 整體優化建議', '', '### 高優先級'];

    if (overallSummary.avgResponseTime > 2000) {
      recommendations.push('1. **實施 API 響應時間監控**，設置警告閾值');
      recommendations.push('2. **引入多層次緩存機制**，減少重複查詢');
    }

    if (overallSummary.errorRate > 3) {
      recommendations.push('3. **改善錯誤處理機制**，提高系統穩定性');
    }

    recommendations.push('', '### 中長期優化');
    recommendations.push('4. **考慮 GraphQL 遷移**，解決 N+1 查詢問題');
    recommendations.push('5. **實施請求批量處理**，減少網絡往返次數');

    return recommendations;
  }

  /**
   * 計算整體性能等級
   */
  private calculatePerformanceGrade(results: BenchmarkResult[]): 'A' | 'B' | 'C' | 'D' | 'F' {
    const allMetrics = results.flatMap(r => r.metrics);
    const summary = this.calculateSummary(allMetrics);

    if (summary.avgResponseTime < 500 && summary.errorRate < 1) return 'A';
    if (summary.avgResponseTime < 1000 && summary.errorRate < 3) return 'B';
    if (summary.avgResponseTime < 2000 && summary.errorRate < 5) return 'C';
    if (summary.avgResponseTime < 5000 && summary.errorRate < 10) return 'D';
    return 'F';
  }

  /**
   * 獲取記憶體使用情況
   */
  private getMemoryUsage(): { used: number; total: number } {
    if (typeof window !== 'undefined' && hasMemoryAPI(performance as PerformanceWithMemory)) {
      const memory = (performance as PerformanceWithMemory).memory!;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
      };
    }

    // Node.js 環境
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      return {
        used: memory.heapUsed,
        total: memory.heapTotal,
      };
    }

    return { used: 0, total: 0 };
  }

  /**
   * 計算 payload 大小
   */
  private calculatePayloadSize(data: unknown): number {
    try {
      if (!isJSONSerializable(data)) {
        console.warn('Data is not JSON serializable, using fallback size calculation');
        return String(data).length;
      }
      return JSON.stringify(data || {}).length;
    } catch (error) {
      console.error('Failed to calculate payload size:', error);
      return 0;
    }
  }

  /**
   * 匯出結果為 JSON
   */
  exportResults(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results: this.results,
        summary: this.calculateSummary(this.results),
      },
      null,
      2
    );
  }
}

// 單例導出
export const performanceBenchmark = new PerformanceBenchmark();
