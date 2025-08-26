/**
 * GraphQL Performance Monitor
 * 監控 GraphQL 查詢性能和使用情況
 * Phase 2: 用於監控 GraphQL 遷移效果
 */

import { ApolloLink, Operation, NextLink, FetchResult, Observable } from '@apollo/client';
import { logger } from '@/lib/logger';

// 性能指標類型
interface GraphQLMetrics {
  operationName: string;
  operationType: 'query' | 'mutation' | 'subscription';
  startTime: number;
  endTime: number;
  duration: number;
  variables?: Record<string, unknown>;
  errors?: unknown[];
  dataSize: number;
  cacheHit: boolean;
}

// 性能統計
interface PerformanceStats {
  totalOperations: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  errorCount: number;
  cacheHitRate: number;
  operationCounts: Record<string, number>;
}

class GraphQLPerformanceMonitor {
  private metrics: GraphQLMetrics[] = [];
  private maxMetricsSize = 1000; // 最多保存 1000 條記錄
  private listeners: ((metrics: GraphQLMetrics) => void)[] = [];

  /**
   * 記錄操作指標
   */
  recordMetrics(metrics: GraphQLMetrics) {
    this.metrics.push(metrics);

    // 限制記錄數量
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift();
    }

    // 通知監聽器
    this.listeners.forEach(listener => listener(metrics));

    // 記錄到控制台（開發環境）
    if (process.env.NODE_ENV === 'development') {
      console.log('[GraphQL Performance]', {
        operation: metrics.operationName,
        duration: `${metrics.duration}ms`,
        cacheHit: metrics.cacheHit,
        errors: metrics.errors?.length || 0,
      });
    }

    // 記錄慢查詢
    if (metrics.duration > 1000) {
      logger.warn(
        {
          operation: metrics.operationName,
          duration: metrics.duration,
          variables: metrics.variables,
        },
        'Slow GraphQL query detected'
      );
    }

    // 記錄錯誤
    if (metrics.errors && metrics.errors.length > 0) {
      logger.error(
        {
          operation: metrics.operationName,
          errors: metrics.errors,
        },
        'GraphQL errors'
      );
    }
  }

  /**
   * 獲取性能統計
   */
  getStats(operationName?: string): PerformanceStats {
    const filteredMetrics = operationName
      ? this.metrics.filter(m => m.operationName === operationName)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        errorCount: 0,
        cacheHitRate: 0,
        operationCounts: {},
      };
    }

    const durations = filteredMetrics.map(m => m.duration);
    const errorCount = filteredMetrics.filter(m => m.errors && m.errors.length > 0).length;
    const cacheHits = filteredMetrics.filter(m => m.cacheHit).length;

    const operationCounts = filteredMetrics.reduce(
      (acc, m) => {
        acc[m.operationName] = (acc[m.operationName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalOperations: filteredMetrics.length,
      totalDuration: durations.reduce((sum, d) => sum + d, 0),
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      errorCount,
      cacheHitRate: (cacheHits / filteredMetrics.length) * 100,
      operationCounts,
    };
  }

  /**
   * 獲取 ACO Progress 特定統計
   */
  getAcoProgressStats(): {
    rest: PerformanceStats;
    graphql: PerformanceStats;
    comparison: {
      speedImprovement: number;
      errorReduction: number;
      cacheEfficiency: number;
    };
  } {
    // 這裡需要與 REST API 監控集成來比較
    const graphqlStats = this.getStats('AcoOrderProgressCards');

    // 模擬 REST API 統計（實際應從 API Monitor 獲取）
    const restStats: PerformanceStats = {
      totalOperations: 100,
      totalDuration: 50000,
      averageDuration: 500,
      minDuration: 200,
      maxDuration: 1200,
      errorCount: 5,
      cacheHitRate: 30,
      operationCounts: { 'aco-order-progress-cards': 100 },
    };

    const speedImprovement =
      restStats.averageDuration > 0
        ? ((restStats.averageDuration - graphqlStats.averageDuration) / restStats.averageDuration) *
          100
        : 0;

    const errorReduction =
      restStats.errorCount > 0
        ? ((restStats.errorCount - graphqlStats.errorCount) / restStats.errorCount) * 100
        : 0;

    const cacheEfficiency = graphqlStats.cacheHitRate - restStats.cacheHitRate;

    return {
      rest: restStats,
      graphql: graphqlStats,
      comparison: {
        speedImprovement,
        errorReduction,
        cacheEfficiency,
      },
    };
  }

  /**
   * 清除指標
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * 訂閱指標更新
   */
  subscribe(listener: (metrics: GraphQLMetrics) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 導出指標（用於分析）
   */
  exportMetrics(): GraphQLMetrics[] {
    return [...this.metrics];
  }
}

// 單例實例
export const graphqlPerformanceMonitor = new GraphQLPerformanceMonitor();

/**
 * Apollo Link for performance monitoring
 */
export class PerformanceLink extends ApolloLink {
  request(operation: Operation, forward: NextLink): Observable<FetchResult> {
    const startTime = Date.now();
    const operationName = operation.operationName || 'unnamed';
    const operationType =
      operation.query.definitions[0]?.kind === 'OperationDefinition'
        ? operation.query.definitions[0].operation
        : 'query';

    return new Observable(observer => {
      const subscription = forward(operation).subscribe({
        next: result => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // 檢查是否從緩存獲取
          const cacheHit = operation.getContext().response?.headers?.get('X-Cache-Hit') === 'true';

          // 記錄指標
          graphqlPerformanceMonitor.recordMetrics({
            operationName,
            operationType: operationType as 'query' | 'mutation' | 'subscription',
            startTime,
            endTime,
            duration,
            variables: operation.variables,
            errors: result.errors ? [...result.errors] : undefined,
            dataSize: JSON.stringify(result.data || {}).length,
            cacheHit,
          });

          observer.next(result);
        },
        error: error => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // 記錄錯誤指標
          graphqlPerformanceMonitor.recordMetrics({
            operationName,
            operationType: operationType as 'query' | 'mutation' | 'subscription',
            startTime,
            endTime,
            duration,
            variables: operation.variables,
            errors: [error],
            dataSize: 0,
            cacheHit: false,
          });

          observer.error(error);
        },
        complete: () => {
          observer.complete();
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    });
  }
}

// 輔助函數：生成性能報告
export function generatePerformanceReport(): string {
  const stats = graphqlPerformanceMonitor.getStats();
  const acoStats = graphqlPerformanceMonitor.getAcoProgressStats();

  return `
GraphQL Performance Report
=========================

Overall Statistics:
- Total Operations: ${stats.totalOperations}
- Average Duration: ${stats.averageDuration.toFixed(2)}ms
- Min Duration: ${stats.minDuration}ms
- Max Duration: ${stats.maxDuration}ms
- Error Rate: ${((stats.errorCount / stats.totalOperations) * 100).toFixed(2)}%
- Cache Hit Rate: ${stats.cacheHitRate.toFixed(2)}%

ACO Progress Migration:
- Speed Improvement: ${acoStats.comparison.speedImprovement.toFixed(2)}%
- Error Reduction: ${acoStats.comparison.errorReduction.toFixed(2)}%
- Cache Efficiency: +${acoStats.comparison.cacheEfficiency.toFixed(2)}%

Top Operations:
${Object.entries(stats.operationCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([op, count]) => `- ${op}: ${count} calls`)
  .join('\n')}
`;
}
