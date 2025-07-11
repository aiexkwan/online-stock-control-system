/**
 * Yesterday Transfer Count Widget
 * 顯示昨天 transfer done 的總數
 * 支援頁面的 time frame selector
 * 
 * 已優化為使用批量查詢系統和 MetricCard 通用組件
 * - 從 DashboardDataContext 獲取數據
 * - 使用 MetricCard 統一顯示邏輯
 * - 減少代碼重複，提高維護性
 */

'use client';

import React, { useMemo } from 'react';
import { TruckIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { format } from 'date-fns';
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';
import { MetricCard } from './common/data-display/MetricCard';

interface TransferCountData {
  count: number;
  trend: number;
  dateRange: {
    start: string;
    end: string;
  };
  optimized?: boolean;
}

const YesterdayTransferCountWidget = React.memo(function YesterdayTransferCountWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  // 使用批量查詢系統獲取數據
  const { data: widgetData, loading, error, refetch } = useWidgetData<TransferCountData>('yesterdayTransferCount');
  
  // 格式化顯示數據
  const displayData = useMemo(() => {
    if (!widgetData) {
      return {
        count: 0,
        trend: 0,
        dateRange: {
          start: timeFrame?.start.toISOString() || new Date().toISOString(),
          end: timeFrame?.end.toISOString() || new Date().toISOString()
        },
        optimized: false
      };
    }
    
    return {
      count: widgetData.count || 0,
      trend: widgetData.trend || 0,
      dateRange: widgetData.dateRange || {
        start: timeFrame?.start.toISOString() || new Date().toISOString(),
        end: timeFrame?.end.toISOString() || new Date().toISOString()
      },
      optimized: widgetData.optimized || false
    };
  }, [widgetData, timeFrame]);

  // 計算 trend 方向
  const trendDirection = displayData.trend > 0 ? 'up' : displayData.trend < 0 ? 'down' : 'neutral';

  // 格式化日期範圍
  const dateRangeText = `${format(new Date(displayData.dateRange.start), 'MMM d')} to ${format(new Date(displayData.dateRange.end), 'MMM d')}`;

  if (isEditMode) {
    return (
      <MetricCard
        title="Transfer Done"
        value={0}
        label="Total Transfers"
        icon={TruckIcon}
        isEditMode={true}
      />
    );
  }

  return (
    <MetricCard
      title="Transfer Done"
      value={displayData.count}
      label="Total Transfers"
      icon={TruckIcon}
      trend={trendDirection}
      trendValue={`${Math.abs(displayData.trend).toFixed(1)}%`}
      trendLabel="vs Today"
      dateRange={dateRangeText}
      performanceMetrics={displayData.optimized ? {
        source: 'Batch',
        optimized: true
      } : undefined}
      loading={loading}
      error={error}
      onRetry={refetch}
      animateOnMount={true}
      widgetType={widget.type.toUpperCase() as any}
    />
  );
});

export default YesterdayTransferCountWidget;

/**
 * Migration History:
 * 
 * 1. @deprecated Legacy implementation with dual GraphQL queries
 *    Migrated to hybrid architecture on 2025-07-07
 *    - Query count: 2 GraphQL queries → 1 optimized server query
 *    - Data processing: Client-side edges.length → Server-side COUNT aggregation
 *    - Bundle reduction: Removed GraphQL client dependencies
 *    - Caching: None → 3-minute TTL with automatic revalidation
 *    - Trend calculation: Client-side → Server-side with single query
 * 
 * 2. Migrated to batch query system on 2025-07-10
 *    - Changed from individual API calls to DashboardDataContext
 *    - Single batch query serves multiple widgets
 *    - Unified loading states and error handling
 *    - Automatic cache management through context provider
 *    - Reduced network requests: 1 per widget → 1 total for dashboard
 */
