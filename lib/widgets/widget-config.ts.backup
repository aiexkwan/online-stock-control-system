/**
 * Unified Widget Configuration
 * 統一的 Widget 配置文件 - 取代所有 8 個 adapter 文件
 * 
 * This file combines all widget configurations from the 8 adapter files:
 * - operations-widget-adapter.ts
 * - lists-widget-adapter.ts
 * - charts-widget-adapter.ts
 * - analysis-widget-adapter.ts
 * - admin-renderer-adapter.ts
 * - reports-widget-adapter.ts
 * - special-widget-adapter.ts
 * - stats-widget-adapter.ts
 */

import { WidgetDefinition } from './types';

/**
 * 統一的 Widget 配置接口
 */
export interface UnifiedWidgetConfig {
  id: string;
  name: string;
  category: 'operations' | 'lists' | 'charts' | 'analysis' | 'reports' | 'special' | 'stats' | 'core';
  description?: string;
  lazyLoad: boolean;
  preloadPriority: number;
  metadata: {
    dataSource?: string;
    refreshInterval?: number;
    supportsFilters?: boolean;
    supportsPagination?: boolean;
    chartType?: string;
    exportFormats?: string[];
    requiresAuth?: boolean;
    requiresConfirmation?: boolean;
    supportsGraphQL?: boolean;
    supportsFallback?: boolean;
    supportBulkUpdate?: boolean;
    validationRequired?: boolean;
    auditLog?: boolean;
    cacheEnabled?: boolean;
    realtimeUpdates?: boolean;
    supportDateRange?: boolean;
    supportExport?: boolean;
    supportPriorityQueue?: boolean;
    supportImport?: boolean;
    requiresAdminAuth?: boolean;
    timeFrameSupport?: boolean;
    complexQuery?: boolean;
    [key: string]: any;
  };
}

/**
 * 統一的 Widget 配置對象
 */
