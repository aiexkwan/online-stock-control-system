/**
 * Lazy Widget Registry
 * 提供懶加載版本嘅 widgets
 */

import React, { lazy, Suspense } from 'react';
import { WidgetType, WidgetComponentProps } from '@/app/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

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