/**
 * Dynamic Imports Map
 * 為所有 widgets 提供動態導入函數
 */

import { wrapAllWidgetsWithErrorBoundary } from './error-boundary-wrapper';

// Core Widgets
export const coreWidgetImports = {
  'HistoryTree': () => import('@/app/admin/components/dashboard/widgets/HistoryTreeV2').then(module => module.HistoryTreeV2),
  'HistoryTreeV2': () => import('@/app/admin/components/dashboard/widgets/HistoryTreeV2').then(module => module.HistoryTreeV2),
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
  'StockDistributionChart': () => import('@/app/admin/components/dashboard/widgets/StockDistributionChart'),
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
  'ProductUpdateWidgetV2': () => import('@/app/admin/components/dashboard/widgets/ProductUpdateWidgetV2'),
  'SupplierUpdateWidget': () => import('@/app/admin/components/dashboard/widgets/SupplierUpdateWidgetV2'),
  'SupplierUpdateWidgetV2': () => import('@/app/admin/components/dashboard/widgets/SupplierUpdateWidgetV2'),
  'StockTypeSelector': () => import('@/app/admin/components/dashboard/widgets/StockTypeSelector'),
};

// Uploads Widgets
export const uploadsWidgetImports = {
  'UploadOrdersWidget': () => import('@/app/admin/components/dashboard/widgets/UploadOrdersWidgetV2'),
  'UploadOrdersWidgetV2': () => import('@/app/admin/components/dashboard/widgets/UploadOrdersWidgetV2'),
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
  'GrnReportWidgetV2': () => import('@/app/admin/components/dashboard/widgets/GrnReportWidgetV2'),
  'AcoOrderReportWidget': () => import('@/app/admin/components/dashboard/widgets/AcoOrderReportWidget'),
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

// Unified Widgets - v2.0.3 新增統一組件
export const unifiedWidgetImports = {
  'UnifiedStatsWidget': () => import('@/app/admin/components/dashboard/widgets/UnifiedStatsWidgetWithErrorBoundary'),
  'UnifiedChartWidget': () => import('@/app/admin/components/dashboard/widgets/UnifiedChartWidgetWithErrorBoundary'),
  'UnifiedTableWidget': () => import('@/app/admin/components/dashboard/widgets/UnifiedTableWidgetWithErrorBoundary'),
};

// 合併所有導入映射 (不包含已有錯誤邊界的統一組件)
const rawWidgetImports: Record<string, () => Promise<{ default: React.ComponentType }>> = {
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

// 為所有 widgets 自動添加錯誤邊界保護
const wrappedWidgetImports = wrapAllWidgetsWithErrorBoundary(rawWidgetImports);

// 合併所有導入映射，包含已有錯誤邊界的統一組件
export const allWidgetImports: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  ...wrappedWidgetImports,
  ...unifiedWidgetImports, // 這些已經有錯誤邊界
};

// 根據 widget ID 獲取導入函數
export function getWidgetImport(widgetId: string): (() => Promise<{ default: React.ComponentType }>) | undefined {
  return allWidgetImports[widgetId];
}