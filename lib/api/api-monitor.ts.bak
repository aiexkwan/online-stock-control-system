/**
 * API Monitor - 監控 GraphQL/REST API 切換效果 (v1.2.3)
 *
 * 監控 API 性能、錯誤率、用戶體驗等指標
 * 用於 A/B 測試驗證
 */

import { logger } from '@/lib/logger';

export interface APIMetrics {
  apiType: 'graphql' | 'rest';
  endpoint: string;
  method?: string;
  responseTime: number;
  success: boolean;
  error?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface APIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface APIComparison {
  graphql: APIStats;
  rest: APIStats;
  improvement: {
    responseTime: number; // 百分比
    errorRate: number; // 百分比
    successRate: number; // 百分比
  };
}

/**
 * API 監控器
 */
export class APIMonitor {
  private metrics: APIMetrics[] = [];
  private maxMetrics = 10000; // 最大存儲指標數量
  private alertThresholds = {
    errorRate: 0.05, // 5% 錯誤率告警
    responseTime: 5000, // 5秒響應時間告警
    p95ResponseTime: 2000, // P95 2秒告警
  };

  /**
   * 記錄 API 指標
   */
  recordMetric(metric: APIMetrics): void {
    this.metrics.push(metric);

    // 限制內存使用
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 檢查告警條件
    this.checkAlerts(metric);

    logger.debug('API metric recorded', {
      apiType: metric.apiType,
      endpoint: metric.endpoint,
      responseTime: metric.responseTime,
      success: metric.success,
    });
  }

  /**
   * 記錄成功的 API 調用
   */
  recordSuccess(
    apiType: 'graphql' | 'rest',
    endpoint: string,
    responseTime: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.recordMetric({
      apiType,
      endpoint,
      responseTime,
      success: true,
      userId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * 記錄失敗的 API 調用
   */
  recordError(
    apiType: 'graphql' | 'rest',
    endpoint: string,
    responseTime: number,
    error: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.recordMetric({
      apiType,
      endpoint,
      responseTime,
      success: false,
      error,
      userId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * 獲取 API 統計數據
   */
  getStats(apiType?: 'graphql' | 'rest', timeRange?: { start: Date; end: Date }): APIStats {
    let filteredMetrics = this.metrics;

    if (apiType) {
      filteredMetrics = filteredMetrics.filter(m => m.apiType === apiType);
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      };
    }

    const successfulRequests = filteredMetrics.filter(m => m.success).length;
    const failedRequests = filteredMetrics.length - successfulRequests;
    const responseTimes = filteredMetrics.map(m => m.responseTime).sort((a, b) => a - b);

    return {
      totalRequests: filteredMetrics.length,
      successfulRequests,
      failedRequests,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      errorRate: failedRequests / filteredMetrics.length,
      p95ResponseTime: this.getPercentile(responseTimes, 95),
      p99ResponseTime: this.getPercentile(responseTimes, 99),
    };
  }

  /**
   * 比較 GraphQL 和 REST API 性能
   */
  compareAPIs(timeRange?: { start: Date; end: Date }): APIComparison {
    const graphqlStats = this.getStats('graphql', timeRange);
    const restStats = this.getStats('rest', timeRange);

    const improvement = {
      responseTime:
        graphqlStats.avgResponseTime > 0
          ? ((graphqlStats.avgResponseTime - restStats.avgResponseTime) /
              graphqlStats.avgResponseTime) *
            100
          : 0,
      errorRate:
        graphqlStats.errorRate > 0
          ? ((graphqlStats.errorRate - restStats.errorRate) / graphqlStats.errorRate) * 100
          : 0,
      successRate:
        graphqlStats.totalRequests > 0
          ? (restStats.successfulRequests / restStats.totalRequests -
              graphqlStats.successfulRequests / graphqlStats.totalRequests) *
            100
          : 0,
    };

    return {
      graphql: graphqlStats,
      rest: restStats,
      improvement,
    };
  }

  /**
   * 獲取告警狀態
   */
  getAlerts(timeRange?: { start: Date; end: Date }): {
    alerts: Array<{
      type: 'error_rate' | 'response_time' | 'p95_response_time';
      message: string;
      severity: 'warning' | 'critical';
      timestamp: Date;
    }>;
  } {
    const alerts: Array<{
      type: 'error_rate' | 'response_time' | 'p95_response_time';
      message: string;
      severity: 'warning' | 'critical';
      timestamp: Date;
    }> = [];

    const graphqlStats = this.getStats('graphql', timeRange);
    const restStats = this.getStats('rest', timeRange);

    // 檢查 GraphQL 告警
    if (graphqlStats.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        message: `GraphQL error rate ${(graphqlStats.errorRate * 100).toFixed(2)}% exceeds threshold`,
        severity: graphqlStats.errorRate > 0.1 ? 'critical' : 'warning',
        timestamp: new Date(),
      });
    }

    // 檢查 REST API 告警
    if (restStats.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        message: `REST API error rate ${(restStats.errorRate * 100).toFixed(2)}% exceeds threshold`,
        severity: restStats.errorRate > 0.1 ? 'critical' : 'warning',
        timestamp: new Date(),
      });
    }

    return { alerts };
  }

  /**
   * 清除指標數據
   */
  clearMetrics(): void {
    this.metrics = [];
    logger.info('API metrics cleared');
  }

  /**
   * 導出指標數據
   */
  exportMetrics(): APIMetrics[] {
    return [...this.metrics];
  }

  /**
   * 獲取百分位數
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * 檢查告警條件
   */
  private checkAlerts(metric: APIMetrics): void {
    // 檢查響應時間告警
    if (metric.responseTime > this.alertThresholds.responseTime) {
      logger.warn('API response time alert', {
        apiType: metric.apiType,
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        threshold: this.alertThresholds.responseTime,
      });
    }

    // 檢查錯誤率告警 (基於最近 100 個請求)
    const recentMetrics = this.metrics.slice(-100);
    const sameTypeMetrics = recentMetrics.filter(m => m.apiType === metric.apiType);

    if (sameTypeMetrics.length >= 20) {
      const errorRate = sameTypeMetrics.filter(m => !m.success).length / sameTypeMetrics.length;

      if (errorRate > this.alertThresholds.errorRate) {
        logger.warn('API error rate alert', {
          apiType: metric.apiType,
          errorRate: errorRate * 100,
          threshold: this.alertThresholds.errorRate * 100,
        });
      }
    }
  }
}

// 全局監控器實例
export const apiMonitor = new APIMonitor();

// 便利函數
export function recordAPISuccess(
  apiType: 'graphql' | 'rest',
  endpoint: string,
  responseTime: number,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  apiMonitor.recordSuccess(apiType, endpoint, responseTime, userId, metadata);
}

export function recordAPIError(
  apiType: 'graphql' | 'rest',
  endpoint: string,
  responseTime: number,
  error: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  apiMonitor.recordError(apiType, endpoint, responseTime, error, userId, metadata);
}

// 自動清理舊指標 (每小時)
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const currentMetrics = apiMonitor.exportMetrics();
      const recentMetrics = currentMetrics.filter(m => m.timestamp > oneHourAgo);

      if (recentMetrics.length < currentMetrics.length) {
        apiMonitor.clearMetrics();
        recentMetrics.forEach(metric => apiMonitor.recordMetric(metric));
        logger.info('Old API metrics cleaned up');
      }
    },
    60 * 60 * 1000
  ); // 每小時執行
}
