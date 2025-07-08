/**
 * Operations Widget Adapter
 * 遷移 Operations 類別 widgets 到新的註冊系統
 */

import { widgetRegistry } from './enhanced-registry';
import { WidgetDefinition } from './types';
import { getWidgetImport } from './dynamic-imports';
import { createLazyWidget } from './widget-loader';

/**
 * Operations widgets 的映射配置
 */
export const operationsWidgetConfigs: Record<string, Partial<WidgetDefinition>> = {
  VoidPalletWidget: {
    name: 'Void Pallet',
    category: 'operations',
    description: 'Void pallet operations',
    lazyLoad: true,
    preloadPriority: 9, // 高優先級 - 關鍵操作
    metadata: {
      dataSource: 'record_palletinfo',
      requiresAuth: true,
      auditLog: true,
      confirmationRequired: true,
    },
  },

  ProductUpdateWidget: {
    name: 'Product Update',
    category: 'operations',
    description: 'Update product information',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_product',
      supportBulkUpdate: true,
      validationRequired: true,
    },
  },

  SupplierUpdateWidget: {
    name: 'Supplier Update',
    category: 'operations',
    description: 'Manage supplier information',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_supplier',
      supportImport: true,
      validationRequired: true,
    },
  },

  BookedOutQueueWidget: {
    name: 'Booked Out Queue',
    category: 'operations',
    description: 'Manage booking out queue',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_loading',
      refreshInterval: 30000, // 30秒刷新 - 實時性要求高
      supportPriorityQueue: true,
    },
  },

  StockTypeSelector: {
    name: 'Stock Type Selector',
    category: 'operations',
    description: 'Select and manage stock types',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'stock_types',
      cacheEnabled: true,
      supportFilters: true,
    },
  },
};

/**
 * 註冊所有 Operations widgets
 */
export async function registerOperationsWidgets(): Promise<void> {
  const startTime = performance.now();
  let registeredCount = 0;

  console.log('[OperationsWidgetAdapter] Starting Operations widgets registration...');

  for (const [widgetId, config] of Object.entries(operationsWidgetConfigs)) {
    try {
      // 獲取動態導入函數
      const importFn = getWidgetImport(widgetId);

      if (!importFn) {
        console.warn(`[OperationsWidgetAdapter] No import function found for ${widgetId}`);
        continue;
      }

      // 創建完整的 widget 定義，包含懶加載組件
      const definition: WidgetDefinition = {
        id: widgetId,
        name: config.name || widgetId,
        category: 'operations',
        ...config,
        component: createLazyWidget(widgetId), // 使用統一的 widget loader
      };

      // 註冊到 registry
      widgetRegistry.register(definition);

      registeredCount++;
      console.log(`[OperationsWidgetAdapter] Registered: ${widgetId}`);
    } catch (error) {
      console.error(`[OperationsWidgetAdapter] Failed to register ${widgetId}:`, error);
    }
  }

  const endTime = performance.now();
  console.log(
    `[OperationsWidgetAdapter] Completed: ${registeredCount} widgets registered in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * 預加載高優先級 Operations widgets
 */
export async function preloadHighPriorityOperationsWidgets(): Promise<void> {
  const highPriorityWidgets = Object.entries(operationsWidgetConfigs)
    .filter(([_, config]) => (config.preloadPriority || 0) >= 8)
    .map(([id]) => id);

  if (highPriorityWidgets.length > 0) {
    console.log(
      '[OperationsWidgetAdapter] Preloading high priority Operations widgets:',
      highPriorityWidgets
    );
    await widgetRegistry.preloadWidgets(highPriorityWidgets);
  }
}

/**
 * 檢查操作是否需要認證
 */
export function requiresAuth(widgetId: string): boolean {
  const config = operationsWidgetConfigs[widgetId];
  return config?.metadata?.requiresAuth === true;
}

/**
 * 檢查操作是否需要確認
 */
export function requiresConfirmation(widgetId: string): boolean {
  const config = operationsWidgetConfigs[widgetId];
  return config?.metadata?.confirmationRequired === true;
}
