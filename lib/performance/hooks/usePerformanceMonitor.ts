/**
 * Performance Monitor React Hook
 *
 * 提供性能監控功能的 React Hook
 */

import React, { useCallback, useEffect, useState } from 'react';
import { performanceMonitor, PerformanceMetric, PerformanceAlert } from '../PerformanceMonitor';
import {
  SimplePerformanceMonitor,
  PerformanceSummary,
  type SimpleMetric,
  type PerformanceAlert as SimpleAlert,
} from '../SimplePerformanceMonitor';
// import { useFeatureFlag } from '@/lib/feature-flags/hooks/useFeatureFlag'; // Commented out for now

// 性能監控報告類型
interface PerformanceMonitorReport {
  totalMetrics: number;
  categories: string[];
  alertCount: number;
  activeCategories: string[];
  recentAlerts: number;
  memoryUsage: number;
  timestamp: string;
}

// Hook 返回結果類型
interface StopMonitoringResult {
  success: boolean;
  duration: number;
  finalReport: PerformanceMonitorReport;
  metricsCount: number;
}

export interface UsePerformanceMonitorOptions {
  autoStart?: boolean;
  reportInterval?: number; // 毫秒
  onAlert?: (alert: PerformanceAlert) => void;
}

export interface UsePerformanceMonitorReturn {
  // 狀態
  isMonitoring: boolean;
  metrics: PerformanceMetric[];
  alerts: SimpleAlert[];
  report: PerformanceMonitorReport | null;

  // 控制方法
  startMonitoring: () => void;
  stopMonitoring: () => StopMonitoringResult;

  // 測量方法
  measureAsync: <T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => Promise<T>
  ) => Promise<T>;

  measureSync: <T>(name: string, category: PerformanceMetric['category'], operation: () => T) => T;

  // 記錄方法
  recordMetric: (metric: Omit<PerformanceMetric, 'timestamp'>) => void;
  recordApiCall: (endpoint: string, method: string, duration: number, status: number) => void;
  recordDatabaseQuery: (query: string, duration: number, rowCount?: number) => void;
}

