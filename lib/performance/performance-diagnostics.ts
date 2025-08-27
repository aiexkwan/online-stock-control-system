/**
 * Performance Diagnostics Tools
 * 
 * 提供精確的性能問題診斷和建議系統
 * 包含性能瓶頸分析、系統健康評估和智慧化建議
 */

import {
  PerformanceMeasurement,
  RegressionDetectionResult,
  PerformanceBaseline
} from './performance-baseline-framework';
import { AdvancedRegressionResult } from './regression-detection-system';

// 診斷結果介面
export interface DiagnosticResult {
  componentName: string;
  timestamp: number;
  overallHealth: {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    trend: 'improving' | 'stable' | 'degrading';
  };
  bottlenecks: {
    primary: PerformanceBottleneck[];
    secondary: PerformanceBottleneck[];
  };
  recommendations: {
    critical: DiagnosticRecommendation[];
    high: DiagnosticRecommendation[];
    medium: DiagnosticRecommendation[];
    low: DiagnosticRecommendation[];
  };
  systemMetrics: {
    cpu: SystemMetric;
    memory: SystemMetric;
    network: SystemMetric;
    rendering: SystemMetric;
  };
  comparisons: {
    vsBaseline: ComparisonResult;
    vsLastWeek: ComparisonResult;
    vsIndustryBenchmark: ComparisonResult;
  };
  predictions: {
    nextWeek: PerformancePrediction;
    nextMonth: PerformancePrediction;
  };
}

// 性能瓶頸介面
export interface PerformanceBottleneck {
  type: 'cpu' | 'memory' | 'network' | 'rendering' | 'database' | 'bundle';
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  currentValue: number;
  expectedValue: number;
  impact: {
    userExperience: number; // 0-100
    businessMetrics: number; // 0-100
    systemStability: number; // 0-100
  };
  description: string;
  technicalDetails: string;
  potentialCauses: string[];
  estimatedFixTime: {
    min: number; // hours
    max: number; // hours
  };
}

// 診斷建議介面
export interface DiagnosticRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'performance' | 'architecture' | 'code' | 'infrastructure' | 'monitoring';
  title: string;
  description: string;
  implementation: {
    steps: string[];
    estimatedEffort: {
      hours: number;
      complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    };
    requiredSkills: string[];
    dependencies: string[];
  };
  expectedImpact: {
    performance: number; // 0-100
    maintainability: number; // 0-100
    userExperience: number; // 0-100
  };
  riskLevel: 'low' | 'medium' | 'high';
  codeExamples?: {
    before: string;
    after: string;
    explanation: string;
  };
}

// 系統指標介面
export interface SystemMetric {
  current: number;
  average: number;
  peak: number;
  trend: 'up' | 'down' | 'stable';
  status: 'optimal' | 'acceptable' | 'concerning' | 'critical';
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
}

// 比較結果介面
export interface ComparisonResult {
  renderTime: {
    change: number; // percentage
    direction: 'improved' | 'degraded' | 'stable';
    significance: 'high' | 'medium' | 'low' | 'negligible';
  };
  memoryUsage: {
    change: number; // percentage
    direction: 'improved' | 'degraded' | 'stable';
    significance: 'high' | 'medium' | 'low' | 'negligible';
  };
  overall: {
    change: number; // percentage
    direction: 'improved' | 'degraded' | 'stable';
  };
}

// 性能預測介面
export interface PerformancePrediction {
  renderTime: {
    predicted: number;
    confidence: number; // 0-1
    range: { min: number; max: number };
  };
  memoryUsage: {
    predicted: number;
    confidence: number; // 0-1
    range: { min: number; max: number };
  };
  overallHealth: {
    predicted: number;
    confidence: number; // 0-1
  };
}

/**
 * 性能診斷系統類
 */
export class PerformanceDiagnostics {
  private industryBenchmarks = {
    renderTime: 150, // ms
    memoryUsage: 3.0, // MB
    apiResponseTime: 200, // ms
    interactiveTime: 100, // ms
  };

