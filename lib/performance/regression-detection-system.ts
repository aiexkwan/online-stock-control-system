/**
 * Performance Regression Detection System
 * 
 * 高級性能回歸檢測系統，使用統計分析和機器學習技術
 * 提供精確的性能回歸識別和預測功能
 */

import {
  PerformanceMeasurement,
  RegressionDetectionResult,
  PerformanceBaseline
} from './performance-baseline-framework';

// 統計分析結果介面
export interface StatisticalAnalysis {
  metric: string;
  trend: 'improving' | 'stable' | 'degrading';
  confidence: number; // 0-1
  significance: number; // p-value
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    min: number;
    max: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  changePoint: {
    detected: boolean;
    timestamp?: number;
    beforeMean: number;
    afterMean: number;
    changePercent: number;
  };
}

// 進階回歸檢測結果
export interface AdvancedRegressionResult {
  componentName: string;
  timestamp: number;
  analysisWindow: {
    start: number;
    end: number;
    sampleSize: number;
  };
  metrics: {
    renderTime: StatisticalAnalysis;
    memoryUsage: StatisticalAnalysis;
    apiResponseTime: StatisticalAnalysis;
    interactiveTime: StatisticalAnalysis;
  };
  overallHealth: {
    score: number; // 0-100
    trend: 'improving' | 'stable' | 'degrading';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  predictions: {
    nextWeek: {
      renderTime: { min: number; max: number; confidence: number };
      memoryUsage: { min: number; max: number; confidence: number };
    };
    nextMonth: {
      renderTime: { min: number; max: number; confidence: number };
      memoryUsage: { min: number; max: number; confidence: number };
    };
  };
}

/**
 * 性能回歸檢測系統類
 */
export class RegressionDetectionSystem {
  private historyData: Map<string, PerformanceMeasurement[]> = new Map();
  private baselineData: Map<string, PerformanceBaseline> = new Map();
  private detectionConfig = {
    minSampleSize: 10, // 最小樣本數量
    analysisWindowDays: 7, // 分析視窗天數
    significanceLevel: 0.05, // 顯著性水準
    changePointSensitivity: 0.1, // 變化點敏感度
  };

  /**
   * 新增測量數據
   */
  addMeasurement(componentName: string, measurement: PerformanceMeasurement): void {
    if (!this.historyData.has(componentName)) {
      this.historyData.set(componentName, []);
    }
    
    const history = this.historyData.get(componentName)!;
    history.push(measurement);
    
    // 保持最多200個測量記錄
    if (history.length > 200) {
      history.splice(0, history.length - 200);
    }
    
    this.historyData.set(componentName, history);
  }

  /**
   * 設置基準線數據
   */
  setBaseline(componentName: string, baseline: PerformanceBaseline): void {
    this.baselineData.set(componentName, baseline);
  }

