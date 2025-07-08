/**
 * A/B Testing Utilities
 * 用於重置和管理 A/B 測試狀態
 */

import { abTestManager } from './ab-testing-framework';
import { cleanupOldSessions } from './ab-testing-metrics';

/**
 * 重置 A/B 測試狀態
 */
export function resetABTest(testId: string): void {
  console.log(`[ABTestUtils] Resetting test: ${testId}`);

  // 清除所有指標數據
  clearMetrics(testId);

  // 清除 session 統計
  cleanupOldSessions(0); // 清除所有

  // 重新創建測試配置
  abTestManager.createTest({
    testId: testId,
    name: 'Widget Registry V2 Progressive Rollout',
    description: 'Gradual rollout of the new widget registry system',
    startDate: new Date(),
    status: 'draft',
    segmentation: {
      type: 'percentage',
      rules: [
        {
          type: 'percentage',
          value: 50,
          variantId: 'v2-system',
        },
        {
          type: 'percentage',
          value: 50,
          variantId: 'legacy-system',
        },
      ],
    },
    variants: [
      {
        id: 'v2-system',
        name: 'New Widget Registry V2',
        weight: 50,
        config: {
          useNewRegistry: true,
          enableGraphQL: true,
        },
      },
      {
        id: 'legacy-system',
        name: 'Legacy System',
        weight: 50,
        config: {
          useNewRegistry: false,
          enableGraphQL: false,
        },
      },
    ],
    metrics: [
      {
        name: 'widget_load_time',
        type: 'performance',
        target: 50,
        unit: 'ms',
      },
      {
        name: 'error_rate',
        type: 'error',
        target: 0.01,
        unit: '%',
      },
      {
        name: 'user_engagement',
        type: 'engagement',
        unit: 'interactions',
      },
    ],
    rollback: {
      enabled: true,
      threshold: 0.1, // 10% 錯誤率閾值
      window: 5 * 60 * 1000, // 5分鐘窗口
    },
  });

  console.log(`[ABTestUtils] Test reset completed`);
}

/**
 * 清除指標數據
 */
function clearMetrics(testId: string): void {
  // 暫時使用反射來清除私有數據
  // 在實際應用中，應該在 ABTestManager 中添加公開方法
  const manager = abTestManager as any;

  // 清除決策緩存
  if (manager.decisions) {
    manager.decisions.clear();
  }

  // 清除指標數據
  if (manager.metrics) {
    const keysToDelete = Array.from(manager.metrics.keys()).filter(key => key.startsWith(testId));
    keysToDelete.forEach(key => manager.metrics.delete(key));
  }

  console.log(`[ABTestUtils] Metrics cleared for test: ${testId}`);
}

/**
 * 獲取測試狀態摘要
 */
export function getTestSummary(testId: string): {
  isActive: boolean;
  totalSessions: number;
  v2Percentage: number;
  errorRate: number;
  avgLoadTime: number;
} {
  try {
    const report = abTestManager.getTestReport(testId);
    const v2Variant = report.variants.find(v => v.variantId === 'v2-system');
    const legacyVariant = report.variants.find(v => v.variantId === 'legacy-system');

    const totalSessions = report.summary.totalSessions;
    const v2Sessions = v2Variant?.sessions || 0;
    const v2Percentage = totalSessions > 0 ? (v2Sessions / totalSessions) * 100 : 0;

    const errorMetrics = v2Variant?.metrics.get('error_rate');
    const loadTimeMetrics = v2Variant?.metrics.get('widget_load_time');

    return {
      isActive: report.status === 'active',
      totalSessions,
      v2Percentage,
      errorRate: errorMetrics?.mean || 0,
      avgLoadTime: loadTimeMetrics?.mean || 0,
    };
  } catch (e) {
    return {
      isActive: false,
      totalSessions: 0,
      v2Percentage: 0,
      errorRate: 0,
      avgLoadTime: 0,
    };
  }
}