  /**
   * 執行全面性能診斷
   */
  async performComprehensiveDiagnosis(
    componentName: string,
    measurements: PerformanceMeasurement[],
    baseline: PerformanceBaseline,
    regressionResult?: AdvancedRegressionResult
  ): Promise<DiagnosticResult> {
    console.log(`[PerformanceDiagnostics] Starting comprehensive diagnosis for ${componentName}`);
    
    if (measurements.length === 0) {
      throw new Error('No measurement data available for diagnosis');
    }
    
    // 1. 計算整體健康度
    const overallHealth = this.calculateOverallHealth(measurements, baseline);
    
    // 2. 識別性能瓶頸
    const bottlenecks = await this.identifyBottlenecks(measurements, baseline);
    
    // 3. 生成診斷建議
    const recommendations = this.generateDiagnosticRecommendations(
      measurements,
      bottlenecks,
      regressionResult
    );
    
    // 4. 分析系統指標
    const systemMetrics = this.analyzeSystemMetrics(measurements);
    
    // 5. 執行比較分析
    const comparisons = this.performComparisons(measurements, baseline);
    
    // 6. 生成性能預測
    const predictions = this.generatePredictions(measurements);
    
    const result: DiagnosticResult = {
      componentName,
      timestamp: Date.now(),
      overallHealth,
      bottlenecks,
      recommendations,
      systemMetrics,
      comparisons,
      predictions,
    };
    
    console.log(`[PerformanceDiagnostics] Diagnosis completed for ${componentName}:`, {
      healthScore: result.overallHealth.score,
      primaryBottlenecks: result.bottlenecks.primary.length,
      criticalRecommendations: result.recommendations.critical.length
    });
    
    return result;
  }

  /**
   * 計算整體健康度
   */
  private calculateOverallHealth(
    measurements: PerformanceMeasurement[],
    baseline: PerformanceBaseline
  ): DiagnosticResult['overallHealth'] {
    if (measurements.length === 0) {
      return {
        score: 0,
        status: 'critical',
        trend: 'stable'
      };
    }
    
    const latest = measurements[measurements.length - 1];
    const metrics = latest.metrics;
    
    let score = 100;
    
    // 渲染時間評分
    const renderTimeScore = this.calculateMetricScore(
      metrics.renderTime,
      baseline.metrics.renderTime.baseline,
      baseline.metrics.renderTime.threshold
    );
    
    // 記憶體使用評分
    const memoryScore = this.calculateMetricScore(
      metrics.memoryUsage,
      baseline.metrics.memoryUsage.baseline,
      baseline.metrics.memoryUsage.threshold
    );
    
    // API響應時間評分
    const apiScore = this.calculateMetricScore(
      metrics.apiResponseTime,
      baseline.metrics.apiResponseTime.baseline,
      baseline.metrics.apiResponseTime.threshold
    );
    
    // 交互時間評分
    const interactiveScore = this.calculateMetricScore(
      metrics.interactiveTime,
      baseline.metrics.interactiveTime.baseline,
      baseline.metrics.interactiveTime.threshold
    );
    
    // 加權平均計算總分
    score = (
      renderTimeScore * 0.35 +
      memoryScore * 0.25 +
      apiScore * 0.25 +
      interactiveScore * 0.15
    );
    
    // 決定狀態
    let status: DiagnosticResult['overallHealth']['status'];
    if (score >= 90) status = 'excellent';
    else if (score >= 80) status = 'good';
    else if (score >= 65) status = 'fair';
    else if (score >= 40) status = 'poor';
    else status = 'critical';
    
    // 計算趋勢
    const trend = this.calculateTrend(measurements);
    
    return {
      score: Math.round(score),
      status,
      trend
    };
  }

