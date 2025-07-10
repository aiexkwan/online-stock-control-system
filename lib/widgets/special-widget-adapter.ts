/**
 * Special Widget Adapter
 * 遷移 Special 類別 widgets 到新的註冊系統
 */

import { widgetRegistry } from './enhanced-registry';
import { WidgetDefinition } from './types';
import { getWidgetImport } from './dynamic-imports';
import { createDynamicWidget } from './widget-loader';

/**
 * Special widgets 的映射配置
 */
export const specialWidgetConfigs: Record<string, Partial<WidgetDefinition>> = {
  OrderAnalysisResultDialog: {
    name: 'Order Analysis Result Dialog',
    category: 'special',
    description: 'Dialog for order analysis results',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      isDialog: true,
      requiresAuth: true,
    },
  },

  Folder3D: {
    name: '3D Folder',
    category: 'special',
    description: '3D folder visualization',
    lazyLoad: true,
    preloadPriority: 3,
    metadata: {
      requires3D: true,
      heavyComponent: true,
    },
  },

  PerformanceTestWidget: {
    name: 'Performance Test Widget',
    category: 'special',
    description: 'Test batch query performance vs individual queries',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      requiresAdmin: true,
      testingTool: true,
      dataSource: 'performance_metrics',
    },
  },
};

/**
 * 註冊所有 Special widgets
 */
export async function registerSpecialWidgets(): Promise<void> {
  const startTime = performance.now();
  let registeredCount = 0;

  console.log('[SpecialWidgetAdapter] Starting Special widgets registration...');

  for (const [widgetId, config] of Object.entries(specialWidgetConfigs)) {
    try {
      // 獲取動態導入函數
      const importFn = getWidgetImport(widgetId);

      if (!importFn) {
        console.warn(`[SpecialWidgetAdapter] No import function found for ${widgetId}`);
        continue;
      }

      // 創建完整的 widget 定義，包含懶加載組件
      const definition: WidgetDefinition = {
        id: widgetId,
        name: config.name || widgetId,
        category: 'special',
        ...config,
        component: createDynamicWidget(widgetId), // 使用統一的 widget loader
      };

      // 註冊到 registry
      widgetRegistry.register(definition);

      registeredCount++;
      console.log(`[SpecialWidgetAdapter] Registered: ${widgetId}`);
    } catch (error) {
      console.error(`[SpecialWidgetAdapter] Failed to register ${widgetId}:`, error);
    }
  }

  const endTime = performance.now();
  console.log(
    `[SpecialWidgetAdapter] Completed: ${registeredCount} widgets registered in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * 預加載高優先級 Special widgets
 */
export async function preloadHighPrioritySpecialWidgets(): Promise<void> {
  const highPriorityWidgets = Object.entries(specialWidgetConfigs)
    .filter(([_, config]) => (config.preloadPriority || 0) >= 5)
    .map(([id]) => id);

  if (highPriorityWidgets.length > 0) {
    console.log(
      '[SpecialWidgetAdapter] Preloading high priority Special widgets:',
      highPriorityWidgets
    );
    await widgetRegistry.preloadWidgets(highPriorityWidgets);
  }
}

/**
 * 檢查是否需要管理員權限
 */
export function requiresAdminAuth(widgetId: string): boolean {
  const config = specialWidgetConfigs[widgetId];
  return config?.metadata?.requiresAdmin === true;
}