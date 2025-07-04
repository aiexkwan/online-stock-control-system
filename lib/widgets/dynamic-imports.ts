/**
 * Dynamic Imports Map
 * 為所有 widgets 提供動態導入函數
 */

// Core Widgets
export const coreWidgetImports = {
  'HistoryTree': () => import('@/app/admin/components/dashboard/widgets/HistoryTree'),
  'AdminWidgetRenderer': () => import('@/app/admin/components/dashboard/AdminWidgetRenderer'),
};

// Stats Widgets
export const statsWidgetImports = {
  'AwaitLocationQtyWidget': () => import('@/app/admin/components/dashboard/widgets/AwaitLocationQtyWidget'),
  'YesterdayTransferCountWidget': () => import('@/app/admin/components/dashboard/widgets/YesterdayTransferCountWidget'),
  'StillInAwaitWidget': () => import('@/app/admin/components/dashboard/widgets/StillInAwaitWidget'),
  'StillInAwaitPercentageWidget': () => import('@/app/admin/components/dashboard/widgets/StillInAwaitPercentageWidget'),
  'WarehouseWorkLevelAreaChart': () => import('@/app/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart'),
  'StatsCardWidget': () => import('@/app/admin/components/dashboard/widgets/StatsCardWidget'),
};

// Charts Widgets
export const chartsWidgetImports = {
  'ProductMixChartWidget': () => import('@/app/admin/components/dashboard/widgets/ProductMixChartWidget'),
  'StockDistributionChart': () => import('@/app/admin/components/dashboard/widgets/StockDistributionChart'),
  'StockLevelHistoryChart': () => import('@/app/admin/components/dashboard/widgets/StockLevelHistoryChart'),
  'TransferTimeDistributionWidget': () => import('@/app/admin/components/dashboard/widgets/TransferTimeDistributionWidget'),
  'InventoryOrderedAnalysisWidget': () => import('@/app/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget'),
  'TopProductsInventoryChart': () => import('@/app/admin/components/dashboard/charts/TopProductsInventoryChart'),
};

// Lists Widgets
export const listsWidgetImports = {
  'OrdersListWidget': () => import('@/app/admin/components/dashboard/widgets/OrdersListWidget'),
  'OtherFilesListWidget': () => import('@/app/admin/components/dashboard/widgets/OtherFilesListWidget'),
  'WarehouseTransferListWidget': () => import('@/app/admin/components/dashboard/widgets/WarehouseTransferListWidget'),
  'OrderStateListWidget': () => import('@/app/admin/components/dashboard/widgets/OrderStateListWidget'),
};

// Operations Widgets
export const operationsWidgetImports = {
  'VoidPalletWidget': () => import('@/app/admin/components/dashboard/widgets/VoidPalletWidget'),
  'ProductUpdateWidget': () => import('@/app/admin/components/dashboard/widgets/ProductUpdateWidget'),
  'SupplierUpdateWidget': () => import('@/app/admin/components/dashboard/widgets/SupplierUpdateWidget'),
  'StockTypeSelector': () => import('@/app/admin/components/dashboard/widgets/StockTypeSelector'),
  'EmptyPlaceholderWidget': () => import('@/app/admin/components/dashboard/widgets/EmptyPlaceholderWidget'),
};

// Uploads Widgets
export const uploadsWidgetImports = {
  'UploadOrdersWidget': () => import('@/app/admin/components/dashboard/widgets/UploadOrdersWidget'),
  'UploadFilesWidget': () => import('@/app/admin/components/dashboard/widgets/UploadFilesWidget'),
  'UploadProductSpecWidget': () => import('@/app/admin/components/dashboard/widgets/UploadProductSpecWidget'),
  'UploadPhotoWidget': () => import('@/app/admin/components/dashboard/widgets/UploadPhotoWidget'),
  'AvailableSoonWidget': () => import('@/app/admin/components/dashboard/widgets/AvailableSoonWidget'),
  'GoogleDriveUploadToast': () => import('@/app/admin/components/dashboard/widgets/GoogleDriveUploadToast'),
};