export const UNIFIED_WIDGET_CONFIG: Record<string, UnifiedWidgetConfig> = {
  // === OPERATIONS WIDGETS ===
  VoidPalletWidget: {
    id: 'VoidPalletWidget',
    name: 'Void Pallet',
    category: 'operations',
    description: 'Void pallet operations',
    lazyLoad: true,
    preloadPriority: 9,
    metadata: {
      dataSource: 'record_palletinfo',
      requiresAuth: true,
      auditLog: true,
      requiresConfirmation: true,
    },
  },

  ProductUpdateWidgetV2: {
    id: 'ProductUpdateWidgetV2',
    name: 'Product Update V2',
    category: 'operations',
    description: 'Update product information with REST API + fallback',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      dataSource: 'data_code',
      supportsGraphQL: false,
      supportsFallback: true,
      supportBulkUpdate: true,
      validationRequired: true,
    },
  },

  SupplierUpdateWidgetV2: {
    id: 'SupplierUpdateWidgetV2',
    name: 'Supplier Update V2',
    category: 'operations',
    description: 'Manage supplier information',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'data_supplier',
      supportImport: true,
      validationRequired: true,
      supportsGraphQL: false,
    },
  },

  ReprintLabelWidget: {
    id: 'ReprintLabelWidget',
    name: 'Reprint Label',
    category: 'operations',
    description: 'Reprint pallet labels',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_palletinfo',
      requiresAuth: true,
      auditLog: true,
    },
  },

  StockTypeSelector: {
    id: 'StockTypeSelector',
    name: 'Stock Type Selector',
    category: 'operations',
    description: 'Select and manage stock types',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'stock_types',
      cacheEnabled: true,
      supportsFilters: true,
      supportsGraphQL: false,
    },
  },

  // === UNIFIED LIST WIDGETS (V1.2) ===
  // 使用 UniversalListWidget 統一實現，替代原有的5個 list widgets
  OrdersListWidgetV2: {
    id: 'OrdersListWidgetV2',
    name: 'Orders List V2',
    category: 'lists',
    description: 'Display orders with REST API optimization using UniversalListWidget',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      // UniversalListWidget 配置
      universalWidget: true,
      configType: 'OrdersListConfig',
      dataSource: 'record_aco',
      supportsPagination: true,
      supportsFilters: true,
      supportsGraphQL: false,
      refreshInterval: 30000,
      // 向後兼容的元數據
      specialFeatures: ['pdf_opening', 'infinite_scroll'],
      displayType: 'table',
    },
  },

  OtherFilesListWidgetV2: {
    id: 'OtherFilesListWidgetV2',
    name: 'Other Files List V2',
    category: 'lists',
    description: 'Display other files with REST API optimization using UniversalListWidget',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      // UniversalListWidget 配置
      universalWidget: true,
      configType: 'OtherFilesListConfig',
      dataSource: 'record_files',
      supportsPagination: true,
      supportsFilters: true,
      supportsGraphQL: false,
      refreshInterval: 60000,
      // 向後兼容的元數據
      specialFeatures: ['file_type_detection', 'size_display'],
      displayType: 'table',
    },
  },

  WarehouseTransferListWidget: {
    id: 'WarehouseTransferListWidget',
    name: 'Warehouse Transfer List',
    category: 'lists',
    description: 'Display warehouse transfers using UniversalListWidget',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      // UniversalListWidget 配置
      universalWidget: true,
      configType: 'WarehouseTransferListConfig',
      dataSource: 'record_transfer',
      supportsPagination: true,
      supportsFilters: true,
      refreshInterval: 30000,
      realtimeUpdates: true,
      // 向後兼容的元數據
      supportsGraphQL: false,
      specialFeatures: ['location_mapping', 'status_tracking'],
      displayType: 'table',
    },
  },

  OrderStateListWidgetV2: {
    id: 'OrderStateListWidgetV2',
    name: 'Order State List V2',
    category: 'lists',
    description: 'Display order states with REST API optimization using UniversalListWidget',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      // UniversalListWidget 配置
      universalWidget: true,
      configType: 'OrderStateListConfig',
      dataSource: 'record_aco',
      supportsPagination: true,
      supportsFilters: true,
      supportsGraphQL: false,
      refreshInterval: 30000,
      // 向後兼容的元數據
      specialFeatures: ['progress_calculation', 'status_visualization'],
      displayType: 'table',
    },
  },

  ProductionDetailsWidget: {
    id: 'ProductionDetailsWidget',
    name: 'Production Details',
    category: 'lists',
    description: 'Display production details using UniversalListWidget',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      // UniversalListWidget 配置
      universalWidget: true,
      configType: 'ProductionDetailsConfig',
      dataSource: 'production_details',
      supportsPagination: true,
      supportsFilters: true,
      supportsGraphQL: false,
      refreshInterval: 15000,
      // 向後兼容的元數據
      specialFeatures: ['department_filtering', 'real_time_updates'],
      displayType: 'table',
    },
  },

  // === CHARTS WIDGETS ===
  StockDistributionChart: {
    id: 'StockDistributionChart',
    name: 'Stock Distribution Chart',
    category: 'charts',
    description: 'Display stock distribution chart',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'stock_level',
      chartType: 'pie',
      supportsGraphQL: false,
      refreshInterval: 60000,
    },
  },

  StockLevelHistoryChart: {
    id: 'StockLevelHistoryChart',
    name: 'Stock Level History Chart',
    category: 'charts',
    description: 'Display stock level history',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'stock_level',
      chartType: 'line',
      supportDateRange: true,
      refreshInterval: 300000,
    },
  },

  WarehouseWorkLevelAreaChart: {
    id: 'WarehouseWorkLevelAreaChart',
    name: 'Warehouse Work Level Area Chart',
    category: 'charts',
    description: 'Display warehouse work level',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'work_level',
      chartType: 'area',
      refreshInterval: 60000,
    },
  },

  TransferTimeDistributionWidget: {
    id: 'TransferTimeDistributionWidget',
    name: 'Transfer Time Distribution',
    category: 'charts',
    description: 'Display transfer time distribution',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_transfer',
      chartType: 'line',
      supportDateRange: true,
      refreshInterval: 300000,
    },
  },

  TopProductsInventoryChart: {
    id: 'TopProductsInventoryChart',
    name: 'Top Products Inventory Chart',
    category: 'charts',
    description: 'Display top products inventory',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_palletinfo',
      chartType: 'bar',
      refreshInterval: 60000,
      supportsGraphQL: false,
    },
  },

  UserActivityHeatmap: {
    id: 'UserActivityHeatmap',
    name: 'User Activity Heatmap',
    category: 'charts',
    description: 'Display user activity heatmap',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      dataSource: 'user_activity',
      chartType: 'heatmap',
      refreshInterval: 300000,
      supportsGraphQL: false,
    },
  },

  InventoryTurnoverAnalysis: {
    id: 'InventoryTurnoverAnalysis',
    name: 'Inventory Turnover Analysis',
    category: 'charts',
    description: 'Display inventory turnover analysis',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_inventory',
      chartType: 'line',
      supportDateRange: true,
      refreshInterval: 300000,
      supportsGraphQL: false,
    },
  },

  TopProductsByQuantityWidget: {
    id: 'TopProductsByQuantityWidget',
    name: 'Top Products by Quantity',
    category: 'charts',
    description: 'Display top products by quantity',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_palletinfo',
      chartType: 'bar',
      refreshInterval: 60000,
      supportsGraphQL: false,
    },
  },

  TopProductsDistributionWidget: {
    id: 'TopProductsDistributionWidget',
    name: 'Top Products Distribution',
    category: 'charts',
    description: 'Display top products distribution',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_palletinfo',
      chartType: 'donut',
      refreshInterval: 60000,
      supportsGraphQL: false,
    },
  },

  // === ANALYSIS WIDGETS ===
  AnalysisExpandableCards: {
    id: 'AnalysisExpandableCards',
    name: 'Analysis Expandable Cards',
    category: 'analysis',
    description: 'Container for analysis charts',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'multiple',
      realtimeUpdates: true,
      supportExport: true,
      complexQuery: true,
    },
  },

  AcoOrderProgressCards: {
    id: 'AcoOrderProgressCards',
    name: 'ACO Order Progress Cards',
    category: 'analysis',
    description: 'Display ACO order progress',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'record_aco',
      refreshInterval: 30000,
      realtimeUpdates: true,
      supportsGraphQL: false,
    },
  },

  InventoryOrderedAnalysisWidget: {
    id: 'InventoryOrderedAnalysisWidget',
    name: 'Inventory Ordered Analysis',
    category: 'analysis',
    description: 'Analyze inventory ordered data',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_inventory',
      supportExport: true,
      complexQuery: true,
      refreshInterval: 300000,
    },
  },

  // === REPORTS WIDGETS ===
  TransactionReportWidget: {
    id: 'TransactionReportWidget',
    name: 'Transaction Report',
    category: 'reports',
    description: 'Generate transaction reports',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_transfer',
      exportFormats: ['pdf', 'excel', 'csv'],
      supportDateRange: true,
      supportExport: true,
    },
  },

  GrnReportWidget: {
    id: 'GrnReportWidget',
    name: 'GRN Report',
    category: 'reports',
    description: 'Generate GRN reports',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_grn',
      exportFormats: ['pdf', 'excel'],
      supportDateRange: true,
      supportExport: true,
      supportsGraphQL: false,
    },
  },

  AcoOrderReportWidget: {
    id: 'AcoOrderReportWidget',
    name: 'ACO Order Report',
    category: 'reports',
    description: 'Generate ACO order reports',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      dataSource: 'record_aco',
      exportFormats: ['pdf', 'excel'],
      supportDateRange: true,
      supportExport: true,
      supportsGraphQL: false,
    },
  },

  ReportGeneratorWithDialogWidgetV2: {
    id: 'ReportGeneratorWithDialogWidgetV2',
    name: 'Report Generator with Dialog V2',
    category: 'reports',
    description: 'Generate reports with dialog',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      dataSource: 'multiple',
      exportFormats: ['pdf', 'excel', 'csv'],
      supportDateRange: true,
      supportExport: true,
      supportsGraphQL: false,
    },
  },

  // === SPECIAL WIDGETS ===
  OrderAnalysisResultDialog: {
    id: 'OrderAnalysisResultDialog',
    name: 'Order Analysis Result Dialog',
    category: 'special',
    description: 'Display order analysis results',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      dataSource: 'record_aco',
      requiresAdminAuth: true,
      complexQuery: true,
    },
  },

  Folder3D: {
    id: 'Folder3D',
    name: 'Folder 3D',
    category: 'special',
    description: '3D folder visualization',
    lazyLoad: true,
    preloadPriority: 3,
    metadata: {
      dataSource: 'folder_structure',
      requiresAdminAuth: true,
    },
  },

  PerformanceTestWidget: {
    id: 'PerformanceTestWidget',
    name: 'Performance Test Widget',
    category: 'special',
    description: 'Performance testing and analysis',
    lazyLoad: true,
    preloadPriority: 1,
    metadata: {
      dataSource: 'performance_metrics',
      requiresAdminAuth: true,
    },
  },

  // === UNIFIED STATS WIDGETS (V1.2) ===
  // 使用 UniversalStatsWidget 統一實現，替代原有的6個 stats widgets
  AwaitLocationQtyWidget: {
    id: 'AwaitLocationQtyWidget',
    name: 'Await Location Quantity',
    category: 'stats',
    description: 'Display await location quantity using UniversalStatsWidget',
    lazyLoad: true,
    preloadPriority: 9,
    metadata: {
      // UniversalStatsWidget 配置
      universalWidget: true,
      configType: 'AwaitLocationQtyConfig',
      dataSource: 'record_inventory',
      refreshInterval: 60000,
      timeFrameSupport: true,
      // 向後兼容的元數據
      supportsGraphQL: false,
      supportsFallback: true,
      displayType: 'metric',
    },
  },

  YesterdayTransferCountWidget: {
    id: 'YesterdayTransferCountWidget',
    name: 'Yesterday Transfer Count',
    category: 'stats',
    description: 'Display yesterday transfer count with trend using UniversalStatsWidget',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      // UniversalStatsWidget 配置
      universalWidget: true,
      configType: 'YesterdayTransferCountConfig',
      dataSource: 'record_transfer',
      refreshInterval: 300000,
      timeFrameSupport: true,
      // 向後兼容的元數據
      supportsGraphQL: false,
      supportsFallback: true,
      displayType: 'trend',
    },
  },

  StillInAwaitWidget: {
    id: 'StillInAwaitWidget',
    name: 'Still In Await',
    category: 'stats',
    description: 'Display still in await quantity using UniversalStatsWidget',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      // UniversalStatsWidget 配置
      universalWidget: true,
      configType: 'StillInAwaitConfig',
      dataSource: 'record_palletinfo',
      refreshInterval: 60000,
      timeFrameSupport: true,
      // 向後兼容的元數據
      supportsGraphQL: false,
      supportsFallback: true,
      displayType: 'metric',
    },
  },

  StillInAwaitPercentageWidget: {
    id: 'StillInAwaitPercentageWidget',
    name: 'Still In Await Percentage',
    category: 'stats',
    description: 'Display still in await percentage with progress using UniversalStatsWidget',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      // UniversalStatsWidget 配置
      universalWidget: true,
      configType: 'StillInAwaitPercentageConfig',
      dataSource: 'record_palletinfo',
      refreshInterval: 60000,
      timeFrameSupport: true,
      // 向後兼容的元數據
      supportsGraphQL: false,
      supportsFallback: true,
      displayType: 'progress',
    },
  },

  StatsCardWidget: {
    id: 'StatsCardWidget',
    name: 'Stats Card Widget',
    category: 'stats',
    description: 'Generic stats card using UniversalStatsWidget',
    lazyLoad: true,
    preloadPriority: 9,
    metadata: {
      // UniversalStatsWidget 配置
      universalWidget: true,
      configType: 'StatsCardConfig',
      dataSource: 'multiple',
      timeFrameSupport: true,
      cacheEnabled: true,
      // 向後兼容的元數據
      supportsGraphQL: false,
      supportsFallback: true,
      displayType: 'metric',
    },
  },

  InjectionProductionStatsWidget: {
    id: 'InjectionProductionStatsWidget',
    name: 'Injection Production Stats',
    category: 'stats',
    description: 'Display injection production statistics using UniversalStatsWidget',
    lazyLoad: true,
    preloadPriority: 9,
    metadata: {
      // UniversalStatsWidget 配置
      universalWidget: true,
      configType: 'InjectionProductionStatsConfig',
      dataSource: 'record_palletinfo',
      refreshInterval: 30000,
      supportsGraphQL: false,
      timeFrameSupport: true,
      // 向後兼容的元數據
      supportsFallback: true,
      displayType: 'trend',
    },
  },

  AvailableSoonWidget: {
    id: 'AvailableSoonWidget',
    name: 'Available Soon',
    category: 'stats',
    description: 'Display available soon placeholder',
    lazyLoad: true,
    preloadPriority: 3,
    metadata: {
      dataSource: 'none',
      // 這個 widget 暫時保持原樣，因為它只是一個佔位符
    },
  },

  // === UNIFIED UPLOAD WIDGETS (V1.3) ===
  // 使用 UniversalUploadWidget 統一實現，替代原有的4個 upload widgets
  UploadFilesWidget: {
    id: 'UploadFilesWidget',
    name: 'Upload Files',
    category: 'operations',
    description: 'File upload widget using UniversalUploadWidget',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      // UniversalUploadWidget 配置
      universalWidget: true,
      configType: 'UploadFilesConfig',
      dataSource: 'file_uploads',
      supportImport: true,
      validationRequired: true,
      // 向後兼容的元數據
      auditLog: true,
      requiresAuth: true,
    },
  },

  UploadPhotoWidget: {
    id: 'UploadPhotoWidget',
    name: 'Upload Photo',
    category: 'operations',
    description: 'Photo upload widget using UniversalUploadWidget',
    lazyLoad: true,
    preloadPriority: 5,
    metadata: {
      // UniversalUploadWidget 配置
      universalWidget: true,
      configType: 'UploadPhotoConfig',
      dataSource: 'photo_uploads',
      supportImport: true,
      validationRequired: true,
      // 向後兼容的元數據
      auditLog: true,
      requiresAuth: true,
    },
  },

  UploadProductSpecWidget: {
    id: 'UploadProductSpecWidget',
    name: 'Upload Product Spec',
    category: 'operations',
    description: 'Product specification upload widget using UniversalUploadWidget',
    lazyLoad: true,
    preloadPriority: 6,
    metadata: {
      // UniversalUploadWidget 配置
      universalWidget: true,
      configType: 'UploadProductSpecConfig',
      dataSource: 'product_specs',
      supportImport: true,
      validationRequired: true,
      // 向後兼容的元數據
      auditLog: true,
      requiresAuth: true,
    },
  },

  UploadOrdersWidgetV2: {
    id: 'UploadOrdersWidgetV2',
    name: 'Upload Orders V2',
    category: 'operations',
    description: 'Order upload widget using UniversalUploadWidget',
    lazyLoad: true,
    preloadPriority: 8,
    metadata: {
      // UniversalUploadWidget 配置
      universalWidget: true,
      configType: 'UploadOrdersConfig',
      dataSource: 'record_aco',
      supportImport: true,
      validationRequired: true,
      // 向後兼容的元數據
      supportsGraphQL: false,
      supportsFallback: true,
      auditLog: true,
      requiresAuth: true,
    },
  },

  // === HISTORY WIDGETS ===
  HistoryTree: {
    id: 'HistoryTree',
    name: 'History Tree',
    category: 'core',
    description: 'Display history tree',
    lazyLoad: true,
    preloadPriority: 10,
    metadata: {
      dataSource: 'record_history',
      refreshInterval: 30000,
      realtimeUpdates: true,
    },
  },

  HistoryTreeV2: {
    id: 'HistoryTreeV2',
    name: 'History Tree V2',
    category: 'core',
    description: 'Display history tree V2',
    lazyLoad: true,
    preloadPriority: 10,
    metadata: {
      dataSource: 'record_history',
      refreshInterval: 30000,
      realtimeUpdates: true,
      supportsGraphQL: false,
    },
  },

  // === PRODUCTION WIDGETS ===
  // InjectionProductionStatsWidget moved to UNIFIED STATS WIDGETS section above

  StaffWorkloadWidget: {
    id: 'StaffWorkloadWidget',
    name: 'Staff Workload',
    category: 'charts',
    description: 'Display staff workload chart',
    lazyLoad: true,
    preloadPriority: 7,
    metadata: {
      dataSource: 'work_level',
      chartType: 'line',
      supportsGraphQL: false,
      refreshInterval: 60000,
    },
  },
};

