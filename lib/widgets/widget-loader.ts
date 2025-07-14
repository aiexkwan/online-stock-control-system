/**
 * Widget Loader
 * 動態加載 widget 組件
 */

import React from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { getWidgetImport } from './dynamic-imports';

// 使用靜態導入避免動態 require 問題
import dynamic from 'next/dynamic';

// Widget 路徑映射
const widgetPaths: Record<string, string> = {
  // Core Widgets
  HistoryTree: '@/app/admin/components/dashboard/widgets/HistoryTreeV2',
  HistoryTreeV2: '@/app/admin/components/dashboard/widgets/HistoryTreeV2',
  AdminWidgetRenderer: '@/app/admin/components/dashboard/widgets/AdminWidgetRenderer',

  // Stats Widgets
  AwaitLocationQtyWidget: '@/app/admin/components/dashboard/widgets/AwaitLocationQtyWidget',
  YesterdayTransferCountWidget:
    '@/app/admin/components/dashboard/widgets/YesterdayTransferCountWidget',
  StillInAwaitWidget: '@/app/admin/components/dashboard/widgets/StillInAwaitWidget',
  StillInAwaitPercentageWidget:
    '@/app/admin/components/dashboard/widgets/StillInAwaitPercentageWidget',
  WarehouseWorkLevelAreaChart:
    '@/app/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart',

  // Charts Widgets
  StockDistributionChart: '@/app/admin/components/dashboard/widgets/StockDistributionChartV2',
  StockDistributionChartV2: '@/app/admin/components/dashboard/widgets/StockDistributionChartV2',
  StockLevelHistoryChart: '@/app/admin/components/dashboard/widgets/StockLevelHistoryChart',
  TransferTimeDistributionWidget:
    '@/app/admin/components/dashboard/widgets/TransferTimeDistributionWidget',
  TopProductsByQuantityWidget: '@/app/admin/components/dashboard/widgets/TopProductsByQuantityWidget',
  ProductDistributionChartWidget:
    '@/app/admin/components/dashboard/widgets/ProductDistributionChartWidget',
  TopProductsInventoryChart: '@/app/admin/components/dashboard/widgets/TopProductsInventoryChart',
  InventoryOrderedAnalysisWidget:
    '@/app/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget',

  // Lists Widgets
  OrdersListWidget: '@/app/admin/components/dashboard/widgets/OrdersListWidgetV2',
  OrdersListWidgetV2: '@/app/admin/components/dashboard/widgets/OrdersListWidgetV2',
  OtherFilesListWidget: '@/app/admin/components/dashboard/widgets/OtherFilesListWidgetV2',
  OtherFilesListWidgetV2: '@/app/admin/components/dashboard/widgets/OtherFilesListWidgetV2',
  WarehouseTransferListWidget:
    '@/app/admin/components/dashboard/widgets/WarehouseTransferListWidget',
  OrderStateListWidget: '@/app/admin/components/dashboard/widgets/OrderStateListWidgetV2',
  OrderStateListWidgetV2: '@/app/admin/components/dashboard/widgets/OrderStateListWidgetV2',
  BookedOutListWidget: '@/app/admin/components/dashboard/widgets/BookedOutListWidget',
  GrnListWidget: '@/app/admin/components/dashboard/widgets/GrnListWidget',
  TransferListWidget: '@/app/admin/components/dashboard/widgets/TransferListWidget',
  LoadingListWidget: '@/app/admin/components/dashboard/widgets/LoadingListWidget',

  // Operations Widgets
  VoidPalletWidget: '@/app/admin/components/dashboard/widgets/VoidPalletWidget',
  ProductUpdateWidgetV2: '@/app/admin/components/dashboard/widgets/ProductUpdateWidgetV2',
  SupplierUpdateWidget: '@/app/admin/components/dashboard/widgets/SupplierUpdateWidgetV2',
  SupplierUpdateWidgetV2: '@/app/admin/components/dashboard/widgets/SupplierUpdateWidgetV2',
  BookedOutQueueWidget: '@/app/admin/components/dashboard/widgets/BookedOutQueueWidget',
  StockTypeSelector: '@/app/admin/components/dashboard/widgets/StockTypeSelector',

  // Uploads Widgets
  UploadOrdersWidget: '@/app/admin/components/dashboard/widgets/UploadOrdersWidgetV2',
  UploadOrdersWidgetV2: '@/app/admin/components/dashboard/widgets/UploadOrdersWidgetV2',
  UploadFilesWidget: '@/app/admin/components/dashboard/widgets/UploadFilesWidget',
  UploadProductSpecWidget: '@/app/admin/components/dashboard/widgets/UploadProductSpecWidget',
  UploadPhotoWidget: '@/app/admin/components/dashboard/widgets/UploadPhotoWidget',
  AvailableSoonWidget: '@/app/admin/components/dashboard/widgets/AvailableSoonWidget',
  BookedOutProgressWidget: '@/app/admin/components/dashboard/widgets/BookedOutProgressWidget',

  // Reports Widgets
  TransactionReportWidget: '@/app/admin/components/dashboard/widgets/TransactionReportWidget',
  GrnReportWidget: '@/app/admin/components/dashboard/widgets/GrnReportWidgetV2',
  GrnReportWidgetV2: '@/app/admin/components/dashboard/widgets/GrnReportWidgetV2',
  AcoOrderReportWidget: '@/app/admin/components/dashboard/widgets/AcoOrderReportWidgetV2',
  AcoOrderReportWidgetV2: '@/app/admin/components/dashboard/widgets/AcoOrderReportWidgetV2',
  ReprintLabelWidget: '@/app/admin/components/dashboard/widgets/ReprintLabelWidget',
  ReportGeneratorWidget: '@/app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidgetV2',
  ReportGeneratorWithDialogWidget: '@/app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidgetV2',
  ReportGeneratorWithDialogWidgetV2: '@/app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidgetV2',
  BookedOutStatsWidget: '@/app/admin/components/dashboard/widgets/BookedOutStatsWidget',
  OutputStatsWidget: '@/app/admin/components/dashboard/widgets/OutputStatsWidget',

  // Analysis Widgets
  AnalysisExpandableCards: '@/app/admin/components/dashboard/widgets/AnalysisExpandableCards',
  AcoOrderProgressCards: '@/app/admin/components/dashboard/widgets/AcoOrderProgressCards',
  AcoOrderProgressWidget: '@/app/admin/components/dashboard/widgets/AcoOrderProgressWidget',
  AnalysisPagedWidget: '@/app/admin/components/dashboard/widgets/AnalysisPagedWidgetV2',
  AnalysisPagedWidgetV2: '@/app/admin/components/dashboard/widgets/AnalysisPagedWidgetV2',

  // Production Widgets (Server Actions versions)
  ProductionDetailsWidget: '@/app/admin/components/dashboard/widgets/ProductionDetailsWidget',
  ProductionStatsWidget: '@/app/admin/components/dashboard/widgets/ProductionStatsWidget',
  StaffWorkloadWidget: '@/app/admin/components/dashboard/widgets/StaffWorkloadWidget',
  TopProductsChartGraphQL: '@/app/admin/components/dashboard/widgets/TopProductsChartGraphQL',
  ProductDistributionChartGraphQL:
    '@/app/admin/components/dashboard/widgets/ProductDistributionChartGraphQL',
};