  /**
   * 計算單一指標評分
   */
  private calculateMetricScore(
    currentValue: number,
    baselineValue: number,
    threshold: { warning: number; critical: number }
  ): number {
    if (currentValue <= baselineValue) {
      return 100; // 優於基準線
    }
    
    if (currentValue <= threshold.warning) {
      // 在基準線和警告閘值之間
      const ratio = (currentValue - baselineValue) / (threshold.warning - baselineValue);
      return 100 - (ratio * 15); // 最多扣酓15分
    }
    
    if (currentValue <= threshold.critical) {
      // 在警告和關鍵閘值之間
      const ratio = (currentValue - threshold.warning) / (threshold.critical - threshold.warning);
      return 85 - (ratio * 45); // 從85分扣到40分
    }
    
    // 超過關鍵閘值
    const excessRatio = Math.min((currentValue - threshold.critical) / threshold.critical, 1);
    return Math.max(0, 40 - (excessRatio * 40)); // 從40分扣到0分
  }

  /**
   * 計算性能趋勢
   */
  private calculateTrend(measurements: PerformanceMeasurement[]): 'improving' | 'stable' | 'degrading' {
    if (measurements.length < 5) {
      return 'stable';
    }
    
    // 取最近的測量結果
    const recent = measurements.slice(-5);
    const renderTimes = recent.map(m => m.metrics.renderTime);
    
    // 計算線性趋勢
    const n = renderTimes.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = renderTimes;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    if (Math.abs(slope) < 0.1) {
      return 'stable';
    } else if (slope > 0) {
      return 'degrading'; // 渲染時間增加表示惡化
    } else {
      return 'improving';
    }
  }

  /**
   * 識別性能瓶頸
   */
  private async identifyBottlenecks(
    measurements: PerformanceMeasurement[],
    baseline: PerformanceBaseline
  ): Promise<DiagnosticResult['bottlenecks']> {
    const bottlenecks: PerformanceBottleneck[] = [];
    
    if (measurements.length === 0) {
      return { primary: [], secondary: [] };
    }
    
    const latest = measurements[measurements.length - 1];
    const metrics = latest.metrics;
    
    // 渲染性能瓶頸
    if (metrics.renderTime > baseline.metrics.renderTime.threshold.warning) {
      const severity = metrics.renderTime > baseline.metrics.renderTime.threshold.critical
        ? 'critical' : 'high';
      
      bottlenecks.push({
        type: 'rendering',
        severity,
        metric: 'renderTime',
        currentValue: metrics.renderTime,
        expectedValue: baseline.metrics.renderTime.baseline,
        impact: {
          userExperience: severity === 'critical' ? 90 : 70,
          businessMetrics: severity === 'critical' ? 80 : 60,
          systemStability: 40,
        },
        description: `Component render time (${metrics.renderTime.toFixed(1)}ms) exceeds ${severity} threshold`,
        technicalDetails: `Current render time is ${((metrics.renderTime / baseline.metrics.renderTime.baseline - 1) * 100).toFixed(1)}% above baseline`,
        potentialCauses: [
          'Heavy computations during render',
          'Unnecessary re-renders due to state changes',
          'Large DOM manipulations',
          'Missing React.memo or useMemo optimizations',
          'Inefficient prop drilling'
        ],
        estimatedFixTime: { min: 2, max: 8 }
      });
    }
    
    // 記憶體使用瓶頸
    if (metrics.memoryUsage > baseline.metrics.memoryUsage.threshold.warning) {
      const severity = metrics.memoryUsage > baseline.metrics.memoryUsage.threshold.critical
        ? 'critical' : 'high';
      
      bottlenecks.push({
        type: 'memory',
        severity,
        metric: 'memoryUsage',
        currentValue: metrics.memoryUsage,
        expectedValue: baseline.metrics.memoryUsage.baseline,
        impact: {
          userExperience: 60,
          businessMetrics: 50,
          systemStability: severity === 'critical' ? 95 : 75,
        },
        description: `Memory usage (${metrics.memoryUsage.toFixed(1)}MB) exceeds ${severity} threshold`,
        technicalDetails: `Current memory usage is ${((metrics.memoryUsage / baseline.metrics.memoryUsage.baseline - 1) * 100).toFixed(1)}% above baseline`,
        potentialCauses: [
          'Memory leaks in event listeners or subscriptions',
          'Uncleaned useEffect hooks',
          'Large objects held in memory',
          'Inefficient data structures',
          'Circular references preventing garbage collection'
        ],
        estimatedFixTime: { min: 1, max: 6 }
      });
    }
    
    // API響應時間瓶頸
    if (metrics.apiResponseTime > baseline.metrics.apiResponseTime.threshold.warning) {
      const severity = metrics.apiResponseTime > baseline.metrics.apiResponseTime.threshold.critical
        ? 'critical' : 'medium';
      
      bottlenecks.push({
        type: 'network',
        severity,
        metric: 'apiResponseTime',
        currentValue: metrics.apiResponseTime,
        expectedValue: baseline.metrics.apiResponseTime.baseline,
        impact: {
          userExperience: severity === 'critical' ? 85 : 65,
          businessMetrics: severity === 'critical' ? 90 : 70,
          systemStability: 30,
        },
        description: `API response time (${metrics.apiResponseTime.toFixed(1)}ms) exceeds ${severity} threshold`,
        technicalDetails: `API responses are ${((metrics.apiResponseTime / baseline.metrics.apiResponseTime.baseline - 1) * 100).toFixed(1)}% slower than baseline`,
        potentialCauses: [
          'Database query performance issues',
          'Missing database indexes',
          'Network latency problems',
          'Server resource constraints',
          'Inefficient GraphQL queries',
          'Missing query result caching'
        ],
        estimatedFixTime: { min: 3, max: 16 }
      });
    }
    
    // 按嚴重程度排序和分組
    const sortedBottlenecks = bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    return {
      primary: sortedBottlenecks.filter(b => b.severity === 'critical' || b.severity === 'high'),
      secondary: sortedBottlenecks.filter(b => b.severity === 'medium' || b.severity === 'low')
    };
  }

