/**
 * PDF Extraction Performance Monitor
 * Real-time monitoring and alerting for extraction performance
 */

import { systemLogger } from '@/lib/logger';
import { EventEmitter } from 'events';

// Performance thresholds
interface PerformanceThresholds {
  maxExtractionTime: number; // ms
  maxTokensPerRequest: number;
  targetCacheHitRate: number; // percentage
  maxErrorRate: number; // percentage
  maxMemoryUsage: number; // MB
}

// Metric snapshot
interface MetricSnapshot {
  timestamp: number;
  extractionTime: number;
  tokensUsed: number;
  cacheHit: boolean;
  success: boolean;
  method: string;
  fileName?: string;
  error?: string;
}

// Aggregated statistics
interface AggregatedStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageExtractionTime: number;
  p50ExtractionTime: number;
  p95ExtractionTime: number;
  p99ExtractionTime: number;
  totalTokensUsed: number;
  averageTokensPerRequest: number;
  cacheHitRate: number;
  errorRate: number;
  topErrors: Array<{ error: string; count: number }>;
  methodDistribution: Record<string, number>;
  memoryUsage: number;
  costEstimate: number;
}

// Time series data for graphing
interface TimeSeriesData {
  timestamps: number[];
  extractionTimes: number[];
  tokenUsage: number[];
  cacheHitRates: number[];
  errorRates: number[];
}

export class PDFExtractionMonitor extends EventEmitter {
  private static instance: PDFExtractionMonitor;

  private metrics: MetricSnapshot[] = [];
  private readonly maxMetricsHistory = 1000;
  private readonly aggregationWindow = 5 * 60 * 1000; // 5 minutes

  private thresholds: PerformanceThresholds = {
    maxExtractionTime: 5000, // 5 seconds
    maxTokensPerRequest: 2000,
    targetCacheHitRate: 60, // 60% cache hit rate
    maxErrorRate: 5, // 5% error rate
    maxMemoryUsage: 500, // 500MB
  };

  // Cost tracking (OpenAI pricing)
  private readonly tokenCosts = {
    'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // per 1K tokens
  };

  private alertThrottles = new Map<string, number>();
  private readonly alertThrottleMs = 60000; // 1 minute

  private constructor() {
    super();
    this.startMemoryMonitoring();
    this.startPeriodicReporting();
  }

  public static getInstance(): PDFExtractionMonitor {
    if (!PDFExtractionMonitor.instance) {
      PDFExtractionMonitor.instance = new PDFExtractionMonitor();
    }
    return PDFExtractionMonitor.instance;
  }

  /**
   * Record a metric snapshot
   */
  public recordMetric(metric: Omit<MetricSnapshot, 'timestamp'>): void {
    const snapshot: MetricSnapshot = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(snapshot);

    // Maintain history limit
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Check thresholds and emit alerts
    this.checkThresholds(snapshot);

    // Log if verbose mode
    if (process.env.PDF_MONITOR_VERBOSE === 'true') {
      systemLogger.debug(
        {
          metric: snapshot,
        },
        '[PDFMonitor] Metric recorded'
      );
    }
  }