// 創建錯誤處理組件
const ErrorWidget: React.FC<{ widgetId: string; error?: string }> = ({ widgetId, error }) => (
  React.createElement('div', {
    className: 'h-32 bg-red-100 border border-red-300 rounded p-4 flex flex-col justify-center items-center text-red-700'
  }, [
    React.createElement('h3', { key: 'title', className: 'font-semibold' }, `錯誤：無法載入 ${widgetId}`),
    error && React.createElement('p', { key: 'error', className: 'text-sm mt-2' }, error),
    React.createElement('p', { key: 'hint', className: 'text-xs text-gray-600 mt-2' }, 'Check dynamic-imports.ts and widget-loader.ts for path mismatches')
  ])
);

// 創建動態加載的 widget 組件
export function createDynamicWidget(
  widgetId: string
): React.ComponentType<WidgetComponentProps> | undefined {
  try {
    const importFn = getWidgetImport(widgetId);

    if (!importFn) {
      console.warn(`[WidgetLoader] No import function for widget: ${widgetId}`);
      // 返回錯誤組件而不是 undefined
      const ErrorComponent = (props: WidgetComponentProps) => 
        React.createElement(ErrorWidget, { widgetId, error: '找不到導入函數' });
      ErrorComponent.displayName = `ErrorWidget(${widgetId})`;
      return ErrorComponent;
    }

    // 使用 Next.js dynamic import，處理 named exports
    return dynamic(
      () => {
        try {
          return importFn().then(mod => {
            // 檢查 module 是否存在
            if (!mod) {
              throw new Error(`Module for ${widgetId} is null or undefined`);
            }

            // 簡化模塊處理邏輯，避免複雜的 export 查找
            if (mod && mod.default) {
              return mod;
            }

            // 如果冇 default export，嘗試找到可用的組件
            if (mod && typeof mod === 'object') {
              // 首先嘗試用 widgetId 查找
              let component = mod[widgetId];
              
              // 如果仍然冇找到，查找第一個函數類型的 export
              if (!component) {
                component = Object.values(mod).find(exp => typeof exp === 'function');
              }

              if (component) {
                return { default: component };
              }
            }

            throw new Error(`No valid component found in module for ${widgetId}`);
          }).catch(importError => {
            console.error(`[WidgetLoader] Import error for ${widgetId}:`, importError);
            // 返回錯誤組件
            return { 
              default: (props: WidgetComponentProps) => 
                React.createElement(ErrorWidget, { 
                  widgetId, 
                  error: `導入錯誤: ${importError.message}` 
                })
            };
          });
        } catch (syncError) {
          console.error(`[WidgetLoader] Sync error for ${widgetId}:`, syncError);
          // 處理同步錯誤
          const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
          return Promise.resolve({ 
            default: (props: WidgetComponentProps) => 
              React.createElement(ErrorWidget, { 
                widgetId, 
                error: `同步錯誤: ${errorMessage}` 
              })
          });
        }
      },
      {
        loading: () =>
          React.createElement('div', {
            className: 'h-32 bg-gray-200 animate-pulse rounded flex items-center justify-center',
          }, React.createElement('span', { className: 'text-gray-500' }, `載入 ${widgetId}...`)),
        ssr: false,
      }
    );
  } catch (error) {
    console.error(`[WidgetLoader] Outer error for ${widgetId}:`, error);
    // 如果整個過程失敗，返回錯誤組件
    const OuterErrorComponent = (props: WidgetComponentProps) => 
      React.createElement(ErrorWidget, { 
        widgetId, 
        error: `外部錯誤: ${error instanceof Error ? error.message : '未知錯誤'}` 
      });
    OuterErrorComponent.displayName = `OuterErrorWidget(${widgetId})`;
    return OuterErrorComponent;
  }
}

