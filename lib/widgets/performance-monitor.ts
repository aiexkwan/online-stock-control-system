/**
 * Widget Performance Monitoring System
 * 全面追蹤和分析 Widget 性能
 */

import { WidgetComponentProps } from './types';

// 性能指標接口
export interface PerformanceMetrics {
  widgetId: string;
  timestamp: number;
  // 時間指標 (毫秒)
  loadTime: number;
  renderTime: number;
  dataFetchTime?: number;
  // 資源指標
  memoryUsage?: number;
  bundleSize?: number;
  // 用戶體驗指標
  firstContentfulPaint?: number;
  timeToInteractive?: number;
  cumulativeLayoutShift?: number;
  // 上下文
  route: string;
  variant: 'v2' | 'legacy';
  sessionId: string;
  userId?: string;
}

// 聚合性能數據
export interface AggregatedPerformance {
  widgetId: string;
  variant: 'v2' | 'legacy';
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    loadTime: StatisticalSummary;
    renderTime: StatisticalSummary;
    dataFetchTime: StatisticalSummary;
    errorRate: number;
    sampleCount: number;
  };
  // 按路由分組
  byRoute: Map<string, RoutePerformance>;
  // 性能趨勢
  trend: PerformanceTrend;
}

// 統計摘要
export interface StatisticalSummary {
  min: number;
  max: number;
  mean: number;
  median: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  stdDev: number;
}

// 路由性能
export interface RoutePerformance {
  route: string;
  loadTime: StatisticalSummary;
  sampleCount: number;
  topIssues: PerformanceIssue[];
}

// 性能問題
export interface PerformanceIssue {
  type: 'slow-load' | 'memory-leak' | 'render-blocking' | 'data-fetch-delay';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedCount: number;
  recommendation: string;
}

// 性能趨勢
export interface PerformanceTrend {
  direction: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  comparedTo: Date;
}

