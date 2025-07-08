/**
 * GraphQL Performance Monitor
 *
 * Real-time performance monitoring and alerting for GraphQL operations
 * Features:
 * - Query execution time tracking
 * - Cache hit rate monitoring
 * - Threshold-based alerting
 * - Performance degradation detection
 */

import { EventEmitter } from 'events';

export interface PerformanceMetric {
  timestamp: Date;
  queryName: string;
  operationType: 'query' | 'mutation' | 'subscription';
  executionTime: number; // milliseconds
  complexity: number;
  cacheHit: boolean;
  errors: string[];
}

export interface PerformanceThresholds {
  maxExecutionTime: number;
  maxComplexity: number;
  minCacheHitRate: number;
  maxErrorRate: number;
}

export interface PerformanceAlert {
  id: string;
  severity: 'warning' | 'critical';
  type: 'execution_time' | 'complexity' | 'cache_hit_rate' | 'error_rate';
  message: string;
  metric: PerformanceMetric | AggregatedMetrics;
  timestamp: Date;
}

export interface AggregatedMetrics {
  period: string;
  totalQueries: number;
  avgExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  cacheHitRate: number;
  errorRate: number;
  topSlowQueries: Array<{
    queryName: string;
    avgTime: number;
    count: number;
  }>;
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: PerformanceThresholds;
  private retentionPeriod: number = 24 * 60 * 60 * 1000; // 24 hours
  private aggregationInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    super();

    // Default thresholds based on documented performance targets
    this.thresholds = {
      maxExecutionTime: 500, // 500ms for complex queries
      maxComplexity: 1000,
      minCacheHitRate: 0.7, // 70% minimum
      maxErrorRate: 0.01, // 1% maximum
      ...thresholds,
    };

    // Start periodic aggregation and cleanup
    this.startPeriodicTasks();
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Check for immediate threshold violations
    this.checkThresholdViolations(fullMetric);

