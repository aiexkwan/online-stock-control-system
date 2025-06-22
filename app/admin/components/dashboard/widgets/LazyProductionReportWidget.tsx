/**
 * Lazy-loaded Production Report Widget
 * 懶加載版本，只在需要時載入 recharts
 */

'use client';

import React, { lazy, Suspense } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the actual widget
const ProductionReportWidget = lazy(() => 
  import('./ProductionReportWidget').then(module => ({
    default: module.ProductionReportWidget
  }))
);

export const LazyProductionReportWidget = React.memo(function LazyProductionReportWidget(props: WidgetComponentProps) {
  return (
    <Suspense 
      fallback={
        <div className="h-full w-full p-4 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40 bg-slate-700" />
            <Skeleton className="h-8 w-24 bg-slate-700" />
          </div>
          <Skeleton className="h-64 w-full bg-slate-700" />
        </div>
      }
    >
      <ProductionReportWidget {...props} />
    </Suspense>
  );
});