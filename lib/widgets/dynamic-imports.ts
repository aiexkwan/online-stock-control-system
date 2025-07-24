/**
 * Dynamic Imports Map
 * 為所有 widgets 提供動態導入函數
 *
 * 策略 2: DTO/自定義 type interface - 定義標準化的組件導入類型
 */

import React from 'react';
import { wrapAllWidgetsWithErrorBoundary } from './error-boundary-wrapper';

// 策略 2: 自定義組件導入類型介面
type ComponentImport = () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;
type ModuleImport = () => Promise<Record<string, unknown>>;

// 策略 2: 工具函數 - 將命名導出轉換為默認導出格式
const wrapNamedExport = (
  importFn: () => Promise<Record<string, unknown>>,
  exportName: string
): ComponentImport => {
  return async () => {
    try {
      const importedModule = await importFn();

      if (!importedModule || typeof importedModule !== 'object') {
        throw new Error(`Module import failed: received ${typeof importedModule}`);
      }

      const component = (importedModule[exportName] || importedModule.default) as React.ComponentType<
        Record<string, unknown>
      >;

      if (!component || typeof component !== 'function') {
        throw new Error(`Component "${exportName}" not found or is not a function`);
      }

      return { default: component };
    } catch (error) {
      console.error(`[wrapNamedExport] Failed to import ${exportName}:`, error);
      throw error;
    }
  };
};

// 策略 2: 工具函數 - 標準化默認導出
const wrapDefaultExport = (importFn: () => Promise<Record<string, unknown>>): ComponentImport => {
  return async () => {
    try {
      const importedModule = await importFn();

      if (!importedModule || typeof importedModule !== 'object') {
        throw new Error(`Module import failed: received ${typeof importedModule}`);
      }

      const component = importedModule.default as React.ComponentType<Record<string, unknown>>;

      if (!component || typeof component !== 'function') {
        throw new Error(`Default export is not a function: received ${typeof component}`);
      }

      return { default: component };
    } catch (error) {
      console.error(`[wrapDefaultExport] Failed to import default export:`, error);
      throw error;
    }
  };
};

// Core Widgets - 策略 2: 標準化導入格式
export const coreWidgetImports: Record<string, ComponentImport> = {
  // HistoryTreeV2 使用靜態導入避免 originalFactory.call 錯誤
  HistoryTreeV2: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/HistoryTreeV2')
  ),
  // GraphQL Version - Phase 2 Migration
  HistoryTreeV2GraphQL: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/HistoryTreeV2GraphQL')
  ),
  AdminCardRenderer: wrapNamedExport(
    () => import('@/app/(app)/admin/components/dashboard/AdminCardRenderer'),
    'AdminCardRenderer'
  ),
};

// Stats Widgets - 策略 2: 標準化導入格式
export const statsWidgetImports: Record<string, ComponentImport> = {
  AwaitLocationQtyWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/AwaitLocationQtyWidget')
  ),
  YesterdayTransferCountWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/YesterdayTransferCountWidget')
  ),
  StillInAwaitWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/StillInAwaitWidget')
  ),
  StillInAwaitPercentageWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/StillInAwaitPercentageWidget')
  ),
  WarehouseWorkLevelAreaChart: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart')
  ),
  StatsCardWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/StatsCardWidget')
  ),
};

// Charts Widgets - 策略 2: 標準化導入格式
export const chartsWidgetImports: Record<string, ComponentImport> = {
  StockDistributionChart: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/StockDistributionChart')
  ),
  StockLevelHistoryChart: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/StockLevelHistoryChart')
  ),
  TransferTimeDistributionWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/TransferTimeDistributionWidget')
  ),
  InventoryOrderedAnalysisWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget')
  ),
  InventoryOrderedAnalysisWidgetGraphQL: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidgetGraphQL')
  ),
  TopProductsInventoryChart: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/charts/TopProductsInventoryChart')
  ),
  AcoOrderProgressChart: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/charts/AcoOrderProgressChart')
  ),
};

// Lists Widgets - 策略 2: 標準化導入格式
export const listsWidgetImports: Record<string, ComponentImport> = {
  OrdersListWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/OrdersListWidget')
  ),
  OtherFilesListWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/OtherFilesListWidget')
  ),
  WarehouseTransferListWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/WarehouseTransferListWidget')
  ),
  OrderStateListWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/OrderStateListWidget')
  ),
};

