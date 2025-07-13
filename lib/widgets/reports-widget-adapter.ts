/**
 * Reports Widget Adapter
 * 遷移 Reports 類別 widgets 到新的註冊系統
 */

import { WidgetDefinition } from './types';
import { getWidgetImport } from './dynamic-imports';

/**
 * Reports widgets 的映射配置
 */
export const reportsWidgetConfigs: Record<string, Partial<WidgetDefinition>> = {
  TransactionReportWidget: {
    name: 'Transaction Report',
    category: 'reports',
    description: 'Generate transaction reports',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_transaction',
      exportFormats: ['pdf', 'csv', 'excel'],
      supportDateRange: true,
    },
  },

  GrnReportWidget: {
    name: 'GRN Report',
    category: 'reports',
    description: 'Goods Receipt Note reports',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_grn',
      exportFormats: ['pdf', 'csv'],
      supportFilters: true,
    },
  },

  AcoOrderReportWidget: {
    name: 'ACO Order Report',
    category: 'reports',
    description: 'ACO order analysis reports',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_aco_order',
      exportFormats: ['pdf', 'excel'],
      supportDateRange: true,
      complexReport: true,
    },
  },

  ReprintLabelWidget: {
    name: 'Reprint Label',
    category: 'reports',
    description: 'Reprint pallet labels',
    lazyLoad: true,
    preloadPriority: 9, // 高優先級 - 常用功能
    metadata: {
      dataSource: 'record_palletinfo',
      printSupport: true,
      barcodeScan: true,
    },
  },

  ReportGeneratorWidget: {
    name: 'Report Generator',
    category: 'reports',
    description: 'Generic report generation tool',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      configurable: true,
      supportedReports: ['inventory', 'movement', 'performance'],
      exportFormats: ['pdf', 'csv', 'excel'],
    },
  },

  StaffWorkloadWidget: {
    name: 'Staff Workload Report',
    category: 'reports',
    description: 'Staff productivity analysis',
    lazyLoad: true,
    preloadPriority: 6,
    useGraphQL: true,
    graphqlVersion: 'StaffWorkloadGraphQL',
    metadata: {
      dataSource: 'staff_activity',
      supportTimeFrame: true,
      chartIntegration: true,
    },
  },

  BookedOutStatsWidget: {
    name: 'Booked Out Statistics',
    category: 'reports',
    description: 'Booking out performance stats',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_loading',
      refreshInterval: 300000, // 5分鐘刷新
      supportDateRange: true,
    },
  },

  OutputStatsWidget: {
    name: 'Output Statistics',
    category: 'reports',
    description: 'Warehouse output performance',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_output',
      refreshInterval: 300000,
      supportWarehouseFilter: true,
    },
  },
};

/**
 * 註冊所有 Reports widgets
 */
export async function registerReportsWidgets(widgetRegistry: any): Promise<void> {
  const startTime = performance.now();
  let registeredCount = 0;

  console.log('[ReportsWidgetAdapter] Starting Reports widgets registration...');

  for (const [widgetId, config] of Object.entries(reportsWidgetConfigs)) {
    try {
      // 獲取動態導入函數
      const importFn = getWidgetImport(widgetId);

      if (!importFn) {
        console.warn(`[ReportsWidgetAdapter] No import function found for ${widgetId}`);
        continue;
      }

      // 創建完整的 widget 定義，包含懶加載組件
      const definition: WidgetDefinition = {
        id: widgetId,
        name: config.name || widgetId,
        category: 'reports',
        ...config,
        component: undefined, // 延遲創建組件
      };

      // 註冊到 registry
      widgetRegistry.register(definition);

      registeredCount++;
      console.log(`[ReportsWidgetAdapter] Registered: ${widgetId}`);
    } catch (error) {
      console.error(`[ReportsWidgetAdapter] Failed to register ${widgetId}:`, error);
    }
  }

  const endTime = performance.now();
  console.log(
    `[ReportsWidgetAdapter] Completed: ${registeredCount} widgets registered in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * 預加載高優先級 Reports widgets
 */
export async function preloadHighPriorityReportsWidgets(widgetRegistry: any): Promise<void> {
  const highPriorityWidgets = Object.entries(reportsWidgetConfigs)
    .filter(([_, config]) => (config.preloadPriority || 0) >= 8)
    .map(([id]) => id);

  if (highPriorityWidgets.length > 0) {
    console.log(
      '[ReportsWidgetAdapter] Preloading high priority Reports widgets:',
      highPriorityWidgets
    );
    await widgetRegistry.preloadWidgets(highPriorityWidgets);
  }
}

/**
 * 獲取報表支援的導出格式
 */
export function getExportFormats(widgetId: string): string[] {
  const config = reportsWidgetConfigs[widgetId];
  return (config?.metadata?.exportFormats as string[]) || [];
}

/**
 * 檢查報表是否支援日期範圍
 */
export function supportsDateRange(widgetId: string): boolean {
  const config = reportsWidgetConfigs[widgetId];
  return config?.metadata?.supportDateRange === true;
}
