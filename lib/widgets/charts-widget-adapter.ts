/**
 * Charts Widget Adapter
 * 遷移 Charts 類別 widgets 到新的註冊系統
 */

import { widgetRegistry } from './enhanced-registry';
import { WidgetDefinition } from './types';
import { getWidgetImport } from './dynamic-imports';
import { createDynamicWidget } from './widget-loader';

/**
 * Charts widgets 的映射配置
 */
export const chartsWidgetConfigs: Record<string, Partial<WidgetDefinition>> = {
  StockDistributionChart: {
    name: 'Stock Distribution Chart',
    category: 'charts',
    description: 'Shows stock distribution across warehouses',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 300000,
      chartType: 'bar',
    },
  },

  StockDistributionChartV2: {
    name: 'Stock Distribution Chart V2',
    category: 'charts',
    description: 'Enhanced stock distribution visualization',
    lazyLoad: true,
    preloadPriority: 8,
    useGraphQL: false,
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 300000,
      chartType: 'treemap',
    },
  },

  StockLevelHistoryChart: {
    name: 'Stock Level History',
    category: 'charts',
    description: 'Historical stock levels over time',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 600000, // 10分鐘刷新
      chartType: 'line',
      supportTimeFrame: true,
    },
  },

  TransferTimeDistributionWidget: {
    name: 'Transfer Time Distribution',
    category: 'charts',
    description: 'Distribution of transfer completion times',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_transfer',
      refreshInterval: 600000,
      chartType: 'histogram',
    },
  },

  InventoryOrderedAnalysisWidget: {
    name: 'Inventory Ordered Analysis',
    category: 'charts',
    description: 'Analysis of inventory vs orders',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'multiple',
      refreshInterval: 300000,
      chartType: 'combo',
      requiresComplexQuery: true,
    },
  },

  TopProductsInventoryChart: {
    name: 'Top Products Inventory',
    category: 'charts',
    description: 'Top products by inventory level',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 300000,
      chartType: 'bar',
      limit: 10,
    },
  },

  TopProductsByQuantityWidget: {
    name: 'Top Products by Quantity',
    category: 'charts',
    description: 'Top products ranked by quantity (GraphQL optimized)',
    lazyLoad: true,
    preloadPriority: 7,
    useGraphQL: true,
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 300000,
      chartType: 'bar',
      limit: 10,
      optimized: true,
    },
  },

  TopProductsDistributionWidget: {
    name: 'Top Products Distribution',
    category: 'charts',
    description: 'Distribution of top products (GraphQL optimized)',
    lazyLoad: true,
    preloadPriority: 7,
    useGraphQL: true,
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: 300000,
      chartType: 'pie',
      limit: 10,
      optimized: true,
    },
  },

  WarehouseWorkLevelAreaChart: {
    name: 'Warehouse Work Level',
    category: 'charts',
    description: 'Work level trends across warehouses',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'warehouse_activity',
      refreshInterval: 300000,
      chartType: 'area',
      supportTimeFrame: true,
    },
  },
};

/**
 * 註冊所有 Charts widgets
 */
export async function registerChartsWidgets(): Promise<void> {
  const startTime = performance.now();
  let registeredCount = 0;

  console.log('[ChartsWidgetAdapter] Starting Charts widgets registration...');

  for (const [widgetId, config] of Object.entries(chartsWidgetConfigs)) {
    try {
      // 獲取動態導入函數
      const importFn = getWidgetImport(widgetId);

      if (!importFn) {
        console.warn(`[ChartsWidgetAdapter] No import function found for ${widgetId}`);
        continue;
      }

      // 創建完整的 widget 定義，包含懶加載組件
      const definition: WidgetDefinition = {
        id: widgetId,
        name: config.name || widgetId,
        category: 'charts',
        ...config,
        component: createDynamicWidget(widgetId), // 使用統一的 widget loader
      };

      // 註冊到 registry
      widgetRegistry.register(definition);

      registeredCount++;
      console.log(`[ChartsWidgetAdapter] Registered: ${widgetId}`);
    } catch (error) {
      console.error(`[ChartsWidgetAdapter] Failed to register ${widgetId}:`, error);
    }
  }

  const endTime = performance.now();
  console.log(
    `[ChartsWidgetAdapter] Completed: ${registeredCount} widgets registered in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * 預加載高優先級 Charts widgets
 */
export async function preloadHighPriorityChartsWidgets(): Promise<void> {
  const highPriorityWidgets = Object.entries(chartsWidgetConfigs)
    .filter(([_, config]) => (config.preloadPriority || 0) >= 8)
    .map(([id]) => id);

  if (highPriorityWidgets.length > 0) {
    console.log(
      '[ChartsWidgetAdapter] Preloading high priority Charts widgets:',
      highPriorityWidgets
    );
    await widgetRegistry.preloadWidgets(highPriorityWidgets);
  }
}

/**
 * 獲取 Charts widget 的圖表類型
 */
export function getChartType(widgetId: string): string | undefined {
  const config = chartsWidgetConfigs[widgetId];
  return config?.metadata?.chartType as string | undefined;
}

/**
 * 檢查 Charts widget 是否需要複雜查詢
 */
export function requiresComplexQuery(widgetId: string): boolean {
  const config = chartsWidgetConfigs[widgetId];
  return config?.metadata?.requiresComplexQuery === true;
}
