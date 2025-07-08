/**
 * Performance Monitoring Integration
 * 整合性能監控到 Widget 加載流程
 */

import React from 'react';
import { WidgetComponentProps } from './types';
import { performanceMonitor, PerformanceTimer } from './performance-monitor';
import { dualLoadingAdapter, getDualLoadingConfig } from './dual-loading-adapter';

/**
 * 性能監控 HOC (Higher Order Component)
 */
export function withPerformanceMonitoring<P extends WidgetComponentProps>(
  WrappedComponent: React.ComponentType<P>,
  widgetId: string
): React.ComponentType<P> {
  const MonitoredComponent = (props: P) => {
    const timerRef = React.useRef<PerformanceTimer | null>(null);
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
      setIsClient(true);
    }, []);

    React.useEffect(() => {
      if (!isClient) return;

      // 獲取當前配置
      const config = getDualLoadingConfig();
      const variant = config.enableV2 ? 'v2' : 'legacy';

      // 開始監控
      timerRef.current = performanceMonitor.startMonitoring(widgetId, variant);
      timerRef.current.startRender();

      // 完成監控
      return () => {
        if (timerRef.current) {
          timerRef.current.complete({
            route: window.location.pathname,
            sessionId: getSessionId(),
            userId: getUserId(),
          });
        }
      };
    }, [isClient]);

    // 監控數據獲取
    const originalUseEffect = React.useEffect;
    React.useEffect = function (...args: Parameters<typeof originalUseEffect>) {
      const [effect, deps] = args;

      return originalUseEffect(() => {
        // 如果這是數據獲取的 effect，開始計時
        if (timerRef.current && deps && deps.length > 0) {
          timerRef.current.startDataFetch();
        }

        const cleanup = effect();

        // 結束數據獲取計時
        if (timerRef.current) {
          timerRef.current.endDataFetch();
        }

        return cleanup;
      }, deps);
    };

    return React.createElement(WrappedComponent, props);
  };

  MonitoredComponent.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || widgetId})`;

  return MonitoredComponent;
}

/**
 * 性能監控 Hook
 */
export function usePerformanceMonitoring(widgetId: string) {
  const [timer, setTimer] = React.useState<PerformanceTimer | null>(null);
  const [metrics, setMetrics] = React.useState<{
    loadTime?: number;
    renderTime?: number;
    dataFetchTime?: number;
  }>({});

  React.useEffect(() => {
    // 獲取當前配置
    const config = getDualLoadingConfig();
    const variant = config.enableV2 ? 'v2' : 'legacy';

    // 創建計時器
    const performanceTimer = performanceMonitor.startMonitoring(widgetId, variant);
    setTimer(performanceTimer);

    // 清理
    return () => {
      performanceTimer.complete({
        route: window.location.pathname,
        sessionId: getSessionId(),
        userId: getUserId(),
      });
    };
  }, [widgetId]);

  const startRender = React.useCallback(() => {
    timer?.startRender();
  }, [timer]);

  const startDataFetch = React.useCallback(() => {
    timer?.startDataFetch();
  }, [timer]);

  const endDataFetch = React.useCallback(() => {
    if (timer) {
      const time = timer.endDataFetch();
      setMetrics(prev => ({ ...prev, dataFetchTime: time }));
    }
  }, [timer]);

  const mark = React.useCallback(
    (name: string) => {
      timer?.mark(name);
    },
    [timer]
  );

  return {
    startRender,
    startDataFetch,
    endDataFetch,
    mark,
    metrics,
  };
}

/**
 * Widget 加載器整合
 */
export async function loadWidgetWithMonitoring(
  widgetId: string,
  loader: () => Promise<React.ComponentType<any>>
): Promise<React.ComponentType<any>> {
  const config = getDualLoadingConfig();
  const variant = config.enableV2 ? 'v2' : 'legacy';

  // 開始監控
  const timer = performanceMonitor.startMonitoring(widgetId, variant);

  try {
    // 加載組件
    const component = await loader();

    // 返回包裝的組件
    return withPerformanceMonitoring(component, widgetId);
  } finally {
    // 記錄加載時間
    timer.complete({
      route: window.location.pathname,
      sessionId: getSessionId(),
      userId: getUserId(),
    });
  }
}

/**
 * 批量性能報告
 */
export function useBatchPerformanceReport(widgetIds: string[]) {
  const [reports, setReports] = React.useState<Map<string, any>>(new Map());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const newReports = new Map();

      for (const widgetId of widgetIds) {
        const report = performanceMonitor.getWidgetReport(widgetId);
        newReports.set(widgetId, report);
      }

      setReports(newReports);
      setLoading(false);
    };

    fetchReports();

    // 每 30 秒更新一次
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [widgetIds]);

  return { reports, loading };
}

/**
 * 實時性能監控 Hook
 */
export function useRealtimePerformance() {
  const [data, setData] = React.useState(performanceMonitor.getRealtimeMetrics());

  React.useEffect(() => {
    const updateData = () => {
      setData(performanceMonitor.getRealtimeMetrics());
    };

    // 每 5 秒更新一次
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, []);

  return data;
}

// 工具函數
function getSessionId(): string {
  // 從 cookie 或生成新的
  if (typeof window !== 'undefined') {
    let sessionId = document.cookie
      .split('; ')
      .find(row => row.startsWith('session_id='))
      ?.split('=')[1];

    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2);
      document.cookie = `session_id=${sessionId}; path=/; max-age=86400`; // 24 hours
    }

    return sessionId;
  }
  return 'unknown';
}

function getUserId(): string | undefined {
  // 從 cookie 或 localStorage 獲取
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId') || undefined;
  }
  return undefined;
}

/**
 * 自動整合到現有 widgets
 */
export function autoIntegratePerformanceMonitoring() {
  // 在 widget registry 初始化時調用
  console.log('[PerformanceIntegration] Auto-integration started');

  // Hook into widget registry
  import('./enhanced-registry').then(({ widgetRegistry }) => {
    const originalGetComponent = widgetRegistry.getComponent.bind(widgetRegistry);

    widgetRegistry.getComponent = function (widgetId: string) {
      const component = originalGetComponent(widgetId);
      if (component) {
        // 返回包裝的組件
        return withPerformanceMonitoring(component, widgetId);
      }
      return component;
    };

    console.log('[PerformanceIntegration] Widget registry patched for performance monitoring');
  });
}