  /**
   * 生成診斷建議
   */
  private generateDiagnosticRecommendations(
    measurements: PerformanceMeasurement[],
    bottlenecks: DiagnosticResult['bottlenecks'],
    regressionResult?: AdvancedRegressionResult
  ): DiagnosticResult['recommendations'] {
    const recommendations: DiagnosticRecommendation[] = [];
    
    // 基於瓶頸的建議
    bottlenecks.primary.forEach(bottleneck => {
      if (bottleneck.type === 'rendering') {
        recommendations.push({
          id: 'render-optimization-memo',
          priority: 'critical',
          category: 'code',
          title: 'Implement React.memo for expensive components',
          description: 'Prevent unnecessary re-renders by memoizing components that don\'t depend on frequently changing props',
          implementation: {
            steps: [
              'Identify components with expensive render operations',
              'Wrap components with React.memo',
              'Use useMemo for expensive calculations',
              'Implement useCallback for stable function references'
            ],
            estimatedEffort: { hours: 4, complexity: 'moderate' },
            requiredSkills: ['React', 'JavaScript', 'Performance Optimization'],
            dependencies: []
          },
          expectedImpact: {
            performance: 85,
            maintainability: 70,
            userExperience: 90
          },
          riskLevel: 'low',
          codeExamples: {
            before: `const GRNLabelCard = (props) => {
  return (
    <div>
      {/* expensive render logic */}
    </div>
  );
};`,
            after: `const GRNLabelCard = React.memo((props) => {
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(props.data);
  }, [props.data]);
  
  return (
    <div>
      {/* optimized render logic */}
    </div>
  );
});`,
            explanation: 'React.memo prevents re-renders when props haven\'t changed, and useMemo caches expensive calculations'
          }
        });
      }
      
      if (bottleneck.type === 'memory') {
        recommendations.push({
          id: 'memory-leak-cleanup',
          priority: 'critical',
          category: 'code',
          title: 'Fix memory leaks in useEffect cleanup',
          description: 'Properly clean up subscriptions, timers, and event listeners to prevent memory leaks',
          implementation: {
            steps: [
              'Review all useEffect hooks for proper cleanup',
              'Add cleanup functions for event listeners',
              'Cancel pending promises or async operations',
              'Clear intervals and timeouts',
              'Unsubscribe from external subscriptions'
            ],
            estimatedEffort: { hours: 3, complexity: 'moderate' },
            requiredSkills: ['React', 'Memory Management', 'JavaScript'],
            dependencies: []
          },
          expectedImpact: {
            performance: 90,
            maintainability: 85,
            userExperience: 60
          },
          riskLevel: 'low',
          codeExamples: {
            before: `useEffect(() => {
  const subscription = api.subscribe();
  const timer = setInterval(update, 1000);
}, []);`,
            after: `useEffect(() => {
  const subscription = api.subscribe();
  const timer = setInterval(update, 1000);
  
  return () => {
    subscription.unsubscribe();
    clearInterval(timer);
  };
}, []);`,
            explanation: 'The cleanup function ensures resources are properly released when the component unmounts'
          }
        });
      }
    });
    
    // 一般性性能建議
    recommendations.push({
      id: 'performance-monitoring-setup',
      priority: 'high',
      category: 'monitoring',
      title: 'Set up continuous performance monitoring',
      description: 'Implement automated performance monitoring to catch regressions early',
      implementation: {
        steps: [
          'Configure performance budgets',
          'Set up automated performance tests in CI/CD',
          'Implement real-time monitoring alerts',
          'Create performance dashboards'
        ],
        estimatedEffort: { hours: 8, complexity: 'complex' },
        requiredSkills: ['DevOps', 'Monitoring', 'CI/CD'],
        dependencies: ['CI/CD Pipeline', 'Monitoring Infrastructure']
      },
      expectedImpact: {
        performance: 60,
        maintainability: 95,
        userExperience: 70
      },
      riskLevel: 'low'
    });
    
    // 按優先級分組
    return {
      critical: recommendations.filter(r => r.priority === 'critical'),
      high: recommendations.filter(r => r.priority === 'high'),
      medium: recommendations.filter(r => r.priority === 'medium'),
      low: recommendations.filter(r => r.priority === 'low')
    };
  }

