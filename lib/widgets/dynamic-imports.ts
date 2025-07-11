/**
 * Dynamic Imports Map
 * 為所有 widgets 提供動態導入函數
 */

// Core Widgets
export const coreWidgetImports = {
  'HistoryTree': () => import('@/app/admin/components/dashboard/widgets/HistoryTreeV2').then(m => ({ default: m.HistoryTreeV2 || m.default })),
  'HistoryTreeV2': () => import('@/app/admin/components/dashboard/widgets/HistoryTreeV2'),
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
  'StockDistributionChart': () => import('@/app/admin/components/dashboard/widgets/StockDistributionChartV2'),
  'StockDistributionChartV2': () => import('@/app/admin/components/dashboard/widgets/StockDistributionChartV2'),
  'StockLevelHistoryChart': () => import('@/app/admin/components/dashboard/widgets/StockLevelHistoryChart'),
  'TransferTimeDistributionWidget': () => import('@/app/admin/components/dashboard/widgets/TransferTimeDistributionWidget'),
  'InventoryOrderedAnalysisWidget': () => import('@/app/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget'),
  'TopProductsInventoryChart': () => import('@/app/admin/components/dashboard/charts/TopProductsInventoryChart'),
  'AcoOrderProgressChart': () => import('@/app/admin/components/dashboard/charts/AcoOrderProgressChart'),
};

// Lists Widgets
export const listsWidgetImports = {
  'OrdersListWidget': () => import('@/app/admin/components/dashboard/widgets/OrdersListWidgetV2'),
  'OrdersListWidgetV2': () => import('@/app/admin/components/dashboard/widgets/OrdersListWidgetV2'),
  'OtherFilesListWidget': () => import('@/app/admin/components/dashboard/widgets/OtherFilesListWidgetV2'),
  'OtherFilesListWidgetV2': () => import('@/app/admin/components/dashboard/widgets/OtherFilesListWidgetV2'),
  'WarehouseTransferListWidget': () => import('@/app/admin/components/dashboard/widgets/WarehouseTransferListWidget'),
  'OrderStateListWidget': () => import('@/app/admin/components/dashboard/widgets/OrderStateListWidgetV2'),
  'OrderStateListWidgetV2': () => import('@/app/admin/components/dashboard/widgets/OrderStateListWidgetV2'),
};

// Operations Widgets
export const operationsWidgetImports = {
  'VoidPalletWidget': () => import('@/app/admin/components/dashboard/widgets/VoidPalletWidget'),
  'ProductUpdateWidget': () => import('@/app/admin/components/dashboard/widgets/ProductUpdateWidget'),
  'ProductUpdateWidgetV2': () => import('@/app/admin/components/dashboard/widgets/ProductUpdateWidgetV2'),
  'SupplierUpdateWidget': () => import('@/app/admin/components/dashboard/widgets/SupplierUpdateWidgetV2'),
  'SupplierUpdateWidgetV2': () => import('@/app/admin/components/dashboard/widgets/SupplierUpdateWidgetV2'),
  'StockTypeSelector': () => import('@/app/admin/components/dashboard/widgets/StockTypeSelector'),
};

// Uploads Widgets
export const uploadsWidgetImports = {
  'UploadOrdersWidget': () => import('@/app/admin/components/dashboard/widgets/UploadOrdersWidgetV2'),
  'UploadFilesWidget': () => import('@/app/admin/components/dashboard/widgets/UploadFilesWidget'),
  'UploadProductSpecWidget': () => import('@/app/admin/components/dashboard/widgets/UploadProductSpecWidget'),
  'UploadPhotoWidget': () => import('@/app/admin/components/dashboard/widgets/UploadPhotoWidget'),
  'AvailableSoonWidget': () => import('@/app/admin/components/dashboard/widgets/AvailableSoonWidget'),
  'GoogleDriveUploadToast': () => import('@/app/admin/components/dashboard/widgets/GoogleDriveUploadToast'),
};

// Reports Widgets
export const reportsWidgetImports = {
  'TransactionReportWidget': () => import('@/app/admin/components/dashboard/widgets/TransactionReportWidget'),
  'GrnReportWidget': () => import('@/app/admin/components/dashboard/widgets/GrnReportWidgetV2'),
  'GrnReportWidgetV2': () => import('@/app/admin/components/dashboard/widgets/GrnReportWidgetV2'),
  'AcoOrderReportWidget': () => import('@/app/admin/components/dashboard/widgets/AcoOrderReportWidgetV2'),
  'AcoOrderReportWidgetV2': () => import('@/app/admin/components/dashboard/widgets/AcoOrderReportWidgetV2'),
  'ReprintLabelWidget': () => import('@/app/admin/components/dashboard/widgets/ReprintLabelWidget'),
  'ReportGeneratorWidget': () => import('@/app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidgetV2'),
  'ReportGeneratorWithDialogWidget': () => import('@/app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidgetV2'),
  'ReportGeneratorWithDialogWidgetV2': () => import('@/app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidgetV2'),
};

// Analysis Widgets
export const analysisWidgetImports = {
  'AnalysisExpandableCards': () => import('@/app/admin/components/dashboard/widgets/AnalysisExpandableCards'),
  'AcoOrderProgressWidget': () => import('@/app/admin/components/dashboard/widgets/AcoOrderProgressWidget'),
  'AcoOrderProgressCards': () => import('@/app/admin/components/dashboard/charts/AcoOrderProgressCards'),
  'AnalysisPagedWidget': () => import('@/app/admin/components/dashboard/widgets/AnalysisPagedWidgetV2'),
  'AnalysisPagedWidgetV2': () => import('@/app/admin/components/dashboard/widgets/AnalysisPagedWidgetV2'),
};

// Production Monitoring Widgets - Server Actions versions
export const productionWidgetImports = {
  'ProductionDetailsWidget': () => import('@/app/admin/components/dashboard/widgets/ProductionDetailsWidget'),
  'ProductionStatsWidget': () => import('@/app/admin/components/dashboard/widgets/ProductionStatsWidget'),
  'InjectionProductionStatsWidget': () => import('@/app/admin/components/dashboard/widgets/InjectionProductionStatsWidget'),
  'StaffWorkloadWidget': () => import('@/app/admin/components/dashboard/widgets/StaffWorkloadWidget'),
  'TopProductsByQuantityWidget': () => import('@/app/admin/components/dashboard/widgets/TopProductsByQuantityWidget'),
  'ProductDistributionChartWidget': () => import('@/app/admin/components/dashboard/widgets/ProductDistributionChartWidget'),
  'TopProductsDistributionWidget': () => import('@/app/admin/components/dashboard/widgets/TopProductsDistributionWidget'),
};

// Special Widgets
export const specialWidgetImports = {
  'OrderAnalysisResultDialog': () => import('@/app/admin/components/dashboard/widgets/OrderAnalysisResultDialog'),
  'Folder3D': () => import('@/app/admin/components/dashboard/widgets/Folder3D'),
  'PerformanceTestWidget': () => import('@/app/admin/components/dashboard/widgets/PerformanceTestWidget'),
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
  ...productionWidgetImports,
  ...specialWidgetImports,
};

// 根據 widget ID 獲取導入函數
export function getWidgetImport(widgetId: string): (() => Promise<any>) | undefined {
  return allWidgetImports[widgetId];
}