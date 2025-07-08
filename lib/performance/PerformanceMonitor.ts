/**
 * Performance Monitor
 *
 * 系統性能監控服務
 */

import { EventEmitter } from 'events';

export interface PerformanceMetric {
  name: string;
  category: 'api' | 'database' | 'render' | 'network' | 'custom';
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface PerformanceReport {
  startTime: Date;
  endTime: Date;
  metrics: PerformanceMetric[];
  summary: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalRequests: number;
    errorRate: number;
    avgMemoryUsage: number;
    peakMemoryUsage: number;
  };
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  level: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  message: string;
}

export class PerformanceMonitor extends EventEmitter {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private startTime: Date;
  private isMonitoring: boolean = false;
  private metricsBuffer: PerformanceMetric[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;

  // 預設閾值
  private defaultThresholds: PerformanceThreshold[] = [
    { metric: 'api_response_time', warning: 1000, critical: 3000, unit: 'ms' },
    { metric: 'database_query_time', warning: 500, critical: 2000, unit: 'ms' },
    { metric: 'render_time', warning: 100, critical: 500, unit: 'ms' },
    { metric: 'memory_usage', warning: 80, critical: 95, unit: 'percentage' },
    { metric: 'error_rate', warning: 1, critical: 5, unit: 'percentage' },
  ];

  private constructor() {
    super();
    this.startTime = new Date();
    this.initializeThresholds();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeThresholds() {
    this.defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.metric, threshold);
    });
  }

  /**
   * 開始監控
   */
  public startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startTime = new Date();
    this.metrics = [];

    // 設置緩衝區刷新間隔（每5秒）
    this.bufferFlushInterval = setInterval(() => {
      this.flushMetricsBuffer();
    }, 5000);

    // 監控系統資源
    this.startResourceMonitoring();

    this.emit('monitoring:started');
  }

  /**
   * 停止監控
   */
  public stopMonitoring(): PerformanceReport {
    if (!this.isMonitoring) {
      return this.generateReport();
    }

    this.isMonitoring = false;

    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }

    this.flushMetricsBuffer();
    this.emit('monitoring:stopped');

    return this.generateReport();
  }

  /**
   * 記錄性能指標
   */
  public recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    // 添加到緩衝區
    this.metricsBuffer.push(fullMetric);

    // 檢查閾值
    this.checkThresholds(fullMetric);

    // 如果緩衝區太大，立即刷新
    if (this.metricsBuffer.length > 1000) {
      this.flushMetricsBuffer();
    }
  }

  /**
   * 測量操作時間
   */
  public async measureAsync<T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        category,
        value: duration,
        unit: 'ms',
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `${name}_error`,
        category,
        value: duration,
        unit: 'ms',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      throw error;
    }
  }

  /**
   * 測量同步操作時間
   */
  public measureSync<T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => T
  ): T {
    const startTime = performance.now();

    try {
      const result = operation();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        category,
        value: duration,
        unit: 'ms',
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `${name}_error`,
        category,
        value: duration,
        unit: 'ms',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      throw error;
    }
  }

  /**
   * 記錄 API 請求
   */
  public recordApiCall(endpoint: string, method: string, duration: number, status: number) {
    this.recordMetric({
      name: 'api_request',
      category: 'api',
      value: duration,
      unit: 'ms',
      metadata: { endpoint, method, status },
    });

    // 記錄錯誤率
    if (status >= 400) {
      this.recordMetric({
        name: 'api_error',
        category: 'api',
        value: 1,
        unit: 'count',
        metadata: { endpoint, method, status },
      });
    }
  }

  /**
   * 記錄數據庫查詢
   */
  public recordDatabaseQuery(query: string, duration: number, rowCount?: number) {
    this.recordMetric({
      name: 'database_query',
      category: 'database',
      value: duration,
      unit: 'ms',
      metadata: {
        query: query.substring(0, 100), // 只記錄前100個字符
        rowCount,
      },
    });
  }

  /**
   * 設置性能閾值
   */
  public setThreshold(threshold: PerformanceThreshold) {
    this.thresholds.set(threshold.metric, threshold);
  }

  /**
   * 獲取實時指標
   */
  public getRealtimeMetrics(): {
    currentMetrics: PerformanceMetric[];
    activeAlerts: PerformanceAlert[];
  } {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > fiveMinutesAgo);
    const activeAlerts = this.checkAllThresholds(recentMetrics);

    return {
      currentMetrics: recentMetrics,
      activeAlerts,
    };
  }

  /**
   * 生成性能報告
   */
  private generateReport(): PerformanceReport {
    const endTime = new Date();
    const allMetrics = [...this.metrics, ...this.metricsBuffer];

    // 計算響應時間統計
    const responseTimes = allMetrics
      .filter(m => m.category === 'api' && m.name === 'api_request')
      .map(m => m.value)
      .sort((a, b) => a - b);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, val) => sum + val, 0) / responseTimes.length
        : 0;

    const p95ResponseTime =
      responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0;

    const p99ResponseTime =
      responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0;

    // 計算錯誤率
    const totalRequests = responseTimes.length;
    const errorCount = allMetrics.filter(m => m.name === 'api_error').length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // 計算內存使用
    const memoryMetrics = allMetrics.filter(m => m.name === 'memory_usage');
    const avgMemoryUsage =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
        : 0;
    const peakMemoryUsage =
      memoryMetrics.length > 0 ? Math.max(...memoryMetrics.map(m => m.value)) : 0;

    return {
      startTime: this.startTime,
      endTime,
      metrics: allMetrics,
      summary: {
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        totalRequests,
        errorRate,
        avgMemoryUsage,
        peakMemoryUsage,
      },
      alerts: this.checkAllThresholds(allMetrics),
    };
  }

  /**
   * 檢查閾值
   */
  private checkThresholds(metric: PerformanceMetric) {
    const threshold = this.thresholds.get(metric.name);
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      const alert: PerformanceAlert = {
        level: 'critical',
        metric: metric.name,
        value: metric.value,
        threshold: threshold.critical,
        timestamp: metric.timestamp,
        message: `${metric.name} exceeded critical threshold: ${metric.value}${metric.unit} > ${threshold.critical}${threshold.unit}`,
      };

      this.emit('alert:critical', alert);
    } else if (metric.value >= threshold.warning) {
      const alert: PerformanceAlert = {
        level: 'warning',
        metric: metric.name,
        value: metric.value,
        threshold: threshold.warning,
        timestamp: metric.timestamp,
        message: `${metric.name} exceeded warning threshold: ${metric.value}${metric.unit} > ${threshold.warning}${threshold.unit}`,
      };

      this.emit('alert:warning', alert);
    }
  }

  /**
   * 檢查所有閾值
   */
  private checkAllThresholds(metrics: PerformanceMetric[]): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    this.thresholds.forEach((threshold, metricName) => {
      const relevantMetrics = metrics.filter(m => m.name === metricName);
      if (relevantMetrics.length === 0) return;

      const avgValue =
        relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length;

      if (avgValue >= threshold.critical) {
        alerts.push({
          level: 'critical',
          metric: metricName,
          value: avgValue,
          threshold: threshold.critical,
          timestamp: new Date(),
          message: `Average ${metricName} exceeded critical threshold`,
        });
      } else if (avgValue >= threshold.warning) {
        alerts.push({
          level: 'warning',
          metric: metricName,
          value: avgValue,
          threshold: threshold.warning,
          timestamp: new Date(),
          message: `Average ${metricName} exceeded warning threshold`,
        });
      }
    });

    return alerts;
  }

  /**
   * 刷新指標緩衝區
   */
  private flushMetricsBuffer() {
    if (this.metricsBuffer.length === 0) return;

    this.metrics.push(...this.metricsBuffer);
    this.metricsBuffer = [];

    // 保持合理的內存使用，只保留最近1小時的數據
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
  }

  /**
   * 開始資源監控
   */
  private startResourceMonitoring() {
    if (typeof process === 'undefined') return;

    // 每30秒記錄一次內存使用
    setInterval(() => {
      if (!this.isMonitoring) return;

      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      this.recordMetric({
        name: 'memory_usage',
        category: 'custom',
        value: memoryPercentage,
        unit: 'percentage',
        metadata: {
          heapUsed: usedMemory,
          heapTotal: totalMemory,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers,
        },
      });
    }, 30000);
  }
}

// 導出單例
export const performanceMonitor = PerformanceMonitor.getInstance();
