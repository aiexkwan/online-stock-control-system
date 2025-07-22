'use client';

import { useEffect, useRef } from 'react';
import { useVisualSystem } from '../core/VisualSystemProvider';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderTime: number;
}

export function usePerformanceMonitor() {
  const { state, actions, performanceConfig } = useVisualSystem();
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    renderTime: 0,
  });

  useEffect(() => {
    if (!performanceConfig.monitoring.collectMetrics) return;

    let animationId: number;
    let metricsInterval: NodeJS.Timeout;

    // FPS計算
    const measureFPS = (currentTime: number) => {
      frameCountRef.current++;
      
      if (currentTime - lastTimeRef.current >= 1000) {
        metricsRef.current.fps = Math.round(
          (frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)
        );
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    // 記憶體監控
    const measureMemory = () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        metricsRef.current.memory = Math.round(
          memoryInfo.usedJSHeapSize / 1048576 // 轉換為MB
        );
      }
    };

    // 定期更新指標
    metricsInterval = setInterval(() => {
      measureMemory();
      actions.updatePerformanceMetrics(
        metricsRef.current.fps,
        metricsRef.current.memory
      );

      // 檢查是否需要降級
      checkPerformanceDegradation();
    }, performanceConfig.monitoring.metricsInterval);

    // 開始測量
    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(metricsInterval);
    };
  }, [actions, performanceConfig]);

  // 性能降級檢查
  const checkPerformanceDegradation = () => {
    const { fallbackStrategies } = performanceConfig;
    
    // FPS降級
    if (metricsRef.current.fps < fallbackStrategies.lowPerformance.threshold) {
      if (fallbackStrategies.lowPerformance.actions.disableAnimations) {
        actions.setAnimationsEnabled(false);
      }
      if (fallbackStrategies.lowPerformance.actions.reduceQuality) {
        actions.setPerformanceTier('low');
      }
    }

    // 記憶體降級
    const memoryThreshold = performanceConfig.memoryManagement.warningThreshold;
    if (metricsRef.current.memory > memoryThreshold) {
      if (fallbackStrategies.lowMemory.actions.disableEffects) {
        actions.setStarfieldEnabled(false);
        actions.setGlassmorphismEnabled(false);
      }
    }
  };

  return {
    fps: state.currentFPS,
    memory: state.memoryUsage,
    performanceTier: state.performanceTier,
  };
}

// 性能優化HOC
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    disableOnLowPerformance?: boolean;
    fallbackComponent?: React.ComponentType<P>;
  } = {}
) {
  return function OptimizedComponent(props: P) {
    const { state } = useVisualSystem();
    
    if (
      options.disableOnLowPerformance && 
      state.performanceTier === 'low' &&
      options.fallbackComponent
    ) {
      const FallbackComponent = options.fallbackComponent;
      return <FallbackComponent {...props} />;
    }

    return <Component {...props} />;
  };
}