/**
 * Widget Loader
 * 動態加載 widget 組件
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { getWidgetImport } from './dynamic-imports';

// Widget 路徑映射
const widgetPaths: Record<string, string> = {
  // Core Widgets
  'HistoryTree': '@/app/admin/components/dashboard/widgets/HistoryTree',
  'AdminWidgetRenderer': '@/app/admin/components/dashboard/widgets/AdminWidgetRenderer',
  
  // Stats Widgets
  'AwaitLocationQtyWidget': '@/app/admin/components/dashboard/widgets/AwaitLocationQtyWidget',
  'YesterdayTransferCountWidget': '@/app/admin/components/dashboard/widgets/YesterdayTransferCountWidget',
  'StillInAwaitWidget': '@/app/admin/components/dashboard/widgets/StillInAwaitWidget',
  'StillInAwaitPercentageWidget': '@/app/admin/components/dashboard/widgets/StillInAwaitPercentageWidget',
  'WarehouseWorkLevelAreaChart': '@/app/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart',
  
  // Charts Widgets
  'ProductMixChartWidget': '@/app/admin/components/dashboard/widgets/ProductMixChartWidget',
  'StockDistributionChart': '@/app/admin/components/dashboard/widgets/StockDistributionChart',
  'StockLevelHistoryChart': '@/app/admin/components/dashboard/widgets/StockLevelHistoryChart',
  'TransferTimeDistributionWidget': '@/app/admin/components/dashboard/widgets/TransferTimeDistributionWidget',
  'TopProductsChartWidget': '@/app/admin/components/dashboard/widgets/TopProductsChartWidget',
  'ProductDistributionChartWidget': '@/app/admin/components/dashboard/widgets/ProductDistributionChartWidget',
  'TopProductsInventoryChart': '@/app/admin/components/dashboard/widgets/TopProductsInventoryChart',
  'InventoryOrderedAnalysisWidget': '@/app/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget',
  
  // Lists Widgets
  'OrdersListWidget': '@/app/admin/components/dashboard/widgets/OrdersListWidget',
  'OtherFilesListWidget': '@/app/admin/components/dashboard/widgets/OtherFilesListWidget',
  'WarehouseTransferListWidget': '@/app/admin/components/dashboard/widgets/WarehouseTransferListWidget',
  'OrderStateListWidget': '@/app/admin/components/dashboard/widgets/OrderStateListWidget',
  'BookedOutListWidget': '@/app/admin/components/dashboard/widgets/BookedOutListWidget',
  'GrnListWidget': '@/app/admin/components/dashboard/widgets/GrnListWidget',
  'TransferListWidget': '@/app/admin/components/dashboard/widgets/TransferListWidget',
  'LoadingListWidget': '@/app/admin/components/dashboard/widgets/LoadingListWidget',
  
  // Operations Widgets
  'VoidPalletWidget': '@/app/admin/components/dashboard/widgets/VoidPalletWidget',
  'ProductUpdateWidget': '@/app/admin/components/dashboard/widgets/ProductUpdateWidget',
  'SupplierUpdateWidget': '@/app/admin/components/dashboard/widgets/SupplierUpdateWidget',
  'BookedOutQueueWidget': '@/app/admin/components/dashboard/widgets/BookedOutQueueWidget',
  'StockTypeSelector': '@/app/admin/components/dashboard/widgets/StockTypeSelector',
  'EmptyPlaceholderWidget': '@/app/admin/components/dashboard/widgets/EmptyPlaceholderWidget',
  
  // Uploads Widgets
  'UploadOrdersWidget': '@/app/admin/components/dashboard/widgets/UploadOrdersWidget',
  'UploadFilesWidget': '@/app/admin/components/dashboard/widgets/UploadFilesWidget',
  'UploadProductSpecWidget': '@/app/admin/components/dashboard/widgets/UploadProductSpecWidget',
  'UploadPhotoWidget': '@/app/admin/components/dashboard/widgets/UploadPhotoWidget',
  'AvailableSoonWidget': '@/app/admin/components/dashboard/widgets/AvailableSoonWidget',
  'BookedOutProgressWidget': '@/app/admin/components/dashboard/widgets/BookedOutProgressWidget',
  
  // Reports Widgets
  'TransactionReportWidget': '@/app/admin/components/dashboard/widgets/TransactionReportWidget',
  'GrnReportWidget': '@/app/admin/components/dashboard/widgets/GrnReportWidget',
  'AcoOrderReportWidget': '@/app/admin/components/dashboard/widgets/AcoOrderReportWidget',
  'ReprintLabelWidget': '@/app/admin/components/dashboard/widgets/ReprintLabelWidget',
  'ReportGeneratorWidget': '@/app/admin/components/dashboard/widgets/ReportGeneratorWidget',
  'StaffWorkloadWidget': '@/app/admin/components/dashboard/widgets/StaffWorkloadWidget',
  'BookedOutStatsWidget': '@/app/admin/components/dashboard/widgets/BookedOutStatsWidget',
  'OutputStatsWidget': '@/app/admin/components/dashboard/widgets/OutputStatsWidget',
  
  // Analysis Widgets
  'AnalysisExpandableCards': '@/app/admin/components/dashboard/widgets/AnalysisExpandableCards',
  'AcoOrderProgressCards': '@/app/admin/components/dashboard/widgets/AcoOrderProgressCards',
  'AcoOrderProgressWidget': '@/app/admin/components/dashboard/widgets/AcoOrderProgressWidget',
  
  // GraphQL Widgets
  'StillInAwaitWidgetGraphQL': '@/app/admin/components/dashboard/widgets/StillInAwaitWidgetGraphQL',
  'WarehouseTransferListWidgetGraphQL': '@/app/admin/components/dashboard/widgets/WarehouseTransferListWidgetGraphQL',
  'OrdersListGraphQL': '@/app/admin/components/dashboard/widgets/OrdersListGraphQL',
  'OtherFilesListGraphQL': '@/app/admin/components/dashboard/widgets/OtherFilesListGraphQL',
  'ProductionDetailsGraphQL': '@/app/admin/components/dashboard/widgets/ProductionDetailsGraphQL',
  'ProductionStatsGraphQL': '@/app/admin/components/dashboard/widgets/ProductionStatsGraphQL',
  'StaffWorkloadGraphQL': '@/app/admin/components/dashboard/widgets/StaffWorkloadGraphQL',
  'TopProductsChartGraphQL': '@/app/admin/components/dashboard/widgets/TopProductsChartGraphQL',
  'ProductDistributionChartGraphQL': '@/app/admin/components/dashboard/widgets/ProductDistributionChartGraphQL',
};

// 創建動態加載的 widget 組件
export function createLazyWidget(widgetId: string): React.ComponentType<WidgetComponentProps> | undefined {
  const importFn = getWidgetImport(widgetId);
  
  if (!importFn) {
    console.warn(`[WidgetLoader] No import function for widget: ${widgetId}`);
    return undefined;
  }
  
  // 使用 Next.js dynamic import，處理 named exports
  return dynamic(
    () => importFn().then(mod => ({
      // 大部分 widgets 使用 named export，名稱與 widgetId 相同
      default: mod[widgetId] || mod.default || Object.values(mod).find(exp => typeof exp === 'function')
    })),
    {
      loading: () => null,
      ssr: false
    }
  );
}

// 批量創建懶加載 widgets
export function createLazyWidgets(widgetIds: string[]): Map<string, React.ComponentType<WidgetComponentProps>> {
  const lazyWidgets = new Map<string, React.ComponentType<WidgetComponentProps>>();
  
  widgetIds.forEach(widgetId => {
    const component = createLazyWidget(widgetId);
    if (component) {
      lazyWidgets.set(widgetId, component);
    }
  });
  
  return lazyWidgets;
}

// 預加載 widget
export async function preloadWidget(widgetId: string): Promise<void> {
  const importFn = getWidgetImport(widgetId);
  
  if (!importFn) {
    throw new Error(`No import function found for widget: ${widgetId}`);
  }
  
  try {
    await importFn();
    console.log(`[WidgetLoader] Preloaded: ${widgetId}`);
  } catch (error) {
    console.error(`[WidgetLoader] Failed to preload ${widgetId}:`, error);
    throw error;
  }
}

// 批量預加載 widgets
export async function preloadWidgets(widgetIds: string[]): Promise<void> {
  const promises = widgetIds.map(widgetId => preloadWidget(widgetId));
  await Promise.allSettled(promises);
}