/**
 * 統一 Widget 配置系統
 * 合併 widget-config.ts 和 widget-mappings.ts 的功能
 */

import { WidgetDefinition, WidgetCategory } from './types';

/**
 * 簡化的 Widget 配置接口
 */
export interface UnifiedWidgetConfig {
  id: string;
  name: string;
  category: WidgetCategory;
  description?: string;
  lazyLoad: boolean;
  preloadPriority: number;
  loader?: () => Promise<{ default: React.ComponentType<any> }>;
  metadata: {
    dataSource?: string;
    refreshInterval?: number | false;
    supportsFilters?: boolean;
    chartType?: string;
    exportFormats?: string[];
    requiresAuth?: boolean;
    cacheEnabled?: boolean;
    realtimeUpdates?: boolean;
    supportDateRange?: boolean;
  };
}

/**
 * 統一的 Widget 配置中心
 */
export const UNIFIED_WIDGET_CONFIG: Record<string, UnifiedWidgetConfig> = {
  // Core Widgets
  HistoryTreeV2: {
    id: 'HistoryTreeV2',
    name: 'History Tree V2',
    category: 'core',
    description: 'Enhanced hierarchical display of system history',
    lazyLoad: true,
    preloadPriority: 10,
    loader: () =>
      import('@/app/(app)/admin/components/dashboard/widgets/HistoryTreeV2').then(module => ({
        default: module.HistoryTreeV2,
      })),
    metadata: {
      dataSource: 'record_history',
      refreshInterval: false, // 🛑 禁用自動刷新
      supportsFilters: true,
      supportDateRange: true,
      cacheEnabled: true,
    },
  },

  // Stats Widgets
  AwaitLocationQtyWidget: {
    id: 'AwaitLocationQtyWidget',
    name: 'Await Location Quantity',
    category: 'stats',
    description: 'Display quantity awaiting location assignment',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_palletinfo',
      refreshInterval: false, // 🛑 禁用自動刷新 // 🛑 緊急修復：從5秒改為60秒 (1分鐘)
      realtimeUpdates: true,
    },
  },

  YesterdayTransferCountWidget: {
    id: 'YesterdayTransferCountWidget',
    name: 'Yesterday Transfer Count',
    category: 'stats',
    description: 'Count of transfers from yesterday',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_transfer',
      refreshInterval: false, // 🛑 禁用自動刷新
      cacheEnabled: true,
    },
  },

  StillInAwaitWidget: {
    id: 'StillInAwaitWidget',
    name: 'Still In Await Widget',
    category: 'stats',
    description: 'Items still awaiting processing',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_palletinfo',
      refreshInterval: false, // 🛑 禁用自動刷新 // 🛑 修復：從10秒改為60秒
      realtimeUpdates: true,
    },
  },

  StillInAwaitPercentageWidget: {
    id: 'StillInAwaitPercentageWidget',
    name: 'Still In Await Percentage',
    category: 'stats',
    description: 'Percentage of items still awaiting',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_palletinfo',
      refreshInterval: false, // 🛑 禁用自動刷新
      realtimeUpdates: true,
    },
  },

  StatsCardWidget: {
    id: 'StatsCardWidget',
    name: 'Stats Card Widget',
    category: 'stats',
    description: 'General statistics card display',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      refreshInterval: false, // 🛑 禁用自動刷新
      cacheEnabled: true,
    },
  },

  // Chart Widgets
  StockDistributionChartV2: {
    id: 'StockDistributionChartV2',
    name: 'Stock Distribution Chart V2',
    category: 'charts',
    description: 'Enhanced stock distribution visualization',
    lazyLoad: true,
    preloadPriority: 8,
    loader: () =>
      import('@/app/(app)/admin/components/dashboard/widgets/StockDistributionChartV2').then(module => ({
        default: module.default || module.StockDistributionChartV2,
      })),
    metadata: {
      dataSource: 'record_inventory',
      chartType: 'pie',
      exportFormats: ['png', 'pdf'],
      refreshInterval: false, // 🛑 禁用自動刷新
      supportDateRange: true,
    },
  },

  StockLevelHistoryChart: {
    id: 'StockLevelHistoryChart',
    name: 'Stock Level History Chart',
    category: 'charts',
    description: 'Historical stock level trends',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_inventory',
      chartType: 'line',
      exportFormats: ['png', 'pdf'],
      refreshInterval: false, // 🛑 禁用自動刷新
      supportDateRange: true,
    },
  },

  WarehouseWorkLevelAreaChart: {
    id: 'WarehouseWorkLevelAreaChart',
    name: 'Warehouse Work Level Area Chart',
    category: 'charts',
    description: 'Area chart of warehouse work levels',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'work_level',
      chartType: 'area',
      exportFormats: ['png', 'pdf'],
      refreshInterval: false, // 🛑 禁用自動刷新
      supportDateRange: true,
    },
  },

  TransferTimeDistributionWidget: {
    id: 'TransferTimeDistributionWidget',
    name: 'Transfer Time Distribution',
    category: 'charts',
    description: 'Distribution of transfer times',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_transfer',
      chartType: 'histogram',
      exportFormats: ['png', 'pdf'],
      refreshInterval: false, // 🛑 禁用自動刷新
      supportDateRange: true,
    },
  },

  ProductDistributionChartWidget: {
    id: 'ProductDistributionChartWidget',
    name: 'Product Distribution Chart',
    category: 'charts',
    description: 'Distribution of products across categories',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'data_code',
      chartType: 'bar',
      exportFormats: ['png', 'pdf'],
      refreshInterval: false, // 🛑 禁用自動刷新
    },
  },

  TopProductsByQuantityWidget: {
    id: 'TopProductsByQuantityWidget',
    name: 'Top Products By Quantity',
    category: 'charts',
    description: 'Top products ranked by quantity',
    lazyLoad: true,
    preloadPriority: 7,
    loader: () =>
      import('@/app/(app)/admin/components/dashboard/widgets/TopProductsByQuantityWidget').then(module => ({
        default: module.default || module.TopProductsByQuantityWidget,
      })),
    metadata: {
      dataSource: 'record_inventory',
      chartType: 'bar',
      exportFormats: ['png', 'pdf'],
      refreshInterval: false, // 🛑 禁用自動刷新
      supportDateRange: true,
    },
  },

  TopProductsDistributionWidget: {
    id: 'TopProductsDistributionWidget',
    name: 'Top Products Distribution',
    category: 'charts',
    description: 'Distribution visualization of top products',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_inventory',
      chartType: 'doughnut',
      exportFormats: ['png', 'pdf'],
      refreshInterval: false, // 🛑 禁用自動刷新
      supportDateRange: true,
    },
  },

  // List Widgets
  OrdersListWidgetV2: {
    id: 'OrdersListWidgetV2',
    name: 'Orders List V2',
    category: 'lists',
    description: 'Enhanced orders listing',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'data_order',
      refreshInterval: false, // 🛑 禁用自動刷新
      supportsFilters: true,
      supportDateRange: true,
      exportFormats: ['csv', 'excel'],
    },
  },

  OtherFilesListWidgetV2: {
    id: 'OtherFilesListWidgetV2',
    name: 'Other Files List V2',
    category: 'lists',
    description: 'Enhanced other files listing',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      refreshInterval: false, // 🛑 禁用自動刷新
      supportsFilters: true,
      exportFormats: ['csv'],
    },
  },

  WarehouseTransferListWidget: {
    id: 'WarehouseTransferListWidget',
    name: 'Warehouse Transfer List',
    category: 'lists',
    description: 'List of warehouse transfers',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'record_transfer',
      refreshInterval: false, // 🛑 禁用自動刷新
      supportsFilters: true,
      supportDateRange: true,
      exportFormats: ['csv', 'excel'],
      realtimeUpdates: true,
    },
  },

  OrderStateListWidgetV2: {
    id: 'OrderStateListWidgetV2',
    name: 'Order State List V2',
    category: 'lists',
    description: 'Enhanced order state listing',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'data_order',
      refreshInterval: false, // 🛑 禁用自動刷新
      supportsFilters: true,
      supportDateRange: true,
      exportFormats: ['csv'],
    },
  },

  // Operations Widgets
  VoidPalletWidget: {
    id: 'VoidPalletWidget',
    name: 'Void Pallet Widget',
    category: 'operations',
    description: 'Widget for voiding pallets',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_palletinfo',
      requiresAuth: true,
      refreshInterval: false, // 🛑 禁用自動刷新
    },
  },

  ProductUpdateWidgetV2: {
    id: 'ProductUpdateWidgetV2',
    name: 'Product Update Widget V2',
    category: 'operations',
    description: 'Enhanced product updating interface',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'data_code',
      requiresAuth: true,
      refreshInterval: false, // 🛑 禁用自動刷新
    },
  },

  SupplierUpdateWidgetV2: {
    id: 'SupplierUpdateWidgetV2',
    name: 'Supplier Update Widget V2',
    category: 'operations',
    description: 'Enhanced supplier updating interface',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'data_supplier',
      requiresAuth: true,
      refreshInterval: false, // 🛑 禁用自動刷新
    },
  },

  ReprintLabelWidget: {
    id: 'ReprintLabelWidget',
    name: 'Reprint Label Widget',
    category: 'operations',
    description: 'Widget for reprinting labels',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      requiresAuth: true,
    },
  },

  // Upload Widgets
  UploadOrdersWidgetV2: {
    id: 'UploadOrdersWidgetV2',
    name: 'Upload Orders Widget V2',
    category: 'operations',
    description: 'Enhanced orders upload interface',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      requiresAuth: true,
    },
  },

  UploadFilesWidget: {
    id: 'UploadFilesWidget',
    name: 'Upload Files Widget',
    category: 'operations',
    description: 'General file upload interface',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      requiresAuth: true,
    },
  },

  // Analysis Widgets
  AnalysisExpandableCards: {
    id: 'AnalysisExpandableCards',
    name: 'Analysis Expandable Cards',
    category: 'analysis',
    description: 'Expandable cards for analysis data',
    lazyLoad: true,
    preloadPriority: 6,
    loader: () =>
      import('@/app/(app)/admin/components/dashboard/widgets/AnalysisExpandableCards').then(module => ({
        default: module.default || module.AnalysisExpandableCards,
      })),
    metadata: {
      refreshInterval: false, // 🛑 禁用自動刷新
      supportDateRange: true,
      exportFormats: ['pdf'],
    },
  },

  InventoryOrderedAnalysisWidget: {
    id: 'InventoryOrderedAnalysisWidget',
    name: 'Inventory Ordered Analysis',
    category: 'analysis',
    description: 'Analysis of ordered inventory',
    lazyLoad: true,
    preloadPriority: 7,
    loader: () =>
      import('@/app/(app)/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget').then(module => ({
        default: module.default || module.InventoryOrderedAnalysisWidget,
      })),
    metadata: {
      dataSource: 'record_inventory',
      refreshInterval: false, // 🛑 禁用自動刷新
      supportDateRange: true,
      exportFormats: ['csv', 'excel', 'pdf'],
    },
  },

  // Reports Widgets
  ReportGeneratorWithDialogWidgetV2: {
    id: 'ReportGeneratorWithDialogWidgetV2',
    name: 'Report Generator With Dialog V2',
    category: 'reports',
    description: 'Enhanced report generator with dialog',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      requiresAuth: true,
      exportFormats: ['pdf', 'excel', 'csv'],
    },
  },

  TransactionReportWidget: {
    id: 'TransactionReportWidget',
    name: 'Transaction Report Widget',
    category: 'reports',
    description: 'Generate transaction reports',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      dataSource: 'record_history',
      requiresAuth: true,
      supportDateRange: true,
      exportFormats: ['pdf', 'excel'],
    },
  },
};

