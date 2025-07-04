/**
 * Lazy Widget Registry
 * 提供懶加載版本嘅 widgets
 * 擴展版本 - 支援新的 Widget 註冊系統但保持向後兼容
 */

import React, { lazy, Suspense } from 'react';
import { WidgetType, WidgetComponentProps } from '@/app/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { widgetRegistry } from '@/lib/widgets/enhanced-registry';
import { getRoutePreloadWidgets } from '@/lib/widgets/widget-mappings';

// Default loading skeleton
const DefaultWidgetSkeleton = () => (
  <div className="h-full w-full p-4 space-y-3">
    <Skeleton className="h-6 w-3/4 bg-slate-700" />
    <Skeleton className="h-4 w-1/2 bg-slate-700" />
    <Skeleton className="h-32 w-full bg-slate-700" />
  </div>
);

// Create lazy wrapper for a widget
export function createLazyWidget(
  importFn: () => Promise<{ default: React.ComponentType<WidgetComponentProps> } | any>,
  LoadingComponent: React.ComponentType = DefaultWidgetSkeleton
) {
  const LazyComponent = lazy(importFn);
  
  return React.memo(function LazyWidget(props: WidgetComponentProps) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  });
}

// Lazy loaded widgets map
export const LazyWidgets: Partial<Record<WidgetType, React.ComponentType<WidgetComponentProps>>> = {
  // Heavy widgets that benefit from lazy loading
  
  [WidgetType.ANALYTICS_DASHBOARD]: createLazyWidget(
    () => import('./widgets/AnalyticsDashboardWidget').then(m => ({ default: m.AnalyticsDashboardWidget }))
  ),
  
  [WidgetType.REPORTS]: createLazyWidget(
    () => import('./widgets/ReportsWidget').then(m => ({ default: m.ReportsWidget }))
  ),
  
  [WidgetType.INVENTORY_SEARCH]: createLazyWidget(
    () => import('./widgets/InventorySearchWidget').then(m => ({ default: m.InventorySearchWidget }))
  ),
  
  // Chart widgets
  [WidgetType.PRODUCT_MIX_CHART]: createLazyWidget(
    () => import('./widgets/ProductMixChartWidget').then(m => ({ default: m.ProductMixChartWidget }))
  ),
  
};

// Component-based lazy widgets (for AdminWidgetRenderer)
export const LazyComponents: Record<string, React.ComponentType<any>> = {
  // 分析類重型 widget (named exports)
  'AnalysisPagedWidget': createLazyWidget(
    () => import('./widgets/AnalysisPagedWidget').then(m => ({ default: m.AnalysisPagedWidget }))
  ),
  'AnalysisPagedWidgetV2': createLazyWidget(
    () => import('./widgets/AnalysisPagedWidgetV2').then(m => ({ default: m.AnalysisPagedWidgetV2 }))
  ),
  'AnalysisExpandableCards': createLazyWidget(
    () => import('./widgets/AnalysisExpandableCards').then(m => ({ default: m.AnalysisExpandableCards }))
  ),
  
  // 報表類重型 widget (named exports)
  'ReportGeneratorWidget': createLazyWidget(
    () => import('./widgets/ReportGeneratorWidget').then(m => ({ default: m.ReportGeneratorWidget }))
  ),
  'ReportGeneratorWithDialogWidget': createLazyWidget(
    () => import('./widgets/ReportGeneratorWithDialogWidget').then(m => ({ default: m.ReportGeneratorWithDialogWidget }))
  ),
  
  // History widget (named export)
  'HistoryTree': createLazyWidget(
    () => import('./widgets/HistoryTree').then(m => ({ default: m.HistoryTree }))
  ),
  
  // Upload page widgets (named exports)
  'OrdersListWidget': createLazyWidget(
    () => import('./widgets/OrdersListWidget').then(m => ({ default: m.OrdersListWidget }))
  ),
  'OtherFilesListWidget': createLazyWidget(
    () => import('./widgets/OtherFilesListWidget').then(m => ({ default: m.OtherFilesListWidget }))
  ),
  'UploadFilesWidget': createLazyWidget(
    () => import('./widgets/UploadFilesWidget').then(m => ({ default: m.UploadFilesWidget }))
  ),
  'UploadOrdersWidget': createLazyWidget(
    () => import('./widgets/UploadOrdersWidget').then(m => ({ default: m.UploadOrdersWidget }))
  ),
  'UploadProductSpecWidget': createLazyWidget(
    () => import('./widgets/UploadProductSpecWidget').then(m => ({ default: m.UploadProductSpecWidget }))
  ),
  'UploadPhotoWidget': createLazyWidget(
    () => import('./widgets/UploadPhotoWidget').then(m => ({ default: m.UploadPhotoWidget }))
  ),
  
  // Product Update widget (named export)
  'ProductUpdateWidget': createLazyWidget(
    () => import('./widgets/ProductUpdateWidget').then(m => ({ default: m.ProductUpdateWidget }))
  ),
  
  // Supplier Update widget (named export)
  'SupplierUpdateWidget': createLazyWidget(
    () => import('./widgets/SupplierUpdateWidget').then(m => ({ default: m.SupplierUpdateWidget }))
  ),
  
  // Void Pallet widget (named export)
  'VoidPalletWidget': createLazyWidget(
    () => import('./widgets/VoidPalletWidget').then(m => ({ default: m.VoidPalletWidget }))
  ),
  
  // Reprint Label widget (named export)
  'ReprintLabelWidget': createLazyWidget(
    () => import('./widgets/ReprintLabelWidget').then(m => ({ default: m.ReprintLabelWidget }))
  ),
  
  // Transaction Report widget (named export)
  'TransactionReportWidget': createLazyWidget(
    () => import('./widgets/TransactionReportWidget').then(m => ({ default: m.TransactionReportWidget }))
  ),
  
  // GRN Report widget (named export)
  'GrnReportWidget': createLazyWidget(
    () => import('./widgets/GrnReportWidget').then(m => ({ default: m.GrnReportWidget }))
  ),
  
  // ACO Order Report widget (named export)
  'AcoOrderReportWidget': createLazyWidget(
    () => import('./widgets/AcoOrderReportWidget').then(m => ({ default: m.AcoOrderReportWidget }))
  ),
};