/**
 * 輔助函數：按分類獲取 widgets
 */
export function getWidgetsByCategory(category: string): UnifiedWidgetConfig[] {
  return Object.values(UNIFIED_WIDGET_CONFIG).filter(widget => widget.category === category);
}

/**
 * 輔助函數：按優先級獲取 widgets
 */
export function getWidgetsByPriority(minPriority: number): UnifiedWidgetConfig[] {
  return Object.values(UNIFIED_WIDGET_CONFIG).filter(widget => widget.preloadPriority >= minPriority);
}

/**
 * 輔助函數：獲取支援舊架構的 widgets (已棄用)
 */
export function getGraphQLWidgets(): UnifiedWidgetConfig[] {
  return Object.values(UNIFIED_WIDGET_CONFIG).filter(widget => widget.metadata.supportsGraphQL);
}

/**
 * 輔助函數：按數據源獲取 widgets
 */
export function getWidgetsByDataSource(dataSource: string): UnifiedWidgetConfig[] {
  return Object.values(UNIFIED_WIDGET_CONFIG).filter(widget => widget.metadata.dataSource === dataSource);
}

/**
 * 輔助函數：轉換為 WidgetDefinition 格式
 */
export function toWidgetDefinition(config: UnifiedWidgetConfig): Partial<WidgetDefinition> {
  return {
    id: config.id,
    name: config.name,
    category: config.category as any,
    description: config.description,
    lazyLoad: config.lazyLoad,
    preloadPriority: config.preloadPriority,
    metadata: config.metadata,
    component: undefined, // 組件將由動態導入提供
  };
}

/**
 * 統計信息
 */
export const CATEGORY_STATS = {
  operations: getWidgetsByCategory('operations').length,
  lists: getWidgetsByCategory('lists').length,
  charts: getWidgetsByCategory('charts').length,
  analysis: getWidgetsByCategory('analysis').length,
  reports: getWidgetsByCategory('reports').length,
  special: getWidgetsByCategory('special').length,
  stats: getWidgetsByCategory('stats').length,
  core: getWidgetsByCategory('core').length,
  total: Object.keys(UNIFIED_WIDGET_CONFIG).length,
};

export const PRIORITY_STATS = {
  critical: getWidgetsByPriority(9).length,
  high: getWidgetsByPriority(7).length,
  medium: getWidgetsByPriority(5).length,
  low: getWidgetsByPriority(1).length,
};

export const LEGACY_STATS = {
  supported: getGraphQLWidgets().length,
  total: Object.keys(UNIFIED_WIDGET_CONFIG).length,
  percentage: Math.round((getGraphQLWidgets().length / Object.keys(UNIFIED_WIDGET_CONFIG).length) * 100),
};

// Legacy alias for backward compatibility
export const GRAPHQL_STATS = LEGACY_STATS;