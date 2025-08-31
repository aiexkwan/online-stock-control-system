/**
 * React Hook for Supabase Performance Monitoring
 * Provides real-time performance metrics and alerts in React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getPerformanceMonitor,
  type PerformanceReport,
  type PerformanceAlert,
} from '../monitoring/supabase-performance-monitor';

// Hook configuration
export interface UseSupabasePerformanceOptions {
  enabled?: boolean;
  _showAlerts?: boolean;
  alertToast?: boolean;
  updateInterval?: number;
  onAlert?: (alert: PerformanceAlert) => void;
  onMetricsUpdate?: (report: PerformanceReport) => void;
}

// Hook return type
export interface UseSupabasePerformanceReturn {
  metrics: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueryPercentage: number;
    failedQueries: number;
    cacheHitRate: number;
    connectionStatus: string;
  } | null;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number;
  } | null;
  alerts: PerformanceAlert[];
  recommendations: string[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  refreshMetrics: () => Promise<void>;
  clearHistory: () => void;
}

/**
 * Custom hook for Supabase performance monitoring
 */
export function useSupabasePerformance(
  options: UseSupabasePerformanceOptions = {}
): UseSupabasePerformanceReturn {
  const {
    enabled = true,
    _showAlerts = true,
    alertToast = false,
    updateInterval = 30000,
    onAlert,
    onMetricsUpdate,
  } = options;

  const [metrics, setMetrics] = useState<UseSupabasePerformanceReturn['metrics']>(null);
  const [health, setHealth] = useState<UseSupabasePerformanceReturn['health']>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const monitorRef = useRef<ReturnType<typeof getPerformanceMonitor> | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize monitor
  useEffect(() => {
    if (!enabled) return;

    monitorRef.current = getPerformanceMonitor({
      enabled: true,
      interval: updateInterval,
      alertCallback: (alert: PerformanceAlert) => {
        // Update alerts state
        setAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10 alerts

        // Show toast if enabled
        if (alertToast) {
          const toastType =
            alert.severity === 'critical' || alert.severity === 'error'
              ? 'error'
              : alert.severity === 'warning'
                ? 'warning'
                : 'info';

          toast[toastType](alert.message, {
            description: `${alert.metric}: ${alert.value.toFixed(2)} (threshold: ${alert.threshold})`,
          });
        }

        // Call custom handler
        if (onAlert) {
          onAlert(alert);
        }
      },
      metricsCallback: (report: PerformanceReport) => {
        // Update metrics from report
        if (report.clientMetrics) {
          const totalCacheAccess =
            report.clientMetrics.cacheHits + report.clientMetrics.cacheMisses;
          setMetrics({
            totalQueries: report.clientMetrics.totalQueries,
            averageQueryTime: report.clientMetrics.averageQueryTime,
            slowQueryPercentage:
              report.clientMetrics.totalQueries > 0
                ? (report.clientMetrics.slowQueries / report.clientMetrics.totalQueries) * 100
                : 0,
            failedQueries: report.clientMetrics.failedQueries,
            cacheHitRate:
              totalCacheAccess > 0 ? (report.clientMetrics.cacheHits / totalCacheAccess) * 100 : 0,
            connectionStatus: report.clientMetrics.connectionStatus,
          });
        }

        // Update health
        setHealth(report.health);

        // Update recommendations
        setRecommendations(report.recommendations);

        // Call custom handler
        if (onMetricsUpdate) {
          onMetricsUpdate(report);
        }
      },
    });

    return () => {
      if (monitorRef.current) {
        monitorRef.current.stop();
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [enabled, updateInterval, alertToast, onAlert, onMetricsUpdate]);

  // Refresh metrics manually
  const refreshMetrics = useCallback(async () => {
    if (!monitorRef.current) return;

    try {
      const summary = await monitorRef.current.getCurrentSummary();

      setMetrics({
        totalQueries: summary.metrics.totalQueries,
        averageQueryTime: summary.metrics.averageQueryTime,
        slowQueryPercentage: summary.metrics.slowQueryPercentage,
        failedQueries: summary.metrics.failedQueries,
        cacheHitRate: summary.metrics.cacheHitRate,
        connectionStatus: 'connected', // Will be updated by monitor callback
      });

      setHealth({
        status: summary.health.status as 'healthy' | 'degraded' | 'unhealthy',
        score: summary.health.score,
      });

      setAlerts(summary.recentAlerts);

      const recs = await monitorRef.current.getRecommendations();
      setRecommendations(recs);
    } catch (error) {
      console.error('[useSupabasePerformance] Error refreshing metrics:', error);
    }
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!monitorRef.current || isMonitoring) return;

    monitorRef.current.start();
    setIsMonitoring(true);

    // Initial metrics fetch
    refreshMetrics();

    // Set up periodic updates
    updateIntervalRef.current = setInterval(() => {
      refreshMetrics();
    }, updateInterval);
  }, [isMonitoring, updateInterval, refreshMetrics]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!monitorRef.current || !isMonitoring) return;

    monitorRef.current.stop();
    setIsMonitoring(false);

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, [isMonitoring]);

  // Clear history
  const clearHistory = useCallback(() => {
    if (!monitorRef.current) return;

    monitorRef.current.clearHistory();
    setAlerts([]);
    setRecommendations([]);
  }, []);

  // Auto-start monitoring if enabled
  useEffect(() => {
    if (enabled && !isMonitoring) {
      startMonitoring();
    } else if (!enabled && isMonitoring) {
      stopMonitoring();
    }
  }, [enabled, isMonitoring, startMonitoring, stopMonitoring]);

  return {
    metrics,
    health,
    alerts,
    recommendations,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshMetrics,
    clearHistory,
  };
}

/**
 * Hook for monitoring GRN-specific database operations
 */
export function useGrnPerformance() {
  return useSupabasePerformance({
    enabled: true,
    _showAlerts: true,
    alertToast: true,
    updateInterval: 15000, // More frequent updates for GRN operations
    onAlert: (alert: PerformanceAlert) => {
      // Log GRN-specific alerts
      if (alert.severity === 'error' || alert.severity === 'critical') {
        console.error('[GRN Performance Alert]', alert);
      }
    },
  });
}