// Operations Widgets - 策略 2: 標準化導入格式
export const operationsWidgetImports: Record<string, ComponentImport> = {
  VoidPalletWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/VoidPalletWidget')
  ),
  ProductUpdateWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/ProductUpdateWidget')
  ),
  SupplierUpdateWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/SupplierUpdateWidget')
  ),
  StockTypeSelector: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/StockTypeSelector')
  ),
  DepartmentSelectorWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/DepartmentSelectorWidget')
  ),
};

// Uploads Widgets - 策略 2: 標準化導入格式
export const uploadsWidgetImports: Record<string, ComponentImport> = {
  UploadOrdersWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/UploadOrdersWidget')
  ),
  UploadFilesWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/UploadFilesWidget')
  ),
  UploadProductSpecWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/UploadProductSpecWidget')
  ),
  UploadPhotoWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/UploadPhotoWidget')
  ),
  GoogleDriveUploadToast: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/GoogleDriveUploadToast')
  ),
};

// Reports Widgets - 策略 2: 標準化導入格式
export const reportsWidgetImports: Record<string, ComponentImport> = {
  TransactionReportWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/TransactionReportWidget')
  ),
  GrnReportWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/GrnReportWidget')
  ),
  AcoOrderReportWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/AcoOrderReportWidget')
  ),
  ReprintLabelWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/ReprintLabelWidget')
  ),
  ReportGeneratorWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidget')
  ),
  ReportGeneratorWithDialogWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidget')
  ),
};

// Analysis Widgets - 策略 2: 標準化導入格式
export const analysisWidgetImports: Record<string, ComponentImport> = {
  AnalysisExpandableCards: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/AnalysisExpandableCards')
  ),
  AcoOrderProgressWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/AcoOrderProgressWidget')
  ),
  AcoOrderProgressCards: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/charts/AcoOrderProgressCards')
  ),
  AnalysisPagedWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/AnalysisPagedWidget')
  ),
};

// Production Monitoring Widgets - 策略 2: 標準化導入格式
export const productionWidgetImports: Record<string, ComponentImport> = {
  ProductionDetailsWidget: wrapNamedExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/ProductionDetailsWidget'),
    'ProductionDetailsWidget'
  ),
  ProductionStatsWidget: wrapNamedExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/ProductionStatsWidget'),
    'ProductionStatsWidget'
  ),
  InjectionProductionStatsWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/InjectionProductionStatsWidget')
  ),
  StaffWorkloadWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/StaffWorkloadWidget')
  ),
  TopProductsByQuantityWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/TopProductsByQuantityWidget')
  ),
  // GraphQL Version - Phase 2 Migration
  TopProductsByQuantityWidgetGraphQL: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/TopProductsByQuantityWidgetGraphQL')
  ),
  ProductDistributionChartWidget: wrapNamedExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/ProductDistributionChartWidget'),
    'ProductDistributionChartWidget'
  ),
  TopProductsDistributionWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/TopProductsDistributionWidget')
  ),
};

// Special Widgets - 策略 2: 標準化導入格式
export const specialWidgetImports: Record<string, ComponentImport> = {
  OrderAnalysisResultDialog: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/OrderAnalysisResultDialog')
  ),
  Folder3D: wrapDefaultExport(() => import('@/app/(app)/admin/components/dashboard/widgets/Folder3D')),
  PerformanceTestWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/PerformanceTestWidget')
  ),
};

// Unified Widgets - v2.0.3 新增統一組件 - 策略 2: 標準化導入格式
export const unifiedWidgetImports: Record<string, ComponentImport> = {
  UnifiedStatsWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/UnifiedStatsWidgetWithErrorBoundary')
  ),
  UnifiedChartWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/UnifiedChartWidgetWithErrorBoundary')
  ),
  UnifiedTableWidget: wrapDefaultExport(
    () => import('@/app/(app)/admin/components/dashboard/widgets/UnifiedTableWidgetWithErrorBoundary')
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
export function getWidgetImport(
  widgetId: string
): (() => Promise<{ default: React.ComponentType }>) | undefined {
  return allWidgetImports[widgetId];
}
