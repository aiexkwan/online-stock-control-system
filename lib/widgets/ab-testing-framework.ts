/**
 * A/B Testing Framework for Widget Registry
 * 支援新舊系統的漸進式切換和功能對比
 */

import React from 'react';
import { WidgetComponentProps } from './types';
import { dualLoadingAdapter } from './dual-loading-adapter';
import { widgetRegistry } from './enhanced-registry';

// A/B 測試配置
export interface ABTestConfig {
  testId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
  // 測試分組策略
  segmentation: {
    type: 'percentage' | 'user' | 'route' | 'feature' | 'custom';
    rules: SegmentationRule[];
  };
  // 測試變體
  variants: ABTestVariant[];
  // 成功指標
  metrics: ABTestMetric[];
  // 自動回滾配置
  rollback?: {
    enabled: boolean;
    threshold: number; // 錯誤率閾值
    window: number; // 時間窗口（毫秒）
  };
}

// 分組規則
export interface SegmentationRule {
  type: 'percentage' | 'userId' | 'route' | 'feature' | 'custom';
  value: string | number | RegExp | ((context: ABTestContext) => boolean);
  variantId: string;
}

// 測試變體
export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  weight: number; // 0-100
  config: {
    useNewRegistry: boolean;
    enableGraphQL?: boolean;
    widgetOverrides?: Map<string, WidgetOverride>;
  };
}

// Widget 覆寫配置
export interface WidgetOverride {
  useV2: boolean;
  useGraphQL?: boolean;
  customProps?: Partial<WidgetComponentProps>;
}

// 測試指標
export interface ABTestMetric {
  name: string;
  type: 'performance' | 'error' | 'engagement' | 'custom';
  target?: number;
  unit?: string;
}

// 測試上下文
export interface ABTestContext {
  userId?: string;
  sessionId: string;
  route: string;
  features?: string[];
  timestamp: number;
  userAgent?: string;
  customData?: Record<string, any>;
}

// 測試結果
export interface ABTestResult {
  variantId: string;
  context: ABTestContext;
  decision: {
    timestamp: number;
    reason: string;
  };
}

// 指標數據點
export interface MetricDataPoint {
  testId: string;
  variantId: string;
  metricName: string;
  value: number;
  timestamp: number;
  context?: Partial<ABTestContext>;
}

/**
 * A/B 測試管理器
 */
export class ABTestManager {
  private tests = new Map<string, ABTestConfig>();
  private activeTests = new Map<string, ABTestConfig>();
  private decisions = new Map<string, ABTestResult>(); // sessionId -> result
  private metrics = new Map<string, MetricDataPoint[]>();
  private rollbackHandlers = new Map<string, NodeJS.Timeout>();
  
  constructor() {
    this.initializeDefaultTests();
  }
  
  /**
   * 初始化默認測試
   */
  private initializeDefaultTests(): void {
    // Widget Registry V2 漸進式發布測試
    this.createTest({
      testId: 'widget-registry-v2-rollout',
      name: 'Widget Registry V2 Progressive Rollout',
      description: 'Gradual rollout of the new widget registry system',
      startDate: new Date(),
      status: 'draft',
      segmentation: {
        type: 'percentage',
        rules: [
          {
            type: 'percentage',
            value: 10, // 10% 用戶使用新系統
            variantId: 'v2-system'
          },
          {
            type: 'percentage',
            value: 90, // 90% 用戶使用舊系統
            variantId: 'legacy-system'
          }
        ]
      },
      variants: [
        {
          id: 'v2-system',
          name: 'New Widget Registry V2',
          weight: 10,
          config: {
            useNewRegistry: true,
            enableGraphQL: true
          }
        },
        {
          id: 'legacy-system',
          name: 'Legacy System',
          weight: 90,
          config: {
            useNewRegistry: false,
            enableGraphQL: false
          }
        }
      ],
      metrics: [
        {
          name: 'widget_load_time',
          type: 'performance',
          target: 50, // 目標 50ms
          unit: 'ms'
        },
        {
          name: 'error_rate',
          type: 'error',
          target: 0.01, // 目標錯誤率 < 1%
          unit: '%'
        },
        {
          name: 'user_engagement',
          type: 'engagement',
          unit: 'interactions'
        }
      ],
      rollback: {
        enabled: true,
        threshold: 0.10, // 10% 錯誤率觸發回滾（提高閾值）
        window: 5 * 60 * 1000 // 5分鐘窗口
      }
    });
  }
  
