/**
 * 統一數據源配置管理器
 * 支援 REST 和 GraphQL 共存的配置驅動架構
 */

import { DataSourceType } from '@/lib/api/unified-data-layer';
import { logger } from '@/lib/logger';

export interface DataSourceRule {
  id: string;
  name: string;
  condition: DataSourceCondition;
  target: DataSourceType;
  priority: number;
  enabled: boolean;
  fallbackEnabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface DataSourceCondition {
  type: 'user' | 'card' | 'performance' | 'time' | 'feature_flag' | 'experiment';
  value?: unknown;
  operator?: 'equals' | 'contains' | 'gt' | 'lt' | 'between';
}

export interface DataSourceContext {
  userId?: string;
  cardId?: string;
  cardCategory?: string;
  [key: string]: unknown;
}

export interface DataSourceMetrics {
  restSuccessRate: number;
  graphqlSuccessRate: number;
  restAvgResponseTime: number;
  graphqlAvgResponseTime: number;
  lastUpdated: Date;
}

export interface ABTestConfig {
  experimentId: string;
  name: string;
  enabled: boolean;
  trafficPercentage: number; // 0-100
  targetDataSource: DataSourceType;
  startDate: Date;
  endDate?: Date;
  conditions?: DataSourceCondition[];
}

/**
 * 數據源配置管理器
 */
export class DataSourceConfigManager {
  private rules: DataSourceRule[] = [];
  private abTests: ABTestConfig[] = [];
  private metrics: DataSourceMetrics | null = null;
  private defaultDataSource: DataSourceType = DataSourceType.REST;
  private globalFallbackEnabled: boolean = true;

  constructor() {
    this.loadDefaultRules();
  }

  /**
   * 載入默認規則
   */
  private loadDefaultRules() {
    this.rules = [
      // 高優先級：性能基準規則
      {
        id: 'performance_graphql_slow',
        name: 'GraphQL 性能降級',
        condition: {
          type: 'performance',
          value: 5000, // 5秒
          operator: 'gt',
        },
        target: DataSourceType.REST,
        priority: 100,
        enabled: true,
        fallbackEnabled: true,
        metadata: {
          description: '當 GraphQL 平均響應時間超過 5 秒時，切換到 REST API',
          monitoringEnabled: true,
        },
      },

      // 中等優先級：Card 特定規則
      {
        id: 'card_chart_graphql',
        name: '圖表 Card 優先使用 GraphQL',
        condition: {
          type: 'card',
          value: ['charts', 'analysis'],
          operator: 'contains',
        },
        target: DataSourceType.GRAPHQL,
        priority: 50,
        enabled: true,
        fallbackEnabled: true,
        metadata: {
          description: '圖表和分析類 Card 優先使用 GraphQL 以獲得更好的查詢能力',
        },
      },

      // 低優先級：默認規則
      {
        id: 'default_rest',
        name: '默認使用 REST API',
        condition: {
          type: 'feature_flag',
          value: 'use_rest_by_default',
        },
        target: DataSourceType.REST,
        priority: 10,
        enabled: true,
        fallbackEnabled: true,
        metadata: {
          description: '系統默認優先使用 REST API',
        },
      },
    ];
  }

  /**
   * 根據上下文決定數據源
   */
  async determineDataSource(context: {
    cardId?: string;
    cardCategory?: string;
    userId?: string;
    userAgent?: string;
    performanceMetrics?: Partial<DataSourceMetrics>;
  }): Promise<{
    dataSource: DataSourceType;
    reason: string;
    fallbackEnabled: boolean;
    appliedRule?: DataSourceRule;
  }> {
    // 檢查 A/B 測試
    const abTestResult = await this.checkABTests(context);
    if (abTestResult) {
      return abTestResult;
    }

    // 按優先級檢查規則
    const sortedRules = this.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (await this.evaluateRule(rule, context)) {
        logger.debug(
          {
            ruleId: rule.id,
            ruleName: rule.name,
            target: rule.target,
            context,
          },
          'Data source rule matched'
        );

        return {
          dataSource: rule.target,
          reason: `Rule: ${rule.name}`,
          fallbackEnabled: rule.fallbackEnabled,
          appliedRule: rule,
        };
      }
    }

    // 默認數據源
    return {
      dataSource: this.defaultDataSource,
      reason: 'Default data source',
      fallbackEnabled: this.globalFallbackEnabled,
    };
  }