/**
 * 路由預加載映射
 */
export const ROUTE_PRELOAD_MAP: Record<string, string[]> = {
  '/admin/warehouse': [
    'AwaitLocationQtyWidget',
    'WarehouseTransferListWidget',
    'StockDistributionChartV2',
    'StillInAwaitWidget',
  ],
  '/admin/injection': ['HistoryTreeV2', 'StatsCardWidget', 'ProductDistributionChartWidget'],
  '/admin/pipeline': [
    'WarehouseWorkLevelAreaChart',
    'OrdersListWidgetV2',
    'OrderStateListWidgetV2',
  ],
  '/admin/upload': [
    'UploadOrdersWidgetV2',
    'UploadFilesWidget',
    'OrdersListWidgetV2',
    'OtherFilesListWidgetV2',
  ],
  '/admin/update': ['ProductUpdateWidgetV2', 'SupplierUpdateWidgetV2', 'VoidPalletWidget'],
  '/admin/stock-management': [
    'StockDistributionChartV2',
    'StockLevelHistoryChart',
    'InventoryOrderedAnalysisWidget',
  ],
  '/admin/system': [
    'ReportGeneratorWithDialogWidgetV2',
    'ReprintLabelWidget',
    'TransactionReportWidget',
  ],
  '/admin/analysis': ['HistoryTreeV2', 'AnalysisExpandableCards'],
};

