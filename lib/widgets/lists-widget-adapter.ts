/**
 * Lists Widget Adapter
 * 遷移 Lists 類別 widgets 到新的註冊系統
 */

import { widgetRegistry } from './enhanced-registry';
import { WidgetDefinition } from './types';
import { getWidgetImport } from './dynamic-imports';
import { createLazyWidget } from './widget-loader';

/**
 * Lists widgets 的映射配置
 */
export const listsWidgetConfigs: Record<string, Partial<WidgetDefinition>> = {
  OrdersListWidgetV2: {
    name: 'Orders List',
    category: 'lists',
    description: 'Displays list of customer orders',
    lazyLoad: true,
    preloadPriority: 9, // 高優先級
    useGraphQL: false, // GraphQL version removed
    metadata: {
      dataSource: 'record_order',
      refreshInterval: 60000, // 1分鐘刷新
      supportPagination: true,
      supportFilters: true,
    },
  },

  WarehouseTransferListWidget: {
    name: 'Warehouse Transfer List',
    category: 'lists',
    description: 'Shows warehouse transfer records',
    lazyLoad: true,
    preloadPriority: 8,
    useGraphQL: false, // GraphQL version removed
    metadata: {
      dataSource: 'record_transfer',
      refreshInterval: 60000,
      supportPagination: true,
      supportTimeFrame: true,
    },
  },

  TransferListWidget: {
    name: 'Transfer List',
    category: 'lists',
    description: 'Generic transfer list display',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_transfer',
      refreshInterval: 120000, // 2分鐘刷新
      supportPagination: true,
    },
  },

  OrderStateListWidget: {
    name: 'Order State List',
    category: 'lists',
    description: 'Shows orders grouped by state',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_order',
      refreshInterval: 120000,
      supportStateFilter: true,
    },
  },

  BookedOutListWidget: {
    name: 'Booked Out List',
    category: 'lists',
    description: 'Displays booked out items',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_loading',
      refreshInterval: 60000,
      supportDateFilter: true,
    },
  },

  GrnListWidget: {
    name: 'GRN List',
    category: 'lists',
    description: 'Goods Receipt Note list',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_grn',
      refreshInterval: 300000, // 5分鐘刷新
      supportPagination: true,
    },
  },

  LoadingListWidget: {
    name: 'Loading List',
    category: 'lists',
    description: 'Shows loading bay activities',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_loading',
      refreshInterval: 30000, // 30秒刷新（實時性要求高）
      supportStatusFilter: true,
    },
  },

  OtherFilesListWidget: {
    name: 'Other Files List',
    category: 'lists',
    description: 'Displays miscellaneous files',
    lazyLoad: true,
    preloadPriority: 5,
    useGraphQL: false, // GraphQL version removed
    metadata: {
      dataSource: 'record_files',
      refreshInterval: 300000,
      supportTypeFilter: true,
    },
  },
};

/**
 * 註冊所有 Lists widgets
 */
export async function registerListsWidgets(): Promise<void> {
  const startTime = performance.now();
  let registeredCount = 0;

  console.log('[ListsWidgetAdapter] Starting Lists widgets registration...');

  for (const [widgetId, config] of Object.entries(listsWidgetConfigs)) {
    try {
      // 獲取動態導入函數
      const importFn = getWidgetImport(widgetId);

      if (!importFn) {
        console.warn(`[ListsWidgetAdapter] No import function found for ${widgetId}`);
        continue;
      }

      // 創建完整的 widget 定義，包含懶加載組件
      const definition: WidgetDefinition = {
        id: widgetId,
        name: config.name || widgetId,
        category: 'lists',
        ...config,
        component: createLazyWidget(widgetId), // 使用統一的 widget loader
      };

      // 註冊到 registry
      widgetRegistry.register(definition);

      registeredCount++;
      console.log(`[ListsWidgetAdapter] Registered: ${widgetId}`);
    } catch (error) {
      console.error(`[ListsWidgetAdapter] Failed to register ${widgetId}:`, error);
    }
  }

  const endTime = performance.now();
  console.log(
    `[ListsWidgetAdapter] Completed: ${registeredCount} widgets registered in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * 預加載高優先級 Lists widgets
 */
export async function preloadHighPriorityListsWidgets(): Promise<void> {
  const highPriorityWidgets = Object.entries(listsWidgetConfigs)
    .filter(([_, config]) => (config.preloadPriority || 0) >= 8)
    .map(([id]) => id);

  if (highPriorityWidgets.length > 0) {
    console.log(
      '[ListsWidgetAdapter] Preloading high priority Lists widgets:',
      highPriorityWidgets
    );
    await widgetRegistry.preloadWidgets(highPriorityWidgets);
  }
}

/**
 * 獲取 Lists widget 的分頁配置
 */
export function supportsPagination(widgetId: string): boolean {
  const config = listsWidgetConfigs[widgetId];
  return config?.metadata?.supportPagination === true;
}

/**
 * 獲取 Lists widget 的實時刷新頻率
 */
export function getListRefreshInterval(widgetId: string): number | undefined {
  const config = listsWidgetConfigs[widgetId];
  return config?.metadata?.refreshInterval as number | undefined;
}

/**
 * 檢查 Lists widget 是否有 GraphQL 版本
 */
export function hasGraphQLVersion(widgetId: string): string | undefined {
  const config = listsWidgetConfigs[widgetId];
  return config?.graphqlVersion;
}
