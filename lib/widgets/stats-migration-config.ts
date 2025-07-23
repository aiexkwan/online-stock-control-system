/**
 * Stats Widget Migration Configuration
 * 映射舊的 widget 名稱到新的 StatsCard 類型
 * 確保向後兼容性
 */

import { StatsType } from '@/types/generated/graphql';

// Widget 名稱到 StatsType 的映射
export const WIDGET_TO_STATS_TYPE_MAP: Record<string, StatsType> = {
  // 基礎統計 widgets
  'YesterdayTransferCountWidget': StatsType.YesterdayTransferCount,
  'AwaitLocationQtyWidget': StatsType.AwaitLocationQty,
  'StillInAwaitWidget': StatsType.StillInAwait,
  'StillInAwaitPercentageWidget': StatsType.StillInAwaitPercentage,
  
  // 生產統計 widgets
  'ProductionStatsWidget': StatsType.ProductionStats,
  'InjectionProductionStatsWidget': StatsType.InjectionProductionStats,
  
  // 工作量統計 widgets
  'StaffWorkloadWidget': StatsType.StaffWorkload,
  'WarehouseWorkLevelAreaChart': StatsType.WarehouseWorkLevel,
  
  // 時間和歷史統計 widgets
  'TransferTimeDistributionWidget': StatsType.TransferTimeDistribution,
  'StockLevelHistoryChart': StatsType.StockLevelHistory,
};

// 反向映射（StatsType 到 Widget 名稱）
export const STATS_TYPE_TO_WIDGET_MAP: Record<StatsType, string> = Object.entries(
  WIDGET_TO_STATS_TYPE_MAP
).reduce((acc, [widgetName, statsType]) => {
  acc[statsType] = widgetName;
  return acc;
}, {} as Record<StatsType, string>);

// 需要遷移的 widget 列表
export const STATS_WIDGETS_TO_MIGRATE = Object.keys(WIDGET_TO_STATS_TYPE_MAP);

// StatsCard 配置預設
export interface StatsCardPreset {
  name: string;
  description: string;
  statTypes: StatsType[];
  columns: 1 | 2 | 3 | 4;
  showTrend: boolean;
  showComparison: boolean;
}

// 預設配置（用於不同的 admin 頁面）
export const STATS_CARD_PRESETS: Record<string, StatsCardPreset> = {
  // 儀表板主頁
  'dashboard': {
    name: 'Dashboard Overview',
    description: 'Key metrics overview',
    statTypes: [
      StatsType.YesterdayTransferCount,
      StatsType.AwaitLocationQty,
      StatsType.StillInAwaitPercentage,
    ],
    columns: 3,
    showTrend: true,
    showComparison: true,
  },
  
  // 倉庫操作頁面
  'warehouse': {
    name: 'Warehouse Operations',
    description: 'Warehouse activity metrics',
    statTypes: [
      StatsType.AwaitLocationQty,
      StatsType.StillInAwait,
      StatsType.WarehouseWorkLevel,
      StatsType.TransferTimeDistribution,
    ],
    columns: 4,
    showTrend: true,
    showComparison: false,
  },
  
  // 生產監控頁面
  'production': {
    name: 'Production Monitoring',
    description: 'Production statistics',
    statTypes: [
      StatsType.ProductionStats,
      StatsType.InjectionProductionStats,
      StatsType.StaffWorkload,
    ],
    columns: 3,
    showTrend: true,
    showComparison: true,
  },
  
  // 庫存管理頁面
  'inventory': {
    name: 'Inventory Management',
    description: 'Stock and inventory metrics',
    statTypes: [
      StatsType.StockLevelHistory,
      StatsType.AwaitLocationQty,
      StatsType.StillInAwaitPercentage,
    ],
    columns: 3,
    showTrend: true,
    showComparison: true,
  },
};

// 遷移輔助函數
export function getStatsTypeForWidget(widgetName: string): StatsType | undefined {
  return WIDGET_TO_STATS_TYPE_MAP[widgetName];
}

export function getWidgetNameForStatsType(statsType: StatsType): string | undefined {
  return STATS_TYPE_TO_WIDGET_MAP[statsType];
}

export function isStatsWidget(widgetName: string): boolean {
  return widgetName in WIDGET_TO_STATS_TYPE_MAP;
}

// 將舊的 widget 配置轉換為 StatsCard 配置
export function convertWidgetConfigToStatsCard(
  widgetNames: string[]
): { statTypes: StatsType[]; unmapped: string[] } {
  const statTypes: StatsType[] = [];
  const unmapped: string[] = [];

  widgetNames.forEach(widgetName => {
    const statsType = getStatsTypeForWidget(widgetName);
    if (statsType) {
      statTypes.push(statsType);
    } else {
      unmapped.push(widgetName);
    }
  });

  return { statTypes, unmapped };
}

// 獲取頁面的建議 StatsCard 配置
export function getStatsCardPresetForPage(pagePath: string): StatsCardPreset | undefined {
  // 根據路徑判斷頁面類型
  if (pagePath.includes('/admin/dashboard')) {
    return STATS_CARD_PRESETS['dashboard'];
  } else if (pagePath.includes('/admin/warehouse')) {
    return STATS_CARD_PRESETS['warehouse'];
  } else if (pagePath.includes('/admin/production')) {
    return STATS_CARD_PRESETS['production'];
  } else if (pagePath.includes('/admin/inventory')) {
    return STATS_CARD_PRESETS['inventory'];
  }
  
  // 默認返回 dashboard 配置
  return STATS_CARD_PRESETS['dashboard'];
}

// Feature Flag 配置（用於漸進式遷移）
export const STATS_MIGRATION_FLAGS = {
  // 是否啟用 StatsCard
  enableStatsCard: true,
  
  // 是否顯示遷移提示
  showMigrationHints: true,
  
  // 是否保留舊 widgets（用於 A/B 測試）
  keepOldWidgets: false,
  
  // 自動遷移模式
  autoMigrate: true,
  
  // 遷移批次（可以分批遷移）
  migrationBatch: 1, // 1 = 第一批, 2 = 第二批, etc.
};

// 檢查 widget 是否應該被遷移
export function shouldMigrateWidget(widgetName: string): boolean {
  if (!STATS_MIGRATION_FLAGS.enableStatsCard) {
    return false;
  }
  
  if (!isStatsWidget(widgetName)) {
    return false;
  }
  
  // 可以根據批次控制遷移
  // 例如：第一批只遷移基礎統計 widgets
  if (STATS_MIGRATION_FLAGS.migrationBatch === 1) {
    const batch1Widgets = [
      'YesterdayTransferCountWidget',
      'AwaitLocationQtyWidget',
      'StillInAwaitWidget',
      'StillInAwaitPercentageWidget',
    ];
    return batch1Widgets.includes(widgetName);
  }
  
  return true;
}