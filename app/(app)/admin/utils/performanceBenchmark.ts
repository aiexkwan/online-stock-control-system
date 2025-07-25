/**
 * 性能基準測試工具
 * 用於測量 Admin Dashboard 優化效果
 */

import React from 'react';

interface PerformanceMetrics {
  bundleSize: number;
  initialLoadTime: number;
  widgetRenderTimes: Map<string, number>;
  rerenderCount: Map<string, number>;
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  };
  networkMetrics: {
    requestCount: number;
    totalSize: number;
    cachedRequests: number;
  };
}

export class PerformanceBenchmark {
  private static instance: PerformanceBenchmark;
  private metrics: PerformanceMetrics;
  private observer: PerformanceObserver | null = null;
  private renderStartTimes: Map<string, number> = new Map();

  private constructor() {
    this.metrics = {
      bundleSize: 0,
      initialLoadTime: 0,
      widgetRenderTimes: new Map(),
      rerenderCount: new Map(),
      memoryUsage: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
      },
      networkMetrics: {
        requestCount: 0,
        totalSize: 0,
        cachedRequests: 0,
      },
    };
  }

  static getInstance(): PerformanceBenchmark {
    if (!PerformanceBenchmark.instance) {
      PerformanceBenchmark.instance = new PerformanceBenchmark();
    }
    return PerformanceBenchmark.instance;
  }

  // 開始性能監測
  startMonitoring(): void {
    // 監測資源加載
    this.observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.metrics.networkMetrics.requestCount++;
          this.metrics.networkMetrics.totalSize += resourceEntry.transferSize || 0;

          if (resourceEntry.transferSize === 0) {
            this.metrics.networkMetrics.cachedRequests++;
          }
        }
      }
    });

    this.observer.observe({ entryTypes: ['resource', 'measure'] });

    // 記錄初始加載時間
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      this.metrics.initialLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    }

    // 監測內存使用 (如果支援)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (
          performance as Performance & {
            memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
          }
        ).memory;
        this.metrics.memoryUsage = {
          usedJSHeapSize: memory?.usedJSHeapSize || 0,
          totalJSHeapSize: memory?.totalJSHeapSize || 0,
        };
      }, 1000);
    }
  }

  // 記錄 Widget 渲染開始
  startWidgetRender(widgetId: string): void {
    this.renderStartTimes.set(widgetId, performance.now());
  }

  // 記錄 Widget 渲染結束
  endWidgetRender(widgetId: string): void {
    const startTime = this.renderStartTimes.get(widgetId);
    if (startTime) {
      const renderTime = performance.now() - startTime;

      // 更新渲染時間
      const currentTime = this.metrics.widgetRenderTimes.get(widgetId) || 0;
      this.metrics.widgetRenderTimes.set(widgetId, Math.max(currentTime, renderTime));

      // 更新重渲染次數
      const currentCount = this.metrics.rerenderCount.get(widgetId) || 0;
      this.metrics.rerenderCount.set(widgetId, currentCount + 1);

      this.renderStartTimes.delete(widgetId);
    }
  }

  // 測量 Bundle Size
  async measureBundleSize(): Promise<void> {
    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.endsWith('.js'));

      this.metrics.bundleSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
    } catch (error) {
      console.error('Failed to measure bundle size:', error);
    }
  }

  // 獲取性能報告
  getReport(): {
    summary: string;
    details: PerformanceMetrics;
    recommendations: string[];
  } {
    const bundleSizeKB = Math.round(this.metrics.bundleSize / 1024);
    const loadTimeSeconds = (this.metrics.initialLoadTime / 1000).toFixed(2);
    const avgRenderTime = this.calculateAverageRenderTime();
    const totalRerenders = this.calculateTotalRerenders();

    const summary = `
性能測試報告：
- Bundle Size: ${bundleSizeKB}KB ${bundleSizeKB < 350 ? '✅' : '❌'} (目標: <350KB)
- 初始加載時間: ${loadTimeSeconds}s ${parseFloat(loadTimeSeconds) < 1 ? '✅' : '❌'} (目標: <1s)
- 平均 Widget 渲染時間: ${avgRenderTime.toFixed(2)}ms
- 總重渲染次數: ${totalRerenders}
- 內存使用: ${Math.round(this.metrics.memoryUsage.usedJSHeapSize / 1024 / 1024)}MB
- 網絡請求: ${this.metrics.networkMetrics.requestCount} (${this.metrics.networkMetrics.cachedRequests} cached)
    `.trim();

    const recommendations = this.generateRecommendations();

    return {
      summary,
      details: this.metrics,
      recommendations,
    };
  }

  // 計算平均渲染時間
  private calculateAverageRenderTime(): number {
    const times = Array.from(this.metrics.widgetRenderTimes.values());
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // 計算總重渲染次數
  private calculateTotalRerenders(): number {
    return Array.from(this.metrics.rerenderCount.values()).reduce((sum, count) => sum + count, 0);
  }

  // 生成優化建議
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.bundleSize > 350 * 1024) {
      recommendations.push('Bundle size 超過 350KB，建議進一步 code splitting');
    }

    if (this.metrics.initialLoadTime > 1000) {
      recommendations.push('初始加載時間超過 1 秒，建議優化關鍵渲染路徑');
    }

    // 檢查高重渲染的組件
    this.metrics.rerenderCount.forEach((count, widgetId) => {
      if (count > 5) {
        recommendations.push(`Widget ${widgetId} 重渲染 ${count} 次，建議檢查依賴項`);
      }
    });

    // 檢查慢渲染的組件
    this.metrics.widgetRenderTimes.forEach((time, widgetId) => {
      if (time > 100) {
        recommendations.push(`Widget ${widgetId} 渲染時間 ${time.toFixed(2)}ms，建議優化`);
      }
    });

    return recommendations;
  }

  // 清理資源
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.renderStartTimes.clear();
  }
}

// 導出便捷函數
export const performanceBenchmark = PerformanceBenchmark.getInstance();

// React Hook 用於組件性能測量
export function useWidgetPerformance(widgetId: string) {
  const benchmark = PerformanceBenchmark.getInstance();

  // 組件掛載時開始測量
  React.useEffect(() => {
    benchmark.startWidgetRender(widgetId);

    // 使用 RAF 確保渲染完成後結束測量
    const rafId = requestAnimationFrame(() => {
      benchmark.endWidgetRender(widgetId);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  });
}
