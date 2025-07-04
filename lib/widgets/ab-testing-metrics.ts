/**
 * A/B Testing Metrics Helper
 * 用於正確計算和記錄測試指標
 */

import { abTestManager } from './ab-testing-framework';

// 用於追蹤每個 session 的請求統計
const sessionStats = new Map<string, {
  totalRequests: number;
  errorCount: number;
  variant: string;
}>();

/**
 * 記錄 Widget 請求（成功或失敗）
 */
export function recordWidgetRequest(
  widgetId: string,
  sessionId: string,
  variant: string,
  success: boolean,
  loadTime?: number
): void {
  // 更新 session 統計
  if (!sessionStats.has(sessionId)) {
    sessionStats.set(sessionId, {
      totalRequests: 0,
      errorCount: 0,
      variant
    });
  }
  
  const stats = sessionStats.get(sessionId)!;
  stats.totalRequests++;
  
  if (!success) {
    stats.errorCount++;
  }
  
  // 計算錯誤率
  const errorRate = stats.errorCount / stats.totalRequests;
  
  // 記錄錯誤率（作為比例，不是計數）
  abTestManager.recordMetric({
    testId: 'widget-registry-v2-rollout',
    variantId: variant,
    metricName: 'error_rate',
    value: errorRate, // 0-1 的比例
    timestamp: Date.now(),
    context: {
      customData: {
        widgetId,
        sessionId,
        totalRequests: stats.totalRequests,
        errorCount: stats.errorCount
      }
    }
  });
  
  // 如果成功且有加載時間，記錄性能指標
  if (success && loadTime !== undefined) {
    abTestManager.recordMetric({
      testId: 'widget-registry-v2-rollout',
      variantId: variant,
      metricName: 'widget_load_time',
      value: loadTime,
      timestamp: Date.now(),
      context: {
        customData: { widgetId, sessionId }
      }
    });
  }
}

/**
 * 改進的 Widget 加載性能記錄
 */
export function recordWidgetLoadPerformanceV2(
  widgetId: string,
  loadTime: number,
  variant: string,
  sessionId: string
): void {
  recordWidgetRequest(widgetId, sessionId, variant, true, loadTime);
}

/**
 * 改進的 Widget 錯誤記錄
 */
export function recordWidgetErrorV2(
  widgetId: string,
  error: Error,
  variant: string,
  sessionId: string
): void {
  recordWidgetRequest(widgetId, sessionId, variant, false);
  
  // 額外記錄錯誤詳情
  console.error(`[ABTestMetrics] Widget error for ${widgetId}:`, {
    variant,
    sessionId,
    error: error.message,
    stack: error.stack
  });
}

/**
 * 獲取 session 統計摘要
 */
export function getSessionStats(sessionId: string) {
  return sessionStats.get(sessionId);
}

/**
 * 清理舊的 session 統計（避免內存洩漏）
 */
export function cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000) {
  // 如果 maxAge 為 0，清除所有
  if (maxAge === 0) {
    sessionStats.clear();
    return;
  }
  
  // 實際應用中應該記錄時間戳並清理舊數據
  // 這裡簡化處理
  if (sessionStats.size > 10000) {
    // 保留最近的 5000 個 sessions
    const entries = Array.from(sessionStats.entries());
    const toKeep = entries.slice(-5000);
    sessionStats.clear();
    toKeep.forEach(([key, value]) => sessionStats.set(key, value));
  }
}

/**
 * 計算聚合錯誤率
 */
export function calculateAggregateErrorRate(variant: string): number {
  let totalRequests = 0;
  let totalErrors = 0;
  
  sessionStats.forEach((stats) => {
    if (stats.variant === variant) {
      totalRequests += stats.totalRequests;
      totalErrors += stats.errorCount;
    }
  });
  
  return totalRequests > 0 ? totalErrors / totalRequests : 0;
}