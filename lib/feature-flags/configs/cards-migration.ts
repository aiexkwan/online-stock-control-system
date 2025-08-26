/**
 * Cards 系統架構 Feature Flags 配置
 *
 * 控制 REST→GraphQL API 遷移的漸進式發布
 *
 * @created 2025-07-25
 * @updated 2025-08-12
 */

import { FeatureFlag, FeatureFlagStatus } from '../types';

export const cardsMigrationFlags: FeatureFlag[] = [
  // ===== 總體遷移控制 =====
  {
    key: 'cards_migration_enabled',
    name: 'Cards Migration Master Switch',
    description: '啟用 Cards/Widgets 系統遷移總開關',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['migration', 'cards', 'architecture'],
    metadata: {
      startDate: new Date('2025-07-25'),
      targetCompletion: new Date('2025-11-01'),
      documentationUrl: '/docs/integration/card-component-architecture.md',
    },
  },

  // ===== Card 到 Card 遷移 =====
  {
    key: 'use_cards_system',
    name: 'Use Cards System Instead of Widgets',
    description: '使用新的 Cards 系統取代舊的 Widget 系統',
    type: 'percentage',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: false,
    rolloutPercentage: 30, // 開始 30% 發布，因為已有 88% Cards 完成
    rules: [
      {
        type: 'environment',
        value: 'development',
        operator: 'equals',
      },
      {
        type: 'user',
        value: ['test@pennineindustries.com', 'akwan@pennineindustries.com'],
        operator: 'contains',
      },
    ],
    tags: ['cards', 'widgets', 'ui'],
    metadata: {
      completedCards: 15,
      totalCards: 17,
      remainingWidgets: 56,
    },
  },

  // ===== 個別 Card 控制 =====
  {
    key: 'enable_stats_card',
    name: 'Enable Stats Card',
    description: '啟用 StatsCard 取代多個獨立統計 Widgets',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['cards', 'stats'],
  },

  {
    key: 'enable_chart_card',
    name: 'Enable Chart Card',
    description: '啟用 ChartCard 取代各種圖表 Widgets',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['cards', 'charts'],
  },

  {
    key: 'enable_table_card',
    name: 'Enable Table Card',
    description: '啟用 TableCard 取代表格 Widgets',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['cards', 'tables'],
  },

  {
    key: 'enable_upload_card',
    name: 'Enable Upload Card',
    description: '啟用 UploadCard 取代上傳 Widgets',
    type: 'percentage',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: false,
    rolloutPercentage: 10, // UploadCard 仍有 TODO，謹慎發布
    tags: ['cards', 'upload'],
  },

  // ===== REST 到 GraphQL 遷移 =====
  {
    key: 'use_graphql_api',
    name: 'Use GraphQL API Instead of REST',
    description: '使用 GraphQL API 取代 REST endpoints',
    type: 'percentage',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: false,
    rolloutPercentage: 20, // 開始 20% 發布
    tags: ['api', 'graphql', 'rest'],
    metadata: {
      completedResolvers: 17,
      totalEndpoints: 77,
      remainingRestEndpoints: 60,
    },
  },

  {
    key: 'graphql_stats_queries',
    name: 'GraphQL Stats Queries',
    description: '使用 GraphQL 查詢統計數據',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['graphql', 'stats'],
  },

  {
    key: 'graphql_mutations',
    name: 'GraphQL Mutations',
    description: '啟用 GraphQL mutations 進行數據修改',
    type: 'percentage',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: false,
    rolloutPercentage: 10, // 謹慎發布 mutations
    tags: ['graphql', 'mutations'],
  },

  {
    key: 'graphql_subscriptions',
    name: 'GraphQL Subscriptions',
    description: '啟用 GraphQL subscriptions 實時更新',
    type: 'boolean',
    status: FeatureFlagStatus.DISABLED,
    defaultValue: false, // 第三階段才啟用
    tags: ['graphql', 'subscriptions', 'realtime'],
  },

  // ===== 舊系統下線控制 =====
  {
    key: 'disable_legacy_widgets',
    name: 'Disable Legacy Widgets',
    description: '停用舊的 Widget 系統',
    type: 'boolean',
    status: FeatureFlagStatus.DISABLED,
    defaultValue: false, // 等所有 Cards 完成才啟用
    tags: ['deprecation', 'widgets'],
  },

  {
    key: 'disable_rest_endpoints',
    name: 'Disable REST Endpoints',
    description: '停用舊的 REST API endpoints',
    type: 'boolean',
    status: FeatureFlagStatus.DISABLED,
    defaultValue: false, // 等 GraphQL 完全遷移才啟用
    tags: ['deprecation', 'rest'],
  },

  // ===== 性能優化控制 =====
  {
    key: 'enable_card_lazy_loading',
    name: 'Enable Card Lazy Loading',
    description: '啟用 Card 組件懶加載',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['performance', 'cards'],
  },

  {
    key: 'enable_graphql_batching',
    name: 'Enable GraphQL Query Batching',
    description: '啟用 GraphQL 查詢批量處理',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['performance', 'graphql'],
  },

  // ===== 監控和分析 =====
  {
    key: 'cards_migration_analytics',
    name: 'Cards Migration Analytics',
    description: '收集 Cards 遷移相關的分析數據',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['analytics', 'monitoring'],
  },
];

/**
 * 檢查是否應該使用 GraphQL API
 */
export function shouldUseGraphQL(
  operation: 'query' | 'mutation' | 'subscription',
  userId?: string
): boolean {
  const apiFlag = cardsMigrationFlags.find(f => f.key === 'use_graphql_api');
  if (!apiFlag || apiFlag.status === FeatureFlagStatus.DISABLED) {
    return false;
  }

  // 檢查特定操作類型
  if (operation === 'mutation') {
    const mutationFlag = cardsMigrationFlags.find(f => f.key === 'graphql_mutations');
    if (mutationFlag?.status === FeatureFlagStatus.DISABLED) {
      return false;
    }
  }

  if (operation === 'subscription') {
    const subscriptionFlag = cardsMigrationFlags.find(f => f.key === 'graphql_subscriptions');
    return subscriptionFlag?.status === FeatureFlagStatus.ENABLED;
  }

  // 百分比發布邏輯
  if (apiFlag.type === 'percentage' && apiFlag.rolloutPercentage !== undefined && userId) {
    let hash = 0;
    const str = `${apiFlag.key}-${userId}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const bucketValue = Math.abs(hash) % 100;
    return bucketValue < apiFlag.rolloutPercentage;
  }

  return apiFlag.defaultValue as boolean;
}
