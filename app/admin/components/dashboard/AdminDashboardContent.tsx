/**
 * Admin Dashboard Content Component
 * 根據不同主題渲染對應的儀表板內容
 * Phase 3.1.2: 使用動態導入優化
 */

'use client';

import React, { lazy, Suspense, useEffect, useMemo } from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { adminDashboardLayouts } from './adminDashboardLayouts';
import { AdminWidgetRenderer } from './AdminWidgetRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { optimizedWidgetLoader, preloadRouteWidgets } from './LazyWidgetRegistry';
import { smartPreloader } from '@/lib/widgets/enhanced-registry';
import { useWidgetRegistry } from '@/app/hooks/useWidgetRegistry';

// 動態導入 theme layouts - 使用 webpack magic comments
const ThemeLayouts = {
  injection: lazy(() =>
    import(/* webpackChunkName: "theme-injection" */ './CustomThemeLayout').then(m => ({
      default: m.CustomThemeLayout,
    }))
  ),
  pipeline: lazy(() =>
    import(/* webpackChunkName: "theme-pipeline" */ './CustomThemeLayout').then(m => ({
      default: m.CustomThemeLayout,
    }))
  ),
  warehouse: lazy(() =>
    import(/* webpackChunkName: "theme-warehouse" */ './CustomThemeLayout').then(m => ({
      default: m.CustomThemeLayout,
    }))
  ),
  upload: lazy(() =>
    import(/* webpackChunkName: "theme-upload" */ './UploadUpdateLayout').then(m => ({
      default: m.UploadUpdateLayout,
    }))
  ),
  update: lazy(() =>
    import(/* webpackChunkName: "theme-update" */ './UploadUpdateLayout').then(m => ({
      default: m.UploadUpdateLayout,
    }))
  ),
  'stock-management': lazy(() =>
    import(/* webpackChunkName: "theme-stock" */ './StockManagementLayout').then(m => ({
      default: m.StockManagementLayout,
    }))
  ),
  system: lazy(() =>
    import(/* webpackChunkName: "theme-system" */ './SystemLayout').then(m => ({
      default: m.SystemLayout,
    }))
  ),
  analysis: lazy(() =>
    import(/* webpackChunkName: "theme-analysis" */ './AnalysisLayout').then(m => ({
      default: m.AnalysisLayout,
    }))
  ),
};

// Theme loading skeleton
const ThemeLoadingSkeleton = () => (
  <div className='h-full w-full space-y-4 p-6'>
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className='space-y-3'>
          <Skeleton className='h-48 w-full bg-slate-700' />
          <Skeleton className='h-4 w-3/4 bg-slate-700' />
          <Skeleton className='h-4 w-1/2 bg-slate-700' />
        </div>
      ))}
    </div>
  </div>
);

interface AdminDashboardContentProps {
  theme: string;
  timeFrame: TimeFrame;
}

export const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({
  theme,
  timeFrame,
}) => {
  // 確保 widget registry 已初始化
  const { isInitialized, error } = useWidgetRegistry();

  // 預加載當前路由的 widgets
  useEffect(() => {
    if (!isInitialized) return;

    const currentRoute = `/admin/${theme}`;

    // 使用 OptimizedWidgetLoader 預加載
    optimizedWidgetLoader.preloadForRoute(currentRoute);

    // 使用 SmartPreloader 進行智能預測預加載
    smartPreloader.preloadForRoute(currentRoute);

    // 預加載當前主題的 widgets
    preloadRouteWidgets(currentRoute).catch(console.error);
  }, [theme, isInitialized]);

  // 獲取對應的 Layout 組件
  const ThemeLayout = useMemo(() => {
    if (theme in ThemeLayouts) {
      return ThemeLayouts[theme as keyof typeof ThemeLayouts];
    }
    return null;
  }, [theme]);

  // 獲取 layout 配置
  const layout = adminDashboardLayouts[theme];

  // 如果正在初始化，顯示加載狀態
  if (!isInitialized) {
    return <ThemeLoadingSkeleton />;
  }

  // 如果初始化出錯，顯示錯誤
  if (error) {
    return (
      <div className='flex h-full w-full items-center justify-center'>
        <div className='text-center text-red-500'>
          <h2 className='mb-2 text-xl font-semibold'>Failed to Initialize Widgets</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  // 如果沒有找到對應的 layout，顯示空狀態
  if (!layout) {
    return (
      <div className='flex h-full w-full items-center justify-center'>
        <div className='text-center text-gray-500'>
          <h2 className='mb-2 text-xl font-semibold'>No Dashboard Available</h2>
          <p>No dashboard layout is configured for the &quot;{theme}&quot; theme.</p>
        </div>
      </div>
    );
  }

  // 渲染 widgets - 保持原有順序，只添加延遲加載
  const renderWidgets = () => {
    // 定義 widget 優先級（用於延遲加載，不改變順序）
    const widgetPriority: Record<string, number> = {
      // 核心統計 widgets - 最高優先級
      StatsCardWidget: 1,
      AwaitLocationQtyWidget: 1,
      YesterdayTransferCountWidget: 1,
      StillInAwaitWidget: 1,
      StillInAwaitPercentageWidget: 1,

      // 列表和表格 - 中優先級
      OrderStateListWidgetV2: 2,
      WarehouseTransferListWidget: 2,
      OrdersListWidgetV2: 2,
      OtherFilesListWidget: 2,

      // 圖表 - 低優先級
      ProductMixChartWidget: 3,
      StockDistributionChart: 3,
      WarehouseWorkLevelAreaChart: 3,
      TransferTimeDistributionWidget: 3,
      InventoryOrderedAnalysisWidget: 3,

      // 歷史記錄 - 最低優先級
      HistoryTree: 4,
      HistoryTreeV2: 4,
    };

    return (
      <>
        {layout.widgets.map((widget, index) => {
          // 為低優先級 widgets 添加延遲，但保持原有順序
          const priority = widgetPriority[widget.component || ''] || 99;
          const delay = priority > 2 ? (priority - 2) * 100 : 0;

          return (
            <AdminWidgetRenderer
              key={`${widget.gridArea}-${index}`}
              config={widget}
              theme={theme}
              timeFrame={timeFrame}
              index={index}
              delay={delay}
            />
          );
        })}
      </>
    );
  };

  // 如果有對應的 ThemeLayout 組件，使用動態加載
  if (ThemeLayout) {
    return (
      <Suspense fallback={<ThemeLoadingSkeleton />}>
        <ThemeLayout theme={theme} timeFrame={timeFrame}>
          {renderWidgets()}
        </ThemeLayout>
      </Suspense>
    );
  }

  // 默認佈局（如果沒有特定的 Layout 組件）
  return (
    <div
      className='h-full w-full'
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: '200px 300px 200px',
        gap: '16px',
        gridTemplateAreas: layout.gridTemplate,
        height: '100%',
        width: '100%',
      }}
    >
      {renderWidgets()}
    </div>
  );
};
