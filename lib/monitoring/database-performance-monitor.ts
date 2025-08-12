/**
 * Database Performance Monitoring and Alerting System
 * Provides comprehensive monitoring for database operations with automated alerting
 * and performance trend analysis for operational excellence
 */

import { createClient } from '@/app/utils/supabase/server';
import { dbConnectionManager } from '@/lib/database/connection-pool';

// Performance metrics interface
interface DatabaseMetrics {
  // Connection metrics
  activeConnections: number;
  maxConnections: number;
  connectionUtilization: number;
  
  // Query performance
  avgQueryTime: number;
  slowQueryCount: number;
  totalQueries: number;
  queriesPerSecond: number;
  
  // Table metrics
  tableSize: number;
  indexEfficiency: number;
  cacheHitRatio: number;
  
  // System health
  diskUsage: number;
  replicationLag?: number;
  lockCount: number;
  
  // Timestamps
  timestamp: Date;
  period: string;
}

// Alert configuration
interface AlertThreshold {
  metric: keyof DatabaseMetrics;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  enabled: boolean;
}

// Default alert thresholds
const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: 'connectionUtilization',
    operator: 'gt',
    value: 80,
    severity: 'high',
    message: 'Database connection utilization exceeded 80%',
    enabled: true
  },
  {
    metric: 'avgQueryTime',
    operator: 'gt',
    value: 1000,
    severity: 'medium',
    message: 'Average query time exceeded 1 second',
    enabled: true
  },
  {
    metric: 'slowQueryCount',
    operator: 'gt',
    value: 10,
    severity: 'medium',
    message: 'High number of slow queries detected',
    enabled: true
  },
  {
    metric: 'cacheHitRatio',
    operator: 'lt',
    value: 95,
    severity: 'low',
    message: 'Database cache hit ratio below 95%',
    enabled: true
  },
  {
    metric: 'diskUsage',
    operator: 'gt',
    value: 85,
    severity: 'high',
    message: 'Database disk usage exceeded 85%',
    enabled: true
  },
  {
    metric: 'lockCount',
    operator: 'gt',
    value: 50,
    severity: 'medium',
    message: 'High number of database locks detected',
    enabled: true
  }
];

/**
 * Database Performance Monitor Class
 */
export class DatabasePerformanceMonitor {
  private supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  private alertThresholds: AlertThreshold[];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: ((alert: AlertEvent) => void)[] = [];
  private metricsHistory: DatabaseMetrics[] = [];
  
  constructor(alertThresholds: AlertThreshold[] = DEFAULT_ALERT_THRESHOLDS) {
    this.alertThresholds = alertThresholds;
  }

  /**
   * Initialize monitoring system
   */
  async initialize() {
    this.supabase = await createClient();
    await this.setupMonitoringTables();
    console.log('[DatabaseMonitor] Performance monitoring system initialized');
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs: number = 60000) {
    if (this.isMonitoring) {
      console.warn('[DatabaseMonitor] Monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectAndAnalyzeMetrics();
      } catch (error) {
        console.error('[DatabaseMonitor] Error during monitoring cycle:', error);
      }
    }, intervalMs);

    console.log(`[DatabaseMonitor] Started monitoring with ${intervalMs}ms interval`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('[DatabaseMonitor] Monitoring stopped');
  }

  /**
   * Collect comprehensive database metrics
   */
  async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    const connectionStats = dbConnectionManager.getStats();
    const timestamp = new Date();

    // Get database system metrics
    const systemMetrics = await this.getSystemMetrics();
    const queryMetrics = await this.getQueryPerformanceMetrics();
    const tableMetrics = await this.getTableMetrics();

