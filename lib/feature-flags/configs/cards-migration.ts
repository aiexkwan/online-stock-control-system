/**
 * Cards/Widgets 系統架構遷移 Feature Flags 配置
 * 
 * 控制 Widget→Card 遷移和 REST→GraphQL 遷移的漸進式發布
 * 
 * @document /docs/planning/系統架構全面遷移計劃.md
 * @created 2025-07-25
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

  // ===== Widget 到 Card 遷移 =====
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
    key: 'enable_form_card',
    name: 'Enable Form Card',
    description: '啟用 FormCard 取代表單 Widgets',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['cards', 'forms'],
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
 * 檢查是否應該使用 Card 組件
 */
export function shouldUseCard(cardType: string, userId?: string): boolean {
  // 檢查總開關
  const masterSwitch = cardsMigrationFlags.find(f => f.key === 'cards_migration_enabled');
  if (!masterSwitch || masterSwitch.status === FeatureFlagStatus.DISABLED) {
    return false;
  }

  // 檢查系統級開關
  const systemFlag = cardsMigrationFlags.find(f => f.key === 'use_cards_system');
  if (!systemFlag || systemFlag.status === FeatureFlagStatus.DISABLED) {
    return false;
  }

  // 檢查特定 Card 的開關
  const cardFlag = cardsMigrationFlags.find(f => f.key === `enable_${cardType}_card`);
  if (!cardFlag) {
    return false; // 未定義的 Card 類型預設不啟用
  }

  if (cardFlag.status === FeatureFlagStatus.DISABLED) {
    return false;
  }

  if (cardFlag.status === FeatureFlagStatus.ENABLED) {
    return true;
  }

  // 部分啟用 - 檢查百分比或用戶規則
  if (cardFlag.type === 'percentage' && cardFlag.rolloutPercentage !== undefined && userId) {
    // 使用穩定的哈希函數
    let hash = 0;
    const str = `${cardFlag.key}-${userId}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const bucketValue = Math.abs(hash) % 100;
    return bucketValue < cardFlag.rolloutPercentage;
  }

  return cardFlag.defaultValue as boolean;
}

/**
 * 檢查是否應該使用 GraphQL API
 */
export function shouldUseGraphQL(operation: 'query' | 'mutation' | 'subscription', userId?: string): boolean {
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

/**
 * 獲取當前遷移進度
 */
export function getMigrationProgress(): {
  cards: { completed: number; total: number; percentage: number };
  api: { completed: number; total: number; percentage: number };
  widgets: { remaining: number; cleaned: number; percentage: number };
} {
  const cardsFlag = cardsMigrationFlags.find(f => f.key === 'use_cards_system');
  const apiFlag = cardsMigrationFlags.find(f => f.key === 'use_graphql_api');
  
  const cardsMetadata = cardsFlag?.metadata as Record<string, number> || {};
  const apiMetadata = apiFlag?.metadata as Record<string, number> || {};

  return {
    cards: {
      completed: cardsMetadata.completedCards || 15,
      total: cardsMetadata.totalCards || 17,
      percentage: ((cardsMetadata.completedCards || 15) / (cardsMetadata.totalCards || 17)) * 100,
    },
    api: {
      completed: apiMetadata.completedResolvers || 17,
      total: apiMetadata.totalEndpoints || 77,
      percentage: ((apiMetadata.completedResolvers || 17) / (apiMetadata.totalEndpoints || 77)) * 100,
    },
    widgets: {
      remaining: cardsMetadata.remainingWidgets || 56,
      cleaned: 0, // 目前未開始清理
      percentage: 0,
    },
  };
}

/**
 * 檢查是否可以停用舊系統
 */
export function canDisableLegacySystem(system: 'widgets' | 'rest'): boolean {
  const progress = getMigrationProgress();
  
  if (system === 'widgets') {
    // 當所有 Cards 完成且 Widgets 清理完成才能停用
    return progress.cards.percentage >= 100 && progress.widgets.percentage >= 100;
  }
  
  if (system === 'rest') {
    // 當 GraphQL 遷移達到 100% 才能停用 REST
    return progress.api.percentage >= 100;
  }
  
  return false;
}