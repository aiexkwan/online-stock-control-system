/**
 * Supabase Performance Monitor
 * Real-time monitoring and diagnostics for Supabase connections and queries
 */

import { getSupabaseClient } from '../database/supabase-client-manager';
import { getGrnDatabaseService } from '../database/grn-database-service';
import type { PerformanceMetrics } from '../database/supabase-client-manager';

// Performance thresholds
export interface PerformanceThresholds {
  maxQueryTime: number; // milliseconds
  maxSlowQueryPercentage: number; // percentage
  maxFailedQueries: number; // count
  maxCacheMissRate: number; // percentage
  minCacheHitRate: number; // percentage
}

// Default thresholds
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxQueryTime: 1000, // 1 second
  maxSlowQueryPercentage: 10, // 10%
  maxFailedQueries: 5,
  maxCacheMissRate: 50, // 50%
  minCacheHitRate: 30, // 30%
};

// Alert severity levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Performance alert
export interface PerformanceAlert {
  timestamp: Date;
  severity: AlertSeverity;
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

// Monitoring configuration
export interface MonitoringConfig {
  enabled: boolean;
  interval: number; // milliseconds
  thresholds: PerformanceThresholds;
  alertCallback?: (alert: PerformanceAlert) => void;
  metricsCallback?: (metrics: PerformanceReport) => void;
}

// Performance report
export interface PerformanceReport {
  timestamp: Date;
  clientMetrics: PerformanceMetrics | null;
  grnMetrics: Record<string, unknown> | null;
  alerts: PerformanceAlert[];
  recommendations: string[];
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number; // 0-100
  };
}

/**
 * Supabase Performance Monitor Class
 */
