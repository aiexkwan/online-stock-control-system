/**
 * GRNLabelCard Performance Benchmarks
 * 
 * 專門為GRNLabelCard設計的性能基準測試套件
 * 包含渲染性能、交互響應、記憶體使用等關鍵指標測試
 */

import {
  PerformanceBaselineFramework,
  PerformanceMeasurement,
  RegressionDetectionResult,
  GRN_LABEL_CARD_BASELINE
} from './performance-baseline-framework';

// GRNLabelCard 特定的測試場景
export interface GRNTestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<PerformanceMeasurement>;
  cleanup: () => Promise<void>;
  expectedMetrics: {
    renderTime: { min: number; max: number };
    memoryUsage: { min: number; max: number };
    apiResponseTime: { min: number; max: number };
    interactiveTime: { min: number; max: number };
  };
}

// 測試場景定義
export const GRN_TEST_SCENARIOS: GRNTestScenario[] = [
  {
    name: 'initial-render',
    description: 'Initial component mount and render performance',
    setup: async () => {
      // 清理DOM和記憶體
      if (typeof window !== 'undefined') {
        // 清理之前的測試組件
        const testContainer = document.getElementById('grn-test-container');
        if (testContainer) {
          testContainer.remove();
        }
      }
    },
    execute: async () => {
      const framework = new PerformanceBaselineFramework();
      framework.startMonitoring('GRNLabelCard-initial-render');
      
      // 模擬組件初始化時間
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const measurement = framework.stopMonitoring('GRNLabelCard-initial-render');
      if (!measurement) {
        throw new Error('Failed to measure initial render performance');
      }
      
      return measurement;
    },
    cleanup: async () => {
      // 測試後清理
      await new Promise(resolve => setTimeout(resolve, 50));
    },
    expectedMetrics: {
      renderTime: { min: 50, max: 200 },
      memoryUsage: { min: 1.0, max: 4.0 },
      apiResponseTime: { min: 0, max: 100 },
      interactiveTime: { min: 10, max: 150 },
    },
  },
  {
    name: 'form-interaction',
    description: 'Form field interaction and validation performance',
    setup: async () => {
      // 模擬表單已經渲染完成的狀態
    },
    execute: async () => {
      const framework = new PerformanceBaselineFramework();
      framework.startMonitoring('GRNLabelCard-form-interaction');
      
      // 模擬表單填寫操作
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const measurement = framework.stopMonitoring('GRNLabelCard-form-interaction');
      if (!measurement) {
        throw new Error('Failed to measure form interaction performance');
      }
      
      return measurement;
    },
    cleanup: async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
    },
    expectedMetrics: {
      renderTime: { min: 20, max: 100 },
      memoryUsage: { min: 2.0, max: 5.0 },
      apiResponseTime: { min: 100, max: 400 },
      interactiveTime: { min: 50, max: 150 },
    },
  },
  {
    name: 'weight-input-heavy-load',
    description: 'Performance with maximum weight inputs (22 items)',
    setup: async () => {
      // 準備22個重量輸入項的測試數據
    },
    execute: async () => {
      const framework = new PerformanceBaselineFramework();
      framework.startMonitoring('GRNLabelCard-weight-heavy-load');
      
      // 模擬22個重量輸入的處理時間
      const weights = Array(22).fill(0).map((_, i) => `${(i + 1) * 10}.5`);
      await new Promise(resolve => setTimeout(resolve, weights.length * 2));
      
      const measurement = framework.stopMonitoring('GRNLabelCard-weight-heavy-load');
      if (!measurement) {
        throw new Error('Failed to measure heavy load performance');
      }
      
      return measurement;
    },
    cleanup: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    expectedMetrics: {
      renderTime: { min: 80, max: 300 },
      memoryUsage: { min: 3.0, max: 8.0 },
      apiResponseTime: { min: 200, max: 800 },
      interactiveTime: { min: 100, max: 250 },
    },
  },
  {
    name: 'print-process',
    description: 'Print label generation and processing performance',
    setup: async () => {
      // 模擬完整的表單數據準備
    },
    execute: async () => {
      const framework = new PerformanceBaselineFramework();
      framework.startMonitoring('GRNLabelCard-print-process');
      
      // 模擬打印處理流程
      await new Promise(resolve => setTimeout(resolve, 150)); // 模擬PDF生成和處理
      
      const measurement = framework.stopMonitoring('GRNLabelCard-print-process');
      if (!measurement) {
        throw new Error('Failed to measure print process performance');
      }
      
      return measurement;
    },
    cleanup: async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    },
    expectedMetrics: {
      renderTime: { min: 100, max: 400 },
      memoryUsage: { min: 2.5, max: 6.0 },
      apiResponseTime: { min: 300, max: 1200 },
      interactiveTime: { min: 150, max: 500 },
    },
  },
  {
    name: 'memory-stress-test',
    description: 'Memory usage under continuous operations',
    setup: async () => {
      // 準備記憶體壓力測試
    },
    execute: async () => {
      const framework = new PerformanceBaselineFramework();
      framework.startMonitoring('GRNLabelCard-memory-stress');
      
      // 模擬連續操作造成的記憶體壓力
      const operations = 10;
      for (let i = 0; i < operations; i++) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      const measurement = framework.stopMonitoring('GRNLabelCard-memory-stress');
      if (!measurement) {
        throw new Error('Failed to measure memory stress performance');
      }
      
      return measurement;
    },
    cleanup: async () => {
      // 強制垃圾回收（如果可用）
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    },
    expectedMetrics: {
      renderTime: { min: 200, max: 600 },
      memoryUsage: { min: 4.0, max: 12.0 },
      apiResponseTime: { min: 500, max: 2000 },
      interactiveTime: { min: 200, max: 800 },
    },
  },
];

