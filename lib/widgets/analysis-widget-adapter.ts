/**
 * Analysis Widget Adapter
 * 遷移 Analysis 類別 widgets 到新的註冊系統
 */

import { widgetRegistry } from './enhanced-registry';
import { WidgetDefinition } from './types';
import { getWidgetImport } from './dynamic-imports';
import { createLazyWidget } from './widget-loader';

/**
 * Analysis widgets 的映射配置
 */
export const analysisWidgetConfigs: Record<string, Partial<WidgetDefinition>> = {
  AnalysisExpandableCards: {
    name: 'Analysis Expandable Cards',
    category: 'analysis',
    description: 'Expandable analysis cards with detailed metrics',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'multiple',
      supportExpansion: true,
      refreshInterval: 300000, // 5分鐘刷新
      complexAnalytics: true,
    },
  },

  AcoOrderProgressCards: {
    name: 'ACO Order Progress Cards',
    category: 'analysis',
    description: 'ACO order progress tracking cards',
    lazyLoad: true,
    preloadPriority: 9, // 高優先級 - 重要分析
    metadata: {
      dataSource: 'record_aco_order',
      refreshInterval: 60000, // 1分鐘刷新
      supportRealtime: true,
      visualProgress: true,
    },
  },

  AcoOrderProgressWidget: {
    name: 'ACO Order Progress Widget',
    category: 'analysis',
    description: 'Comprehensive ACO order progress analysis',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_aco_order',
      refreshInterval: 120000, // 2分鐘刷新
      supportFilters: true,
      chartIntegration: true,
      exportable: true,
    },
  },
};

/**
 * 註冊所有 Analysis widgets
 */
export async function registerAnalysisWidgets(): Promise<void> {
  const startTime = performance.now();
  let registeredCount = 0;

  console.log('[AnalysisWidgetAdapter] Starting Analysis widgets registration...');

  for (const [widgetId, config] of Object.entries(analysisWidgetConfigs)) {
    try {
      // 獲取動態導入函數
      const importFn = getWidgetImport(widgetId);

      if (!importFn) {
        console.warn(`[AnalysisWidgetAdapter] No import function found for ${widgetId}`);
        continue;
      }

      // 創建完整的 widget 定義，包含懶加載組件
      const definition: WidgetDefinition = {
        id: widgetId,
        name: config.name || widgetId,
        category: 'analysis',
        ...config,
        component: createLazyWidget(widgetId), // 使用統一的 widget loader
      };

      // 註冊到 registry
      widgetRegistry.register(definition);

      registeredCount++;
      console.log(`[AnalysisWidgetAdapter] Registered: ${widgetId}`);
    } catch (error) {
      console.error(`[AnalysisWidgetAdapter] Failed to register ${widgetId}:`, error);
    }
  }

  const endTime = performance.now();
  console.log(
    `[AnalysisWidgetAdapter] Completed: ${registeredCount} widgets registered in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * 預加載高優先級 Analysis widgets
 */
export async function preloadHighPriorityAnalysisWidgets(): Promise<void> {
  const highPriorityWidgets = Object.entries(analysisWidgetConfigs)
    .filter(([_, config]) => (config.preloadPriority || 0) >= 8)
    .map(([id]) => id);

  if (highPriorityWidgets.length > 0) {
    console.log(
      '[AnalysisWidgetAdapter] Preloading high priority Analysis widgets:',
      highPriorityWidgets
    );
    await widgetRegistry.preloadWidgets(highPriorityWidgets);
  }
}

/**
 * 檢查分析 widget 是否支援實時更新
 */
export function supportsRealtime(widgetId: string): boolean {
  const config = analysisWidgetConfigs[widgetId];
  return config?.metadata?.supportRealtime === true;
}

/**
 * 檢查分析 widget 是否支援導出
 */
export function isExportable(widgetId: string): boolean {
  const config = analysisWidgetConfigs[widgetId];
  return config?.metadata?.exportable === true;
}