    // Emit metric event for real-time monitoring
    this.emit('metric', fullMetric);
  }

  /**
   * Check if a metric violates any thresholds
   */
  private checkThresholdViolations(metric: PerformanceMetric) {
    const alerts: PerformanceAlert[] = [];

    // Check execution time
    if (metric.executionTime > this.thresholds.maxExecutionTime) {
      const severity =
        metric.executionTime > this.thresholds.maxExecutionTime * 2 ? 'critical' : 'warning';

      alerts.push({
        id: `alert_${Date.now()}_execution`,
        severity,
        type: 'execution_time',
        message: `Query "${metric.queryName}" exceeded execution time threshold: ${metric.executionTime}ms > ${this.thresholds.maxExecutionTime}ms`,
        metric,
        timestamp: new Date(),
      });
    }

    // Check complexity
    if (metric.complexity > this.thresholds.maxComplexity) {
      alerts.push({
        id: `alert_${Date.now()}_complexity`,
        severity: 'warning',
        type: 'complexity',
        message: `Query "${metric.queryName}" exceeded complexity threshold: ${metric.complexity} > ${this.thresholds.maxComplexity}`,
        metric,
        timestamp: new Date(),
      });
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.emit('alert', alert);
    });
  }

  /**
   * Get aggregated metrics for a time period
   */
  getAggregatedMetrics(periodMinutes: number = 60): AggregatedMetrics {
    const now = Date.now();
    const periodMs = periodMinutes * 60 * 1000;
    const startTime = now - periodMs;

    const periodMetrics = this.metrics.filter(m => m.timestamp.getTime() >= startTime);

    if (periodMetrics.length === 0) {
      return {
        period: `Last ${periodMinutes} minutes`,
        totalQueries: 0,
        avgExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        topSlowQueries: [],
      };
    }

    // Calculate basic stats
    const totalQueries = periodMetrics.length;
    const cacheHits = periodMetrics.filter(m => m.cacheHit).length;
    const errors = periodMetrics.filter(m => m.errors.length > 0).length;

    // Calculate execution time percentiles
    const executionTimes = periodMetrics.map(m => m.executionTime).sort((a, b) => a - b);

    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const p95Index = Math.floor(executionTimes.length * 0.95);
    const p99Index = Math.floor(executionTimes.length * 0.99);

    // Group by query name for slow query analysis
    const queryGroups = periodMetrics.reduce(
      (acc, metric) => {
        if (!acc[metric.queryName]) {
          acc[metric.queryName] = {
            times: [],
            count: 0,
          };
        }
        acc[metric.queryName].times.push(metric.executionTime);
        acc[metric.queryName].count++;
        return acc;
      },
      {} as Record<string, { times: number[]; count: number }>
    );

    // Find top slow queries
    const topSlowQueries = Object.entries(queryGroups)
      .map(([queryName, data]) => ({
        queryName,
        avgTime: data.times.reduce((a, b) => a + b, 0) / data.times.length,
        count: data.count,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    const aggregated: AggregatedMetrics = {
      period: `Last ${periodMinutes} minutes`,
      totalQueries,
      avgExecutionTime: Math.round(avgExecutionTime),
      p95ExecutionTime: Math.round(executionTimes[p95Index] || 0),
      p99ExecutionTime: Math.round(executionTimes[p99Index] || 0),
      cacheHitRate: totalQueries > 0 ? cacheHits / totalQueries : 0,
      errorRate: totalQueries > 0 ? errors / totalQueries : 0,
      topSlowQueries,
    };

    // Check aggregated thresholds
    this.checkAggregatedThresholds(aggregated);

    return aggregated;
  }

  /**
   * Check aggregated metrics against thresholds
   */
  private checkAggregatedThresholds(metrics: AggregatedMetrics) {
    const alerts: PerformanceAlert[] = [];

    // Check cache hit rate
    if (metrics.cacheHitRate < this.thresholds.minCacheHitRate && metrics.totalQueries > 10) {
      alerts.push({
        id: `alert_${Date.now()}_cache`,
        severity: 'warning',
        type: 'cache_hit_rate',
        message: `Cache hit rate below threshold: ${(metrics.cacheHitRate * 100).toFixed(1)}% < ${this.thresholds.minCacheHitRate * 100}%`,
        metric: metrics,
        timestamp: new Date(),
      });
    }

    // Check error rate
    if (metrics.errorRate > this.thresholds.maxErrorRate && metrics.totalQueries > 10) {
      alerts.push({
        id: `alert_${Date.now()}_errors`,
        severity: 'critical',
        type: 'error_rate',
        message: `Error rate above threshold: ${(metrics.errorRate * 100).toFixed(1)}% > ${this.thresholds.maxErrorRate * 100}%`,
        metric: metrics,
        timestamp: new Date(),
      });
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.emit('alert', alert);
    });
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): PerformanceAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear a specific alert
   */
  clearAlert(alertId: string) {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      this.alerts.splice(index, 1);
    }
  }

  /**
   * Start periodic tasks
   */
  private startPeriodicTasks() {
    // Periodic aggregation
    setInterval(() => {
      const aggregated = this.getAggregatedMetrics(5);
      this.emit('aggregated', aggregated);
    }, this.aggregationInterval);

    // Cleanup old metrics
    setInterval(
      () => {
        const cutoff = Date.now() - this.retentionPeriod;
        this.metrics = this.metrics.filter(m => m.timestamp.getTime() >= cutoff);
        this.alerts = this.alerts.filter(a => a.timestamp.getTime() >= cutoff);
      },
      60 * 60 * 1000
    ); // Every hour
  }

  /**
   * Get current performance status
   */
  getStatus(): {
    healthy: boolean;
    metrics: AggregatedMetrics;
    activeAlerts: number;
    criticalAlerts: number;
  } {
    const metrics = this.getAggregatedMetrics(60);
    const recentAlerts = this.getRecentAlerts(100);
    const activeAlerts = recentAlerts.filter(
      a => a.timestamp.getTime() > Date.now() - 30 * 60 * 1000
    );

    const healthy =
      activeAlerts.filter(a => a.severity === 'critical').length === 0 &&
      metrics.errorRate <= this.thresholds.maxErrorRate &&
      metrics.cacheHitRate >= this.thresholds.minCacheHitRate;

    return {
      healthy,
      metrics,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
    };
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(startTime?: Date, endTime?: Date): PerformanceMetric[] {
    let filtered = this.metrics;

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }

    return filtered;
  }

  /**
   * Update thresholds dynamically
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds,
    };

    // Re-evaluate recent metrics with new thresholds
    const recentMetrics = this.getAggregatedMetrics(60);
    this.checkAggregatedThresholds(recentMetrics);
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Example usage with GraphQL execution
export function withPerformanceMonitoring<T>(
  queryName: string,
  operationType: 'query' | 'mutation' | 'subscription',
  complexity: number,
  executeFunction: () => Promise<T>,
  monitor: PerformanceMonitor = performanceMonitor
): Promise<T> {
  const startTime = Date.now();
  let cacheHit = false;
  const errors: string[] = [];

  return executeFunction()
    .then(result => {
      // Check if result came from cache (this would need to be set by your cache layer)
      cacheHit = (result as any)?._fromCache || false;
      return result;
    })
    .catch(error => {
      errors.push(error.message);
      throw error;
    })
    .finally(() => {
      const executionTime = Date.now() - startTime;

      monitor.recordMetric({
        queryName,
        operationType,
        executionTime,
        complexity,
        cacheHit,
        errors,
      });
    });
}
