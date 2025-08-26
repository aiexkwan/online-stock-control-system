/**
 * Card Migration Performance Monitor - MVP
 * 監控 Card 系統的性能指標
 */

interface PerformanceMetric {
  id: string;
  type: 'load_time' | 'render_time' | 'query_time' | 'bundle_size' | 'cache_hit';
  value: number;
  timestamp: number;
  context?: Record<string, unknown>;
}

interface PerformanceReport {
  totalCards: number;
  averageLoadTime: number;
  cacheHitRate: number;
  slowestCard: string;
  fastestCard: string;
  bundleSize: number;
  queryMetrics: {
    total: number;
    average: number;
    slowest: number;
  };
}

export class CardPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private loadStartTimes: Map<string, number> = new Map();

  /**
   * 開始監控 Card 載入
   */
  startCardLoad(cardId: string): void {
    this.loadStartTimes.set(cardId, performance.now());
  }

  /**
   * 結束監控 Card 載入
   */
  endCardLoad(cardId: string, context?: Record<string, unknown>): void {
    const startTime = this.loadStartTimes.get(cardId);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      this.recordMetric({
        id: `card-load-${cardId}`,
        type: 'load_time',
        value: loadTime,
        timestamp: Date.now(),
        context: { cardId, ...context },
      });
      this.loadStartTimes.delete(cardId);
    }
  }

  /**
   * 記錄渲染時間
   */
  recordRenderTime(cardId: string, renderTime: number): void {
    this.recordMetric({
      id: `card-render-${cardId}`,
      type: 'render_time',
      value: renderTime,
      timestamp: Date.now(),
      context: { cardId },
    });
  }

  /**
   * 記錄 GraphQL 查詢時間
   */
  recordQueryTime(queryName: string, queryTime: number, cacheHit: boolean): void {
    this.recordMetric({
      id: `query-${queryName}`,
      type: 'query_time',
      value: queryTime,
      timestamp: Date.now(),
      context: { queryName, cacheHit },
    });

    this.recordMetric({
      id: `cache-${queryName}`,
      type: 'cache_hit',
      value: cacheHit ? 1 : 0,
      timestamp: Date.now(),
      context: { queryName },
    });
  }

  /**
   * 記錄 Bundle 大小
   */
  recordBundleSize(cardId: string, size: number): void {
    this.recordMetric({
      id: `bundle-${cardId}`,
      type: 'bundle_size',
      value: size,
      timestamp: Date.now(),
      context: { cardId },
    });
  }

  /**
   * 記錄性能指標
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 只保留最近 1000 個指標
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // 實時報告慢加載
    if (metric.type === 'load_time' && metric.value > 500) {
      console.warn(
        `[Performance] Slow card load: ${metric.context?.cardId} (${metric.value.toFixed(2)}ms)`
      );
    }
  }

  /**
   * 生成性能報告
   */
  generateReport(): PerformanceReport {
    const loadTimeMetrics = this.metrics.filter(m => m.type === 'load_time');
    const queryTimeMetrics = this.metrics.filter(m => m.type === 'query_time');
    const cacheMetrics = this.metrics.filter(m => m.type === 'cache_hit');
    const bundleMetrics = this.metrics.filter(m => m.type === 'bundle_size');

    // 計算平均載入時間
    const averageLoadTime =
      loadTimeMetrics.length > 0
        ? loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length
        : 0;

    // 找出最快和最慢的 Card
    const sortedLoadTimes = loadTimeMetrics.sort((a, b) => a.value - b.value);
    const fastestCard = (sortedLoadTimes[0]?.context?.cardId as string) || 'N/A';
    const slowestCard =
      (sortedLoadTimes[sortedLoadTimes.length - 1]?.context?.cardId as string) || 'N/A';

    // 計算緩存命中率
    const cacheHitRate =
      cacheMetrics.length > 0
        ? (cacheMetrics.filter(m => m.value === 1).length / cacheMetrics.length) * 100
        : 0;

    // 計算總 Bundle 大小
    const totalBundleSize = bundleMetrics.reduce((sum, m) => sum + m.value, 0);

    // 查詢性能統計
    const queryMetrics = {
      total: queryTimeMetrics.length,
      average:
        queryTimeMetrics.length > 0
          ? queryTimeMetrics.reduce((sum, m) => sum + m.value, 0) / queryTimeMetrics.length
          : 0,
      slowest: queryTimeMetrics.length > 0 ? Math.max(...queryTimeMetrics.map(m => m.value)) : 0,
    };

    return {
      totalCards: new Set(loadTimeMetrics.map(m => m.context?.cardId as string).filter(Boolean))
        .size,
      averageLoadTime,
      cacheHitRate,
      slowestCard,
      fastestCard,
      bundleSize: totalBundleSize,
      queryMetrics,
    };
  }

  /**
   * 獲取性能趨勢
   */
  getPerformanceTrends(hours: number = 1): Record<string, number[]> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    const trends: Record<string, number[]> = {};

    ['load_time', 'query_time', 'render_time'].forEach(type => {
      trends[type] = recentMetrics.filter(m => m.type === type).map(m => m.value);
    });

    return trends;
  }

  /**
   * 清除舊數據
   */
  clearOldMetrics(hours: number = 24): void {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * 導出數據
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// 全局性能監控實例
export const cardPerformanceMonitor = new CardPerformanceMonitor();

// 便捷方法
export const startCardLoad = (cardId: string) => cardPerformanceMonitor.startCardLoad(cardId);
export const endCardLoad = (cardId: string, context?: Record<string, unknown>) =>
  cardPerformanceMonitor.endCardLoad(cardId, context);
export const recordQueryTime = (queryName: string, queryTime: number, cacheHit: boolean) =>
  cardPerformanceMonitor.recordQueryTime(queryName, queryTime, cacheHit);
export const generatePerformanceReport = () => cardPerformanceMonitor.generateReport();