// 追蹤已預加載的 widgets
export const preloadedWidgets = new Set<string>();

// 批量創建懶加載 widgets
export function createLazyWidgets(
  widgetIds: string[]
): Map<string, React.ComponentType<WidgetComponentProps>> {
  const lazyWidgets = new Map<string, React.ComponentType<WidgetComponentProps>>();

  widgetIds.forEach(widgetId => {
    const component = createDynamicWidget(widgetId);
    if (component) {
      lazyWidgets.set(widgetId, component);
    }
  });

  return lazyWidgets;
}

// 預加載 widget
export async function preloadWidget(widgetId: string): Promise<void> {
  // 檢查是否已預加載
  if (preloadedWidgets.has(widgetId)) {
    return;
  }

  const importFn = getWidgetImport(widgetId);

  if (!importFn) {
    console.warn(`[WidgetLoader] No import function found for widget: ${widgetId}`);
    return;
  }

  try {
    await importFn();
    preloadedWidgets.add(widgetId);
    console.log(`[WidgetLoader] Preloaded: ${widgetId}`);
  } catch (error) {
    console.error(`[WidgetLoader] Failed to preload widget: ${widgetId}`, error);
    // Don't re-throw the error, just log it
  }
}

// 批量預加載 widgets
export async function preloadWidgets(widgetIds: string[]): Promise<void> {
  const promises = widgetIds.map(widgetId => preloadWidget(widgetId));
  await Promise.allSettled(promises);
}

// 檢查 widget 是否已預加載
export function isWidgetPreloaded(widgetId: string): boolean {
  return preloadedWidgets.has(widgetId);
}