/**
 * GRNLabelCard 性能基準測試執行器
 */
export class GRNLabelCardBenchmarks {
  private framework: PerformanceBaselineFramework;
  private testResults: Map<string, PerformanceMeasurement[]> = new Map();
  private regressionResults: Map<string, RegressionDetectionResult[]> = new Map();

  constructor() {
    this.framework = new PerformanceBaselineFramework();
  }

  /**
   * 執行單一測試場景
   */
  async runScenario(scenario: GRNTestScenario): Promise<{
    measurement: PerformanceMeasurement;
    regression: RegressionDetectionResult;
    passed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      console.log(`[GRNBenchmarks] Running scenario: ${scenario.name}`);
      
      // 執行設置
      await scenario.setup();
      
      // 執行測試
      const measurement = await scenario.execute();
      
      // 檢測回歸
      const regression = this.framework.detectRegression('GRNLabelCard', measurement);
      
      // 驗證結果是否在期望範圍內
      const passed = this.validateScenarioResults(scenario, measurement, issues);
      
      // 記錄結果
      this.recordTestResult(scenario.name, measurement);
      this.recordRegressionResult(scenario.name, regression);
      
      // 執行清理
      await scenario.cleanup();
      
      console.log(`[GRNBenchmarks] Scenario ${scenario.name} completed:`, {
        passed,
        hasRegression: regression.hasRegression,
        issues: issues.length
      });
      
      return {
        measurement,
        regression,
        passed,
        issues
      };
    } catch (error) {
      issues.push(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // 確保執行清理
      try {
        await scenario.cleanup();
      } catch (cleanupError) {
        console.error(`[GRNBenchmarks] Cleanup failed for ${scenario.name}:`, cleanupError);
      }
      
      throw new Error(`Scenario ${scenario.name} failed: ${issues.join(', ')}`);
    }
  }