/**
 * Performance Monitor 核心類
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private aggregatedData = new Map<string, AggregatedPerformance>();
  private alertThresholds = new Map<string, number>();
  private observers = new Map<string, PerformanceObserver>();

  private constructor() {
    this.initializeObservers();
    this.setDefaultThresholds();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 初始化性能觀察器
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Navigation Timing API
    if ('PerformanceObserver' in window) {
      try {
        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordWebVital('LCP', entry.startTime);
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordWebVital('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);

        // CLS (Cumulative Layout Shift)
        const clsObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          let clsValue = 0;
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordWebVital('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.error('[PerformanceMonitor] Failed to initialize observers:', e);
      }
    }
  }

  /**
   * 設置默認閾值
   */
  private setDefaultThresholds(): void {
    // Widget 加載時間閾值 (毫秒)
    this.alertThresholds.set('loadTime', 100); // 100ms
    this.alertThresholds.set('renderTime', 50); // 50ms
    this.alertThresholds.set('dataFetchTime', 200); // 200ms
    // Web Vitals 閾值
    this.alertThresholds.set('LCP', 2500); // 2.5s
    this.alertThresholds.set('FID', 100); // 100ms
    this.alertThresholds.set('CLS', 0.1); // 0.1
  }

  /**
   * 開始監控 Widget
   */
  startMonitoring(widgetId: string, variant: 'v2' | 'legacy' = 'v2'): PerformanceTimer {
    return new PerformanceTimer(widgetId, variant, this);
  }

  /**
   * 記錄性能指標
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    // 添加到指標列表
    this.metrics.push(metrics);

    // 保留最近 10000 條記錄
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }

    // 檢查性能問題
    this.checkPerformanceIssues(metrics);

    // 更新聚合數據
    this.updateAggregatedData(metrics);

    console.log(`[PerformanceMonitor] Recorded metrics for ${metrics.widgetId}:`, {
      loadTime: `${metrics.loadTime.toFixed(2)}ms`,
      renderTime: `${metrics.renderTime.toFixed(2)}ms`,
      variant: metrics.variant,
    });
  }

  /**
   * 記錄 Web Vitals
   */
  private recordWebVital(metric: string, value: number): void {
    const threshold = this.alertThresholds.get(metric);
    if (threshold && value > threshold) {
      console.warn(`[PerformanceMonitor] ${metric} exceeded threshold: ${value} > ${threshold}`);
    }
  }

  /**
   * 檢查性能問題
   */
  private checkPerformanceIssues(metrics: PerformanceMetrics): void {
    const issues: PerformanceIssue[] = [];

    // 檢查加載時間
    const loadThreshold = this.alertThresholds.get('loadTime')!;
    if (metrics.loadTime > loadThreshold) {
      issues.push({
        type: 'slow-load',
        severity: metrics.loadTime > loadThreshold * 2 ? 'high' : 'medium',
        description: `Widget load time (${metrics.loadTime.toFixed(0)}ms) exceeds threshold (${loadThreshold}ms)`,
        affectedCount: 1,
        recommendation: 'Consider implementing lazy loading or optimizing bundle size',
      });
    }

    // 檢查渲染時間
    const renderThreshold = this.alertThresholds.get('renderTime')!;
    if (metrics.renderTime > renderThreshold) {
      issues.push({
        type: 'render-blocking',
        severity: metrics.renderTime > renderThreshold * 2 ? 'high' : 'medium',
        description: `Widget render time (${metrics.renderTime.toFixed(0)}ms) exceeds threshold (${renderThreshold}ms)`,
        affectedCount: 1,
        recommendation: 'Optimize component rendering, use React.memo or useMemo',
      });
    }

    if (issues.length > 0) {
      console.warn(`[PerformanceMonitor] Issues detected for ${metrics.widgetId}:`, issues);
    }
  }

  /**
   * 更新聚合數據
   */
  private updateAggregatedData(metrics: PerformanceMetrics): void {
    const key = `${metrics.widgetId}-${metrics.variant}`;
    const existing = this.aggregatedData.get(key);

    if (!existing) {
      // 創建新的聚合數據
      const now = new Date();
      this.aggregatedData.set(key, {
        widgetId: metrics.widgetId,
        variant: metrics.variant,
        timeRange: {
          start: now,
          end: now,
        },
        metrics: {
          loadTime: this.createStatisticalSummary([metrics.loadTime]),
          renderTime: this.createStatisticalSummary([metrics.renderTime]),
          dataFetchTime: this.createStatisticalSummary(
            metrics.dataFetchTime ? [metrics.dataFetchTime] : []
          ),
          errorRate: 0,
          sampleCount: 1,
        },
        byRoute: new Map(),
        trend: {
          direction: 'stable',
          changePercent: 0,
          comparedTo: now,
        },
      });
    } else {
      // 更新現有數據（簡化版本）
      existing.metrics.sampleCount++;
      existing.timeRange.end = new Date();
    }
  }

  /**
   * 創建統計摘要
   */
  private createStatisticalSummary(values: number[]): StatisticalSummary {
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p50: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        stdDev: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    // 計算標準差
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: this.percentile(sorted, 50),
      p50: this.percentile(sorted, 50),
      p75: this.percentile(sorted, 75),
      p90: this.percentile(sorted, 90),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      stdDev,
    };
  }

  /**
   * 計算百分位數
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * 獲取 Widget 性能報告
   */
  getWidgetReport(
    widgetId: string,
    timeRange?: { start: Date; end: Date }
  ): WidgetPerformanceReport {
    const relevantMetrics = this.metrics.filter(m => {
      if (m.widgetId !== widgetId) return false;
      if (timeRange) {
        const timestamp = new Date(m.timestamp);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      }
      return true;
    });

    // 按變體分組
    const v2Metrics = relevantMetrics.filter(m => m.variant === 'v2');
    const legacyMetrics = relevantMetrics.filter(m => m.variant === 'legacy');

    return {
      widgetId,
      timeRange: timeRange || {
        start: new Date(Math.min(...relevantMetrics.map(m => m.timestamp))),
        end: new Date(Math.max(...relevantMetrics.map(m => m.timestamp))),
      },
      v2Performance: this.calculatePerformanceSummary(v2Metrics),
      legacyPerformance: this.calculatePerformanceSummary(legacyMetrics),
      improvement: this.calculateImprovement(v2Metrics, legacyMetrics),
      recommendations: this.generateRecommendations(widgetId, relevantMetrics),
    };
  }

  /**
   * 計算性能摘要
   */
  private calculatePerformanceSummary(metrics: PerformanceMetrics[]): PerformanceSummary | null {
    if (metrics.length === 0) return null;

    const loadTimes = metrics.map(m => m.loadTime);
    const renderTimes = metrics.map(m => m.renderTime);

    return {
      sampleCount: metrics.length,
      loadTime: this.createStatisticalSummary(loadTimes),
      renderTime: this.createStatisticalSummary(renderTimes),
      errorRate: 0, // TODO: 整合錯誤率數據
      byRoute: this.groupByRoute(metrics),
    };
  }

  /**
   * 按路由分組
   */
  private groupByRoute(metrics: PerformanceMetrics[]): Map<string, RoutePerformance> {
    const byRoute = new Map<string, PerformanceMetrics[]>();

    metrics.forEach(m => {
      const existing = byRoute.get(m.route) || [];
      existing.push(m);
      byRoute.set(m.route, existing);
    });

    const result = new Map<string, RoutePerformance>();
    byRoute.forEach((metrics, route) => {
      result.set(route, {
        route,
        loadTime: this.createStatisticalSummary(metrics.map(m => m.loadTime)),
        sampleCount: metrics.length,
        topIssues: [],
      });
    });

    return result;
  }

  /**
   * 計算改進幅度
   */
  private calculateImprovement(
    v2Metrics: PerformanceMetrics[],
    legacyMetrics: PerformanceMetrics[]
  ): PerformanceImprovement {
    if (v2Metrics.length === 0 || legacyMetrics.length === 0) {
      return { percentage: 0, absoluteMs: 0 };
    }

    const v2AvgLoad = v2Metrics.reduce((sum, m) => sum + m.loadTime, 0) / v2Metrics.length;
    const legacyAvgLoad =
      legacyMetrics.reduce((sum, m) => sum + m.loadTime, 0) / legacyMetrics.length;

    return {
      percentage: ((legacyAvgLoad - v2AvgLoad) / legacyAvgLoad) * 100,
      absoluteMs: legacyAvgLoad - v2AvgLoad,
    };
  }

  /**
   * 生成優化建議
   */
  private generateRecommendations(widgetId: string, metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];

    if (metrics.length === 0) return recommendations;

    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;

    // 基於性能數據生成建議
    if (avgLoadTime > 100) {
      recommendations.push('Consider implementing code splitting for this widget');
      recommendations.push('Review and optimize bundle dependencies');
    }

    if (avgRenderTime > 50) {
      recommendations.push('Use React.memo to prevent unnecessary re-renders');
      recommendations.push('Optimize expensive computations with useMemo');
    }

    // 檢查性能變異性
    const loadTimes = metrics.map(m => m.loadTime);
    const stdDev = this.createStatisticalSummary(loadTimes).stdDev;
    if (stdDev > avgLoadTime * 0.5) {
      recommendations.push(
        'High performance variability detected - investigate environmental factors'
      );
    }

    return recommendations;
  }

  /**
   * 獲取實時性能數據
   */
  getRealtimeMetrics(): RealtimePerformanceData {
    const last5Minutes = Date.now() - 5 * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);

    const v2Metrics = recentMetrics.filter(m => m.variant === 'v2');
    const legacyMetrics = recentMetrics.filter(m => m.variant === 'legacy');

    return {
      timestamp: Date.now(),
      v2: {
        avgLoadTime:
          v2Metrics.length > 0
            ? v2Metrics.reduce((sum, m) => sum + m.loadTime, 0) / v2Metrics.length
            : 0,
        requestCount: v2Metrics.length,
      },
      legacy: {
        avgLoadTime:
          legacyMetrics.length > 0
            ? legacyMetrics.reduce((sum, m) => sum + m.loadTime, 0) / legacyMetrics.length
            : 0,
        requestCount: legacyMetrics.length,
      },
    };
  }

  /**
   * 清理舊數據
   */
  cleanup(olderThan: Date): void {
    const cutoff = olderThan.getTime();
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    console.log(`[PerformanceMonitor] Cleaned up metrics older than ${olderThan.toISOString()}`);
  }
}

