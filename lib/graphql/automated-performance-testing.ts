/**
 * 自動化性能測試系統
 * 包括負載測試、回歸測試和基準測試
 */

import { DocumentNode } from 'graphql';

interface TestScenario {
  name: string;
  description: string;
  query: string;
  variables?: Record<string, any>;
  expectedMaxExecutionTime: number;
  expectedMaxComplexity: number;
  expectedMinCacheHitRate?: number;
  loadTestConfig?: LoadTestConfig;
}

interface LoadTestConfig {
  duration: number; // 測試持續時間（秒）
  rampUpTime: number; // 負載增加時間（秒）
  maxConcurrentUsers: number;
  requestsPerSecond: number;
}

interface TestResult {
  scenarioName: string;
  timestamp: number;
  passed: boolean;
  metrics: PerformanceMetrics;
  issues: TestIssue[];
  comparison?: ComparisonResult;
}

interface PerformanceMetrics {
  executionTime: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    totalRequests: number;
    failedRequests: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    dbConnections: number;
  };
  caching: {
    hitRate: number;
    missRate: number;
    totalCacheRequests: number;
  };
  errors: {
    timeouts: number;
    graphqlErrors: number;
    networkErrors: number;
  };
}

interface TestIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'reliability' | 'scalability';
  message: string;
  actualValue: number;
  expectedValue: number;
  recommendation: string;
}

interface ComparisonResult {
  previousRun: TestResult;
  changes: {
    executionTime: number; // 百分比變化
    throughput: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  regressions: string[];
  improvements: string[];
}

interface TestSuite {
  name: string;
  description: string;
  scenarios: TestScenario[];
  schedule?: string; // Cron 表達式
  notifications?: NotificationConfig;
}

interface NotificationConfig {
  onFailure: boolean;
  onRegression: boolean;
  thresholds: {
    performanceDegradation: number; // 性能下降百分比閾值
    errorRateIncrease: number; // 錯誤率增加閾值
  };
}

class AutomatedPerformanceTester {
  private testHistory: Map<string, TestResult[]> = new Map();
  private runningTests = new Set<string>();
  private testSuites: Map<string, TestSuite> = new Map();
  private readonly maxHistorySize = 100;

  /**
   * 註冊測試套件
   */
  registerTestSuite(suite: TestSuite): void {
    this.testSuites.set(suite.name, suite);

    if (suite.schedule) {
      this.scheduleTestSuite(suite);
    }
  }

  /**
   * 執行單個測試場景
   */
  async runScenario(scenario: TestScenario): Promise<TestResult> {
    if (this.runningTests.has(scenario.name)) {
      throw new Error(`測試場景 ${scenario.name} 正在執行中`);
    }

    this.runningTests.add(scenario.name);
    console.log(`[性能測試] 開始執行場景: ${scenario.name}`);

    try {
      let metrics: PerformanceMetrics;

      if (scenario.loadTestConfig) {
        metrics = await this.runLoadTest(scenario);
      } else {
        metrics = await this.runSingleTest(scenario);
      }

      const issues = this.analyzePerformance(scenario, metrics);
      const passed =
        issues.filter(issue => issue.severity === 'critical' || issue.severity === 'high')
          .length === 0;

      const result: TestResult = {
        scenarioName: scenario.name,
        timestamp: Date.now(),
        passed,
        metrics,
        issues,
      };

      // 添加歷史比較
      const previousResults = this.testHistory.get(scenario.name) || [];
      if (previousResults.length > 0) {
        const previousResult = previousResults[previousResults.length - 1];
        result.comparison = this.compareResults(previousResult, result);
      }

      this.recordTestResult(result);
      return result;
    } finally {
      this.runningTests.delete(scenario.name);
      console.log(`[性能測試] 完成場景: ${scenario.name}`);
    }
  }

