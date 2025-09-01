/**
 * React 性能監控工具
 *
 * 職責：
 * - 收集組件渲染性能指標
 * - 監控重渲染頻率和原因
 * - 提供開發環境性能警告
 * - 支援性能基準測試
 */

import { useRef, useEffect, useCallback } from 'react';

// 性能指標介面
export interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  totalRenderTime: number;
  lastRenderTime: number;
  propsChangeCount: number;
  memoryUsage?: number;
}

// 重渲染原因追蹤
export interface RenderReason {
  componentName: string;
  timestamp: number;
  propsChanged: string[];
  renderTime: number;
}

// 全局性能監控儲存
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>();
  private renderHistory: RenderReason[] = [];
  private isEnabled = process.env.NODE_ENV === 'development';

  /**
   * 記錄組件渲染
   */
  recordRender(componentName: string, renderTime: number, propsChanged: string[] = []) {
    if (!this.isEnabled) return;

    const existing = this.metrics.get(componentName) || {
      componentName,
      renderCount: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
      propsChangeCount: 0,
    };

    const newMetrics: PerformanceMetrics = {
      ...existing,
      renderCount: existing.renderCount + 1,
      totalRenderTime: existing.totalRenderTime + renderTime,
      lastRenderTime: renderTime,
      propsChangeCount: existing.propsChangeCount + (propsChanged.length > 0 ? 1 : 0),
    };

    newMetrics.averageRenderTime = newMetrics.totalRenderTime / newMetrics.renderCount;

    this.metrics.set(componentName, newMetrics);

    // 記錄重渲染原因
    if (propsChanged.length > 0) {
      this.renderHistory.push({
        componentName,
        timestamp: Date.now(),
        propsChanged,
        renderTime,
      });

      // 保持歷史記錄在合理範圍內
      if (this.renderHistory.length > 1000) {
        this.renderHistory = this.renderHistory.slice(-500);
      }
    }

    // 性能警告
    this.checkPerformanceWarnings(componentName, newMetrics);
  }

  /**
   * 檢查性能警告
   */
  private checkPerformanceWarnings(componentName: string, metrics: PerformanceMetrics) {
    const SLOW_RENDER_THRESHOLD = 16; // 16ms (60fps)
    const HIGH_RENDER_COUNT_THRESHOLD = 100;

    if (metrics.lastRenderTime > SLOW_RENDER_THRESHOLD) {
      console.warn(
        `🐌 慢渲染警告: ${componentName} 渲染耗時 ${metrics.lastRenderTime.toFixed(2)}ms (超過 ${SLOW_RENDER_THRESHOLD}ms 閾值)`
      );
    }

    if (
      metrics.renderCount > HIGH_RENDER_COUNT_THRESHOLD &&
      metrics.renderCount % HIGH_RENDER_COUNT_THRESHOLD === 0
    ) {
      console.warn(
        `🔄 高頻重渲染警告: ${componentName} 已渲染 ${metrics.renderCount} 次，平均耗時 ${metrics.averageRenderTime.toFixed(2)}ms`
      );
    }

    // 檢查 props 變更頻率
    const propsChangeRate = metrics.propsChangeCount / metrics.renderCount;
    if (propsChangeRate > 0.8) {
      console.warn(
        `⚡ Props 變更頻繁警告: ${componentName} 有 ${(propsChangeRate * 100).toFixed(1)}% 的渲染由 props 變更觸發`
      );
    }
  }

  /**
   * 獲取所有性能指標
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 獲取特定組件的指標
   */
  getComponentMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  /**
   * 獲取重渲染歷史
   */
  getRenderHistory(componentName?: string): RenderReason[] {
    if (componentName) {
      return this.renderHistory.filter(r => r.componentName === componentName);
    }
    return [...this.renderHistory];
  }

  /**
   * 重置指標
   */
  reset() {
    this.metrics.clear();
    this.renderHistory = [];
  }

  /**
   * 打印性能報告
   */
  printReport() {
    if (!this.isEnabled) return;

    console.group('📊 React 性能監控報告');

    const metrics = this.getMetrics().sort((a, b) => b.averageRenderTime - a.averageRenderTime);

    console.table(
      metrics.map(m => ({
        組件: m.componentName,
        渲染次數: m.renderCount,
        平均耗時: `${m.averageRenderTime.toFixed(2)}ms`,
        最後耗時: `${m.lastRenderTime.toFixed(2)}ms`,
        總耗時: `${m.totalRenderTime.toFixed(2)}ms`,
        Props變更次數: m.propsChangeCount,
      }))
    );

    // 顯示最近的重渲染原因
    const recentRenders = this.renderHistory.slice(-10);
    if (recentRenders.length > 0) {
      console.group('最近 10 次重渲染原因');
      recentRenders.forEach(r => {
        console.log(
          `${r.componentName} (${r.renderTime.toFixed(2)}ms): ${r.propsChanged.join(', ')}`
        );
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * 啟用/禁用監控
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// 全局監控實例
export const performanceMonitor = new PerformanceMonitor();

/**
 * 性能監控 Hook
 * 用於監控組件的渲染性能
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const previousProps = useRef<any>(null);
  const renderCountRef = useRef(0);

  // 開始測量渲染時間
  const startRenderMeasure = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // 結束測量渲染時間
  const endRenderMeasure = useCallback(
    (props?: any) => {
      if (renderStartTime.current === 0) return;

      const renderTime = performance.now() - renderStartTime.current;
      renderCountRef.current += 1;

      // 檢測 props 變更
      let propsChanged: string[] = [];
      if (props && previousProps.current) {
        propsChanged = Object.keys(props).filter(key => {
          const oldValue = previousProps.current[key];
          const newValue = props[key];

          // 簡單的深度比較
          if (typeof oldValue === 'object' && typeof newValue === 'object') {
            return JSON.stringify(oldValue) !== JSON.stringify(newValue);
          }
          return oldValue !== newValue;
        });
      }

      performanceMonitor.recordRender(componentName, renderTime, propsChanged);
      previousProps.current = props;
      renderStartTime.current = 0;
    },
    [componentName]
  );

  // 自動在每次渲染時測量
  useEffect(() => {
    endRenderMeasure();
  });

  return {
    startRenderMeasure,
    endRenderMeasure,
    renderCount: renderCountRef.current,
  };
};

/**
 * 記憶體使用監控 Hook
 */
export const useMemoryMonitor = (componentName: string) => {
  const previousMemory = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDiff = currentMemory - previousMemory.current;

      if (Math.abs(memoryDiff) > 1024 * 1024) {
        // 超過 1MB 變化才記錄
        console.log(`🧠 ${componentName} 記憶體變化: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
      }

      previousMemory.current = currentMemory;
    }
  });
};

/**
 * 重渲染偵測器 Hook
 * 幫助識別導致重渲染的 props 變更
 */
export const useWhyDidYouUpdate = (componentName: string, props: any) => {
  const previousProps = useRef<any>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: any = {};

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.group(`🔍 ${componentName} 重渲染原因`);
        console.log('變更的 props:', changedProps);
        console.groupEnd();
      }
    }

    previousProps.current = props;
  });
};

/**
 * 性能基準測試工具
 */
export const createPerformanceBenchmark = (testName: string) => {
  const startTime = performance.now();
  let measurements: number[] = [];

  return {
    /**
     * 記錄一次測量
     */
    measure: () => {
      const currentTime = performance.now();
      measurements.push(currentTime - startTime);
    },

    /**
     * 完成基準測試並返回結果
     */
    finish: () => {
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const results = {
        testName,
        totalTime,
        measurements,
        averageTime:
          measurements.length > 0
            ? measurements.reduce((a, b) => a + b, 0) / measurements.length
            : totalTime,
        minTime: Math.min(...measurements),
        maxTime: Math.max(...measurements),
        measurementCount: measurements.length,
      };

      console.group(`⏱️ 性能基準測試: ${testName}`);
      console.table(results);
      console.groupEnd();

      return results;
    },
  };
};

// 開發環境下自動啟用性能監控
if (process.env.NODE_ENV === 'development') {
  // 定期打印性能報告
  setInterval(() => {
    performanceMonitor.printReport();
  }, 30000); // 每 30 秒打印一次

  // 在 window 上暴露性能監控工具
  if (typeof window !== 'undefined') {
    (window as any).performanceMonitor = performanceMonitor;
  }
}