  /**
   * 執行進階回歸檢測
   */
  async detectAdvancedRegression(componentName: string): Promise<AdvancedRegressionResult> {
    const history = this.historyData.get(componentName) || [];
    const baseline = this.baselineData.get(componentName);
    
    if (history.length < this.detectionConfig.minSampleSize) {
      throw new Error(`Insufficient data for regression analysis. Need at least ${this.detectionConfig.minSampleSize} measurements.`);
    }
    
    const analysisWindow = this.getAnalysisWindow();
    const relevantData = history.filter(m => 
      m.timestamp >= analysisWindow.start && m.timestamp <= analysisWindow.end
    );
    
    if (relevantData.length === 0) {
      throw new Error('No data available in the analysis window');
    }
    
    console.log(`[RegressionDetection] Analyzing ${relevantData.length} measurements for ${componentName}`);
    
    // 對每個指標執行統計分析
    const renderTimeAnalysis = await this.performStatisticalAnalysis(
      'renderTime',
      relevantData.map(m => m.metrics.renderTime)
    );
    
    const memoryUsageAnalysis = await this.performStatisticalAnalysis(
      'memoryUsage',
      relevantData.map(m => m.metrics.memoryUsage)
    );
    
    const apiResponseTimeAnalysis = await this.performStatisticalAnalysis(
      'apiResponseTime',
      relevantData.map(m => m.metrics.apiResponseTime)
    );
    
    const interactiveTimeAnalysis = await this.performStatisticalAnalysis(
      'interactiveTime',
      relevantData.map(m => m.metrics.interactiveTime)
    );
    
    // 計算整體健康度
    const overallHealth = this.calculateOverallHealth([
      renderTimeAnalysis,
      memoryUsageAnalysis,
      apiResponseTimeAnalysis,
      interactiveTimeAnalysis
    ]);
    
    // 生成建議
    const recommendations = this.generateRecommendations(
      renderTimeAnalysis,
      memoryUsageAnalysis,
      apiResponseTimeAnalysis,
      interactiveTimeAnalysis,
      baseline
    );
    
    // 生成預測
    const predictions = this.generatePredictions(relevantData);
    
    return {
      componentName,
      timestamp: Date.now(),
      analysisWindow: {
        start: analysisWindow.start,
        end: analysisWindow.end,
        sampleSize: relevantData.length,
      },
      metrics: {
        renderTime: renderTimeAnalysis,
        memoryUsage: memoryUsageAnalysis,
        apiResponseTime: apiResponseTimeAnalysis,
        interactiveTime: interactiveTimeAnalysis,
      },
      overallHealth,
      recommendations,
      predictions,
    };
  }

  /**
   * 執行統計分析
   */
  private async performStatisticalAnalysis(
    metricName: string,
    values: number[]
  ): Promise<StatisticalAnalysis> {
    if (values.length === 0) {
      throw new Error(`No values provided for metric: ${metricName}`);
    }
    
    // 過濾異常值
    const filteredValues = this.removeOutliers(values);
    
    // 計算基本統計指標
    const sorted = [...filteredValues].sort((a, b) => a - b);
    const mean = filteredValues.reduce((sum, val) => sum + val, 0) / filteredValues.length;
    const median = this.calculatePercentile(sorted, 0.5);
    const variance = filteredValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / filteredValues.length;
    const stdDev = Math.sqrt(variance);
    
    const statistics = {
      mean,
      median,
      stdDev,
      variance,
      min: Math.min(...filteredValues),
      max: Math.max(...filteredValues),
      percentiles: {
        p25: this.calculatePercentile(sorted, 0.25),
        p50: this.calculatePercentile(sorted, 0.5),
        p75: this.calculatePercentile(sorted, 0.75),
        p90: this.calculatePercentile(sorted, 0.9),
        p95: this.calculatePercentile(sorted, 0.95),
        p99: this.calculatePercentile(sorted, 0.99),
      },
    };
    
    // 識別趋勢
    const trend = this.identifyTrend(values);
    
    // 計算置信度和顯著性
    const { confidence, significance } = this.calculateStatisticalSignificance(values, trend);
    
    // 檢測變化點
    const changePoint = this.detectChangePoint(values);
    
    return {
      metric: metricName,
      trend,
      confidence,
      significance,
      statistics,
      changePoint,
    };
  }

  /**
   * 移除異常值（使用IQR方法）
   */
  private removeOutliers(values: number[]): number[] {
    if (values.length < 4) {
      return values; // 数据太少，不过滤
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = this.calculatePercentile(sorted, 0.25);
    const q3 = this.calculatePercentile(sorted, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(value => value >= lowerBound && value <= upperBound);
  }

  /**
   * 計算百分位數
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    if (sortedValues.length === 1) return sortedValues[0];
    
    const index = percentile * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (upper >= sortedValues.length) {
      return sortedValues[sortedValues.length - 1];
    }
    
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * 識別性能趋勢
   */
  private identifyTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 5) {
      return 'stable';
    }
    
    // 使用線性回歸識別趋勢
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // 計算趋勢顯著性
    const meanX = sumX / n;
    const meanY = sumY / n;
    const ssxx = x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0);
    const ssyy = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const ssxy = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
    
    const r = ssxy / Math.sqrt(ssxx * ssyy); // 相關係數
    const significance = Math.abs(r);
    
