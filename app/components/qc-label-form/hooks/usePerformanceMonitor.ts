'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * 性能指標介面
 * @interface PerformanceMetrics
 */
interface PerformanceMetrics {
  readonly renderCount: number;
  readonly lastRenderTime: number;
  readonly averageRenderTime: number;
  readonly totalRenderTime: number;
  readonly slowRenders: number;
  readonly componentName: string;
}

/**
 * 性能監控配置介面
 * @interface PerformanceConfig
 */
interface PerformanceConfig {
  readonly componentName: string;
  readonly slowRenderThreshold?: number; // ms
  readonly enableLogging?: boolean;
  readonly trackUserInteractions?: boolean;
}

/**
 * 性能摘要介面
 * @interface PerformanceSummary
 */
interface PerformanceSummary extends PerformanceMetrics {
  readonly slowRenderPercentage: number;
  readonly isPerformant: boolean;
  readonly recommendations: readonly string[];
}

/**
 * 全域性能摘要介面
 * @interface GlobalPerformanceSummary
 */
interface GlobalPerformanceSummary {
  readonly totalComponents: number;
  readonly totalRenders: number;
  readonly averageRenderTime: number;
  readonly slowComponents: number;
  readonly slowComponentPercentage: number;
  readonly componentBreakdown: readonly {
    readonly name: string;
    readonly renderCount: number;
    readonly averageRenderTime: number;
    readonly slowRenders: number;
  }[];
}

/**
 * 交互追蹤返回函數類型
 */
type InteractionEndCallback = () => void;

/**
 * 性能監控 Hook
 * @param config - 監控配置
 * @returns 性能監控工具集
 */
export const usePerformanceMonitor = (config: PerformanceConfig) => {
  const {
    componentName,
    slowRenderThreshold = 16, // 16ms = 60fps
    enableLogging = false, // Disabled by default to prevent infinite loops
    trackUserInteractions = true,
  } = config;

  const renderTimes = useRef<number[]>([]);
  const interactionTimes = useRef<Map<string, number>>(new Map());

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    slowRenders: 0,
    componentName,
  });

  /**
   * 手動渲染追蹤（需要時明確調用）
   */
  const trackRender = useCallback(
    (renderTime: number) => {
      renderTimes.current.push(renderTime);

      // Keep only last 100 render times for average calculation
      if (renderTimes.current.length > 100) {
        renderTimes.current.shift();
      }

      const totalTime = renderTimes.current.reduce((sum, time) => sum + time, 0);
      const averageTime = totalTime / renderTimes.current.length;

      setMetrics(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        lastRenderTime: renderTime,
        averageRenderTime: averageTime,
        totalRenderTime: prev.totalRenderTime + renderTime,
        slowRenders: prev.slowRenders + (renderTime > slowRenderThreshold ? 1 : 0),
      }));

      if (enableLogging && renderTime > slowRenderThreshold) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
          );
        }
      }
    },
    [componentName, enableLogging, slowRenderThreshold]
  );

  /**
   * 追蹤用戶互動
   */
  const trackInteraction = useCallback(
    (interactionType: string): InteractionEndCallback | undefined => {
      if (!trackUserInteractions) return undefined;

      const startTime = performance.now();
      interactionTimes.current.set(interactionType, startTime);

      return (): void => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (enableLogging) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(
              `[Performance] ${componentName} - ${interactionType}: ${duration.toFixed(2)}ms`
            );
          }
        }
      };
    },
    [componentName, enableLogging, trackUserInteractions]
  );

  /**
   * 獲取性能摘要
   */
  const getPerformanceSummary = useCallback((): PerformanceSummary => {
    const recommendations: string[] = [];
    const slowRenderPercentage =
      metrics.renderCount > 0 ? (metrics.slowRenders / metrics.renderCount) * 100 : 0;
    const isPerformant = metrics.averageRenderTime < slowRenderThreshold;

    // Generate recommendations
    if (slowRenderPercentage > 20) {
      recommendations.push('Consider using React.memo or useMemo for expensive calculations');
    }
    if (metrics.averageRenderTime > slowRenderThreshold * 2) {
      recommendations.push('Component renders are consistently slow, consider code splitting');
    }
    if (metrics.renderCount > 100 && metrics.slowRenders > 10) {
      recommendations.push('High number of slow renders detected, review component dependencies');
    }

    const summary: PerformanceSummary = {
      ...metrics,
      slowRenderPercentage,
      isPerformant,
      recommendations,
    };

    return summary;
  }, [metrics, slowRenderThreshold]);

  /**
   * 重置性能指標
   */
  const resetMetrics = useCallback(() => {
    renderTimes.current = [];
    interactionTimes.current.clear();
    setMetrics({
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      slowRenders: 0,
      componentName,
    });
  }, [componentName]);

  return {
    metrics,
    trackRender,
    trackInteraction,
    getPerformanceSummary,
    resetMetrics,
  };
};

/**
 * 全域性能監控上下文
 * @returns 全域性能監控工具集
 */
export const useGlobalPerformanceMonitor = () => {
  const [globalMetrics, setGlobalMetrics] = useState<Map<string, PerformanceMetrics>>(new Map());

  /**
   * 註冊組件性能指標
   */
  const registerComponent = useCallback((componentName: string, metrics: PerformanceMetrics) => {
    setGlobalMetrics(prev => new Map(prev.set(componentName, metrics)));
  }, []);

  /**
   * 獲取全域性能摘要
   */
  const getGlobalSummary = useCallback((): GlobalPerformanceSummary => {
    const components = Array.from(globalMetrics.entries());
    const totalComponents = components.length;
    const totalRenders = components.reduce((sum, [, metrics]) => sum + metrics.renderCount, 0);
    const averageRenderTime =
      totalComponents > 0
        ? components.reduce((sum, [, metrics]) => sum + metrics.averageRenderTime, 0) /
          totalComponents
        : 0;
    const slowComponents = components.filter(
      ([, metrics]) => metrics.averageRenderTime > 16
    ).length;

    return {
      totalComponents,
      totalRenders,
      averageRenderTime,
      slowComponents,
      slowComponentPercentage: totalComponents > 0 ? (slowComponents / totalComponents) * 100 : 0,
      componentBreakdown: components.map(([name, metrics]) => ({
        name,
        renderCount: metrics.renderCount,
        averageRenderTime: metrics.averageRenderTime,
        slowRenders: metrics.slowRenders,
      })),
    };
  }, [globalMetrics]);

  return {
    globalMetrics,
    registerComponent,
    getGlobalSummary,
  };
};

export default usePerformanceMonitor;