  /**
   * 創建新測試
   */
  createTest(config: ABTestConfig): void {
    this.tests.set(config.testId, config);
    console.log(`[ABTest] Created test: ${config.name}`);
  }
  
  /**
   * 啟動測試
   */
  startTest(testId: string): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }
    
    test.status = 'active';
    this.activeTests.set(testId, test);
    
    // 設置自動回滾監控
    if (test.rollback?.enabled) {
      this.setupRollbackMonitoring(testId);
    }
    
    console.log(`[ABTest] Started test: ${test.name}`);
  }
  
  /**
   * 暫停測試
   */
  pauseTest(testId: string): void {
    const test = this.activeTests.get(testId);
    if (test) {
      test.status = 'paused';
      this.activeTests.delete(testId);
      
      // 清除回滾監控
      const handler = this.rollbackHandlers.get(testId);
      if (handler) {
        clearInterval(handler);
        this.rollbackHandlers.delete(testId);
      }
      
      console.log(`[ABTest] Paused test: ${test.name}`);
    }
  }
  
  /**
   * 獲取測試決策
   */
  getDecision(context: ABTestContext): ABTestResult | null {
    // 檢查緩存的決策（基於 session）
    const cached = this.decisions.get(context.sessionId);
    if (cached) {
      return cached;
    }
    
    // 尋找匹配的活躍測試
    for (const [testId, test] of this.activeTests) {
      const variant = this.selectVariant(test, context);
      if (variant) {
        const result: ABTestResult = {
          variantId: variant.id,
          context,
          decision: {
            timestamp: Date.now(),
            reason: `Matched ${test.segmentation.type} rule`
          }
        };
        
        // 緩存決策
        this.decisions.set(context.sessionId, result);
        
        // 應用變體配置
        this.applyVariantConfig(variant);
        
        console.log(`[ABTest] Decision for ${context.sessionId}: ${variant.name}`);
        return result;
      }
    }
    
    return null;
  }
  
  /**
   * 選擇變體
   */
  private selectVariant(test: ABTestConfig, context: ABTestContext): ABTestVariant | null {
    for (const rule of test.segmentation.rules) {
      if (this.matchRule(rule, context)) {
        return test.variants.find(v => v.id === rule.variantId) || null;
      }
    }
    
    // 默認選擇第一個變體
    return test.variants[0] || null;
  }
  
  /**
   * 匹配規則
   */
  private matchRule(rule: SegmentationRule, context: ABTestContext): boolean {
    switch (rule.type) {
      case 'percentage':
        // 基於 sessionId 的哈希值分配
        const hash = this.hashString(context.sessionId);
        const bucket = (hash % 100) + 1;
        return bucket <= (rule.value as number);
        
      case 'userId':
        return context.userId === rule.value;
        
      case 'route':
        if (rule.value instanceof RegExp) {
          return rule.value.test(context.route);
        }
        return context.route === rule.value;
        
      case 'feature':
        return context.features?.includes(rule.value as string) || false;
        
      case 'custom':
        if (typeof rule.value === 'function') {
          return rule.value(context);
        }
        return false;
        
      default:
        return false;
    }
  }
  
  /**
   * 應用變體配置
   */
  private applyVariantConfig(variant: ABTestVariant): void {
    const config = variant.config;
    
    // 配置雙重加載適配器
    const dualConfig = {
      enableV2: config.useNewRegistry,
      enableGraphQL: config.enableGraphQL || false
    };
    
    // Import and configure at runtime to avoid circular dependency
    import('./dual-loading-adapter').then(({ configureDualLoading }) => {
      configureDualLoading(dualConfig);
    });
    
    console.log(`[ABTest] Applied variant config: ${variant.name}`, config);
  }
  
  /**
   * 記錄指標
   */
  recordMetric(data: MetricDataPoint): void {
    const key = `${data.testId}-${data.metricName}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push(data);
    
    // 保留最近 10000 個數據點
    const metrics = this.metrics.get(key)!;
    if (metrics.length > 10000) {
      metrics.shift();
    }
  }
  
  /**
   * 獲取測試報告
   */
  getTestReport(testId: string): ABTestReport {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }
    
    const report: ABTestReport = {
      testId,
      name: test.name,
      status: test.status,
      startDate: test.startDate,
      endDate: test.endDate,
      variants: [],
      summary: {
        totalSessions: this.decisions.size,
        variantDistribution: new Map()
      }
    };
    
    // 計算每個變體的統計
    for (const variant of test.variants) {
      const variantReport = this.calculateVariantReport(testId, variant);
      report.variants.push(variantReport);
      report.summary.variantDistribution.set(variant.id, variantReport.sessions);
    }
    
    return report;
  }
  
  /**
   * 計算變體報告
   */
  private calculateVariantReport(testId: string, variant: ABTestVariant): VariantReport {
    const decisions = Array.from(this.decisions.values())
      .filter(d => d.variantId === variant.id);
    
    const report: VariantReport = {
      variantId: variant.id,
      name: variant.name,
      sessions: decisions.length,
      metrics: new Map()
    };
    
    // 計算每個指標的統計
    const test = this.tests.get(testId)!;
    for (const metric of test.metrics) {
      const key = `${testId}-${metric.name}`;
      const dataPoints = (this.metrics.get(key) || [])
        .filter(dp => dp.variantId === variant.id);
      
      if (dataPoints.length > 0) {
        const values = dataPoints.map(dp => dp.value);
        report.metrics.set(metric.name, {
          count: dataPoints.length,
          mean: this.calculateMean(values),
          median: this.calculateMedian(values),
          p95: this.calculatePercentile(values, 95),
          p99: this.calculatePercentile(values, 99)
        });
      }
    }
    
    return report;
  }
  
  /**
   * 設置回滾監控
   */
  private setupRollbackMonitoring(testId: string): void {
    const test = this.tests.get(testId)!;
    if (!test.rollback?.enabled) return;
    
    const handler = setInterval(() => {
      this.checkRollbackConditions(testId);
    }, 10000); // 每10秒檢查一次
    
    this.rollbackHandlers.set(testId, handler);
  }
  
  /**
   * 檢查回滾條件
   */
  private checkRollbackConditions(testId: string): void {
    const test = this.activeTests.get(testId);
    if (!test || !test.rollback) return;
    
    const errorMetrics = this.metrics.get(`${testId}-error_rate`) || [];
    const recentErrors = errorMetrics.filter(
      dp => dp.timestamp > Date.now() - test.rollback.window
    );
    
    if (recentErrors.length > 0) {
      const errorRate = this.calculateMean(recentErrors.map(dp => dp.value));
      
      console.log(`[ABTest] Error rate check for ${test.name}: ${(errorRate * 100).toFixed(2)}% (threshold: ${test.rollback.threshold * 100}%)`);
      
      if (errorRate > test.rollback.threshold) {
        console.warn(`[ABTest] Rollback triggered for ${test.name}: error rate ${(errorRate * 100).toFixed(2)}% > ${test.rollback.threshold * 100}%`);
        this.rollbackTest(testId);
      }
    }
  }
  
  /**
   * 回滾測試
   */
  private rollbackTest(testId: string): void {
    const test = this.activeTests.get(testId);
    if (!test) return;
    
    // 暫停測試
    this.pauseTest(testId);
    
    // 恢復到安全配置（使用舊系統）
    import('./dual-loading-adapter').then(({ configureDualLoading }) => {
      configureDualLoading({
        enableV2: false,
        enableGraphQL: false,
        fallbackToLegacy: true
      });
    });
    
    // 發送告警
    console.error(`[ABTest] Test ${test.name} has been rolled back due to high error rate`);
  }
  
  /**
   * 工具方法：計算哈希值
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * 工具方法：計算平均值
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * 工具方法：計算中位數
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  /**
   * 工具方法：計算百分位數
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// A/B 測試報告
export interface ABTestReport {
  testId: string;
  name: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  variants: VariantReport[];
  summary: {
    totalSessions: number;
    variantDistribution: Map<string, number>;
  };
}

// 變體報告
export interface VariantReport {
  variantId: string;
  name: string;
  sessions: number;
  metrics: Map<string, MetricStats>;
}

// 指標統計
export interface MetricStats {
  count: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
}

// 導出單例
export const abTestManager = new ABTestManager();

// 類型導出，用於解決循環依賴
export type { ABTestManager as ABTestManagerType };

// React Hook
export function useABTest(context: Partial<ABTestContext>) {
  const [variant, setVariant] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const fullContext: ABTestContext = {
      sessionId: globalThis.crypto?.randomUUID?.() || Math.random().toString(36),
      route: window.location.pathname,
      timestamp: Date.now(),
      ...context
    };
    
    const decision = abTestManager.getDecision(fullContext);
    if (decision) {
      setVariant(decision.variantId);
    }
  }, [context]);
  
  return variant;
}