  /**
   * 執行測試套件
   */
  async runTestSuite(suiteName: string): Promise<TestResult[]> {
    const suite = this.testSuites.get(suiteName);
    if (!suite) {
      throw new Error(`測試套件 ${suiteName} 不存在`);
    }

    console.log(`[性能測試] 開始執行測試套件: ${suiteName}`);
    const results: TestResult[] = [];

    for (const scenario of suite.scenarios) {
      try {
        const result = await this.runScenario(scenario);
        results.push(result);

        // 檢查是否需要發送通知
        await this.checkNotifications(suite, result);
      } catch (error) {
        console.error(`[性能測試] 場景 ${scenario.name} 執行失敗:`, error);
        results.push({
          scenarioName: scenario.name,
          timestamp: Date.now(),
          passed: false,
          metrics: this.getEmptyMetrics(),
          issues: [
            {
              severity: 'critical',
              category: 'reliability',
              message: `測試執行失敗: ${error instanceof Error ? error.message : 'Unknown error'}`,
              actualValue: 0,
              expectedValue: 1,
              recommendation: '檢查測試配置和環境',
            },
          ],
        });
      }
    }

    console.log(`[性能測試] 測試套件 ${suiteName} 執行完成`);
    return results;
  }

  /**
   * 執行負載測試
   */
  private async runLoadTest(scenario: TestScenario): Promise<PerformanceMetrics> {
    const config = scenario.loadTestConfig!;
    const executionTimes: number[] = [];
    const errors = { timeouts: 0, graphqlErrors: 0, networkErrors: 0 };
    let totalRequests = 0;
    let failedRequests = 0;

    const startTime = Date.now();
    const endTime = startTime + config.duration * 1000;

    const rampUpEnd = startTime + config.rampUpTime * 1000;
    let currentConcurrency = 1;

    console.log(`[負載測試] 開始負載測試: ${scenario.name}`);
    console.log(`- 持續時間: ${config.duration}秒`);
    console.log(`- 最大並發: ${config.maxConcurrentUsers}`);
    console.log(`- 目標 RPS: ${config.requestsPerSecond}`);

    const promises: Promise<void>[] = [];

    while (Date.now() < endTime) {
      // 計算當前應有的並發數（逐漸增加到最大值）
      if (Date.now() < rampUpEnd) {
        const progress = (Date.now() - startTime) / (config.rampUpTime * 1000);
        currentConcurrency = Math.ceil(progress * config.maxConcurrentUsers);
      } else {
        currentConcurrency = config.maxConcurrentUsers;
      }

      // 啟動並發請求
      for (let i = 0; i < currentConcurrency && Date.now() < endTime; i++) {
        const promise = this.executeTestQuery(scenario)
          .then(time => {
            executionTimes.push(time);
            totalRequests++;
          })
          .catch(error => {
            failedRequests++;
            if (error.message.includes('timeout')) {
              errors.timeouts++;
            } else if (error.message.includes('GraphQL')) {
              errors.graphqlErrors++;
            } else {
              errors.networkErrors++;
            }
          });

        promises.push(promise);
      }

      // 控制請求速率
      await this.sleep(1000 / config.requestsPerSecond);
    }

    // 等待所有請求完成
    await Promise.allSettled(promises);

    const actualDuration = (Date.now() - startTime) / 1000;
    const memoryUsage = this.getCurrentMemoryUsage();
    const cacheStats = await this.getCacheStats();

    return {
      executionTime: {
        min: Math.min(...executionTimes),
        max: Math.max(...executionTimes),
        avg: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
        p95: this.calculatePercentile(executionTimes, 95),
        p99: this.calculatePercentile(executionTimes, 99),
      },
      throughput: {
        requestsPerSecond: totalRequests / actualDuration,
        totalRequests,
        failedRequests,
      },
      resources: {
        memoryUsage,
        cpuUsage: await this.getCurrentCpuUsage(),
        dbConnections: await this.getActiveDbConnections(),
      },
      caching: cacheStats,
      errors,
    };
  }

  /**
   * 執行單個測試
   */
  private async runSingleTest(scenario: TestScenario): Promise<PerformanceMetrics> {
    const iterations = 10; // 執行多次取平均值
    const executionTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const time = await this.executeTestQuery(scenario);
        executionTimes.push(time);
      } catch (error) {
        console.warn(`[性能測試] 查詢執行失敗 (迭代 ${i + 1}):`, error);
      }
    }