export class SupabasePerformanceMonitor {
  private config: MonitoringConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertHistory: PerformanceAlert[] = [];
  private isMonitoring: boolean = false;
  private performanceHistory: PerformanceReport[] = [];

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      interval: 30000, // 30 seconds
      thresholds: DEFAULT_THRESHOLDS,
      ...config,
    };
  }

  /**
   * Start monitoring
   */
  public start(): void {
    if (this.isMonitoring) {
      console.warn('[SupabasePerformanceMonitor] Already monitoring');
      return;
    }

    if (!this.config.enabled) {
      console.info('[SupabasePerformanceMonitor] Monitoring is disabled');
      return;
    }

    this.isMonitoring = true;
    this.performMonitoring();

    this.monitoringInterval = setInterval(() => {
      this.performMonitoring();
    }, this.config.interval);

    console.info('[SupabasePerformanceMonitor] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.info('[SupabasePerformanceMonitor] Stopped monitoring');
  }

  /**
   * Perform monitoring check
   */
  private async performMonitoring(): Promise<void> {
    try {
      const report = await this.generateReport();

      // Store in history (keep last 100 reports)
      this.performanceHistory.push(report);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift();
      }

      // Call metrics callback if provided
      if (this.config.metricsCallback) {
        this.config.metricsCallback(report);
      }

      // Process alerts
      for (const alert of report.alerts) {
        this.handleAlert(alert);
      }
    } catch (error) {
      console.error('[SupabasePerformanceMonitor] Error during monitoring:', error);
    }
  }

  /**
   * Generate performance report
   */
  public async generateReport(): Promise<PerformanceReport> {
    const timestamp = new Date();
    const alerts: PerformanceAlert[] = [];
    const recommendations: string[] = [];

    // Get client metrics
    const clientManager = getSupabaseClient();
    const clientMetrics = clientManager.getMetrics();

    // Get GRN database metrics
    const grnService = getGrnDatabaseService();
    const grnMetrics = grnService.getPerformanceStats();

    // Check client metrics
    if (clientMetrics) {
      // Check average query time
      if (clientMetrics.averageQueryTime > this.config.thresholds.maxQueryTime) {
        alerts.push({
          timestamp,
          severity: AlertSeverity.WARNING,
          metric: 'averageQueryTime',
          value: clientMetrics.averageQueryTime,
          threshold: this.config.thresholds.maxQueryTime,
          message: `Average query time (${clientMetrics.averageQueryTime.toFixed(2)}ms) exceeds threshold`,
        });
        recommendations.push('Consider optimizing database queries or adding indexes');
      }

      // Check slow query percentage
      const slowQueryPercentage =
        clientMetrics.totalQueries > 0
          ? (clientMetrics.slowQueries / clientMetrics.totalQueries) * 100
          : 0;

      if (slowQueryPercentage > this.config.thresholds.maxSlowQueryPercentage) {
        alerts.push({
          timestamp,
          severity: AlertSeverity.WARNING,
          metric: 'slowQueryPercentage',
          value: slowQueryPercentage,
          threshold: this.config.thresholds.maxSlowQueryPercentage,
          message: `Slow query percentage (${slowQueryPercentage.toFixed(2)}%) exceeds threshold`,
        });
        recommendations.push('Review and optimize slow queries');
      }

      // Check failed queries
      if (clientMetrics.failedQueries > this.config.thresholds.maxFailedQueries) {
        alerts.push({
          timestamp,
          severity: AlertSeverity.ERROR,
          metric: 'failedQueries',
          value: clientMetrics.failedQueries,
          threshold: this.config.thresholds.maxFailedQueries,
          message: `Failed queries (${clientMetrics.failedQueries}) exceed threshold`,
        });
        recommendations.push('Check database connectivity and error logs');
      }

      // Check cache performance
      const totalCacheAccess = clientMetrics.cacheHits + clientMetrics.cacheMisses;
      if (totalCacheAccess > 0) {
        const cacheHitRate = (clientMetrics.cacheHits / totalCacheAccess) * 100;
        const cacheMissRate = (clientMetrics.cacheMisses / totalCacheAccess) * 100;

        if (cacheHitRate < this.config.thresholds.minCacheHitRate) {
          alerts.push({
            timestamp,
            severity: AlertSeverity.INFO,
            metric: 'cacheHitRate',
            value: cacheHitRate,
            threshold: this.config.thresholds.minCacheHitRate,
            message: `Cache hit rate (${cacheHitRate.toFixed(2)}%) below optimal threshold`,
          });
          recommendations.push('Consider adjusting cache TTL or cache size');
        }

        if (cacheMissRate > this.config.thresholds.maxCacheMissRate) {
          alerts.push({
            timestamp,
            severity: AlertSeverity.INFO,
            metric: 'cacheMissRate',
            value: cacheMissRate,
            threshold: this.config.thresholds.maxCacheMissRate,
            message: `Cache miss rate (${cacheMissRate.toFixed(2)}%) above threshold`,
          });
          recommendations.push('Review cache key patterns and query patterns');
        }
      }

      // Check connection status
      if (clientMetrics.connectionStatus !== 'connected') {
        alerts.push({
          timestamp,
          severity: AlertSeverity.CRITICAL,
          metric: 'connectionStatus',
          value: 0,
          threshold: 1,
          message: `Database connection status: ${clientMetrics.connectionStatus}`,
        });
        recommendations.push('Check network connectivity and database status');
      }
    }

    // Calculate health score
    const health = this.calculateHealthScore(clientMetrics, alerts);

    return {
      timestamp,
      clientMetrics,
      grnMetrics,
      alerts,
      recommendations,
      health,
    };
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(
    metrics: PerformanceMetrics | null,
    alerts: PerformanceAlert[]
  ): { status: 'healthy' | 'degraded' | 'unhealthy'; score: number } {
    if (!metrics) {
      return { status: 'unhealthy', score: 0 };
    }

    let score = 100;

    // Deduct points for alerts
    for (const alert of alerts) {
      switch (alert.severity) {
        case AlertSeverity.CRITICAL:
          score -= 40;
          break;
        case AlertSeverity.ERROR:
          score -= 20;
          break;
        case AlertSeverity.WARNING:
          score -= 10;
          break;
        case AlertSeverity.INFO:
          score -= 5;
          break;
      }
    }

    // Deduct points for poor metrics
    if (metrics.averageQueryTime > 500) {
      score -= 10;
    }
    if (metrics.failedQueries > 0) {
      score -= Math.min(metrics.failedQueries * 2, 20);
    }
    if (metrics.connectionStatus !== 'connected') {
      score -= 30;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, score };
  }

  /**
   * Handle alert
   */
  private handleAlert(alert: PerformanceAlert): void {
    // Store in history (keep last 100 alerts)
    this.alertHistory.push(alert);
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }

    // Call alert callback if provided
    if (this.config.alertCallback) {
      this.config.alertCallback(alert);
    }

    // Log alert based on severity
    const logMessage = `[Performance Alert] ${alert.message}`;
    switch (alert.severity) {
      case AlertSeverity.CRITICAL:
      case AlertSeverity.ERROR:
        console.error(logMessage);
        break;
      case AlertSeverity.WARNING:
        console.warn(logMessage);
        break;
      case AlertSeverity.INFO:
        console.info(logMessage);
        break;
    }
  }

  /**
   * Get current performance summary
   */
  public async getCurrentSummary(): Promise<{
    health: { status: string; score: number };
    metrics: {
      totalQueries: number;
      averageQueryTime: number;
      slowQueryPercentage: number;
      failedQueries: number;
      cacheHitRate: number;
    };
    recentAlerts: PerformanceAlert[];
  }> {
    const report = await this.generateReport();
    const clientMetrics = report.clientMetrics;

    const totalCacheAccess = clientMetrics
      ? clientMetrics.cacheHits + clientMetrics.cacheMisses
      : 0;

    return {
      health: report.health,
      metrics: {
        totalQueries: clientMetrics?.totalQueries || 0,
        averageQueryTime: clientMetrics?.averageQueryTime || 0,
        slowQueryPercentage:
          clientMetrics && clientMetrics.totalQueries > 0
            ? (clientMetrics.slowQueries / clientMetrics.totalQueries) * 100
            : 0,
        failedQueries: clientMetrics?.failedQueries || 0,
        cacheHitRate:
          totalCacheAccess > 0 && clientMetrics
            ? (clientMetrics.cacheHits / totalCacheAccess) * 100
            : 0,
      },
      recentAlerts: this.alertHistory.slice(-10),
    };
  }

  /**
   * Get performance history
   */
  public getHistory(): PerformanceReport[] {
    return [...this.performanceHistory];
  }

  /**
   * Clear history
   */
  public clearHistory(): void {
    this.performanceHistory = [];
    this.alertHistory = [];
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      performanceHistory: this.performanceHistory,
      alertHistory: this.alertHistory,
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Get recommendations based on current metrics
   */
  public async getRecommendations(): Promise<string[]> {
    const report = await this.generateReport();
    const recommendations = [...report.recommendations];

    // Add specific recommendations based on patterns
    if (this.performanceHistory.length >= 5) {
      const recentReports = this.performanceHistory.slice(-5);

      // Check for consistent issues
      const consistentSlowQueries = recentReports.every(
        r => r.clientMetrics && r.clientMetrics.averageQueryTime > 500
      );

      if (consistentSlowQueries) {
        recommendations.push(
          'Persistent slow query performance detected - consider database optimization'
        );
      }

      const consistentCacheMisses = recentReports.every(r => {
        if (!r.clientMetrics) return false;
        const totalAccess = r.clientMetrics.cacheHits + r.clientMetrics.cacheMisses;
        return totalAccess > 0 && r.clientMetrics.cacheMisses / totalAccess > 0.7;
      });

      if (consistentCacheMisses) {
        recommendations.push('High cache miss rate persisting - review caching strategy');
      }
    }

    return Array.from(new Set(recommendations)); // Remove duplicates
  }

  /**
   * Dispose of the monitor
   */
  public dispose(): void {
    this.stop();
    this.clearHistory();
  }
}

// Export singleton instance
let monitor: SupabasePerformanceMonitor | null = null;

export const getPerformanceMonitor = (
  config?: Partial<MonitoringConfig>
): SupabasePerformanceMonitor => {
  if (!monitor) {
    monitor = new SupabasePerformanceMonitor(config);
  }
  return monitor;
};

// Export default instance
export default getPerformanceMonitor();