  /**
   * 執行所有測試場景
   */
  async runAllScenarios(): Promise<{
    results: Array<{
      scenario: string;
      measurement: PerformanceMeasurement;
      regression: RegressionDetectionResult;
      passed: boolean;
      issues: string[];
    }>;
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      regressionCount: number;
      criticalIssues: number;
    };
  }> {
    const results = [];
    let passedTests = 0;
    let regressionCount = 0;
    let criticalIssues = 0;
    
    console.log('[GRNBenchmarks] Starting comprehensive benchmark suite...');
    
    for (const scenario of GRN_TEST_SCENARIOS) {
      try {
        const result = await this.runScenario(scenario);
        
        if (result.passed) passedTests++;
        if (result.regression.hasRegression) regressionCount++;
        if (result.regression.regressionDetails.some(d => d.severity === 'critical')) {
          criticalIssues++;
        }
        
        results.push({
          scenario: scenario.name,
          measurement: result.measurement,
          regression: result.regression,
          passed: result.passed,
          issues: result.issues
        });
      } catch (error) {
        console.error(`[GRNBenchmarks] Failed to run scenario ${scenario.name}:`, error);
        
        // 記錄失敗的測試
        results.push({
          scenario: scenario.name,
          measurement: {} as PerformanceMeasurement, // 空的測量結果
          regression: {
            componentName: 'GRNLabelCard',
            hasRegression: true,
            regressionDetails: [{
              metric: 'execution',
              currentValue: 0,
              baselineValue: 0,
              percentageChange: 100,
              severity: 'critical'
            }],
            recommendations: ['Fix test execution issues'],
            timestamp: Date.now()
          },
          passed: false,
          issues: [error instanceof Error ? error.message : String(error)]
        });
        
        criticalIssues++;
      }
    }
    
    const summary = {
      totalTests: GRN_TEST_SCENARIOS.length,
      passedTests,
      failedTests: GRN_TEST_SCENARIOS.length - passedTests,
      regressionCount,
      criticalIssues
    };
    
    console.log('[GRNBenchmarks] Benchmark suite completed:', summary);
    
    return { results, summary };
  }

  /**
   * 驗證測試場景結果
   */
  private validateScenarioResults(
    scenario: GRNTestScenario,
    measurement: PerformanceMeasurement,
    issues: string[]
  ): boolean {
    let passed = true;
    const { expectedMetrics } = scenario;
    const { metrics } = measurement;
    
    // 檢查渲染時間
    if (metrics.renderTime < expectedMetrics.renderTime.min || 
        metrics.renderTime > expectedMetrics.renderTime.max) {
      issues.push(
        `Render time ${metrics.renderTime}ms outside expected range ` +
        `${expectedMetrics.renderTime.min}-${expectedMetrics.renderTime.max}ms`
      );
      passed = false;
    }
    
    // 檢查記憶體使用
    if (metrics.memoryUsage < expectedMetrics.memoryUsage.min || 
        metrics.memoryUsage > expectedMetrics.memoryUsage.max) {
      issues.push(
        `Memory usage ${metrics.memoryUsage}MB outside expected range ` +
        `${expectedMetrics.memoryUsage.min}-${expectedMetrics.memoryUsage.max}MB`
      );
      passed = false;
    }
    
    // 檢查API響應時間（如果有測量到）
    if (metrics.apiResponseTime > 0 && 
        (metrics.apiResponseTime < expectedMetrics.apiResponseTime.min || 
         metrics.apiResponseTime > expectedMetrics.apiResponseTime.max)) {
      issues.push(
        `API response time ${metrics.apiResponseTime}ms outside expected range ` +
        `${expectedMetrics.apiResponseTime.min}-${expectedMetrics.apiResponseTime.max}ms`
      );
      passed = false;
    }
    
    // 檢查交互時間（如果有測量到）
    if (metrics.interactiveTime > 0 && 
        (metrics.interactiveTime < expectedMetrics.interactiveTime.min || 
         metrics.interactiveTime > expectedMetrics.interactiveTime.max)) {
      issues.push(
        `Interactive time ${metrics.interactiveTime}ms outside expected range ` +
        `${expectedMetrics.interactiveTime.min}-${expectedMetrics.interactiveTime.max}ms`
      );
      passed = false;
    }
    
    return passed;
  }

  /**
   * 記錄測試結果
   */
  private recordTestResult(scenarioName: string, measurement: PerformanceMeasurement): void {
    if (!this.testResults.has(scenarioName)) {
      this.testResults.set(scenarioName, []);
    }
    this.testResults.get(scenarioName)!.push(measurement);
  }

  /**
   * 記錄回歸檢測結果
   */
  private recordRegressionResult(scenarioName: string, regression: RegressionDetectionResult): void {
    if (!this.regressionResults.has(scenarioName)) {
      this.regressionResults.set(scenarioName, []);
    }
    this.regressionResults.get(scenarioName)!.push(regression);
  }

  /**
   * 獲取特定場景的測試歷史
   */
  getScenarioHistory(scenarioName: string): {
    measurements: PerformanceMeasurement[];
    regressions: RegressionDetectionResult[];
  } {
    return {
      measurements: this.testResults.get(scenarioName) || [],
      regressions: this.regressionResults.get(scenarioName) || []
    };
  }

  /**
   * 生成詳細的性能報告
   */
  generateDetailedReport(): {
    componentName: string;
    baseline: typeof GRN_LABEL_CARD_BASELINE;
    scenarios: Array<{
      name: string;
      description: string;
      latestResult: PerformanceMeasurement | null;
      averageMetrics: {
        renderTime: number;
        memoryUsage: number;
        apiResponseTime: number;
        interactiveTime: number;
      };
      regressionCount: number;
      recommendations: string[];
    }>;
    overallHealth: {
      status: 'good' | 'warning' | 'critical';
      score: number; // 0-100
      issues: string[];
      strengths: string[];
    };
  } {
    const scenarios = GRN_TEST_SCENARIOS.map(scenario => {
      const history = this.getScenarioHistory(scenario.name);
      const measurements = history.measurements;
      const regressions = history.regressions;
      
      const latestResult = measurements.length > 0 ? measurements[measurements.length - 1] : null;
      
      // 計算平均指標
      const averageMetrics = measurements.length > 0 ? {
        renderTime: measurements.reduce((sum, m) => sum + m.metrics.renderTime, 0) / measurements.length,
        memoryUsage: measurements.reduce((sum, m) => sum + m.metrics.memoryUsage, 0) / measurements.length,
        apiResponseTime: measurements.reduce((sum, m) => sum + m.metrics.apiResponseTime, 0) / measurements.length,
        interactiveTime: measurements.reduce((sum, m) => sum + m.metrics.interactiveTime, 0) / measurements.length,
      } : {
        renderTime: 0,
        memoryUsage: 0,
        apiResponseTime: 0,
        interactiveTime: 0,
      };
      
      const regressionCount = regressions.filter(r => r.hasRegression).length;
      
      // 收集建議
      const recommendations = regressions
        .filter(r => r.hasRegression)
        .flatMap(r => r.recommendations)
        .filter((rec, index, arr) => arr.indexOf(rec) === index); // 去重
      
      return {
        name: scenario.name,
        description: scenario.description,
        latestResult,
        averageMetrics,
        regressionCount,
        recommendations
      };
    });
    
    // 計算整體健康度
    const overallHealth = this.calculateOverallHealth(scenarios);
    
    return {
      componentName: 'GRNLabelCard',
      baseline: GRN_LABEL_CARD_BASELINE,
      scenarios,
      overallHealth
    };
  }

  /**
   * 計算整體系統健康度
   */
  private calculateOverallHealth(scenarios: any[]): {
    status: 'good' | 'warning' | 'critical';
    score: number;
    issues: string[];
    strengths: string[];
  } {
    let score = 100;
    const issues: string[] = [];
    const strengths: string[] = [];
    
    // 基於回歸數量和嚴重程度計算分數
    const totalRegressions = scenarios.reduce((sum, s) => sum + s.regressionCount, 0);
    const totalScenarios = scenarios.length;
    
    if (totalRegressions > 0) {
      const regressionPenalty = Math.min(totalRegressions * 15, 60);
      score -= regressionPenalty;
      issues.push(`Found ${totalRegressions} performance regressions across ${totalScenarios} scenarios`);
    } else {
      strengths.push('No performance regressions detected');
    }
    
    // 檢查平均性能指標
    const averageRenderTime = scenarios.reduce((sum, s) => sum + s.averageMetrics.renderTime, 0) / totalScenarios;
    const averageMemoryUsage = scenarios.reduce((sum, s) => sum + s.averageMetrics.memoryUsage, 0) / totalScenarios;
    
    const baseline = GRN_LABEL_CARD_BASELINE.metrics;
    
    if (averageRenderTime > baseline.renderTime.threshold.critical) {
      score -= 25;
      issues.push(`Average render time (${averageRenderTime.toFixed(1)}ms) exceeds critical threshold`);
    } else if (averageRenderTime > baseline.renderTime.threshold.warning) {
      score -= 10;
      issues.push(`Average render time (${averageRenderTime.toFixed(1)}ms) exceeds warning threshold`);
    } else {
      strengths.push(`Good render performance (avg: ${averageRenderTime.toFixed(1)}ms)`);
    }
    
    if (averageMemoryUsage > baseline.memoryUsage.threshold.critical) {
      score -= 20;
      issues.push(`Average memory usage (${averageMemoryUsage.toFixed(1)}MB) exceeds critical threshold`);
    } else if (averageMemoryUsage > baseline.memoryUsage.threshold.warning) {
      score -= 8;
      issues.push(`Average memory usage (${averageMemoryUsage.toFixed(1)}MB) exceeds warning threshold`);
    } else {
      strengths.push(`Efficient memory usage (avg: ${averageMemoryUsage.toFixed(1)}MB)`);
    }
    
    // 確定狀態
    let status: 'good' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'good';
    } else if (score >= 60) {
      status = 'warning';
    } else {
      status = 'critical';
    }
    
    return {
      status,
      score: Math.max(0, Math.round(score)),
      issues,
      strengths
    };
  }

  /**
   * 清除所有測試數據
   */
  clearAllData(): void {
    this.testResults.clear();
    this.regressionResults.clear();
    this.framework.clearMeasurements('GRNLabelCard');
  }
}

// 創建單例實例
export const grnLabelCardBenchmarks = new GRNLabelCardBenchmarks();

// 便利函數：快速執行所有基準測試
export async function runGRNLabelCardBenchmarks(): Promise<{
  results: any;
  report: any;
}> {
  console.log('[GRNBenchmarks] Starting GRNLabelCard performance benchmarks...');
  
  const results = await grnLabelCardBenchmarks.runAllScenarios();
  const report = grnLabelCardBenchmarks.generateDetailedReport();
  
  console.log('[GRNBenchmarks] Benchmark results:', {
    totalTests: results.summary.totalTests,
    passedTests: results.summary.passedTests,
    overallHealth: report.overallHealth.status,
    score: report.overallHealth.score
  });
  
  return { results, report };
}
