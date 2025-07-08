/**
 * Stats Widget Adapter
 * 遷移 Stats 類別 widgets 到新的註冊系統
 */

import { widgetRegistry } from './enhanced-registry';
import { WidgetDefinition } from './types';
import { getWidgetImport } from './dynamic-imports';
import { createLazyWidget } from './widget-loader';

/**
 * Stats widgets 的映射配置
 */
export const statsWidgetConfigs: Record<string, Partial<WidgetDefinition>> = {
  AwaitLocationQtyWidget: {
    name: 'Await Location Quantity',
    category: 'stats',
    description: 'Displays total pallets in Await location',
    lazyLoad: true,
    preloadPriority: 9, // 高優先級
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 60000, // 1分鐘刷新
      supportTimeFrame: true,
    },
  },

  YesterdayTransferCountWidget: {
    name: 'Yesterday Transfer Count',
    category: 'stats',
    description: 'Shows transfer count from yesterday',
    lazyLoad: true,
    preloadPriority: 8,
    useGraphQL: true,
    metadata: {
      dataSource: 'record_transfer',
      refreshInterval: 300000, // 5分鐘刷新
      supportTimeFrame: true,
    },
  },

  StillInAwaitWidget: {
    name: 'Still In Await',
    category: 'stats',
    description: 'Displays items still in await status',
    lazyLoad: true,
    preloadPriority: 7,
    // GraphQL version removed
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 60000,
    },
  },

  StillInAwaitPercentageWidget: {
    name: 'Still In Await Percentage',
    category: 'stats',
    description: 'Shows percentage of items in await status',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 60000,
      displayType: 'percentage',
    },
  },

  StatsCardWidget: {
    name: 'Stats Card',
    category: 'stats',
    description: 'Generic stats card with configurable data source',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      configurable: true,
      supportedDataSources: ['total_pallets', 'today_transfers', 'active_products'],
    },
  },
};

/**
 * 註冊所有 Stats widgets
 */
export async function registerStatsWidgets(): Promise<void> {
  const startTime = performance.now();
  let registeredCount = 0;

  console.log('[StatsWidgetAdapter] Starting Stats widgets registration...');

  for (const [widgetId, config] of Object.entries(statsWidgetConfigs)) {
    try {
      // 獲取動態導入函數
      const importFn = getWidgetImport(widgetId);

      if (!importFn) {
        console.warn(`[StatsWidgetAdapter] No import function found for ${widgetId}`);
        continue;
      }

      // 創建完整的 widget 定義，包含懶加載組件
      const definition: WidgetDefinition = {
        id: widgetId,
        name: config.name || widgetId,
        category: 'stats',
        ...config,
        component: createLazyWidget(widgetId), // 直接使用 widget loader
      };

      // 註冊到 registry
      widgetRegistry.register(definition);

      registeredCount++;
      console.log(`[StatsWidgetAdapter] Registered: ${widgetId}`);
    } catch (error) {
      console.error(`[StatsWidgetAdapter] Failed to register ${widgetId}:`, error);
    }
  }

  const endTime = performance.now();
  console.log(
    `[StatsWidgetAdapter] Completed: ${registeredCount} widgets registered in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * 預加載高優先級 Stats widgets
 */
export async function preloadHighPriorityStatsWidgets(): Promise<void> {
  const highPriorityWidgets = Object.entries(statsWidgetConfigs)
    .filter(([_, config]) => (config.preloadPriority || 0) >= 8)
    .map(([id]) => id);

  if (highPriorityWidgets.length > 0) {
    console.log(
      '[StatsWidgetAdapter] Preloading high priority Stats widgets:',
      highPriorityWidgets
    );
    await widgetRegistry.preloadWidgets(highPriorityWidgets);
  }
}

/**
 * 獲取 Stats widget 的實時數據刷新配置
 */
export function getStatsWidgetRefreshConfig(widgetId: string): number | undefined {
  const config = statsWidgetConfigs[widgetId];
  return config?.metadata?.refreshInterval as number | undefined;
}

/**
 * 檢查 Stats widget 是否支援 time frame
 */
export function supportsTimeFrame(widgetId: string): boolean {
  const config = statsWidgetConfigs[widgetId];
  return config?.metadata?.supportTimeFrame === true;
}