    const memoryUsage = this.getCurrentMemoryUsage();
    const cacheStats = await this.getCacheStats();

    return {
      executionTime: {
        min: Math.min(...executionTimes),
        max: Math.max(...executionTimes),
        avg: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
        p95: this.calculatePercentile(executionTimes, 95),
        p99: this.calculatePercentile(executionTimes, 99),
      },
      throughput: {
        requestsPerSecond:
          iterations / (executionTimes.reduce((sum, time) => sum + time, 0) / 1000),
        totalRequests: iterations,
        failedRequests: iterations - executionTimes.length,
      },
      resources: {
        memoryUsage,
        cpuUsage: await this.getCurrentCpuUsage(),
        dbConnections: await this.getActiveDbConnections(),
      },
      caching: cacheStats,
      errors: {
        timeouts: 0,
        graphqlErrors: iterations - executionTimes.length,
        networkErrors: 0,
      },
    };
  }

  /**
   * 執行測試查詢
   */
  private async executeTestQuery(scenario: TestScenario): Promise<number> {
    const startTime = performance.now();

    try {
      // 這裡應該調用實際的 GraphQL 執行器
      // 模擬查詢執行
      await this.simulateGraphQLExecution(scenario);

      return performance.now() - startTime;
    } catch (error) {
      throw new Error(`GraphQL 查詢執行失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 模擬 GraphQL 查詢執行
   */
  private async simulateGraphQLExecution(scenario: TestScenario): Promise<void> {
    // 模擬執行時間（實際實施中應該調用真實的 GraphQL 執行器）
    const baseTime = 50 + Math.random() * 200; // 50-250ms
    const complexityFactor = scenario.expectedMaxComplexity / 100;
    const executionTime = baseTime * complexityFactor;

    await this.sleep(executionTime);

    // 模擬偶爾的錯誤
    if (Math.random() < 0.01) {
      // 1% 錯誤率
      throw new Error('模擬 GraphQL 錯誤');
    }
  }

  /**
   * 分析性能指標
   */
  private analyzePerformance(scenario: TestScenario, metrics: PerformanceMetrics): TestIssue[] {
    const issues: TestIssue[] = [];

    // 檢查執行時間
    if (metrics.executionTime.avg > scenario.expectedMaxExecutionTime) {
      issues.push({
        severity:
          metrics.executionTime.avg > scenario.expectedMaxExecutionTime * 2 ? 'critical' : 'high',
        category: 'performance',
        message: '平均執行時間超過預期',
        actualValue: metrics.executionTime.avg,
        expectedValue: scenario.expectedMaxExecutionTime,
        recommendation: '優化查詢複雜度或添加緩存',
      });
    }

    // 檢查 P95 響應時間
    if (metrics.executionTime.p95 > scenario.expectedMaxExecutionTime * 1.5) {
      issues.push({
        severity: 'medium',
        category: 'performance',
        message: 'P95 響應時間過高',
        actualValue: metrics.executionTime.p95,
        expectedValue: scenario.expectedMaxExecutionTime * 1.5,
        recommendation: '檢查是否存在性能波動或資源瓶頸',
      });
    }

    // 檢查緩存命中率
    if (
      scenario.expectedMinCacheHitRate &&
      metrics.caching.hitRate < scenario.expectedMinCacheHitRate
    ) {
      issues.push({
        severity: 'medium',
        category: 'performance',
        message: '緩存命中率低於預期',
        actualValue: metrics.caching.hitRate * 100,
        expectedValue: scenario.expectedMinCacheHitRate * 100,
        recommendation: '檢查緩存策略和 TTL 配置',
      });
    }

    // 檢查錯誤率
    const errorRate = metrics.throughput.failedRequests / metrics.throughput.totalRequests;
    if (errorRate > 0.05) {
      // 5% 錯誤率閾值
      issues.push({
        severity: errorRate > 0.1 ? 'critical' : 'high',
        category: 'reliability',
        message: '錯誤率過高',
        actualValue: errorRate * 100,
        expectedValue: 5,
        recommendation: '檢查查詢有效性和系統穩定性',
      });
    }

    // 檢查內存使用
    if (metrics.resources.memoryUsage > 1024 * 1024 * 1024) {
      // 1GB
      issues.push({
        severity: 'medium',
        category: 'scalability',
        message: '內存使用量過高',
        actualValue: metrics.resources.memoryUsage / (1024 * 1024 * 1024),
        expectedValue: 1,
        recommendation: '優化數據結構或實施內存管理策略',
      });
    }

    return issues;
  }

  /**
   * 比較測試結果
   */
  private compareResults(previous: TestResult, current: TestResult): ComparisonResult {
    const changes = {
      executionTime:
        ((current.metrics.executionTime.avg - previous.metrics.executionTime.avg) /
          previous.metrics.executionTime.avg) *
        100,
      throughput:
        ((current.metrics.throughput.requestsPerSecond -
          previous.metrics.throughput.requestsPerSecond) /
          previous.metrics.throughput.requestsPerSecond) *
        100,
      memoryUsage:
        ((current.metrics.resources.memoryUsage - previous.metrics.resources.memoryUsage) /
          previous.metrics.resources.memoryUsage) *
        100,
      cacheHitRate:
        ((current.metrics.caching.hitRate - previous.metrics.caching.hitRate) /
          previous.metrics.caching.hitRate) *
        100,
    };

    const regressions: string[] = [];
    const improvements: string[] = [];

    if (changes.executionTime > 10) {
      regressions.push(`執行時間增加 ${changes.executionTime.toFixed(1)}%`);
    } else if (changes.executionTime < -10) {
      improvements.push(`執行時間減少 ${Math.abs(changes.executionTime).toFixed(1)}%`);
    }

    if (changes.throughput < -10) {
      regressions.push(`吞吐量減少 ${Math.abs(changes.throughput).toFixed(1)}%`);
    } else if (changes.throughput > 10) {
      improvements.push(`吞吐量增加 ${changes.throughput.toFixed(1)}%`);
    }

    if (changes.memoryUsage > 20) {
      regressions.push(`內存使用增加 ${changes.memoryUsage.toFixed(1)}%`);
    }

    if (changes.cacheHitRate < -10) {
      regressions.push(`緩存命中率下降 ${Math.abs(changes.cacheHitRate).toFixed(1)}%`);
    } else if (changes.cacheHitRate > 10) {
      improvements.push(`緩存命中率提升 ${changes.cacheHitRate.toFixed(1)}%`);
    }

    return {
      previousRun: previous,
      changes,
      regressions,
      improvements,
    };
  }

  /**
   * 生成性能報告
   */
  async generateReport(
    suiteName: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      avgExecutionTime: number;
    };
    trends: {
      executionTimeTrend: number[];
      throughputTrend: number[];
      errorRateTrend: number[];
    };
    topIssues: TestIssue[];
    recommendations: string[];
  }> {
    const suite = this.testSuites.get(suiteName);
    if (!suite) {
      throw new Error(`測試套件 ${suiteName} 不存在`);
    }

    const allResults: TestResult[] = [];
    for (const scenario of suite.scenarios) {
      const results = this.testHistory.get(scenario.name) || [];
      if (timeRange) {
        allResults.push(
          ...results.filter(
            r => new Date(r.timestamp) >= timeRange.start && new Date(r.timestamp) <= timeRange.end
          )
        );
      } else {
        allResults.push(...results);
      }
    }

    const passedTests = allResults.filter(r => r.passed).length;
    const avgExecutionTime =
      allResults.reduce((sum, r) => sum + r.metrics.executionTime.avg, 0) / allResults.length;

    const topIssues = this.getTopIssues(allResults.flatMap(r => r.issues));
    const recommendations = this.generateRecommendations(allResults);

    return {
      summary: {
        totalTests: allResults.length,
        passedTests,
        failedTests: allResults.length - passedTests,
        avgExecutionTime,
      },
      trends: {
        executionTimeTrend: allResults.map(r => r.metrics.executionTime.avg),
        throughputTrend: allResults.map(r => r.metrics.throughput.requestsPerSecond),
        errorRateTrend: allResults.map(
          r => r.metrics.throughput.failedRequests / r.metrics.throughput.totalRequests
        ),
      },
      topIssues,
      recommendations,
    };
  }

  // 工具方法
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private getCurrentMemoryUsage(): number {
    return process.memoryUsage().heapUsed;
  }

  private async getCurrentCpuUsage(): Promise<number> {
    // 簡化實現，實際中應該使用更精確的 CPU 監控
    return Math.random() * 100;
  }

  private async getActiveDbConnections(): Promise<number> {
    // 模擬數據庫連接數
    return Math.floor(Math.random() * 20) + 5;
  }

  private async getCacheStats(): Promise<PerformanceMetrics['caching']> {
    // 模擬緩存統計
    const totalRequests = Math.floor(Math.random() * 1000) + 100;
    const hitRate = 0.6 + Math.random() * 0.3; // 60-90%

    return {
      hitRate,
      missRate: 1 - hitRate,
      totalCacheRequests: totalRequests,
    };
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      executionTime: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
      throughput: { requestsPerSecond: 0, totalRequests: 0, failedRequests: 0 },
      resources: { memoryUsage: 0, cpuUsage: 0, dbConnections: 0 },
      caching: { hitRate: 0, missRate: 0, totalCacheRequests: 0 },
      errors: { timeouts: 0, graphqlErrors: 0, networkErrors: 0 },
    };
  }

  private recordTestResult(result: TestResult): void {
    const history = this.testHistory.get(result.scenarioName) || [];
    history.push(result);

    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }

    this.testHistory.set(result.scenarioName, history);
  }

  private scheduleTestSuite(suite: TestSuite): void {
    // 實際實施中應該使用 cron 庫來處理調度
    console.log(`[性能測試] 已調度測試套件: ${suite.name} (${suite.schedule})`);
  }

  private async checkNotifications(suite: TestSuite, result: TestResult): Promise<void> {
    if (!suite.notifications) return;

    const config = suite.notifications;

    if (config.onFailure && !result.passed) {
      await this.sendNotification(`測試失敗: ${result.scenarioName}`, result);
    }

    if (config.onRegression && result.comparison) {
      const hasRegression = result.comparison.regressions.length > 0;
      if (hasRegression) {
        await this.sendNotification(`性能回歸: ${result.scenarioName}`, result);
      }
    }
  }

  private async sendNotification(message: string, result: TestResult): Promise<void> {
    console.log(`[通知] ${message}`);
    // 實際實施中應該發送郵件或其他通知
  }

  private getTopIssues(issues: TestIssue[]): TestIssue[] {
    const issueMap = new Map<string, TestIssue>();

    issues.forEach(issue => {
      const key = issue.message;
      if (!issueMap.has(key) || issueMap.get(key)!.severity < issue.severity) {
        issueMap.set(key, issue);
      }
    });

    return Array.from(issueMap.values())
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10);
  }

  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];

    const avgExecutionTime =
      results.reduce((sum, r) => sum + r.metrics.executionTime.avg, 0) / results.length;
    if (avgExecutionTime > 500) {
      recommendations.push('總體響應時間偏高，建議實施查詢優化策略');
    }

    const failureRate = results.filter(r => !r.passed).length / results.length;
    if (failureRate > 0.1) {
      recommendations.push('測試失敗率過高，建議檢查系統穩定性');
    }

    const avgCacheHitRate =
      results.reduce((sum, r) => sum + r.metrics.caching.hitRate, 0) / results.length;
    if (avgCacheHitRate < 0.6) {
      recommendations.push('緩存命中率偏低，建議優化緩存策略');
    }

    return recommendations;
  }
}

export { AutomatedPerformanceTester };
export type {
  TestScenario,
  LoadTestConfig,
  TestResult,
  PerformanceMetrics,
  TestIssue,
  ComparisonResult,
  TestSuite,
  NotificationConfig,
};