// Helper to check if widget should be lazy loaded
export function shouldLazyLoad(widgetType: WidgetType): boolean {
  return widgetType in LazyWidgets;
}

// Get lazy or regular component
export function getWidgetComponent(
  widgetType: WidgetType,
  regularComponent: React.ComponentType<WidgetComponentProps>
): React.ComponentType<WidgetComponentProps> {
  return LazyWidgets[widgetType] || regularComponent;
}

// 新增：初始化增強版註冊表（向後兼容）
export async function initializeEnhancedRegistry(): Promise<void> {
  try {
    // 自動註冊所有已知的 widgets
    await widgetRegistry.autoRegisterWidgets();
    
    // 註冊現有的懶加載組件到新系統
    Object.entries(LazyComponents).forEach(([widgetId, component]) => {
      const existingDef = widgetRegistry.getDefinition(widgetId);
      if (existingDef) {
        // 更新現有定義，添加組件
        widgetRegistry.register({
          ...existingDef,
          component,
          lazyLoad: true
        });
      }
    });
    
    console.log('[LazyWidgetRegistry] Enhanced registry initialized');
  } catch (error) {
    console.error('[LazyWidgetRegistry] Failed to initialize enhanced registry:', error);
  }
}

// 新增：預加載路由相關的 widgets
export async function preloadRouteWidgets(route: string): Promise<void> {
  const widgetIds = getRoutePreloadWidgets(route);
  if (widgetIds.length > 0) {
    console.log(`[LazyWidgetRegistry] Preloading widgets for route: ${route}`);
    await widgetRegistry.preloadWidgets(widgetIds);
  }
}

// 新增：獲取組件（支援新舊系統）
export function getEnhancedWidgetComponent(
  widgetId: string,
  enableGraphQL: boolean = false
): React.ComponentType<any> | undefined {
  // 首先嘗試從新系統獲取
  const enhancedComponent = widgetRegistry.getWidgetComponent(widgetId, enableGraphQL);
  if (enhancedComponent) {
    return enhancedComponent;
  }
  
  // 回退到舊系統
  return LazyComponents[widgetId];
}

// 新增：性能監控包裝器
export function withPerformanceTracking<P extends WidgetComponentProps>(
  WidgetComponent: React.ComponentType<P>,
  widgetId: string
): React.ComponentType<P> {
  return React.memo(function TrackedWidget(props: P) {
    React.useEffect(() => {
      // 記錄使用情況
      widgetRegistry.recordUsage(widgetId);
    }, []);
    
    return <WidgetComponent {...props} />;
  });
}