  /**
   * Get aggregated statistics
   */
  public getStats(windowMs?: number): AggregatedStats {
    const window = windowMs || this.aggregationWindow;
    const cutoff = Date.now() - window;
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    if (relevantMetrics.length === 0) {
      return this.getEmptyStats();
    }

    // Calculate basic counts
    const totalRequests = relevantMetrics.length;
    const successfulRequests = relevantMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;

    // Calculate extraction time statistics
    const extractionTimes = relevantMetrics
      .filter(m => m.success)
      .map(m => m.extractionTime)
      .sort((a, b) => a - b);

    const avgExtractionTime = this.average(extractionTimes);
    const p50 = this.percentile(extractionTimes, 50);
    const p95 = this.percentile(extractionTimes, 95);
    const p99 = this.percentile(extractionTimes, 99);

    // Calculate token usage
    const totalTokens = relevantMetrics.reduce((sum, m) => sum + m.tokensUsed, 0);
    const avgTokens = totalRequests > 0 ? totalTokens / totalRequests : 0;

    // Calculate cache hit rate
    const cacheHits = relevantMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    // Calculate error rate
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

    // Aggregate errors
    const errorCounts = new Map<string, number>();
    relevantMetrics
      .filter(m => !m.success && m.error)
      .forEach(m => {
        const count = errorCounts.get(m.error!) || 0;
        errorCounts.set(m.error!, count + 1);
      });

    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Method distribution
    const methodCounts = new Map<string, number>();
    relevantMetrics.forEach(m => {
      const count = methodCounts.get(m.method) || 0;
      methodCounts.set(m.method, count + 1);
    });
    const methodDistribution = Object.fromEntries(methodCounts);

    // Memory usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

    // Cost estimate (simplified)
    const costEstimate = this.estimateCost(totalTokens);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageExtractionTime: Math.round(avgExtractionTime),
      p50ExtractionTime: Math.round(p50),
      p95ExtractionTime: Math.round(p95),
      p99ExtractionTime: Math.round(p99),
      totalTokensUsed: totalTokens,
      averageTokensPerRequest: Math.round(avgTokens),
      cacheHitRate: Math.round(cacheHitRate * 10) / 10,
      errorRate: Math.round(errorRate * 10) / 10,
      topErrors,
      methodDistribution,
      memoryUsage: Math.round(memoryUsage * 10) / 10,
      costEstimate: Math.round(costEstimate * 1000) / 1000,
    };
  }

  /**
   * Get time series data for visualization
   */
  public getTimeSeries(windowMs?: number, bucketSizeMs = 60000): TimeSeriesData {
    const window = windowMs || this.aggregationWindow;
    const cutoff = Date.now() - window;
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    // Create time buckets
    const buckets = new Map<number, MetricSnapshot[]>();

    relevantMetrics.forEach(metric => {
      const bucketTime = Math.floor(metric.timestamp / bucketSizeMs) * bucketSizeMs;
      const bucket = buckets.get(bucketTime) || [];
      bucket.push(metric);
      buckets.set(bucketTime, bucket);
    });

    // Sort buckets by time
    const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

    // Aggregate per bucket
    const timestamps: number[] = [];
    const extractionTimes: number[] = [];
    const tokenUsage: number[] = [];
    const cacheHitRates: number[] = [];
    const errorRates: number[] = [];

    sortedBuckets.forEach(([time, metrics]) => {
      timestamps.push(time);

      // Average extraction time
      const times = metrics.filter(m => m.success).map(m => m.extractionTime);
      extractionTimes.push(times.length > 0 ? this.average(times) : 0);

      // Average token usage
      const tokens = metrics.map(m => m.tokensUsed);
      tokenUsage.push(this.average(tokens));

      // Cache hit rate
      const hits = metrics.filter(m => m.cacheHit).length;
      cacheHitRates.push(metrics.length > 0 ? (hits / metrics.length) * 100 : 0);

      // Error rate
      const errors = metrics.filter(m => !m.success).length;
      errorRates.push(metrics.length > 0 ? (errors / metrics.length) * 100 : 0);
    });

    return {
      timestamps,
      extractionTimes,
      tokenUsage,
      cacheHitRates,
      errorRates,
    };
  }

  /**
   * Check thresholds and emit alerts
   */
  private checkThresholds(metric: MetricSnapshot): void {
    // Check extraction time
    if (metric.extractionTime > this.thresholds.maxExtractionTime) {
      this.emitAlert('slow-extraction', {
        extractionTime: metric.extractionTime,
        threshold: this.thresholds.maxExtractionTime,
        fileName: metric.fileName,
      });
    }

    // Check token usage
    if (metric.tokensUsed > this.thresholds.maxTokensPerRequest) {
      this.emitAlert('high-token-usage', {
        tokensUsed: metric.tokensUsed,
        threshold: this.thresholds.maxTokensPerRequest,
        fileName: metric.fileName,
      });
    }

    // Check aggregated metrics
    const stats = this.getStats(60000); // Last minute

    // Check cache hit rate
    if (stats.totalRequests >= 10 && stats.cacheHitRate < this.thresholds.targetCacheHitRate) {
      this.emitAlert('low-cache-hit-rate', {
        cacheHitRate: stats.cacheHitRate,
        threshold: this.thresholds.targetCacheHitRate,
      });
    }

    // Check error rate
    if (stats.totalRequests >= 10 && stats.errorRate > this.thresholds.maxErrorRate) {
      this.emitAlert('high-error-rate', {
        errorRate: stats.errorRate,
        threshold: this.thresholds.maxErrorRate,
        topErrors: stats.topErrors,
      });
    }

    // Check memory usage
    if (stats.memoryUsage > this.thresholds.maxMemoryUsage) {
      this.emitAlert('high-memory-usage', {
        memoryUsage: stats.memoryUsage,
        threshold: this.thresholds.maxMemoryUsage,
      });
    }
  }

  /**
   * Emit throttled alert
   */
  private emitAlert(type: string, data: Record<string, unknown>): void {
    const now = Date.now();
    const lastAlert = this.alertThrottles.get(type) || 0;

    if (now - lastAlert < this.alertThrottleMs) {
      return; // Throttled
    }

    this.alertThrottles.set(type, now);

    systemLogger.warn(
      {
        alertType: type,
        ...data,
      },
      `[PDFMonitor] Alert: ${type}`
    );

    this.emit('alert', { type, data, timestamp: now });
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;

      if (heapUsedMB > this.thresholds.maxMemoryUsage) {
        this.emitAlert('memory-threshold', {
          heapUsedMB,
          threshold: this.thresholds.maxMemoryUsage,
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    if (process.env.PDF_MONITOR_REPORTING !== 'true') {
      return;
    }

    setInterval(
      () => {
        const stats = this.getStats(5 * 60 * 1000); // Last 5 minutes

        systemLogger.info(
          {
            stats,
          },
          '[PDFMonitor] Periodic Report'
        );

        this.emit('report', { stats, timestamp: Date.now() });
      },
      5 * 60 * 1000
    ); // Report every 5 minutes
  }

  /**
   * Estimate cost based on token usage
   */
  private estimateCost(totalTokens: number): number {
    // Assume gpt-4o-mini for cost estimation
    const costs = this.tokenCosts['gpt-4o-mini'];
    const inputTokens = totalTokens * 0.7; // Assume 70% input
    const outputTokens = totalTokens * 0.3; // Assume 30% output

    const inputCost = (inputTokens / 1000) * costs.input;
    const outputCost = (outputTokens / 1000) * costs.output;

    return inputCost + outputCost;
  }

  /**
   * Calculate average
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Get empty stats object
   */
  private getEmptyStats(): AggregatedStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageExtractionTime: 0,
      p50ExtractionTime: 0,
      p95ExtractionTime: 0,
      p99ExtractionTime: 0,
      totalTokensUsed: 0,
      averageTokensPerRequest: 0,
      cacheHitRate: 0,
      errorRate: 0,
      topErrors: [],
      methodDistribution: {},
      memoryUsage: 0,
      costEstimate: 0,
    };
  }

  /**
   * Set custom thresholds
   */
  public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Reset metrics
   */
  public reset(): void {
    this.metrics = [];
    this.alertThrottles.clear();
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        stats: this.getStats(),
        timeSeries: this.getTimeSeries(),
        thresholds: this.thresholds,
        timestamp: Date.now(),
      },
      null,
      2
    );
  }

  /**
   * Generate performance report
   */
  public generateReport(): string {
    const stats = this.getStats(60 * 60 * 1000); // Last hour
    const timeSeries = this.getTimeSeries(60 * 60 * 1000);

    let report = '# PDF Extraction Performance Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Summary Statistics (Last Hour)\n';
    report += `- Total Requests: ${stats.totalRequests}\n`;
    report += `- Success Rate: ${(100 - stats.errorRate).toFixed(1)}%\n`;
    report += `- Cache Hit Rate: ${stats.cacheHitRate}%\n`;
    report += `- Avg Extraction Time: ${stats.averageExtractionTime}ms\n`;
    report += `- P95 Extraction Time: ${stats.p95ExtractionTime}ms\n`;
    report += `- Avg Tokens/Request: ${stats.averageTokensPerRequest}\n`;
    report += `- Estimated Cost: $${stats.costEstimate}\n\n`;

    report += '## Performance Metrics\n';
    report += `- P50 Latency: ${stats.p50ExtractionTime}ms\n`;
    report += `- P95 Latency: ${stats.p95ExtractionTime}ms\n`;
    report += `- P99 Latency: ${stats.p99ExtractionTime}ms\n\n`;

    report += '## Method Distribution\n';
    for (const [method, count] of Object.entries(stats.methodDistribution)) {
      const percentage = ((count / stats.totalRequests) * 100).toFixed(1);
      report += `- ${method}: ${count} (${percentage}%)\n`;
    }
    report += '\n';

    if (stats.topErrors.length > 0) {
      report += '## Top Errors\n';
      stats.topErrors.forEach(({ error, count }) => {
        report += `- ${error}: ${count} occurrences\n`;
      });
      report += '\n';
    }

    report += '## Resource Usage\n';
    report += `- Memory: ${stats.memoryUsage}MB\n`;
    report += `- Total Tokens Used: ${stats.totalTokensUsed}\n\n`;

    report += '## Recommendations\n';

    if (stats.cacheHitRate < this.thresholds.targetCacheHitRate) {
      report += `- ⚠️ Cache hit rate (${stats.cacheHitRate}%) is below target (${this.thresholds.targetCacheHitRate}%). Consider increasing cache size or TTL.\n`;
    }

    if (stats.p95ExtractionTime > this.thresholds.maxExtractionTime) {
      report += `- ⚠️ P95 extraction time (${stats.p95ExtractionTime}ms) exceeds threshold (${this.thresholds.maxExtractionTime}ms). Consider optimization.\n`;
    }

    if (stats.averageTokensPerRequest > this.thresholds.maxTokensPerRequest) {
      report += `- ⚠️ Average token usage (${stats.averageTokensPerRequest}) exceeds threshold (${this.thresholds.maxTokensPerRequest}). Optimize prompts.\n`;
    }

    if (stats.errorRate > this.thresholds.maxErrorRate) {
      report += `- ⚠️ Error rate (${stats.errorRate}%) exceeds threshold (${this.thresholds.maxErrorRate}%). Investigate failures.\n`;
    }

    return report;
  }
}

// Export singleton
export const pdfMonitor = PDFExtractionMonitor.getInstance();
