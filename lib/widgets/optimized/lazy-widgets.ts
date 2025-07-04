/**
 * Lazy Loading Widget Implementations
 * 優化大型 widgets 的加載性能
 */

import { lazy } from 'react';
import type { WidgetComponentProps } from '../types';

/**
 * 創建優化的懶加載 widget
 */
function createLazyWidget(
  importPath: string,
  chunkName?: string
) {
  return lazy(() => 
    import(
      /* webpackChunkName: "[request]" */
      /* webpackPrefetch: true */
      `@/app/admin/components/dashboard/widgets/${importPath}`
    ).then(module => ({
      default: module.default || module[Object.keys(module)[0]]
    }))
  );
}

// === Charts Widgets (需要優先優化) ===
export const LazyProductMixChartWidget = lazy(() =>
  import(
    /* webpackChunkName: "chart-product-mix" */
    /* webpackPrefetch: true */
    '@/app/admin/components/dashboard/widgets/ProductMixChartWidget'
  )
);

export const LazyStockDistributionChart = lazy(() =>
  import(
    /* webpackChunkName: "chart-stock-distribution" */
    /* webpackPrefetch: true */
    '@/app/admin/components/dashboard/widgets/StockDistributionChart'
  )
);

export const LazyStockLevelHistoryChart = lazy(() =>
  import(
    /* webpackChunkName: "chart-stock-history" */
    /* webpackPrefetch: true */
    '@/app/admin/components/dashboard/widgets/StockLevelHistoryChart'
  )
);

export const LazyWarehouseWorkLevelAreaChart = lazy(() =>
  import(
    /* webpackChunkName: "chart-warehouse-work" */
    /* webpackPrefetch: true */
    '@/app/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart'
  )
);

export const LazyInventoryOrderedAnalysisWidget = lazy(() =>
  import(
    /* webpackChunkName: "chart-inventory-analysis" */
    /* webpackPrefetch: true */
    '@/app/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget'
  )
);

// === Lists Widgets (大數據量，需要優化) ===
export const LazyOrdersListWidget = lazy(() =>
  import(
    /* webpackChunkName: "list-orders" */
    /* webpackPreload: true */
    '@/app/admin/components/dashboard/widgets/OrdersListWidget'
  )
);

export const LazyWarehouseTransferListWidget = lazy(() =>
  import(
    /* webpackChunkName: "list-warehouse-transfer" */
    /* webpackPreload: true */
    '@/app/admin/components/dashboard/widgets/WarehouseTransferListWidget'
  )
);

// === Reports Widgets (按需加載) ===
export const LazyTransactionReportWidget = lazy(() =>
  import(
    /* webpackChunkName: "report-transaction" */
    '@/app/admin/components/dashboard/widgets/TransactionReportWidget'
  )
);

export const LazyGrnReportWidget = lazy(() =>
  import(
    /* webpackChunkName: "report-grn" */
    '@/app/admin/components/dashboard/widgets/GrnReportWidget'
  )
);

// === Heavy Analysis Widgets ===
export const LazyAnalysisExpandableCards = lazy(() =>
  import(
    /* webpackChunkName: "analysis-expandable" */
    '@/app/admin/components/dashboard/widgets/AnalysisExpandableCards'
  )
);

export const LazyAcoOrderProgressWidget = lazy(() =>
  import(
    /* webpackChunkName: "analysis-aco-progress" */
    '@/app/admin/components/dashboard/widgets/AcoOrderProgressWidget'
  )
);

/**
 * Widget 懶加載映射表
 * 用於動態決定是否使用懶加載版本
 */
export const lazyWidgetMap = new Map<string, React.LazyExoticComponent<any>>([
  // Charts
  ['ProductMixChartWidget', LazyProductMixChartWidget],
  ['StockDistributionChart', LazyStockDistributionChart],
  ['StockLevelHistoryChart', LazyStockLevelHistoryChart],
  ['WarehouseWorkLevelAreaChart', LazyWarehouseWorkLevelAreaChart],
  ['InventoryOrderedAnalysisWidget', LazyInventoryOrderedAnalysisWidget],
  // Lists
  ['OrdersListWidget', LazyOrdersListWidget],
  ['WarehouseTransferListWidget', LazyWarehouseTransferListWidget],
  // Reports
  ['TransactionReportWidget', LazyTransactionReportWidget],
  ['GrnReportWidget', LazyGrnReportWidget],
  // Analysis
  ['AnalysisExpandableCards', LazyAnalysisExpandableCards],
  ['AcoOrderProgressWidget', LazyAcoOrderProgressWidget],
]);

/**
 * 判斷是否應該使用懶加載
 */
export function shouldUseLazyLoading(widgetId: string): boolean {
  // 基於 widget 類型和大小決定
  const heavyWidgets = [
    'ProductMixChartWidget',
    'StockDistributionChart',
    'StockLevelHistoryChart',
    'InventoryOrderedAnalysisWidget',
    'OrdersListWidget',
    'WarehouseTransferListWidget',
    'TransactionReportWidget',
    'AnalysisExpandableCards',
  ];
  
  return heavyWidgets.includes(widgetId);
}

/**
 * 獲取優化的 widget 組件
 */
export function getOptimizedWidget(
  widgetId: string,
  fallback?: React.ComponentType<any>
): React.ComponentType<any> {
  const lazyComponent = lazyWidgetMap.get(widgetId);
  
  if (lazyComponent && shouldUseLazyLoading(widgetId)) {
    return lazyComponent;
  }
  
  return fallback || (() => null);
}