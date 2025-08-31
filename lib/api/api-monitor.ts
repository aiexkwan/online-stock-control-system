/**
 * API Monitor - 監控 GraphQL/REST API 切換效果 (v1.2.3)
 *
 * 監控 API 性能、錯誤率、用戶體驗等指標
 * 用於 A/B 測試驗證
 */

// Type-safe logger interface to avoid dependency issues
interface Logger {
  debug(message: string): void;
  debug(obj: Record<string, unknown>, message: string): void;
  info(message: string): void;
  warn(message: string): void;
  warn(obj: Record<string, unknown>, message: string): void;
  error(message: string): void;
  error(obj: Record<string, unknown>, message: string): void;
}

// Create a simple logger implementation
const createSimpleLogger = (): Logger => ({
  debug: (msgOrObj: string | Record<string, unknown>, msg?: string) => {
    if (typeof msgOrObj === 'string') {
      console.debug(`[DEBUG] ${msgOrObj}`);
    } else {
      console.debug(`[DEBUG] ${msg}`, msgOrObj);
    }
  },
  info: (msg: string) => console.info(`[INFO] ${msg}`),
  warn: (msgOrObj: string | Record<string, unknown>, msg?: string) => {
    if (typeof msgOrObj === 'string') {
      console.warn(`[WARN] ${msgOrObj}`);
    } else {
      console.warn(`[WARN] ${msg}`, msgOrObj);
    }
  },
  error: (msgOrObj: string | Record<string, unknown>, msg?: string) => {
    if (typeof msgOrObj === 'string') {
      console.error(`[ERROR] ${msgOrObj}`);
    } else {
      console.error(`[ERROR] ${msg}`, msgOrObj);
    }
  },
});

const logger = createSimpleLogger();

// Type guards for enhanced type safety
function isValidApiType(apiType: unknown): apiType is 'graphql' | 'rest' {
  return typeof apiType === 'string' && ['graphql', 'rest'].includes(apiType);
}

function isValidResponseTime(responseTime: unknown): responseTime is number {
  return typeof responseTime === 'number' && Number.isFinite(responseTime) && responseTime >= 0;
}

function isValidMetric(metric: unknown): metric is APIMetrics {
  if (!metric || typeof metric !== 'object') return false;

  const m = metric as Record<string, unknown>;
  return (
    isValidApiType(m.apiType) &&
    typeof m.endpoint === 'string' &&
    m.endpoint.length > 0 &&
    isValidResponseTime(m.responseTime) &&
    typeof m.success === 'boolean' &&
    m.timestamp instanceof Date
  );
}

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
    responseTime: number; // 百分比改善，正值表示REST比GraphQL快
    errorRate: number; // 百分比改善，正值表示REST錯誤率更低
    successRate: number; // 百分比改善，正值表示REST成功率更高
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
    // Use type guard for comprehensive validation
    if (!isValidMetric(metric)) {
      logger.error({ providedMetric: metric }, 'Invalid metric data provided');
      return;
    }

    this.metrics.push(metric);

    // 限制內存使用
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 檢查告警條件
    this.checkAlerts(metric);

    logger.debug(
      {
        apiType: metric.apiType,
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        success: metric.success,
      },
      'API metric recorded'
    );
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
      avgResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
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
    if (percentile < 0 || percentile > 100) {
      throw new Error('Percentile must be between 0 and 100');
    }

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    const safeIndex = Math.max(0, Math.min(index, sortedArray.length - 1));
    const value = sortedArray[safeIndex];

    // Type guard to ensure we return a valid number
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return value;
  }

  /**
   * 檢查告警條件
   */
  private checkAlerts(metric: APIMetrics): void {
    // 檢查響應時間告警
    if (metric.responseTime > this.alertThresholds.responseTime) {
      logger.warn(
        {
          apiType: metric.apiType,
          endpoint: metric.endpoint,
          responseTime: metric.responseTime,
          threshold: this.alertThresholds.responseTime,
        },
        'API response time alert'
      );
    }

    // 檢查錯誤率告警 (基於最近 100 個請求)
    const recentMetrics = this.metrics.slice(-100);
    const sameTypeMetrics = recentMetrics.filter(m => m.apiType === metric.apiType);

    if (sameTypeMetrics.length >= 20) {
      const errorRate = sameTypeMetrics.filter(m => !m.success).length / sameTypeMetrics.length;

      if (errorRate > this.alertThresholds.errorRate) {
        logger.warn(
          {
            apiType: metric.apiType,
            errorRate: errorRate * 100,
            threshold: this.alertThresholds.errorRate * 100,
          },
          'API error rate alert'
        );
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

// 🛑 完全禁用自動清理：按用戶要求，取消所有自動更新機制
// 自動清理舊指標 (每小時) - 已禁用
// if (typeof window !== 'undefined') {
//   setInterval(
//     () => {
//       const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
//       const currentMetrics = apiMonitor.exportMetrics();
//       const recentMetrics = currentMetrics.filter(m => m.timestamp > oneHourAgo);

//       if (recentMetrics.length < currentMetrics.length) {
//         apiMonitor.clearMetrics();
//         recentMetrics.forEach(metric => apiMonitor.recordMetric(metric));
//         logger.info('Old API metrics cleaned up');
//       }
//     },
//     60 * 60 * 1000
//   ); // 每小時執行 - 已禁用
// }
