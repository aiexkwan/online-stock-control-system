/**
 * React.memo Optimized Widgets
 * 優化頻繁渲染的 widgets
 */

import React, { memo, useMemo, useCallback } from 'react';
import type { WidgetComponentProps } from '../types';

/**
 * StatsCardWidget 優化版本
 * 避免不必要的重新渲染
 */
const StatsCardWidgetComponent = ({ widget, isEditMode, timeFrame }: WidgetComponentProps) => {
  // 只有這些 props 改變才重新渲染
  const widgetKey = `${widget.id}-${widget.config?.metric}`;

  return (
    <div key={widgetKey} className='stats-card-widget'>
      {/* Widget 實現 */}
    </div>
  );
};

StatsCardWidgetComponent.displayName = 'MemoizedStatsCardWidget';

export const MemoizedStatsCardWidget = memo<WidgetComponentProps>(
  StatsCardWidgetComponent,
  (prevProps, nextProps) => {
    // 自定義比較函數
    // 返回 true 表示 props 相等（不需要重新渲染）
    return (
      prevProps.widget.id === nextProps.widget.id &&
      prevProps.widget.config?.metric === nextProps.widget.config?.metric &&
      prevProps.isEditMode === nextProps.isEditMode &&
      prevProps.timeFrame?.start?.getTime() === nextProps.timeFrame?.start?.getTime() &&
      prevProps.timeFrame?.end?.getTime() === nextProps.timeFrame?.end?.getTime()
    );
  }
);

/**
 * 創建優化的 Widget HOC
 */
