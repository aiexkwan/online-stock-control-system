/**
 * Dynamic Imports Map
 * 為所有 widgets 提供動態導入函數
 * 
 * 策略 2: DTO/自定義 type interface - 定義標準化的組件導入類型
 */

import React from 'react';
import { wrapAllWidgetsWithErrorBoundary } from './error-boundary-wrapper';

// 策略 2: 自定義組件導入類型介面
type ComponentImport = () => Promise<{ default: React.ComponentType<any> }>;
type ModuleImport = () => Promise<any>;

// 策略 2: 工具函數 - 將命名導出轉換為默認導出格式
const wrapNamedExport = <T extends React.ComponentType<any>>(
  importFn: () => Promise<any>,
  exportName: string
): ComponentImport => {
  return () => importFn().then(module => ({ default: module[exportName] || module.default }));
};

// 策略 2: 工具函數 - 標準化默認導出
const wrapDefaultExport = (importFn: () => Promise<{ default: React.ComponentType<any> }>): ComponentImport => {
  return importFn;
};

// Core Widgets - 策略 2: 標準化導入格式
export const coreWidgetImports: Record<string, ComponentImport> = {
  'HistoryTree': wrapNamedExport(
    () => import('@/app/admin/components/dashboard/widgets/HistoryTreeV2'),
    'HistoryTreeV2'
  ),
  'HistoryTreeV2': wrapNamedExport(
    () => import('@/app/admin/components/dashboard/widgets/HistoryTreeV2'), 
    'HistoryTreeV2'
  ),
  'AdminWidgetRenderer': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/AdminWidgetRenderer')
  ),
};

// Stats Widgets - 策略 2: 標準化導入格式
export const statsWidgetImports: Record<string, ComponentImport> = {
  'AwaitLocationQtyWidget': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/AwaitLocationQtyWidget')
  ),
  'YesterdayTransferCountWidget': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/YesterdayTransferCountWidget')
  ),
  'StillInAwaitWidget': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/StillInAwaitWidget')
  ),
  'StillInAwaitPercentageWidget': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/StillInAwaitPercentageWidget')
  ),
  'WarehouseWorkLevelAreaChart': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart')
  ),
  'StatsCardWidget': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/StatsCardWidget')
  ),
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

// Unified Widgets - v2.0.3 新增統一組件 - 策略 2: 標準化導入格式
export const unifiedWidgetImports: Record<string, ComponentImport> = {
  'UnifiedStatsWidget': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/UnifiedStatsWidgetWithErrorBoundary')
  ),
  'UnifiedChartWidget': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/UnifiedChartWidgetWithErrorBoundary')
  ),
  'UnifiedTableWidget': wrapDefaultExport(
    () => import('@/app/admin/components/dashboard/widgets/UnifiedTableWidgetWithErrorBoundary')
  ),
};

// 合併所有導入映射 (不包含已有錯誤邊界的統一組件) - 策略 2: 統一導入類型
const rawWidgetImports: Record<string, ComponentImport> = {
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

// 合併所有導入映射，包含已有錯誤邊界的統一組件 - 策略 2: 統一導入類型
export const allWidgetImports: Record<string, ComponentImport> = {
  ...wrappedWidgetImports,
  ...unifiedWidgetImports, // 這些已經有錯誤邊界
};

// 根據 widget ID 獲取導入函數
export function getWidgetImport(widgetId: string): (() => Promise<{ default: React.ComponentType }>) | undefined {
  return allWidgetImports[widgetId];
}