export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
): UsePerformanceMonitorReturn {
  const { autoStart = false, reportInterval = 5000, onAlert } = options;

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<SimpleAlert[]>([]);
  const [report, setReport] = useState<PerformanceMonitorReport | null>(null);

  // 檢查 Feature Flag
  const isPerformanceMonitoringEnabled = true; // Hardcoded for now

  // 開始監控 - 使用 ref 來追蹤狀態，避免依賴 isMonitoring
  const isMonitoringRef = React.useRef(false);
  const startMonitoring = useCallback(() => {
    if (!isPerformanceMonitoringEnabled || isMonitoringRef.current) return; // 防止重複啟動

    // performanceMonitor.startMonitoring(); // Method doesn't exist in SimplePerformanceMonitor
    isMonitoringRef.current = true;
    setIsMonitoring(true);
  }, [isPerformanceMonitoringEnabled]);

  // 停止監控
  const stopMonitoring = useCallback((): StopMonitoringResult => {
    const endTime = Date.now();
    const summary = performanceMonitor.getSummary();
    const finalReport: PerformanceMonitorReport = {
      ...summary,
      timestamp: new Date().toISOString(),
    };

    isMonitoringRef.current = false;
    setIsMonitoring(false);
    setReport(finalReport);

    return {
      success: true,
      duration: endTime - Date.now(), // Simplified duration calculation
      finalReport,
      metricsCount: summary.totalMetrics,
    };
  }, []);

  // 測量異步操作
  const measureAsync = useCallback(
    async <T>(
      name: string,
      category: PerformanceMetric['category'],
      operation: () => Promise<T>
    ): Promise<T> => {
      if (!isPerformanceMonitoringEnabled || !isMonitoring) {
        return operation();
      }

      // Method doesn't exist, implement manually
      const start = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - start;
        performanceMonitor.recordMetric(`${name}_async`, duration, category);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        performanceMonitor.recordMetric(`${name}_async_error`, duration, category);
        throw error;
      }
    },
    [isPerformanceMonitoringEnabled, isMonitoring]
  );

  // 測量同步操作
  const measureSync = useCallback(
    <T>(name: string, category: PerformanceMetric['category'], operation: () => T): T => {
      if (!isPerformanceMonitoringEnabled || !isMonitoring) {
        return operation();
      }

      // Method doesn't exist, implement manually
      const start = Date.now();
      try {
        const result = operation();
        const duration = Date.now() - start;
        performanceMonitor.recordMetric(`${name}_sync`, duration, category);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        performanceMonitor.recordMetric(`${name}_sync_error`, duration, category);
        throw error;
      }
    },
    [isPerformanceMonitoringEnabled, isMonitoring]
  );

  // 記錄指標
  const recordMetric = useCallback(
    (metric: Omit<PerformanceMetric, 'timestamp'>) => {
      if (!isPerformanceMonitoringEnabled || !isMonitoring) return;

      // Adapt to SimplePerformanceMonitor API
      performanceMonitor.recordMetric(metric.name, metric.value, metric.category);
    },
    [isPerformanceMonitoringEnabled, isMonitoring]
  );

  // 記錄 API 調用
  const recordApiCall = useCallback(
    (endpoint: string, method: string, duration: number, status: number) => {
      if (!isPerformanceMonitoringEnabled || !isMonitoring) return;

      // Adapt to SimplePerformanceMonitor API
      performanceMonitor.recordMetric(`api_${method}_${endpoint}`, duration, 'api');
    },
    [isPerformanceMonitoringEnabled, isMonitoring]
  );

  // 記錄數據庫查詢
  const recordDatabaseQuery = useCallback(
    (query: string, duration: number, rowCount?: number) => {
      if (!isPerformanceMonitoringEnabled || !isMonitoring) return;

      // Adapt to SimplePerformanceMonitor API
      performanceMonitor.recordMetric('database_query', duration, 'database');
    },
    [isPerformanceMonitoringEnabled, isMonitoring]
  );

  // 設置事件監聽器
  useEffect(() => {
    if (!isPerformanceMonitoringEnabled) return;

    const handleWarning = (alert: SimpleAlert) => {
      setAlerts(prev => [...prev, alert]);
      onAlert?.(alert as unknown as PerformanceAlert);
    };

    const handleCritical = (alert: SimpleAlert) => {
      setAlerts(prev => [...prev, alert]);
      onAlert?.(alert as unknown as PerformanceAlert);

      // 關鍵警報可以觸發額外操作
      console.error('[Performance Critical]', alert.message);
    };

    // Event listeners not supported in SimplePerformanceMonitor
    // performanceMonitor.on('alert:warning', handleWarning);
    // performanceMonitor.on('alert:critical', handleCritical);

    return () => {
      // performanceMonitor.off('alert:warning', handleWarning);
      // performanceMonitor.off('alert:critical', handleCritical);
    };
  }, [isPerformanceMonitoringEnabled, onAlert]);

  // 定期更新指標
  useEffect(() => {
    if (!isMonitoring || !reportInterval) return;

    const interval = setInterval(() => {
      // getRealtimeMetrics not available, use available methods
      const currentMetrics = performanceMonitor.getMetrics();
      const activeAlerts = performanceMonitor.getAlerts();

      // 使用更高效的比較方式，避免 JSON.stringify
      setMetrics(prev => {
        // 如果長度不同，肯定有變化
        if (prev.length !== currentMetrics.length) {
          return currentMetrics;
        }
        // 只比較最後一個指標是否相同（假設新指標會添加到末尾）
        const lastPrev = prev[prev.length - 1];
        const lastCurrent = currentMetrics[currentMetrics.length - 1];
        if (
          !lastPrev ||
          !lastCurrent ||
          lastPrev.timestamp !== lastCurrent.timestamp ||
          lastPrev.value !== lastCurrent.value
        ) {
          return currentMetrics;
        }
        return prev;
      });

      setAlerts(prev => {
        // 如果長度不同，肯定有變化
        if (prev.length !== activeAlerts.length) {
          return activeAlerts;
        }
        return prev;
      });
    }, reportInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, reportInterval]);

  // 自動啟動 - 使用 useRef 來確保只執行一次
  const hasAutoStarted = React.useRef(false);
  useEffect(() => {
    if (autoStart && isPerformanceMonitoringEnabled && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startMonitoring();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依賴數組，只在組件掛載時執行一次

  // 清理函數放在獨立的 useEffect 中
  useEffect(() => {
    return () => {
      if (isMonitoringRef.current) {
        isMonitoringRef.current = false;
        setIsMonitoring(false);
      }
    };
  }, []); // 空依賴數組，只在組件卸載時清理

  return {
    isMonitoring,
    metrics,
    alerts,
    report,
    startMonitoring,
    stopMonitoring,
    measureAsync,
    measureSync,
    recordMetric,
    recordApiCall,
    recordDatabaseQuery,
  };
}

/**
 * 性能測量裝飾器 Hook
 *
 * 用於自動測量組件渲染性能
 */
export function useComponentPerformance(componentName: string) {
  const { recordMetric } = usePerformanceMonitor();

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      recordMetric({
        name: `component_render`,
        category: 'render',
        value: renderTime,
        // metadata: { componentName }, // Removed for compatibility
      });
    };
  }, [componentName, recordMetric]);
}

/**
 * API 性能追蹤 Hook
 *
 * 自動追蹤 API 調用性能
 */
export function useApiPerformance() {
  const { recordApiCall } = usePerformanceMonitor();

  const trackApi = useCallback(
    async <T>(endpoint: string, method: string, fetcher: () => Promise<Response>): Promise<T> => {
      const startTime = performance.now();

      try {
        const response = await fetcher();
        const duration = performance.now() - startTime;

        recordApiCall(endpoint, method, duration, response.status);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        const duration = performance.now() - startTime;
        recordApiCall(endpoint, method, duration, 0);
        throw error;
      }
    },
    [recordApiCall]
  );

  return { trackApi };
}