export function createMemoizedWidget<P extends WidgetComponentProps>(
  Component: React.ComponentType<P>,
  compareProps?: (prevProps: P, nextProps: P) => boolean
): React.ComponentType<P> {
  const MemoizedComponent = memo(Component, compareProps || defaultPropsComparison) as unknown as React.ComponentType<P>;

  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`;

  return MemoizedComponent;
}

/**
 * 默認的 props 比較函數
 */
function defaultPropsComparison(
  prevProps: WidgetComponentProps,
  nextProps: WidgetComponentProps
): boolean {
  // 基本比較
  if (prevProps.isEditMode !== nextProps.isEditMode) return false;
  if (prevProps.widget.id !== nextProps.widget.id) return false;

  // 配置比較（淺比較）
  const prevConfig = prevProps.widget.config || {};
  const nextConfig = nextProps.widget.config || {};
  const configKeys = new Set([...Object.keys(prevConfig), ...Object.keys(nextConfig)]);

  for (const key of configKeys) {
    if (prevConfig[key] !== nextConfig[key]) return false;
  }

  // 時間範圍比較
  if (prevProps.timeFrame && nextProps.timeFrame) {
    if (
      prevProps.timeFrame.start?.getTime() !== nextProps.timeFrame.start?.getTime() ||
      prevProps.timeFrame.end?.getTime() !== nextProps.timeFrame.end?.getTime()
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Stats Widget 優化包裝器
 */
export function withStatsOptimization<P extends WidgetComponentProps>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const OptimizedComponent = memo<P>((props: P) => {
    // 緩存計算結果
    const processedData = useMemo(() => {
      if (!props.widget.config) return null;
      // 假設有數據處理邏輯
      return props.widget.config;
    }, [props.widget.config]);

    // 緩存事件處理器
    const handleClick = useCallback(() => {
      console.log('Widget clicked:', props.widget.id);
    }, [props.widget.id]);

    return <Component {...props} processedData={processedData} onClick={handleClick} />;
  });

  OptimizedComponent.displayName = `withStatsOptimization(${Component.displayName || Component.name || 'Component'})`;

  return OptimizedComponent;
}

/**
 * List Widget 優化包裝器
 * 針對大數據量列表的優化
 */
export function withListOptimization<P extends WidgetComponentProps>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const OptimizedComponent = memo<P>(
    (props: P) => {
      // 虛擬滾動配置
      const virtualScrollConfig = useMemo(
        () => ({
          itemHeight: 50,
          overscan: 5,
          initialScrollOffset: 0,
        }),
        []
      );

      // 緩存過濾和排序邏輯
      const config = props.widget.config;
      const processedItems = useMemo(() => {
        const items = (config as any)?.items || [];
        const filters = (config as any)?.filters || {};
        const sortBy = (config as any)?.sortBy;

        // 過濾
        let filtered = items;
        if (filters.search) {
          filtered = items.filter((item: any) =>
            item.name?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        // 排序
        if (sortBy) {
          filtered.sort((a: any, b: any) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
            return 0;
          });
        }

        return filtered;
      }, [config]);

      return (
        <Component
          {...props}
          processedItems={processedItems}
          virtualScrollConfig={virtualScrollConfig}
        />
      );
    },
    (prevProps, nextProps) => {
      // 深度比較 items 數組的長度和 filters
      const prevItems = (prevProps.widget.config as any)?.items || [];
      const nextItems = (nextProps.widget.config as any)?.items || [];

      if (prevItems.length !== nextItems.length) return false;

      const prevFilters = JSON.stringify((prevProps.widget.config as any)?.filters || {});
      const nextFilters = JSON.stringify((nextProps.widget.config as any)?.filters || {});

      return (
        prevFilters === nextFilters &&
        (prevProps.widget.config as any)?.sortBy === (nextProps.widget.config as any)?.sortBy
      );
    }
  );

  OptimizedComponent.displayName = `withListOptimization(${Component.displayName || Component.name || 'Component'})`;

  return OptimizedComponent;
}

/**
 * Chart Widget 優化包裝器
 */
export function withChartOptimization<P extends WidgetComponentProps>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const OptimizedComponent = memo<P>(
    (props: P) => {
      // 緩存圖表數據轉換
      const config = props.widget.config;
      const chartData = useMemo(() => {
        const rawData = (config as any)?.data || [];
        // 數據轉換邏輯
        return rawData.map((item: any) => ({
          ...item,
          // 格式化數據
          value: parseFloat(item.value) || 0,
          label: item.label || 'Unknown',
        }));
      }, [config]);

      // 緩存圖表配置
      const chartConfig = useMemo(
        () => ({
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 300,
          },
          plugins: {
            legend: {
              display: props.widget.config?.showLegend !== false,
            },
            tooltip: {
              enabled: true,
            },
          },
        }),
        [props.widget.config?.showLegend]
      );

      return <Component {...props} chartData={chartData} chartConfig={chartConfig} />;
    },
    (prevProps, nextProps) => {
      // 比較數據長度和關鍵配置
      const prevData = (prevProps.widget.config as any)?.data || [];
      const nextData = (nextProps.widget.config as any)?.data || [];

      return (
        prevData.length === nextData.length &&
        (prevProps.widget.config as any)?.chartType === (nextProps.widget.config as any)?.chartType &&
        (prevProps.widget.config as any)?.showLegend === (nextProps.widget.config as any)?.showLegend
      );
    }
  );

  OptimizedComponent.displayName = `withChartOptimization(${Component.displayName || Component.name || 'Component'})`;

  return OptimizedComponent;
}

/**
 * 批量應用優化
 */
export const optimizationMap = new Map<string, (component: any) => any>([
  // Stats widgets
  ['StatsCardWidget', withStatsOptimization],
  ['AwaitLocationQtyWidget', withStatsOptimization],
  ['YesterdayTransferCountWidget', withStatsOptimization],
  ['StillInAwaitWidget', withStatsOptimization],

  // List widgets
  ['OrdersListWidget', withListOptimization],
  ['WarehouseTransferListWidget', withListOptimization],
  ['OrderStateListWidget', withListOptimization],

  // Chart widgets
  ['ProductMixChartWidget', withChartOptimization],
  ['StockDistributionChart', withChartOptimization],
  ['StockLevelHistoryChart', withChartOptimization],
]);

/**
 * 獲取優化的組件
 */
export function getOptimizedComponent<P extends WidgetComponentProps>(
  widgetId: string,
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const optimizer = optimizationMap.get(widgetId);

  if (optimizer) {
    return optimizer(Component);
  }

  // 默認使用基本的 memo 優化
  return createMemoizedWidget(Component);
}
