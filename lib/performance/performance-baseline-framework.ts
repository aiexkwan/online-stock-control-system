/**
 * Performance Baseline Framework
 * 
 * 建立系統性能測試基準線和監控機制
 * 專門為GRNLabelCard等關鍵組件設計
 */

import { performance, PerformanceObserver } from 'perf_hooks';

// 性能指標類型定義
export interface PerformanceBaseline {
  componentName: string;
  metrics: {
    renderTime: {
      baseline: number;
      threshold: {
        warning: number;
        critical: number;
      };
      unit: 'ms';
    };
    memoryUsage: {
      baseline: number;
      threshold: {
        warning: number;
        critical: number;
      };
      unit: 'MB';
    };
    apiResponseTime: {
      baseline: number;
      threshold: {
        warning: number;
        critical: number;
      };
      unit: 'ms';
    };
    interactiveTime: {
      baseline: number;
      threshold: {
        warning: number;
        critical: number;
      };
      unit: 'ms';
    };
    bundleSize: {
      baseline: number;
      threshold: {
        warning: number;
        critical: number;
      };
      unit: 'KB';
    };
  };
  timestamp: number;
  version: string;
}

// 測量結果介面
export interface PerformanceMeasurement {
  componentName: string;
  testName: string;
  metrics: {
    renderTime: number;
    memoryUsage: number;
    apiResponseTime: number;
    interactiveTime: number;
    bundleSize: number;
  };
  webVitals: {
    LCP?: number; // Largest Contentful Paint
    FID?: number; // First Input Delay
    CLS?: number; // Cumulative Layout Shift
    FCP?: number; // First Contentful Paint
    TTFB?: number; // Time to First Byte
  };
  timestamp: number;
  environment: {
    userAgent: string;
    viewportSize: { width: number; height: number };
    deviceType: 'mobile' | 'tablet' | 'desktop';
    networkCondition: 'fast' | 'slow' | 'offline';
  };
}

// 性能回歸檢測結果
export interface RegressionDetectionResult {
  componentName: string;
  hasRegression: boolean;
  regressionDetails: {
    metric: string;
    currentValue: number;
    baselineValue: number;
    percentageChange: number;
    severity: 'warning' | 'critical';
  }[];
  recommendations: string[];
  timestamp: number;
}

// GRNLabelCard 性能基準配置
export const GRN_LABEL_CARD_BASELINE: PerformanceBaseline = {
  componentName: 'GRNLabelCard',
  metrics: {
    renderTime: {
      baseline: 150, // 初始渲染時間基準：150ms
      threshold: {
        warning: 200, // 超過200ms警告
        critical: 300, // 超過300ms嚴重警告
      },
      unit: 'ms',
    },
    memoryUsage: {
      baseline: 2.5, // 記憶體使用基準：2.5MB
      threshold: {
        warning: 5.0, // 超過5MB警告
        critical: 8.0, // 超過8MB嚴重警告
      },
      unit: 'MB',
    },
    apiResponseTime: {
      baseline: 300, // API回應時間基準：300ms
      threshold: {
        warning: 500, // 超過500ms警告
        critical: 1000, // 超過1000ms嚴重警告
      },
      unit: 'ms',
    },
    interactiveTime: {
      baseline: 100, // 互動響應時間基準：100ms
      threshold: {
        warning: 150, // 超過150ms警告
        critical: 250, // 超過250ms嚴重警告
      },
      unit: 'ms',
    },
    bundleSize: {
      baseline: 45, // Bundle大小基準：45KB
      threshold: {
        warning: 60, // 超過60KB警告
        critical: 80, // 超過80KB嚴重警告
      },
      unit: 'KB',
    },
  },
  timestamp: Date.now(),
  version: '1.0.0',
};

/**
 * 性能基準測試框架類
 */