/**
 * Performance Timer Helper Class
 */
export class PerformanceTimer {
  private startTime: number;
  private marks = new Map<string, number>();
  private renderStartTime?: number;
  private dataFetchStartTime?: number;

  constructor(
    private widgetId: string,
    private variant: 'v2' | 'legacy',
    private monitor: PerformanceMonitor
  ) {
    this.startTime = performance.now();
  }

  /**
   * 標記時間點
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * 開始渲染計時
   */
  startRender(): void {
    this.renderStartTime = performance.now();
  }

  /**
   * 開始數據獲取計時
   */
  startDataFetch(): void {
    this.dataFetchStartTime = performance.now();
  }

  /**
   * 結束數據獲取計時
   */
  endDataFetch(): number {
    if (!this.dataFetchStartTime) return 0;
    return performance.now() - this.dataFetchStartTime;
  }

  /**
   * 完成監控
   */
  complete(context: { route: string; sessionId: string; userId?: string }): void {
    const endTime = performance.now();
    const loadTime = endTime - this.startTime;
    const renderTime = this.renderStartTime ? endTime - this.renderStartTime : 0;
    const dataFetchTime = this.dataFetchStartTime ? this.endDataFetch() : undefined;

    const metrics: PerformanceMetrics = {
      widgetId: this.widgetId,
      timestamp: Date.now(),
      loadTime,
      renderTime,
      dataFetchTime,
      route: context.route,
      variant: this.variant,
      sessionId: context.sessionId,
      userId: context.userId,
    };

    this.monitor.recordMetrics(metrics);
  }
}

// 類型定義
export interface WidgetPerformanceReport {
  widgetId: string;
  timeRange: { start: Date; end: Date };
  v2Performance: PerformanceSummary | null;
  legacyPerformance: PerformanceSummary | null;
  improvement: PerformanceImprovement;
  recommendations: string[];
}

export interface PerformanceSummary {
  sampleCount: number;
  loadTime: StatisticalSummary;
  renderTime: StatisticalSummary;
  errorRate: number;
  byRoute: Map<string, RoutePerformance>;
}

export interface PerformanceImprovement {
  percentage: number;
  absoluteMs: number;
}

export interface RealtimePerformanceData {
  timestamp: number;
  v2: { avgLoadTime: number; requestCount: number };
  legacy: { avgLoadTime: number; requestCount: number };
}

// 導出單例
export const performanceMonitor = PerformanceMonitor.getInstance();