  /**
   * 分析系統指標
   */
  private analyzeSystemMetrics(measurements: PerformanceMeasurement[]): DiagnosticResult['systemMetrics'] {
    if (measurements.length === 0) {
      const emptyMetric = {
        current: 0,
        average: 0,
        peak: 0,
        trend: 'stable' as const,
        status: 'critical' as const,
        unit: 'ms',
        threshold: { warning: 0, critical: 0 }
      };
      
      return {
        cpu: emptyMetric,
        memory: { ...emptyMetric, unit: 'MB' },
        network: emptyMetric,
        rendering: emptyMetric
      };
    }
    
    const latest = measurements[measurements.length - 1];
    const renderTimes = measurements.map(m => m.metrics.renderTime);
    const memoryUsages = measurements.map(m => m.metrics.memoryUsage);
    const apiResponseTimes = measurements.map(m => m.metrics.apiResponseTime);
    const interactiveTimes = measurements.map(m => m.metrics.interactiveTime);
    
    return {
      cpu: {
        current: latest.metrics.renderTime,
        average: renderTimes.reduce((sum, val) => sum + val, 0) / renderTimes.length,
        peak: Math.max(...renderTimes),
        trend: this.calculateMetricTrend(renderTimes),
        status: this.getMetricStatus(latest.metrics.renderTime, 150, 300),
        unit: 'ms',
        threshold: { warning: 150, critical: 300 }
      },
      memory: {
        current: latest.metrics.memoryUsage,
        average: memoryUsages.reduce((sum, val) => sum + val, 0) / memoryUsages.length,
        peak: Math.max(...memoryUsages),
        trend: this.calculateMetricTrend(memoryUsages),
        status: this.getMetricStatus(latest.metrics.memoryUsage, 5.0, 8.0),
        unit: 'MB',
        threshold: { warning: 5.0, critical: 8.0 }
      },
      network: {
        current: latest.metrics.apiResponseTime,
        average: apiResponseTimes.reduce((sum, val) => sum + val, 0) / apiResponseTimes.length,
        peak: Math.max(...apiResponseTimes),
        trend: this.calculateMetricTrend(apiResponseTimes),
        status: this.getMetricStatus(latest.metrics.apiResponseTime, 500, 1000),
        unit: 'ms',
        threshold: { warning: 500, critical: 1000 }
      },
      rendering: {
        current: latest.metrics.interactiveTime,
        average: interactiveTimes.reduce((sum, val) => sum + val, 0) / interactiveTimes.length,
        peak: Math.max(...interactiveTimes),
        trend: this.calculateMetricTrend(interactiveTimes),
        status: this.getMetricStatus(latest.metrics.interactiveTime, 150, 250),
        unit: 'ms',
        threshold: { warning: 150, critical: 250 }
      }
    };
  }