  /**
   * 評估規則是否匹配
   */
  private async evaluateRule(rule: DataSourceRule, _context: DataSourceContext): Promise<boolean> {
    const { condition } = rule;

    switch (condition.type) {
      case 'user':
        return _context.userId === condition.value;

      case 'card':
        if (condition.operator === 'contains' && Array.isArray(condition.value)) {
          return (
            condition.value.includes(_context.cardCategory) ||
            condition.value.includes(_context.cardId)
          );
        }
        return _context.cardId === condition.value || _context.cardCategory === condition.value;

      case 'performance':
        if (!this.metrics || !condition.operator) return false;

        const currentResponseTime = this.metrics.graphqlAvgResponseTime;
        switch (condition.operator) {
          case 'gt':
            return currentResponseTime > (condition.value as number);
          case 'lt':
            return currentResponseTime < (condition.value as number);
          default:
            return false;
        }

      case 'time':
        const now = new Date();
        const hour = now.getHours();
        if (condition.operator === 'between' && Array.isArray(condition.value)) {
          return hour >= condition.value[0] && hour <= condition.value[1];
        }
        return false;

      case 'feature_flag':
        // 簡單的 feature flag 實現
        return this.getFeatureFlag(condition.value as string) === true;

      case 'experiment':
        // 實驗規則評估
        return this.evaluateExperiment(condition.value as string, _context);

      default:
        return false;
    }
  }

  /**
   * 檢查 A/B 測試
   */
  private async checkABTests(context: DataSourceContext): Promise<{
    dataSource: DataSourceType;
    reason: string;
    fallbackEnabled: boolean;
    appliedRule?: DataSourceRule;
  } | null> {
    const activeTests = this.abTests.filter(test => {
      const now = new Date();
      return test.enabled && now >= test.startDate && (!test.endDate || now <= test.endDate);
    });

    for (const test of activeTests) {
      // 簡單的流量分配（基於用戶 ID 哈希）
      if (this.shouldIncludeInTest(context.userId || 'anonymous', test.trafficPercentage)) {
        // 檢查額外條件
        if (test.conditions) {
          const matchesConditions = await Promise.all(
            test.conditions.map(condition =>
              this.evaluateRule(
                {
                  ...({} as DataSourceRule),
                  condition,
                },
                context
              )
            )
          );

          if (!matchesConditions.every(Boolean)) {
            continue;
          }
        }

        logger.info(
          {
            experimentId: test.experimentId,
            userId: context.userId,
            targetDataSource: test.targetDataSource,
          },
          'A/B test activated'
        );

        return {
          dataSource: test.targetDataSource,
          reason: `A/B Test: ${test.name}`,
          fallbackEnabled: true,
          appliedRule: undefined,
        };
      }
    }

    return null;
  }

  /**
   * 判斷用戶是否應該包含在測試中
   */
  private shouldIncludeInTest(userId: string, percentage: number): boolean {
    // 簡單哈希函數用於穩定的流量分配
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 轉換為 32 位整數
    }

    const bucket = Math.abs(hash) % 100;
    return bucket < percentage;
  }

  /**
   * 獲取 Feature Flag
   */
  private getFeatureFlag(flagName: string): boolean {
    // 簡單實現，實際項目中可能從配置服務獲取
    const flags: Record<string, boolean> = {
      use_rest_by_default: true,
      enable_graphql_for_charts: true,
      experimental_data_source_switching: true,
    };

    return flags[flagName] || false;
  }

  /**
   * 評估實驗規則
   */
  private evaluateExperiment(_experimentId: string, _context: DataSourceContext): boolean {
    // 實驗邏輯實現
    return false;
  }

  /**
   * 更新性能指標
   */
  updateMetrics(metrics: Partial<DataSourceMetrics>) {
    this.metrics = {
      ...this.metrics,
      ...metrics,
      lastUpdated: new Date(),
    } as DataSourceMetrics;

    logger.debug(this.metrics, 'Data source metrics updated');
  }

  /**
   * 添加規則
   */
  addRule(rule: DataSourceRule) {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 移除規則
   */
  removeRule(ruleId: string) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * 更新規則
   */
  updateRule(ruleId: string, updates: Partial<DataSourceRule>) {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    }
  }

  /**
   * 添加 A/B 測試
   */
  addABTest(test: ABTestConfig) {
    this.abTests.push(test);
  }

  /**
   * 移除 A/B 測試
   */
  removeABTest(experimentId: string) {
    this.abTests = this.abTests.filter(test => test.experimentId !== experimentId);
  }

  /**
   * 獲取當前配置狀態
   */
  getStatus() {
    return {
      rules: this.rules,
      abTests: this.abTests,
      metrics: this.metrics,
      defaultDataSource: this.defaultDataSource,
      globalFallbackEnabled: this.globalFallbackEnabled,
    };
  }

  /**
   * 設置默認數據源
   */
  setDefaultDataSource(dataSource: DataSourceType) {
    this.defaultDataSource = dataSource;
  }

  /**
   * 設置全局 fallback 開關
   */
  setGlobalFallbackEnabled(enabled: boolean) {
    this.globalFallbackEnabled = enabled;
  }
}

// 全局實例
export const dataSourceConfig = new DataSourceConfigManager();
