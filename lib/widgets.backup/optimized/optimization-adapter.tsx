/**
 * Widget Optimization Adapter
 * 整合代碼分割和 React.memo 優化到現有系統
 */

import React, { Suspense } from 'react';
import { WidgetComponentProps } from '../types';
import { widgetRegistry } from '../enhanced-registry';
import { lazyWidgetMap, shouldUseLazyLoading } from './lazy-widgets';
import { getOptimizedComponent } from './memoized-widgets';
import { simplePerformanceMonitor } from '../../performance/SimplePerformanceMonitor';

// 使用已導出的性能監控實例
const performanceMonitor = simplePerformanceMonitor;

/**
 * Widget 加載狀態組件
 */
const WidgetSkeleton: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  return (
    <div className='animate-pulse'>
      <div className='flex h-full items-center justify-center rounded-lg bg-gray-200'>
        <div className='text-gray-400'>
          <div className='text-sm'>Loading {widgetId}...</div>
          <div className='mt-2'>
            <div className='inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600'></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 錯誤邊界組件
 */
class WidgetErrorBoundary extends React.Component<
  { widgetId: string; children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { widgetId: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Widget ${this.props.widgetId} crashed:`, error, errorInfo);

    // 記錄到性能監控
    performanceMonitor.recordMetric(
      `widget_error_${this.props.widgetId}`,
      1,
      'widget_errors'
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <h3 className='font-medium text-red-600'>Widget Error</h3>
          <p className='mt-1 text-sm text-red-500'>Failed to load {this.props.widgetId}</p>
          <details className='mt-2'>
            <summary className='cursor-pointer text-xs text-red-400'>Details</summary>
            <pre className='mt-1 overflow-auto text-xs'>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 優化適配器 - 整合所有優化策略
 */
export class OptimizationAdapter {
  private static instance: OptimizationAdapter;

  private constructor() {}

  static getInstance(): OptimizationAdapter {
    if (!OptimizationAdapter.instance) {
      OptimizationAdapter.instance = new OptimizationAdapter();
    }
    return OptimizationAdapter.instance;
  }

  /**
   * 獲取優化的 Widget 組件
   */
  getOptimizedWidget(widgetId: string): React.ComponentType<WidgetComponentProps> | null {
    // 1. 檢查是否應該使用懶加載
    const lazyComponent = lazyWidgetMap.get(widgetId);
    if (lazyComponent && shouldUseLazyLoading(widgetId)) {
      // 返回包裝的懶加載組件
      return this.wrapWithLazyLoading(widgetId, lazyComponent);
    }

    // 2. 獲取原始組件
    const originalComponent = widgetRegistry.getComponent(widgetId);
    if (!originalComponent) {
      console.warn(`[OptimizationAdapter] Widget not found: ${widgetId}`);
      return null;
    }

    // 3. 應用 React.memo 優化
    return getOptimizedComponent(widgetId, originalComponent);
  }

  /**
   * 包裝懶加載組件
   */
  private wrapWithLazyLoading(
    widgetId: string,
    LazyComponent: React.LazyExoticComponent<any>
  ): React.ComponentType<WidgetComponentProps> {
    const WrappedComponent: React.FC<WidgetComponentProps> = props => {
      return (
        <WidgetErrorBoundary widgetId={widgetId}>
          <Suspense fallback={<WidgetSkeleton widgetId={widgetId} />}>
            <LazyComponent {...props as any} />
          </Suspense>
        </WidgetErrorBoundary>
      );
    };

    WrappedComponent.displayName = `LazyOptimized(${widgetId})`;

    // 應用 React.memo 到包裝組件
    return getOptimizedComponent(widgetId, WrappedComponent);
  }

  /**
   * 預加載 Widget（用於優化體驗）
   */
  async preloadWidget(widgetId: string): Promise<void> {
    const lazyComponent = lazyWidgetMap.get(widgetId);

    if (lazyComponent && shouldUseLazyLoading(widgetId)) {
      try {
        // 觸發懶加載組件的預加載
        await (lazyComponent as any)._payload._result;
      } catch (e) {
        // 組件尚未加載，手動觸發
        (lazyComponent as any)._init((lazyComponent as any)._payload);
      }
    }
  }

  /**
   * 批量預加載（基於路由）
   */
  async preloadForRoute(route: string): Promise<void> {
    const routeWidgetMap: Record<string, string[]> = {
      '/admin/warehouse': [
        'AwaitLocationQtyWidget',
        'WarehouseTransferListWidget',
        'StockDistributionChart',
      ],
      '/admin/injection': ['HistoryTree', 'StatsCardWidget'],
      '/admin/pipeline': ['ProductionDetailsWidget', 'StaffWorkloadWidget', 'OrdersListWidget'],
    };

    const widgetsToPreload = routeWidgetMap[route] || [];

    // 並行預加載
    await Promise.all(widgetsToPreload.map(widgetId => this.preloadWidget(widgetId)));
  }

  /**
   * 整合到 Widget Registry
   */
  integrateWithRegistry(): void {
    // 修改 registry 的 getComponent 方法
    const originalGetComponent = widgetRegistry.getComponent.bind(widgetRegistry);

    widgetRegistry.getComponent = (widgetId: string) => {
      // 優先返回優化版本
      const optimized = this.getOptimizedWidget(widgetId);
      if (optimized) {
        return optimized;
      }

      // 回退到原始版本
      return originalGetComponent(widgetId);
    };

    console.log('[OptimizationAdapter] Integrated with widget registry');
  }

  /**
   * 獲取優化統計
   */
  getOptimizationStats(): {
    totalWidgets: number;
    lazyLoadedWidgets: number;
    memoizedWidgets: number;
    potentialSavings: string;
  } {
    const totalWidgets = widgetRegistry.getAllDefinitions().size;
    const lazyLoadedWidgets = lazyWidgetMap.size;

    // 計算潛在節省
    const avgWidgetSize = 50; // KB
    const lazyLoadedSize = lazyLoadedWidgets * avgWidgetSize;
    const potentialSavings = `~${lazyLoadedSize}KB initial bundle reduction`;

    return {
      totalWidgets,
      lazyLoadedWidgets,
      memoizedWidgets: totalWidgets, // 所有都應用了基本的 memo
      potentialSavings,
    };
  }
}

// 導出單例
export const optimizationAdapter = OptimizationAdapter.getInstance();

/**
 * 初始化優化
 */
export function initializeOptimizations(): void {
  console.log('[OptimizationAdapter] Initializing performance optimizations...');

  // 1. 整合到 registry
  optimizationAdapter.integrateWithRegistry();

  // 2. 監聽路由變化進行預加載
  if (typeof window !== 'undefined') {
    let currentPath = window.location.pathname;

    // 初始預加載
    optimizationAdapter.preloadForRoute(currentPath);

    // 監聽路由變化
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        optimizationAdapter.preloadForRoute(currentPath);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 3. 輸出優化統計
  const stats = optimizationAdapter.getOptimizationStats();
  console.log('[OptimizationAdapter] Optimization stats:', stats);
}

/**
 * React Hook - 使用優化的 Widget
 */
export function useOptimizedWidget(widgetId: string) {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadWidget = async () => {
      setLoading(true);

      // 預加載（如果需要）
      await optimizationAdapter.preloadWidget(widgetId);

      // 獲取優化組件
      const optimizedComponent = optimizationAdapter.getOptimizedWidget(widgetId);
      setComponent(() => optimizedComponent);

      setLoading(false);
    };

    loadWidget();
  }, [widgetId]);

  return { Component, loading };
}
