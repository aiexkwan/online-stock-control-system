'use client';

import { useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  slowRenders: number;
  componentName: string;
}

interface PerformanceConfig {
  componentName: string;
  slowRenderThreshold?: number; // ms
  enableLogging?: boolean;
  trackUserInteractions?: boolean;
}

export const usePerformanceMonitor = (config: PerformanceConfig) => {
  const {
    componentName,
    slowRenderThreshold = 16, // 16ms = 60fps
    enableLogging = false, // Disabled by default to prevent infinite loops
    trackUserInteractions = true
  } = config;

  const renderTimes = useRef<number[]>([]);
  const interactionTimes = useRef<Map<string, number>>(new Map());
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    slowRenders: 0,
    componentName
  });

  // Manual render tracking (called explicitly when needed)
  const trackRender = useCallback((renderTime: number) => {
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
      slowRenders: prev.slowRenders + (renderTime > slowRenderThreshold ? 1 : 0)
    }));

    if (enableLogging && renderTime > slowRenderThreshold) {
      console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName, enableLogging, slowRenderThreshold]);

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string) => {
    if (!trackUserInteractions) return;

    const startTime = performance.now();
    interactionTimes.current.set(interactionType, startTime);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (enableLogging) {
        console.log(`[Performance] ${componentName} - ${interactionType}: ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName, enableLogging, trackUserInteractions]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const summary = {
      ...metrics,
      slowRenderPercentage: metrics.renderCount > 0 ? (metrics.slowRenders / metrics.renderCount) * 100 : 0,
      isPerformant: metrics.averageRenderTime < slowRenderThreshold,
      recommendations: [] as string[]
    };

    // Generate recommendations
    if (summary.slowRenderPercentage > 20) {
      summary.recommendations.push('Consider using React.memo or useMemo for expensive calculations');
    }
    if (summary.averageRenderTime > slowRenderThreshold * 2) {
      summary.recommendations.push('Component renders are consistently slow, consider code splitting');
    }
    if (summary.renderCount > 100 && summary.slowRenders > 10) {
      summary.recommendations.push('High number of slow renders detected, review component dependencies');
    }

    return summary;
  }, [metrics, slowRenderThreshold]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    renderTimes.current = [];
    interactionTimes.current.clear();
    setMetrics({
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      slowRenders: 0,
      componentName
    });
  }, [componentName]);

  return {
    metrics,
    trackRender,
    trackInteraction,
    getPerformanceSummary,
    resetMetrics
  };
};

// Performance monitoring context for global metrics
export const useGlobalPerformanceMonitor = () => {
  const [globalMetrics, setGlobalMetrics] = useState<Map<string, PerformanceMetrics>>(new Map());

  const registerComponent = useCallback((componentName: string, metrics: PerformanceMetrics) => {
    setGlobalMetrics(prev => new Map(prev.set(componentName, metrics)));
  }, []);

  const getGlobalSummary = useCallback(() => {
    const components = Array.from(globalMetrics.entries());
    const totalComponents = components.length;
    const totalRenders = components.reduce((sum, [, metrics]) => sum + metrics.renderCount, 0);
    const averageRenderTime = components.reduce((sum, [, metrics]) => sum + metrics.averageRenderTime, 0) / totalComponents;
    const slowComponents = components.filter(([, metrics]) => metrics.averageRenderTime > 16).length;

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
        slowRenders: metrics.slowRenders
      }))
    };
  }, [globalMetrics]);

  return {
    globalMetrics,
    registerComponent,
    getGlobalSummary
  };
};

export default usePerformanceMonitor; 