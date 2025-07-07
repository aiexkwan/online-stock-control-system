/**
 * Performance Monitor React Hook
 * 
 * 提供性能監控功能的 React Hook
 */

import { useCallback, useEffect, useState } from 'react';
import { 
  performanceMonitor, 
  PerformanceMetric, 
  PerformanceAlert,
  PerformanceReport 
} from '../PerformanceMonitor';
import { useFeatureFlag } from '@/lib/feature-flags/hooks/useFeatureFlag';

export interface UsePerformanceMonitorOptions {
  autoStart?: boolean;
  reportInterval?: number; // 毫秒
  onAlert?: (alert: PerformanceAlert) => void;
}

export interface UsePerformanceMonitorReturn {
  // 狀態
  isMonitoring: boolean;
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  report: PerformanceReport | null;
  
  // 控制方法
  startMonitoring: () => void;
  stopMonitoring: () => PerformanceReport;
  
  // 測量方法
  measureAsync: <T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => Promise<T>
  ) => Promise<T>;
  
  measureSync: <T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => T
  ) => T;
  
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
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  
  // 檢查 Feature Flag
  const { enabled: isPerformanceMonitoringEnabled } = useFeatureFlag('performance_monitoring');
  
  // 開始監控
  const startMonitoring = useCallback(() => {
    if (!isPerformanceMonitoringEnabled) return;
    
    performanceMonitor.startMonitoring();
    setIsMonitoring(true);
  }, [isPerformanceMonitoringEnabled]);
  
  // 停止監控
  const stopMonitoring = useCallback(() => {
    const finalReport = performanceMonitor.stopMonitoring();
    setIsMonitoring(false);
    setReport(finalReport);
    return finalReport;
  }, []);
  
  // 測量異步操作
  const measureAsync = useCallback(async <T,>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!isPerformanceMonitoringEnabled || !isMonitoring) {
      return operation();
    }
    
    return performanceMonitor.measureAsync(name, category, operation);
  }, [isPerformanceMonitoringEnabled, isMonitoring]);
  
  // 測量同步操作
  const measureSync = useCallback(<T,>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => T
  ): T => {
    if (!isPerformanceMonitoringEnabled || !isMonitoring) {
      return operation();
    }
    
    return performanceMonitor.measureSync(name, category, operation);
  }, [isPerformanceMonitoringEnabled, isMonitoring]);
  
  // 記錄指標
  const recordMetric = useCallback((metric: Omit<PerformanceMetric, 'timestamp'>) => {
    if (!isPerformanceMonitoringEnabled || !isMonitoring) return;
    
    performanceMonitor.recordMetric(metric);
  }, [isPerformanceMonitoringEnabled, isMonitoring]);
  
  // 記錄 API 調用
  const recordApiCall = useCallback((
    endpoint: string,
    method: string,
    duration: number,
    status: number
  ) => {
    if (!isPerformanceMonitoringEnabled || !isMonitoring) return;
    
    performanceMonitor.recordApiCall(endpoint, method, duration, status);
  }, [isPerformanceMonitoringEnabled, isMonitoring]);
  
  // 記錄數據庫查詢
  const recordDatabaseQuery = useCallback((
    query: string,
    duration: number,
    rowCount?: number
  ) => {
    if (!isPerformanceMonitoringEnabled || !isMonitoring) return;
    
    performanceMonitor.recordDatabaseQuery(query, duration, rowCount);
  }, [isPerformanceMonitoringEnabled, isMonitoring]);
  
  // 設置事件監聽器
  useEffect(() => {
    if (!isPerformanceMonitoringEnabled) return;
    
    const handleWarning = (alert: PerformanceAlert) => {
      setAlerts(prev => [...prev, alert]);
      onAlert?.(alert);
    };
    
    const handleCritical = (alert: PerformanceAlert) => {
      setAlerts(prev => [...prev, alert]);
      onAlert?.(alert);
      
      // 關鍵警報可以觸發額外操作
      console.error('[Performance Critical]', alert.message);
    };
    
    performanceMonitor.on('alert:warning', handleWarning);
    performanceMonitor.on('alert:critical', handleCritical);
    
    return () => {
      performanceMonitor.off('alert:warning', handleWarning);
      performanceMonitor.off('alert:critical', handleCritical);
    };
  }, [isPerformanceMonitoringEnabled, onAlert]);
  
  // 定期更新指標
  useEffect(() => {
    if (!isMonitoring || !reportInterval) return;
    
    const interval = setInterval(() => {
      const { currentMetrics, activeAlerts } = performanceMonitor.getRealtimeMetrics();
      setMetrics(currentMetrics);
      setAlerts(activeAlerts);
    }, reportInterval);
    
    return () => clearInterval(interval);
  }, [isMonitoring, reportInterval]);
  
  // 自動啟動
  useEffect(() => {
    if (autoStart && isPerformanceMonitoringEnabled && !isMonitoring) {
      startMonitoring();
    }
    
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [autoStart, isPerformanceMonitoringEnabled, isMonitoring, startMonitoring, stopMonitoring]);
  
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
    recordDatabaseQuery
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
        unit: 'ms',
        metadata: { componentName }
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
  
  const trackApi = useCallback(async <T,>(
    endpoint: string,
    method: string,
    fetcher: () => Promise<Response>
  ): Promise<T> => {
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
  }, [recordApiCall]);
  
  return { trackApi };
}