  /**
   * 計算指標趋勢
   */
  private calculateMetricTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  /**
   * 獲取指標狀態
   */
  private getMetricStatus(value: number, warning: number, critical: number): SystemMetric['status'] {
    if (value <= warning * 0.8) return 'optimal';
    if (value <= warning) return 'acceptable';
    if (value <= critical) return 'concerning';
    return 'critical';
  }

  /**
   * 執行比較分析
   */
  private performComparisons(
    measurements: PerformanceMeasurement[],
    baseline: PerformanceBaseline
  ): DiagnosticResult['comparisons'] {
    if (measurements.length === 0) {
      const emptyComparison = {
        renderTime: { change: 0, direction: 'stable' as const, significance: 'negligible' as const },
        memoryUsage: { change: 0, direction: 'stable' as const, significance: 'negligible' as const },
        overall: { change: 0, direction: 'stable' as const }
      };
      
      return {
        vsBaseline: emptyComparison,
        vsLastWeek: emptyComparison,
        vsIndustryBenchmark: emptyComparison
      };
    }
    
    const latest = measurements[measurements.length - 1];
    
    // 與基準線比較
    const vsBaseline = this.compareWithBaseline(latest, baseline);
    
    // 與上週比較（簡化處理）
    const vsLastWeek = this.compareWithPreviousPeriod(measurements);
    
    // 與行業基準比較
    const vsIndustryBenchmark = this.compareWithIndustryBenchmark(latest);
    
    return {
      vsBaseline,
      vsLastWeek,
      vsIndustryBenchmark
    };
  }

  /**
   * 與基準線比較
   */
  private compareWithBaseline(
    measurement: PerformanceMeasurement,
    baseline: PerformanceBaseline
  ): ComparisonResult {
    const renderTimeChange = (measurement.metrics.renderTime - baseline.metrics.renderTime.baseline) / baseline.metrics.renderTime.baseline * 100;
    const memoryUsageChange = (measurement.metrics.memoryUsage - baseline.metrics.memoryUsage.baseline) / baseline.metrics.memoryUsage.baseline * 100;
    
    return {
      renderTime: {
        change: renderTimeChange,
        direction: renderTimeChange > 5 ? 'degraded' : renderTimeChange < -5 ? 'improved' : 'stable',
        significance: Math.abs(renderTimeChange) > 20 ? 'high' : Math.abs(renderTimeChange) > 10 ? 'medium' : Math.abs(renderTimeChange) > 5 ? 'low' : 'negligible'
      },
      memoryUsage: {
        change: memoryUsageChange,
        direction: memoryUsageChange > 5 ? 'degraded' : memoryUsageChange < -5 ? 'improved' : 'stable',
        significance: Math.abs(memoryUsageChange) > 30 ? 'high' : Math.abs(memoryUsageChange) > 15 ? 'medium' : Math.abs(memoryUsageChange) > 5 ? 'low' : 'negligible'
      },
      overall: {
        change: (renderTimeChange + memoryUsageChange) / 2,
        direction: (renderTimeChange + memoryUsageChange) / 2 > 5 ? 'degraded' : (renderTimeChange + memoryUsageChange) / 2 < -5 ? 'improved' : 'stable'
      }
    };
  }

