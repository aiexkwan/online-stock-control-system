/**
 * Widget 映射配置
 * 用於第一階段的定義映射 - 保持現有系統運作
 */

import { WidgetCategory, WidgetMapping } from './types';

// Widget 分類映射
const categoryMap: WidgetMapping['categoryMap'] = {
  // Core widgets
  HistoryTree: 'core',
  AvailableSoonWidget: 'core',
  EmptyPlaceholderWidget: 'core',

  // Stats widgets
  AwaitLocationQtyWidget: 'stats',
  YesterdayTransferCountWidget: 'stats',
  StillInAwaitWidget: 'stats',
  StillInAwaitPercentageWidget: 'stats',
  StatsCardWidget: 'stats',

  // Charts widgets
  ProductMixChartWidget: 'charts',
  StockDistributionChart: 'charts',
  StockLevelHistoryChart: 'charts',
  WarehouseWorkLevelAreaChart: 'charts',
  TransferTimeDistributionWidget: 'charts',
  ProductDistributionChartGraphQL: 'charts',
  TopProductsChartGraphQL: 'charts',

  // Lists widgets
  OrdersListWidgetV2: 'lists',
  OtherFilesListWidget: 'lists',
  WarehouseTransferListWidget: 'lists',
  OrderStateListWidget: 'lists',

  // Operations widgets
  VoidPalletWidget: 'operations',
  ProductUpdateWidget: 'operations',
  SupplierUpdateWidget: 'operations',
  ReprintLabelWidget: 'operations',

  // Uploads widgets
  UploadOrdersWidget: 'uploads',
  UploadFilesWidget: 'uploads',
  UploadPhotoWidget: 'uploads',
  UploadProductSpecWidget: 'uploads',
  GoogleDriveUploadToast: 'uploads',

  // Reports widgets
  TransactionReportWidget: 'reports',
  GrnReportWidget: 'reports',
  AcoOrderReportWidget: 'reports',
  ReportGeneratorWidget: 'reports',
  ReportGeneratorWithDialogWidget: 'reports',
  ReportsWidget: 'reports',

  // Analysis widgets
  AnalysisExpandableCards: 'analysis',
  AcoOrderProgressWidget: 'analysis',
  AnalysisPagedWidget: 'analysis',
  AnalysisPagedWidgetV2: 'analysis',
  AnalyticsDashboardWidget: 'analysis',
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
};

// 預加載優先級映射（基於使用頻率和重要性）
const preloadPriorityMap: WidgetMapping['preloadPriorityMap'] = {
  // 核心必須組件 - 最高優先級
  HistoryTree: 10,
  StatsCardWidget: 9,
  InjectionProductionStatsWidget: 9, // 高優先級 - GraphQL 優化版本

  // 常用統計組件 - 高優先級
  StillInAwaitWidget: 8,
  AwaitLocationQtyWidget: 8,
  YesterdayTransferCountWidget: 8,
  WarehouseTransferListWidget: 8,

  // 重要圖表 - 中高優先級
  ProductMixChartWidget: 7,
  StockDistributionChart: 7,
  WarehouseWorkLevelAreaChart: 7,

  // 操作類組件 - 中優先級
  ProductUpdateWidget: 6,
  SupplierUpdateWidget: 6,
  VoidPalletWidget: 6,

  // 上傳類組件 - 中低優先級
  UploadOrdersWidget: 5,
  UploadFilesWidget: 5,
  UploadPhotoWidget: 4,

  // 報表類組件 - 低優先級（按需加載）
  TransactionReportWidget: 3,
  GrnReportWidget: 3,
  AcoOrderReportWidget: 3,

  // 分析類組件 - 低優先級（通常在特定頁面才需要）
  AnalysisExpandableCards: 2,
  AnalysisPagedWidget: 2,
  InventoryOrderedAnalysisWidget: 2,
};

// 路由預加載配置
export const routePreloadMap: Record<string, string[]> = {
  '/admin/injection': [
    'HistoryTree',
    'InjectionProductionStatsWidget', // GraphQL 優化版本
    'StatsCardWidget',
    'ProductionDetailsWidget',
    'ProductMixChartWidget',
  ],
  '/admin/pipeline': [
    'HistoryTree',
    'StatsCardWidget',
    'ProductionDetailsWidget',
    'ProductMixChartWidget',
  ],
  '/admin/warehouse': [
    'AwaitLocationQtyWidget',
    'WarehouseTransferListWidget',
    'YesterdayTransferCountWidget',
    'WarehouseWorkLevelAreaChart',
  ],
  '/admin/upload': [
    'UploadOrdersWidget',
    'UploadFilesWidget',
    'OrdersListWidgetV2',
    'OtherFilesListWidget',
  ],
  '/admin/update': ['ProductUpdateWidget', 'SupplierUpdateWidget', 'VoidPalletWidget'],
  '/admin/stock-management': [
    'StockDistributionChart',
    'StockLevelHistoryChart',
    'InventoryOrderedAnalysisWidget',
  ],
  '/admin/system': ['ReportGeneratorWidget', 'ReprintLabelWidget', 'TransactionReportWidget'],
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