    // 根據斜率和顯著性判斷趋勢
    if (significance < 0.1) {
      return 'stable';
    } else if (slope > 0) {
      return 'degrading'; // 對於性能指標，上升表示惡化
    } else {
      return 'improving';
    }
  }

  /**
   * 計算統計顯著性
   */
  private calculateStatisticalSignificance(
    values: number[],
    trend: 'improving' | 'stable' | 'degrading'
  ): { confidence: number; significance: number } {
    if (values.length < 3) {
      return { confidence: 0, significance: 1 };
    }
    
    // 簡化的顯著性檢驗（正常情況下應使用更精確的統計檢驗）
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdError = Math.sqrt(variance / n);
    
    // 計算t統計量和p值的簡化版本
    const tStat = mean / stdError;
    const pValue = this.calculatePValue(Math.abs(tStat), n - 1);
    
    const confidence = trend === 'stable' ? 0.5 : Math.max(0, 1 - pValue);
    
    return {
      confidence,
      significance: pValue,
    };
  }

  /**
   * 簡化的p值計算（正常情況下應使用更精確的統計庫）
   */
  private calculatePValue(tStat: number, df: number): number {
    // 這是一個非常簡化的近似值，實際應用中應使用專業統計庫
    if (tStat < 1) return 0.3;
    if (tStat < 2) return 0.1;
    if (tStat < 3) return 0.01;
    return 0.001;
  }

  /**
   * 檢測變化點
   */
  private detectChangePoint(values: number[]): StatisticalAnalysis['changePoint'] {
    if (values.length < 10) {
      return {
        detected: false,
        beforeMean: 0,
        afterMean: 0,
        changePercent: 0,
      };
    }
    
    let maxChangePoint = {
      index: -1,
      change: 0,
      beforeMean: 0,
      afterMean: 0,
    };
    
    // 在中間部分尋找變化點（避免端點）
    const startIndex = Math.floor(values.length * 0.2);
    const endIndex = Math.floor(values.length * 0.8);
    
    for (let i = startIndex; i < endIndex; i++) {
      const beforeValues = values.slice(0, i + 1);
      const afterValues = values.slice(i + 1);
      
      if (beforeValues.length < 3 || afterValues.length < 3) continue;
      
      const beforeMean = beforeValues.reduce((sum, val) => sum + val, 0) / beforeValues.length;
      const afterMean = afterValues.reduce((sum, val) => sum + val, 0) / afterValues.length;
      
      const change = Math.abs(afterMean - beforeMean) / beforeMean;
      
      if (change > maxChangePoint.change) {
        maxChangePoint = {
          index: i,
          change,
          beforeMean,
          afterMean,
        };
      }
    }
    
    const isSignificant = maxChangePoint.change > this.detectionConfig.changePointSensitivity;
    
    return {
      detected: isSignificant,
      timestamp: isSignificant ? Date.now() - (values.length - maxChangePoint.index) * 60000 : undefined,
      beforeMean: maxChangePoint.beforeMean,
      afterMean: maxChangePoint.afterMean,
      changePercent: maxChangePoint.change * 100,
    };
  }