  /**
   * 與前期比較
   */
  private compareWithPreviousPeriod(measurements: PerformanceMeasurement[]): ComparisonResult {
    if (measurements.length < 10) {
      return {
        renderTime: { change: 0, direction: 'stable', significance: 'negligible' },
        memoryUsage: { change: 0, direction: 'stable', significance: 'negligible' },
        overall: { change: 0, direction: 'stable' }
      };
    }
    
    const recent = measurements.slice(-5);
    const previous = measurements.slice(-10, -5);
    
    const recentRenderTime = recent.reduce((sum, m) => sum + m.metrics.renderTime, 0) / recent.length;
    const previousRenderTime = previous.reduce((sum, m) => sum + m.metrics.renderTime, 0) / previous.length;
    
    const recentMemoryUsage = recent.reduce((sum, m) => sum + m.metrics.memoryUsage, 0) / recent.length;
    const previousMemoryUsage = previous.reduce((sum, m) => sum + m.metrics.memoryUsage, 0) / previous.length;
    
    const renderTimeChange = (recentRenderTime - previousRenderTime) / previousRenderTime * 100;
    const memoryUsageChange = (recentMemoryUsage - previousMemoryUsage) / previousMemoryUsage * 100;
    
    return {
      renderTime: {
        change: renderTimeChange,
        direction: renderTimeChange > 3 ? 'degraded' : renderTimeChange < -3 ? 'improved' : 'stable',
        significance: Math.abs(renderTimeChange) > 15 ? 'high' : Math.abs(renderTimeChange) > 8 ? 'medium' : Math.abs(renderTimeChange) > 3 ? 'low' : 'negligible'
      },
      memoryUsage: {
        change: memoryUsageChange,
        direction: memoryUsageChange > 3 ? 'degraded' : memoryUsageChange < -3 ? 'improved' : 'stable',
        significance: Math.abs(memoryUsageChange) > 20 ? 'high' : Math.abs(memoryUsageChange) > 10 ? 'medium' : Math.abs(memoryUsageChange) > 3 ? 'low' : 'negligible'
      },
      overall: {
        change: (renderTimeChange + memoryUsageChange) / 2,
        direction: (renderTimeChange + memoryUsageChange) / 2 > 3 ? 'degraded' : (renderTimeChange + memoryUsageChange) / 2 < -3 ? 'improved' : 'stable'
      }
    };
  }

  /**
   * 與行業基準比較
   */
  private compareWithIndustryBenchmark(measurement: PerformanceMeasurement): ComparisonResult {
    const renderTimeChange = (measurement.metrics.renderTime - this.industryBenchmarks.renderTime) / this.industryBenchmarks.renderTime * 100;
    const memoryUsageChange = (measurement.metrics.memoryUsage - this.industryBenchmarks.memoryUsage) / this.industryBenchmarks.memoryUsage * 100;
    
    return {
      renderTime: {
        change: renderTimeChange,
        direction: renderTimeChange > 10 ? 'degraded' : renderTimeChange < -10 ? 'improved' : 'stable',
        significance: Math.abs(renderTimeChange) > 50 ? 'high' : Math.abs(renderTimeChange) > 25 ? 'medium' : Math.abs(renderTimeChange) > 10 ? 'low' : 'negligible'
      },
      memoryUsage: {
        change: memoryUsageChange,
        direction: memoryUsageChange > 10 ? 'degraded' : memoryUsageChange < -10 ? 'improved' : 'stable',
        significance: Math.abs(memoryUsageChange) > 100 ? 'high' : Math.abs(memoryUsageChange) > 50 ? 'medium' : Math.abs(memoryUsageChange) > 10 ? 'low' : 'negligible'
      },
      overall: {
        change: (renderTimeChange + memoryUsageChange) / 2,
        direction: (renderTimeChange + memoryUsageChange) / 2 > 10 ? 'degraded' : (renderTimeChange + memoryUsageChange) / 2 < -10 ? 'improved' : 'stable'
      }
    };
  }