    return {
      // Connection metrics
      activeConnections: connectionStats.activeConnections,
      maxConnections: 100, // Could be made configurable
      connectionUtilization: (connectionStats.activeConnections / 100) * 100,
      
      // Query performance
      avgQueryTime: queryMetrics.avgQueryTime,
      slowQueryCount: connectionStats.slowQueries,
      totalQueries: connectionStats.totalQueries,
      queriesPerSecond: this.calculateQPS(connectionStats.totalQueries, timestamp),
      
      // Table metrics
      tableSize: tableMetrics.totalSize,
      indexEfficiency: tableMetrics.indexEfficiency,
      cacheHitRatio: systemMetrics.cacheHitRatio,
      
      // System health
      diskUsage: systemMetrics.diskUsage,
      replicationLag: systemMetrics.replicationLag,
      lockCount: systemMetrics.lockCount,
      
      // Metadata
      timestamp,
      period: '1m'
    };
  }

  /**
   * Get system-level database metrics
   */
  private async getSystemMetrics() {
    if (!this.supabase) {
      throw new Error('DatabasePerformanceMonitor not initialized');
    }
    
    try {
      const { data, error } = await this.supabase.rpc('get_database_system_metrics');
      
      if (error) {
        console.warn('[DatabaseMonitor] Could not get system metrics:', error);
        return this.getDefaultSystemMetrics();
      }

      interface SystemMetricsData {
        cache_hit_ratio?: number;
        disk_usage_percent?: number;
        replication_lag_ms?: number;
        active_locks?: number;
      }

      return {
        cacheHitRatio: (data as SystemMetricsData)?.cache_hit_ratio || 95,
        diskUsage: (data as SystemMetricsData)?.disk_usage_percent || 50,
        replicationLag: (data as SystemMetricsData)?.replication_lag_ms || 0,
        lockCount: (data as SystemMetricsData)?.active_locks || 0
      };
    } catch (error) {
      console.warn('[DatabaseMonitor] Error getting system metrics:', error);
      return this.getDefaultSystemMetrics();
    }
  }

  /**
   * Get query performance metrics
   */
  private async getQueryPerformanceMetrics() {
    if (!this.supabase) {
      throw new Error('DatabasePerformanceMonitor not initialized');
    }
    
    try {
      const { data, error } = await this.supabase.rpc('get_query_performance_metrics');
      
      if (error) {
        console.warn('[DatabaseMonitor] Could not get query metrics:', error);
        return { avgQueryTime: 0 };
      }

      return {
        avgQueryTime: (data as { avg_execution_time_ms?: number })?.avg_execution_time_ms || 0
      };
    } catch (error) {
      console.warn('[DatabaseMonitor] Error getting query metrics:', error);
      return { avgQueryTime: 0 };
    }
  }

  /**
   * Get table and index metrics
   */
  private async getTableMetrics() {
    if (!this.supabase) {
      throw new Error('DatabasePerformanceMonitor not initialized');
    }
    
    try {
      const { data, error } = await this.supabase.rpc('get_table_metrics');
      
      if (error) {
        console.warn('[DatabaseMonitor] Could not get table metrics:', error);
        return { totalSize: 0, indexEfficiency: 100 };
      }

      return {
        totalSize: (data as { total_size_mb?: number; index_usage_percent?: number })?.total_size_mb || 0,
        indexEfficiency: (data as { total_size_mb?: number; index_usage_percent?: number })?.index_usage_percent || 100
      };
    } catch (error) {
      console.warn('[DatabaseMonitor] Error getting table metrics:', error);
      return { totalSize: 0, indexEfficiency: 100 };
    }
  }

  /**
   * Calculate queries per second
   */
  private calculateQPS(totalQueries: number, currentTime: Date): number {
    const previousMetric = this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;

    if (!previousMetric) return 0;

    const timeDiffSeconds = (currentTime.getTime() - previousMetric.timestamp.getTime()) / 1000;
    const queryDiff = totalQueries - previousMetric.totalQueries;
    
    return timeDiffSeconds > 0 ? queryDiff / timeDiffSeconds : 0;
  }

  /**
   * Collect metrics and perform alerting analysis
   */
  private async collectAndAnalyzeMetrics() {
    try {
      const metrics = await this.collectDatabaseMetrics();
      
      // Store metrics for trend analysis
      this.metricsHistory.push(metrics);
      
      // Keep only last 100 entries for memory efficiency
      if (this.metricsHistory.length > 100) {
        this.metricsHistory = this.metricsHistory.slice(-100);
      }

      // Store metrics in database - disabled (tables removed)
      // await this.storeMetrics(metrics);

      // Check for alerts - disabled (tables removed)
      // await this.checkAlerts(metrics);

      console.log(`[DatabaseMonitor] Metrics collected: ${JSON.stringify({
        connections: metrics.activeConnections,
        avgQuery: metrics.avgQueryTime,
        slowQueries: metrics.slowQueryCount,
        qps: metrics.queriesPerSecond.toFixed(2)
      })}`);

    } catch (error) {
      console.error('[DatabaseMonitor] Error collecting metrics:', error);
    }
  }

  /**
   * Check metrics against alert thresholds
   */
  private async checkAlerts(metrics: DatabaseMetrics) {
    for (const threshold of this.alertThresholds.filter(t => t.enabled)) {
      const metricValue = metrics[threshold.metric] as number;
      let shouldAlert = false;

      switch (threshold.operator) {
        case 'gt':
          shouldAlert = metricValue > threshold.value;
          break;
        case 'lt':
          shouldAlert = metricValue < threshold.value;
          break;
        case 'eq':
          shouldAlert = metricValue === threshold.value;
          break;
      }

      if (shouldAlert) {
        const alertEvent: AlertEvent = {
          id: `alert_${Date.now()}_${threshold.metric}`,
          type: 'database_performance',
          severity: threshold.severity,
          message: threshold.message,
          metric: threshold.metric,
          currentValue: metricValue,
          thresholdValue: threshold.value,
          timestamp: new Date(),
          resolved: false
        };

        await this.triggerAlert(alertEvent);
      }
    }
  }

  /**
   * Trigger alert and notify subscribers
   */
  private async triggerAlert(alertEvent: AlertEvent) {
    try {
      // Store alert in database
      await this.storeAlert(alertEvent);

      // Notify all subscribers
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alertEvent);
        } catch (error) {
          console.error('[DatabaseMonitor] Error in alert callback:', error);
        }
      });

      console.warn(`[DatabaseMonitor] ALERT [${alertEvent.severity.toUpperCase()}]: ${alertEvent.message} (Current: ${alertEvent.currentValue}, Threshold: ${alertEvent.thresholdValue})`);

    } catch (error) {
      console.error('[DatabaseMonitor] Error triggering alert:', error);
    }
  }

  /**
   * Store metrics in database for historical analysis
   */
  private async storeMetrics(metrics: DatabaseMetrics) {
    if (!this.supabase) {
      throw new Error('DatabasePerformanceMonitor not initialized');
    }
    
    try {
      const { error } = await this.supabase
        .from('db_performance_metrics')
        .insert({
          active_connections: metrics.activeConnections,
          connection_utilization: metrics.connectionUtilization,
          avg_query_time: metrics.avgQueryTime,
          slow_query_count: metrics.slowQueryCount,
          total_queries: metrics.totalQueries,
          queries_per_second: metrics.queriesPerSecond,
          table_size_mb: metrics.tableSize,
          index_efficiency: metrics.indexEfficiency,
          cache_hit_ratio: metrics.cacheHitRatio,
          disk_usage: metrics.diskUsage,
          replication_lag: metrics.replicationLag,
          lock_count: metrics.lockCount,
          recorded_at: metrics.timestamp.toISOString(),
          period: metrics.period
        });

      if (error) {
        console.error('[DatabaseMonitor] Error storing metrics:', error);
      }
    } catch (error) {
      console.error('[DatabaseMonitor] Error in storeMetrics:', error);
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alertEvent: AlertEvent) {
    if (!this.supabase) {
      throw new Error('DatabasePerformanceMonitor not initialized');
    }
    
    try {
      const { error } = await this.supabase
        .from('db_performance_alerts')
        .insert({
          alert_id: alertEvent.id,
          alert_type: alertEvent.type,
          severity: alertEvent.severity,
          message: alertEvent.message,
          metric_name: alertEvent.metric,
          current_value: alertEvent.currentValue,
          threshold_value: alertEvent.thresholdValue,
          triggered_at: alertEvent.timestamp.toISOString(),
          resolved: alertEvent.resolved
        });

      if (error) {
        console.error('[DatabaseMonitor] Error storing alert:', error);
      }
    } catch (error) {
      console.error('[DatabaseMonitor] Error in storeAlert:', error);
    }
  }

  /**
   * Setup monitoring tables if they don't exist
   */
  private async setupMonitoringTables() {
    // This would be handled by migrations in production
    // Just log that tables should exist
    console.log('[DatabaseMonitor] Monitoring tables should be set up via migrations');
  }

  /**
   * Get default system metrics when unable to query
   */
  private getDefaultSystemMetrics() {
    return {
      cacheHitRatio: 95,
      diskUsage: 50,
      replicationLag: 0,
      lockCount: 0
    };
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: AlertEvent) => void) {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get recent metrics for analysis
   */
  getRecentMetrics(count: number = 10): DatabaseMetrics[] {
    return this.metricsHistory.slice(-count);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    if (this.metricsHistory.length === 0) {
      return null;
    }

    const recent = this.metricsHistory.slice(-10);
    const avgQueryTime = recent.reduce((sum, m) => sum + m.avgQueryTime, 0) / recent.length;
    const avgQPS = recent.reduce((sum, m) => sum + m.queriesPerSecond, 0) / recent.length;
    const maxConnections = Math.max(...recent.map(m => m.activeConnections));

    return {
      averageQueryTime: Math.round(avgQueryTime),
      averageQPS: Math.round(avgQPS * 100) / 100,
      maxActiveConnections: maxConnections,
      totalSlowQueries: recent[recent.length - 1].slowQueryCount,
      isHealthy: avgQueryTime < 1000 && maxConnections < 80
    };
  }
}

// Alert event interface
interface AlertEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  timestamp: Date;
  resolved: boolean;
}

// Global monitor instance
export const databasePerformanceMonitor = new DatabasePerformanceMonitor();

// Monitoring disabled - tables removed
// if (process.env.NODE_ENV === 'production') {
//   databasePerformanceMonitor.initialize().then(() => {
//     databasePerformanceMonitor.startMonitoring(60000); // Monitor every minute
//   });
// }

export default databasePerformanceMonitor;