  /**
   * 計算整體健康度
   */
  private calculateOverallHealth(analyses: StatisticalAnalysis[]): AdvancedRegressionResult['overallHealth'] {
    let score = 100;
    let degradingCount = 0;
    let improvingCount = 0;
    let highConfidenceIssues = 0;
    
    analyses.forEach(analysis => {
      if (analysis.trend === 'degrading') {
        degradingCount++;
        if (analysis.confidence > 0.8) {
          score -= 25;
          highConfidenceIssues++;
        } else if (analysis.confidence > 0.5) {
          score -= 15;
        } else {
          score -= 5;
        }
      } else if (analysis.trend === 'improving') {
        improvingCount++;
        score += 5; // 性能改進加分
      }
      
      // 變化點罰分
      if (analysis.changePoint.detected && analysis.changePoint.changePercent > 20) {
        score -= 10;
      }
    });
    
    score = Math.max(0, Math.min(100, score));
    
    // 決定整體趋勢
    let trend: 'improving' | 'stable' | 'degrading';
    if (degradingCount > improvingCount) {
      trend = 'degrading';
    } else if (improvingCount > degradingCount) {
      trend = 'improving';
    } else {
      trend = 'stable';
    }
    
    // 決定風險等級
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) {
      riskLevel = 'low';
    } else if (score >= 60) {
      riskLevel = 'medium';
    } else if (score >= 40) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }
    
    return {
      score,
      trend,
      riskLevel,
    };
  }

  /**
   * 生成建議
   */
  private generateRecommendations(
    renderTimeAnalysis: StatisticalAnalysis,
    memoryUsageAnalysis: StatisticalAnalysis,
    apiResponseTimeAnalysis: StatisticalAnalysis,
    interactiveTimeAnalysis: StatisticalAnalysis,
    baseline?: PerformanceBaseline
  ): AdvancedRegressionResult['recommendations'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    
    // 渲染時間建議
    if (renderTimeAnalysis.trend === 'degrading' && renderTimeAnalysis.confidence > 0.7) {
      immediate.push('Investigate recent changes that may have affected render performance');
      immediate.push('Check for new heavy computations or unnecessary re-renders');
      shortTerm.push('Implement React.memo for expensive components');
      shortTerm.push('Optimize component prop drilling and state management');
      longTerm.push('Consider component architecture refactoring for better performance');
    }
    
    if (renderTimeAnalysis.changePoint.detected) {
      immediate.push(`Performance regression detected around ${new Date(renderTimeAnalysis.changePoint.timestamp || 0).toLocaleString()}`);
      immediate.push('Review code changes made during the detected timeframe');
    }
    
    // 記憶體使用建議
    if (memoryUsageAnalysis.trend === 'degrading' && memoryUsageAnalysis.confidence > 0.7) {
      immediate.push('Check for memory leaks in component cleanup functions');
      immediate.push('Review useEffect dependencies and cleanup procedures');
      shortTerm.push('Implement proper resource cleanup in all components');
      shortTerm.push('Consider using React DevTools Profiler to identify memory issues');
      longTerm.push('Implement memory usage monitoring and alerting');
    }
    
    // API響應時間建議
    if (apiResponseTimeAnalysis.trend === 'degrading' && apiResponseTimeAnalysis.confidence > 0.6) {
      immediate.push('Check database query performance and server load');
      shortTerm.push('Implement API response caching where appropriate');
      shortTerm.push('Review database indexes and query optimization');
      longTerm.push('Consider implementing GraphQL query batching and DataLoader');
    }
    
    // 交互時間建議
    if (interactiveTimeAnalysis.trend === 'degrading' && interactiveTimeAnalysis.confidence > 0.6) {
      immediate.push('Optimize user interaction handlers and debounce inputs');
      shortTerm.push('Implement progressive loading for heavy UI components');
      longTerm.push('Consider implementing virtual scrolling for large lists');
    }
    
    // 如果沒有發現問題，提供維護建議
    if (immediate.length === 0) {
      shortTerm.push('Continue monitoring performance metrics regularly');
      shortTerm.push('Set up automated performance regression alerts');
      longTerm.push('Plan regular performance reviews and optimization cycles');
    }
    
    return {
      immediate,
      shortTerm,
      longTerm,
    };
  }

  /**
   * 生成性能預測
   */
  private generatePredictions(measurements: PerformanceMeasurement[]): AdvancedRegressionResult['predictions'] {
    if (measurements.length < 5) {
      return {
        nextWeek: {
          renderTime: { min: 0, max: 0, confidence: 0 },
          memoryUsage: { min: 0, max: 0, confidence: 0 },
        },
        nextMonth: {
          renderTime: { min: 0, max: 0, confidence: 0 },
          memoryUsage: { min: 0, max: 0, confidence: 0 },
        },
      };
    }
    
    const renderTimes = measurements.map(m => m.metrics.renderTime);
    const memoryUsages = measurements.map(m => m.metrics.memoryUsage);
    
    // 簡化的線性預測模型
    const renderTimePrediction = this.predictLinearTrend(renderTimes);
    const memoryUsagePrediction = this.predictLinearTrend(memoryUsages);
    
    return {
      nextWeek: {
        renderTime: {
          min: Math.max(0, renderTimePrediction.value - renderTimePrediction.margin),
          max: renderTimePrediction.value + renderTimePrediction.margin,
          confidence: renderTimePrediction.confidence,
        },
        memoryUsage: {
          min: Math.max(0, memoryUsagePrediction.value - memoryUsagePrediction.margin),
          max: memoryUsagePrediction.value + memoryUsagePrediction.margin,
          confidence: memoryUsagePrediction.confidence,
        },
      },
      nextMonth: {
        renderTime: {
          min: Math.max(0, renderTimePrediction.value * 1.2 - renderTimePrediction.margin * 2),
          max: renderTimePrediction.value * 1.2 + renderTimePrediction.margin * 2,
          confidence: Math.max(0.1, renderTimePrediction.confidence - 0.2),
        },
        memoryUsage: {
          min: Math.max(0, memoryUsagePrediction.value * 1.2 - memoryUsagePrediction.margin * 2),
          max: memoryUsagePrediction.value * 1.2 + memoryUsagePrediction.margin * 2,
          confidence: Math.max(0.1, memoryUsagePrediction.confidence - 0.2),
        },
      },
    };
  }

  /**
   * 簡化的線性趋勢預測
   */
  private predictLinearTrend(values: number[]): {
    value: number;
    margin: number;
    confidence: number;
  } {
    if (values.length < 3) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      return {
        value: avg,
        margin: avg * 0.1,
        confidence: 0.3,
      };
    }
    
    // 簡化的線性回歸
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 預測下一個值
    const nextX = n;
    const predictedValue = slope * nextX + intercept;
    
    // 計算誤差和置信度
    const predictions = x.map(xi => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / n;
    const rmse = Math.sqrt(mse);
    
    // 簡化的置信度計算
    const r2 = this.calculateRSquared(y, predictions);
    const confidence = Math.max(0.1, Math.min(0.9, r2));
    
    return {
      value: Math.max(0, predictedValue),
      margin: rmse * 1.96, // 95%置信區間
      confidence,
    };
  }

  /**
   * 計算R平方
   */
  private calculateRSquared(actual: number[], predicted: number[]): number {
    const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    
    return ssTotal === 0 ? 0 : 1 - (ssRes / ssTotal);
  }

  /**
   * 獲取分析視窗
   */
  private getAnalysisWindow(): { start: number; end: number } {
    const now = Date.now();
    const windowMs = this.detectionConfig.analysisWindowDays * 24 * 60 * 60 * 1000;
    
    return {
      start: now - windowMs,
      end: now,
    };
  }

  /**
   * 更新檢測配置
   */
  updateConfig(config: Partial<typeof this.detectionConfig>): void {
    this.detectionConfig = { ...this.detectionConfig, ...config };
    console.log('[RegressionDetection] Configuration updated:', this.detectionConfig);
  }

  /**
   * 獲取檢測配置
   */
  getConfig(): typeof this.detectionConfig {
    return { ...this.detectionConfig };
  }

  /**
   * 清除數據
   */
  clearData(componentName?: string): void {
    if (componentName) {
      this.historyData.delete(componentName);
      this.baselineData.delete(componentName);
    } else {
      this.historyData.clear();
      this.baselineData.clear();
    }
    console.log(`[RegressionDetection] Data cleared${componentName ? ` for ${componentName}` : ''}`);
  }
}

// 創建單例實例
export const regressionDetectionSystem = new RegressionDetectionSystem();

// 便利函數
export async function detectPerformanceRegression(
  componentName: string,
  measurements: PerformanceMeasurement[]
): Promise<AdvancedRegressionResult> {
  // 添加測量数据
  measurements.forEach(measurement => {
    regressionDetectionSystem.addMeasurement(componentName, measurement);
  });
  
  // 執行進階回歸檢測
  return await regressionDetectionSystem.detectAdvancedRegression(componentName);
}