  /**
   * 生成性能預測
   */
  private generatePredictions(measurements: PerformanceMeasurement[]): DiagnosticResult['predictions'] {
    if (measurements.length < 5) {
      const emptyPrediction = {
        predicted: 0,
        confidence: 0,
        range: { min: 0, max: 0 }
      };
      
      return {
        nextWeek: {
          renderTime: emptyPrediction,
          memoryUsage: emptyPrediction,
          overallHealth: { predicted: 0, confidence: 0 }
        },
        nextMonth: {
          renderTime: emptyPrediction,
          memoryUsage: emptyPrediction,
          overallHealth: { predicted: 0, confidence: 0 }
        }
      };
    }
    
    const renderTimes = measurements.map(m => m.metrics.renderTime);
    const memoryUsages = measurements.map(m => m.metrics.memoryUsage);
    
    // 簡化的線性預測
    const renderTimePrediction = this.predictMetric(renderTimes);
    const memoryUsagePrediction = this.predictMetric(memoryUsages);
    
    return {
      nextWeek: {
        renderTime: renderTimePrediction,
        memoryUsage: memoryUsagePrediction,
        overallHealth: {
          predicted: Math.max(0, 100 - (renderTimePrediction.predicted / 3) - (memoryUsagePrediction.predicted * 10)),
          confidence: (renderTimePrediction.confidence + memoryUsagePrediction.confidence) / 2
        }
      },
      nextMonth: {
        renderTime: {
          predicted: renderTimePrediction.predicted * 1.1,
          confidence: Math.max(0.1, renderTimePrediction.confidence - 0.2),
          range: {
            min: renderTimePrediction.range.min * 0.8,
            max: renderTimePrediction.range.max * 1.3
          }
        },
        memoryUsage: {
          predicted: memoryUsagePrediction.predicted * 1.1,
          confidence: Math.max(0.1, memoryUsagePrediction.confidence - 0.2),
          range: {
            min: memoryUsagePrediction.range.min * 0.8,
            max: memoryUsagePrediction.range.max * 1.3
          }
        },
        overallHealth: {
          predicted: Math.max(0, 95 - (renderTimePrediction.predicted / 2.5) - (memoryUsagePrediction.predicted * 12)),
          confidence: (renderTimePrediction.confidence + memoryUsagePrediction.confidence) / 2 - 0.15
        }
      }
    };
  }

  /**
   * 預測單一指標
   */
  private predictMetric(values: number[]): PerformancePrediction['renderTime'] {
    if (values.length < 3) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      return {
        predicted: avg,
        confidence: 0.3,
        range: { min: avg * 0.8, max: avg * 1.2 }
      };
    }
    
    // 簡化的線性回歸預測
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predicted = slope * n + intercept;
    const residuals = y.map((yi, i) => yi - (slope * x[i] + intercept));
    const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / n);
    
    // 計算置信度
    const mean = sumY / n;
    const totalVariation = y.reduce((sum, yi) => sum + Math.pow(yi - mean, 2), 0);
    const r2 = Math.max(0, 1 - (residuals.reduce((sum, r) => sum + r * r, 0) / totalVariation));
    
    return {
      predicted: Math.max(0, predicted),
      confidence: Math.min(0.9, Math.max(0.1, r2)),
      range: {
        min: Math.max(0, predicted - rmse * 1.96),
        max: predicted + rmse * 1.96
      }
    };
  }
}

// 創建單例實例
export const performanceDiagnostics = new PerformanceDiagnostics();

// 便利函數
export async function diagnosePerformance(
  componentName: string,
  measurements: PerformanceMeasurement[],
  baseline: PerformanceBaseline,
  regressionResult?: AdvancedRegressionResult
): Promise<DiagnosticResult> {
  return await performanceDiagnostics.performComprehensiveDiagnosis(
    componentName,
    measurements,
    baseline,
    regressionResult
  );
}
