/**
 * Widget 映射配置
 * 用於第一階段的定義映射 - 保持現有系統運作
 */

import { WidgetCategory, WidgetMapping } from './types';

// Widget 分類映射
const categoryMap: WidgetMapping['categoryMap'] = {
  // Core widgets
  HistoryTree: 'core',
  HistoryTreeV2: 'core',
  AvailableSoonWidget: 'core',

  // Stats widgets
  AwaitLocationQtyWidget: 'stats',
  YesterdayTransferCountWidget: 'stats',
  StillInAwaitWidget: 'stats',
  StillInAwaitPercentageWidget: 'stats',
  StatsCardWidget: 'stats',

  // Charts widgets
  StockDistributionChart: 'charts',
  StockLevelHistoryChart: 'charts',
  WarehouseWorkLevelAreaChart: 'charts',
  TransferTimeDistributionWidget: 'charts',
  ProductDistributionChartWidget: 'charts',
  TopProductsByQuantityWidget: 'charts',
  TopProductsDistributionWidget: 'charts',

  // Lists widgets
  OrdersListWidgetV2: 'lists',
  OtherFilesListWidgetV2: 'lists',
  WarehouseTransferListWidget: 'lists',
  OrderStateListWidgetV2: 'lists',

  // Operations widgets
  VoidPalletWidget: 'operations',
  ProductUpdateWidgetV2: 'operations',
  SupplierUpdateWidgetV2: 'operations',
  ReprintLabelWidget: 'operations',

  // Uploads widgets
  UploadOrdersWidgetV2: 'uploads',
  UploadFilesWidget: 'uploads',
  UploadPhotoWidget: 'uploads',
  UploadProductSpecWidget: 'uploads',
  GoogleDriveUploadToast: 'uploads',

  // Reports widgets
  TransactionReportWidget: 'reports',
  GrnReportWidget: 'reports',
  AcoOrderReportWidget: 'reports',
  ReportGeneratorWithDialogWidgetV2: 'reports',

  // Analysis widgets
  AnalysisExpandableCards: 'analysis',
  AcoOrderProgressWidget: 'analysis',
  AnalysisPagedWidgetV2: 'analysis',
  InventoryOrderedAnalysisWidget: 'analysis',

  // Production widgets (Server Actions versions)
  ProductionDetailsWidget: 'lists',
  ProductionStatsWidget: 'stats',
  InjectionProductionStatsWidget: 'stats',
  StaffWorkloadWidget: 'charts',
  OrderAnalysisResultDialog: 'special',
  StockTypeSelector: 'special',
  Folder3D: 'special',
};

// GraphQL 版本映射
const graphqlVersionMap: WidgetMapping['graphqlVersionMap'] = {
  // 所有 GraphQL widgets 已遷移至 V2 版本
  // 保留映射以支持向後兼容
  OrdersListWidget: 'OrdersListWidgetV2',
  OtherFilesListWidget: 'OtherFilesListWidgetV2',
  OrderStateListWidget: 'OrderStateListWidgetV2',
  SupplierUpdateWidget: 'SupplierUpdateWidgetV2',
  GrnReportWidget: 'GrnReportWidget',
  AcoOrderReportWidget: 'AcoOrderReportWidget',
  ReportGeneratorWithDialogWidget: 'ReportGeneratorWithDialogWidgetV2',
  StockDistributionChart: 'StockDistributionChart',
};

// 預加載優先級映射（基於使用頻率和重要性）
const preloadPriorityMap: WidgetMapping['preloadPriorityMap'] = {
  // 核心必須組件 - 最高優先級
  HistoryTree: 10,
  HistoryTreeV2: 10,
  StatsCardWidget: 9,
  InjectionProductionStatsWidget: 9, // 高優先級 - GraphQL 優化版本

  // 常用統計組件 - 高優先級
  StillInAwaitWidget: 8,
  AwaitLocationQtyWidget: 8,
  YesterdayTransferCountWidget: 8,
  WarehouseTransferListWidget: 8,

  // 重要圖表 - 中高優先級
  StockDistributionChart: 7,
  WarehouseWorkLevelAreaChart: 7,
  ProductDistributionChartWidget: 7,
  TopProductsByQuantityWidget: 7,
  TopProductsDistributionWidget: 7,

  // 操作類組件 - 中優先級
  ProductUpdateWidgetV2: 6,
  SupplierUpdateWidgetV2: 6,
  VoidPalletWidget: 6,

  // 上傳類組件 - 中低優先級
  UploadOrdersWidgetV2: 5,
  UploadFilesWidget: 5,
  UploadPhotoWidget: 4,

  // 報表類組件 - 低優先級（按需加載）
  TransactionReportWidget: 3,
  GrnReportWidget: 3,
  AcoOrderReportWidget: 3,
  ReportGeneratorWithDialogWidgetV2: 3,

  // 分析類組件 - 低優先級（通常在特定頁面才需要）
  AnalysisExpandableCards: 2,
  AnalysisPagedWidgetV2: 2,
  InventoryOrderedAnalysisWidget: 2,
};

// 路由預加載配置
export const routePreloadMap: Record<string, string[]> = {
  '/admin/injection': [
    'HistoryTree',
    'InjectionProductionStatsWidget', // GraphQL 優化版本
    'StatsCardWidget',
    'ProductionDetailsWidget',
    'TopProductsByQuantityWidget',
    'TopProductsDistributionWidget',
  ],
  '/admin/pipeline': [
    'HistoryTree',
    'StatsCardWidget',
    'ProductionDetailsWidget',
  ],
  '/admin/warehouse': [
    'AwaitLocationQtyWidget',
    'WarehouseTransferListWidget',
    'YesterdayTransferCountWidget',
    'WarehouseWorkLevelAreaChart',
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
  '/admin/system': ['ReportGeneratorWithDialogWidgetV2', 'ReprintLabelWidget', 'TransactionReportWidget'],
  '/admin/analysis': ['HistoryTree', 'AnalysisExpandableCards'],
};

// 導出統一的映射配置
export const widgetMapping: WidgetMapping = {
  categoryMap,
  graphqlVersionMap,
  preloadPriorityMap,
};

// 輔助函數：獲取 widget 分類
export function getWidgetCategory(widgetId: string): WidgetCategory {
  return categoryMap[widgetId] || 'special';
}

// 輔助函數：獲取 GraphQL 版本
export function getGraphQLVersion(widgetId: string): string | undefined {
  return graphqlVersionMap[widgetId];
}

// 輔助函數：獲取預加載優先級
export function getPreloadPriority(widgetId: string): number {
  return preloadPriorityMap[widgetId] || 1;
}

// 輔助函數：獲取路由的預加載 widgets
export function getRoutePreloadWidgets(route: string): string[] {
  return routePreloadMap[route] || [];
}