// Reports Widgets
export const reportsWidgetImports = {
  'TransactionReportWidget': () => import('@/app/admin/components/dashboard/widgets/TransactionReportWidget'),
  'GrnReportWidget': () => import('@/app/admin/components/dashboard/widgets/GrnReportWidget'),
  'AcoOrderReportWidget': () => import('@/app/admin/components/dashboard/widgets/AcoOrderReportWidget'),
  'ReprintLabelWidget': () => import('@/app/admin/components/dashboard/widgets/ReprintLabelWidget'),
  'ReportGeneratorWidget': () => import('@/app/admin/components/dashboard/widgets/ReportGeneratorWidget'),
  'ReportGeneratorWithDialogWidget': () => import('@/app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidget'),
  'ReportsWidget': () => import('@/app/admin/components/dashboard/widgets/ReportsWidget'),
};

// Analysis Widgets
export const analysisWidgetImports = {
  'AnalysisExpandableCards': () => import('@/app/admin/components/dashboard/widgets/AnalysisExpandableCards'),
  'AcoOrderProgressWidget': () => import('@/app/admin/components/dashboard/widgets/AcoOrderProgressWidget'),
  'AnalysisPagedWidget': () => import('@/app/admin/components/dashboard/widgets/AnalysisPagedWidget'),
  'AnalysisPagedWidgetV2': () => import('@/app/admin/components/dashboard/widgets/AnalysisPagedWidgetV2'),
  'AnalyticsDashboardWidget': () => import('@/app/admin/components/dashboard/widgets/AnalyticsDashboardWidget'),
  'InventorySearchWidget': () => import('@/app/admin/components/dashboard/widgets/InventorySearchWidget'),
};

// GraphQL Widgets
export const graphqlWidgetImports = {
  'StillInAwaitWidgetGraphQL': () => import('@/app/admin/components/dashboard/widgets/StillInAwaitWidgetGraphQL'),
  'WarehouseTransferListWidgetGraphQL': () => import('@/app/admin/components/dashboard/widgets/WarehouseTransferListWidgetGraphQL'),
  'OrdersListGraphQL': () => import('@/app/admin/components/dashboard/widgets/OrdersListGraphQL'),
  'OtherFilesListGraphQL': () => import('@/app/admin/components/dashboard/widgets/OtherFilesListGraphQL'),
  'ProductionDetailsGraphQL': () => import('@/app/admin/components/dashboard/widgets/ProductionDetailsGraphQL'),
  'ProductionStatsGraphQL': () => import('@/app/admin/components/dashboard/widgets/ProductionStatsGraphQL'),
  'StaffWorkloadGraphQL': () => import('@/app/admin/components/dashboard/widgets/StaffWorkloadGraphQL'),
  'TopProductsChartGraphQL': () => import('@/app/admin/components/dashboard/widgets/TopProductsChartGraphQL'),
  'ProductDistributionChartGraphQL': () => import('@/app/admin/components/dashboard/widgets/ProductDistributionChartGraphQL'),
};

// Special Widgets
export const specialWidgetImports = {
  'OrderAnalysisResultDialog': () => import('@/app/admin/components/dashboard/widgets/OrderAnalysisResultDialog'),
  'Folder3D': () => import('@/app/admin/components/dashboard/widgets/Folder3D'),
};

// 合併所有導入映射
export const allWidgetImports: Record<string, () => Promise<any>> = {
  ...coreWidgetImports,
  ...statsWidgetImports,
  ...chartsWidgetImports,
  ...listsWidgetImports,
  ...operationsWidgetImports,
  ...uploadsWidgetImports,
  ...reportsWidgetImports,
  ...analysisWidgetImports,
  ...graphqlWidgetImports,
  ...specialWidgetImports,
};

// 根據 widget ID 獲取導入函數
export function getWidgetImport(widgetId: string): (() => Promise<any>) | undefined {
  return allWidgetImports[widgetId];
}