/**
 * 工具函數
 */

// 獲取 Widget 分類
export function getWidgetCategory(widgetId: string): WidgetCategory {
  const config = UNIFIED_WIDGET_CONFIG[widgetId];
  return config?.category || 'special';
}

// 獲取預加載優先級
export function getPreloadPriority(widgetId: string): number {
  const config = UNIFIED_WIDGET_CONFIG[widgetId];
  return config?.preloadPriority || 1;
}

// 獲取路由的預加載 widgets
export function getRoutePreloadWidgets(route: string): string[] {
  return ROUTE_PRELOAD_MAP[route] || [];
}

// 按分類獲取 widgets
export function getWidgetsByCategory(category: WidgetCategory): UnifiedWidgetConfig[] {
  return Object.values(UNIFIED_WIDGET_CONFIG).filter(config => config.category === category);
}

// 按優先級獲取 widgets
export function getWidgetsByPriority(minPriority: number): UnifiedWidgetConfig[] {
  return Object.values(UNIFIED_WIDGET_CONFIG).filter(
    config => config.preloadPriority >= minPriority
  );
}

// 轉換為 WidgetDefinition 格式（向後兼容）
export function toWidgetDefinition(config: UnifiedWidgetConfig): Partial<WidgetDefinition> {
  return {
    id: config.id,
    name: config.name,
    category: config.category,
    description: config.description,
    lazyLoad: config.lazyLoad,
    preloadPriority: config.preloadPriority,
    // dataSource: config.metadata.dataSource, // Removed for compatibility
    // refreshInterval: config.metadata.refreshInterval, // Removed for compatibility
    // supportsFilters: config.metadata.supportsFilters, // Removed for compatibility
    // exportFormats: config.metadata.exportFormats, // Removed for compatibility
    // requiresAuth: config.metadata.requiresAuth // Removed for compatibility
  };
}