export class PerformanceBaselineFramework {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private measurements: PerformanceMeasurement[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private isMonitoring = false;

  constructor() {
    // 預設載入GRNLabelCard基準
    this.setBaseline(GRN_LABEL_CARD_BASELINE);
    this.initializePerformanceObserver();
  }

  /**
   * 設置性能基準線
   */
  setBaseline(baseline: PerformanceBaseline): void {
    this.baselines.set(baseline.componentName, baseline);
    console.log(`[PerformanceBaseline] Set baseline for ${baseline.componentName}`);
  }

  /**
   * 獲取性能基準線
   */
  getBaseline(componentName: string): PerformanceBaseline | null {
    return this.baselines.get(componentName) || null;
  }

  /**
   * 初始化性能觀察器
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      console.warn('[PerformanceBaseline] PerformanceObserver not available');
      return;
    }

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint']
      });
    } catch (error) {
      console.error('[PerformanceBaseline] Failed to initialize PerformanceObserver:', error);
    }
  }

  /**
   * 處理性能條目
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (!this.isMonitoring) return;

    const measurement: Partial<PerformanceMeasurement> = {
      timestamp: Date.now(),
      testName: entry.name,
    };

    // 根據entry類型收集不同的指標
    switch (entry.entryType) {
      case 'measure':
        if (entry.name.includes('render')) {
          measurement.metrics = {
            ...measurement.metrics,
            renderTime: entry.duration,
          };
        }
        break;
      case 'largest-contentful-paint':
        measurement.webVitals = {
          ...measurement.webVitals,
          LCP: entry.startTime,
        };
        break;
      case 'first-input':
        measurement.webVitals = {
          ...measurement.webVitals,
          FID: (entry as any).processingStart - entry.startTime,
        };
        break;
    }
  }

  /**
   * 開始性能監控
   */
  startMonitoring(componentName: string): void {
    this.isMonitoring = true;
    console.log(`[PerformanceBaseline] Started monitoring ${componentName}`);
    
    // 標記測量開始
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${componentName}-start`);
    }
  }

  /**
   * 停止性能監控並收集測量結果
   */
  stopMonitoring(componentName: string): PerformanceMeasurement | null {
    this.isMonitoring = false;
    
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    try {
      // 標記測量結束
      window.performance.mark(`${componentName}-end`);
      
      // 測量總時間
      window.performance.measure(
        `${componentName}-total`,
        `${componentName}-start`,
        `${componentName}-end`
      );

      const measurement: PerformanceMeasurement = {
        componentName,
        testName: `${componentName}-baseline-test`,
        metrics: {
          renderTime: this.getRenderTime(componentName),
          memoryUsage: this.getMemoryUsage(),
          apiResponseTime: 0, // 將在實際測試中設置
          interactiveTime: 0, // 將在實際測試中設置
          bundleSize: 0, // 將在構建時分析中設置
        },
        webVitals: this.collectWebVitals(),
        timestamp: Date.now(),
        environment: this.getEnvironmentInfo(),
      };

      this.measurements.push(measurement);
      console.log(`[PerformanceBaseline] Stopped monitoring ${componentName}`, measurement);
      
      return measurement;
    } catch (error) {
      console.error('[PerformanceBaseline] Error stopping monitoring:', error);
      return null;
    }
  }

  /**
   * 獲取渲染時間
   */
  private getRenderTime(componentName: string): number {
    if (typeof window === 'undefined' || !window.performance) {
      return 0;
    }

    const measures = window.performance.getEntriesByName(`${componentName}-total`, 'measure');
    return measures.length > 0 ? measures[0].duration : 0;
  }

  /**
   * 獲取記憶體使用量
   */
  private getMemoryUsage(): number {
    if (typeof window === 'undefined' || !(window.performance as any).memory) {
      return 0;
    }

    const memory = (window.performance as any).memory;
    return memory.usedJSHeapSize / (1024 * 1024); // 轉換為MB
  }

  /**
   * 收集Web Vitals指標
   */
  private collectWebVitals(): PerformanceMeasurement['webVitals'] {
    if (typeof window === 'undefined' || !window.performance) {
      return {};
    }

    const vitals: PerformanceMeasurement['webVitals'] = {};

    // 收集 LCP
    const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.LCP = lcpEntries[lcpEntries.length - 1].startTime;
    }

    // 收集 FCP
    const fcpEntries = window.performance.getEntriesByName('first-contentful-paint');
    if (fcpEntries.length > 0) {
      vitals.FCP = fcpEntries[0].startTime;
    }

    // 收集 TTFB
    const navEntries = window.performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      vitals.TTFB = nav.responseStart - nav.requestStart;
    }

    return vitals;
  }

  /**
   * 獲取環境信息
   */
  private getEnvironmentInfo(): PerformanceMeasurement['environment'] {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'Server',
        viewportSize: { width: 0, height: 0 },
        deviceType: 'desktop',
        networkCondition: 'fast',
      };
    }

    const viewport = {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
    };

    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (viewport.width < 768) deviceType = 'mobile';
    else if (viewport.width < 1024) deviceType = 'tablet';

    return {
      userAgent: navigator.userAgent,
      viewportSize: viewport,
      deviceType,
      networkCondition: this.detectNetworkCondition(),
    };
  }

  /**
   * 檢測網絡狀況
   */
  private detectNetworkCondition(): 'fast' | 'slow' | 'offline' {
    if (typeof navigator === 'undefined') {
      return 'fast';
    }

    if (!navigator.onLine) {
      return 'offline';
    }

    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return 'slow';
      }
    }

    return 'fast';
  }

  /**
   * 執行性能回歸檢測
   */
  detectRegression(
    componentName: string,
    currentMeasurement: PerformanceMeasurement
  ): RegressionDetectionResult {
    const baseline = this.getBaseline(componentName);
    if (!baseline) {
      throw new Error(`No baseline found for component: ${componentName}`);
    }

    const regressionDetails: RegressionDetectionResult['regressionDetails'] = [];
    const recommendations: string[] = [];

    // 檢查渲染時間
    if (currentMeasurement.metrics.renderTime > baseline.metrics.renderTime.threshold.warning) {
      const percentageChange = (
        (currentMeasurement.metrics.renderTime - baseline.metrics.renderTime.baseline) /
        baseline.metrics.renderTime.baseline
      ) * 100;

      const severity = currentMeasurement.metrics.renderTime > baseline.metrics.renderTime.threshold.critical
        ? 'critical'
        : 'warning';

      regressionDetails.push({
        metric: 'renderTime',
        currentValue: currentMeasurement.metrics.renderTime,
        baselineValue: baseline.metrics.renderTime.baseline,
        percentageChange,
        severity,
      });

      if (severity === 'critical') {
        recommendations.push('Consider optimizing component rendering with React.memo or useMemo');
        recommendations.push('Check for unnecessary re-renders and heavy computations');
      } else {
        recommendations.push('Monitor render time trends and consider minor optimizations');
      }
    }

    // 檢查記憶體使用
    if (currentMeasurement.metrics.memoryUsage > baseline.metrics.memoryUsage.threshold.warning) {
      const percentageChange = (
        (currentMeasurement.metrics.memoryUsage - baseline.metrics.memoryUsage.baseline) /
        baseline.metrics.memoryUsage.baseline
      ) * 100;

      const severity = currentMeasurement.metrics.memoryUsage > baseline.metrics.memoryUsage.threshold.critical
        ? 'critical'
        : 'warning';

      regressionDetails.push({
        metric: 'memoryUsage',
        currentValue: currentMeasurement.metrics.memoryUsage,
        baselineValue: baseline.metrics.memoryUsage.baseline,
        percentageChange,
        severity,
      });

      if (severity === 'critical') {
        recommendations.push('Check for memory leaks in useEffect cleanup functions');
        recommendations.push('Review large object references and cleanup procedures');
      } else {
        recommendations.push('Monitor memory usage patterns for gradual increases');
      }
    }

    // 檢查API響應時間
    if (currentMeasurement.metrics.apiResponseTime > baseline.metrics.apiResponseTime.threshold.warning) {
      const percentageChange = (
        (currentMeasurement.metrics.apiResponseTime - baseline.metrics.apiResponseTime.baseline) /
        baseline.metrics.apiResponseTime.baseline
      ) * 100;

      const severity = currentMeasurement.metrics.apiResponseTime > baseline.metrics.apiResponseTime.threshold.critical
        ? 'critical'
        : 'warning';

      regressionDetails.push({
        metric: 'apiResponseTime',
        currentValue: currentMeasurement.metrics.apiResponseTime,
        baselineValue: baseline.metrics.apiResponseTime.baseline,
        percentageChange,
        severity,
      });

      recommendations.push('Review database query performance and indexing');
      recommendations.push('Consider implementing query result caching');
    }

    return {
      componentName,
      hasRegression: regressionDetails.length > 0,
      regressionDetails,
      recommendations,
      timestamp: Date.now(),
    };
  }

  /**
   * 獲取所有測量結果
   */
  getMeasurements(componentName?: string): PerformanceMeasurement[] {
    if (componentName) {
      return this.measurements.filter(m => m.componentName === componentName);
    }
    return [...this.measurements];
  }

  /**
   * 清除測量歷史
   */
  clearMeasurements(componentName?: string): void {
    if (componentName) {
      this.measurements = this.measurements.filter(m => m.componentName !== componentName);
    } else {
      this.measurements = [];
    }
  }

  /**
   * 生成性能報告
   */
  generatePerformanceReport(componentName: string): {
    baseline: PerformanceBaseline;
    measurements: PerformanceMeasurement[];
    latestRegression: RegressionDetectionResult | null;
    summary: {
      averageRenderTime: number;
      averageMemoryUsage: number;
      totalTests: number;
      regressionCount: number;
    };
  } {
    const baseline = this.getBaseline(componentName);
    const measurements = this.getMeasurements(componentName);
    
    if (!baseline) {
      throw new Error(`No baseline found for component: ${componentName}`);
    }

    let latestRegression: RegressionDetectionResult | null = null;
    let regressionCount = 0;

    if (measurements.length > 0) {
      const latestMeasurement = measurements[measurements.length - 1];
      latestRegression = this.detectRegression(componentName, latestMeasurement);
      
      // 計算回歸次數
      regressionCount = measurements.filter(m => {
        const regression = this.detectRegression(componentName, m);
        return regression.hasRegression;
      }).length;
    }

    // 計算平均值
    const averageRenderTime = measurements.length > 0 
      ? measurements.reduce((sum, m) => sum + m.metrics.renderTime, 0) / measurements.length
      : 0;
    
    const averageMemoryUsage = measurements.length > 0
      ? measurements.reduce((sum, m) => sum + m.metrics.memoryUsage, 0) / measurements.length
      : 0;

    return {
      baseline,
      measurements,
      latestRegression,
      summary: {
        averageRenderTime,
        averageMemoryUsage,
        totalTests: measurements.length,
        regressionCount,
      },
    };
  }
}

// 創建單例實例
export const performanceBaselineFramework = new PerformanceBaselineFramework();
