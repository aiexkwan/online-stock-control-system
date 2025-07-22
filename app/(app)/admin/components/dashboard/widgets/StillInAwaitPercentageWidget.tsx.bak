/**
 * Still In Await Percentage Widget
 * 顯示指定時間生成的棧板中仍在 await location 的百分比
 * REST API 版本，已移除所有 GraphQL 相關代碼
 */

'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/types/components/dashboard';
import { getYesterdayRange } from '@/app/utils/timezone';
import { format } from 'date-fns';
import { MetricCardProgress } from './common';
// GraphQL imports removed - using REST API only
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';

// GraphQL query removed - using REST API only

interface AwaitStatsData {
  percentage: number;
  stillInAwait: number;
  totalMoved: number;
  calculationTime?: string;
  optimized?: boolean;
}

const StillInAwaitPercentageWidget = React.memo(function StillInAwaitPercentageWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      const range = getYesterdayRange();
      return {
        start: new Date(range.start),
        end: new Date(range.end),
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end,
    };
  }, [timeFrame]);

  // 使用 REST API 獲取數據
  const [apiData, setApiData] = useState<{
    percentage: number;
    stillAwait: number;
    totalPallets: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (isEditMode) return;

    setLoading(true);
    setError(null);

    try {
      const dashboardAPI = createDashboardAPI();
      const dashboardResult = await dashboardAPI.fetch(
        {
          widgetIds: ['await_percentage_stats'],
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          },
        },
        {
          strategy: 'client',
          cache: { ttl: 120 }, // 2-minute cache
        }
      );

      const widgetData = dashboardResult.widgets?.find(
        w => w.widgetId === 'await_percentage_stats'
      );

      if (
        widgetData &&
        !(
          typeof widgetData.data === 'object' &&
          widgetData.data !== null &&
          'error' in widgetData.data &&
          widgetData.data.error
        )
      ) {
        const percentage =
          typeof widgetData.data === 'object' &&
          widgetData.data !== null &&
          'value' in widgetData.data
            ? widgetData.data.value
            : 0;
        const metadata =
          typeof widgetData.data === 'object' &&
          widgetData.data !== null &&
          'metadata' in widgetData.data
            ? widgetData.data.metadata
            : {};
        const stillInAwait =
          typeof metadata === 'object' && metadata !== null && 'stillAwait' in metadata
            ? metadata.stillAwait
            : 0;
        const totalMoved =
          typeof metadata === 'object' && metadata !== null && 'totalPallets' in metadata
            ? metadata.totalPallets
            : 0;

        setApiData({
          percentage: typeof percentage === 'number' ? percentage : Number(percentage) || 0,
          stillAwait: typeof stillInAwait === 'number' ? stillInAwait : Number(stillInAwait) || 0,
          totalPallets: typeof totalMoved === 'number' ? totalMoved : Number(totalMoved) || 0,
        });
      } else {
        const errorMsg =
          widgetData &&
          typeof widgetData.data === 'object' &&
          widgetData.data !== null &&
          'error' in widgetData.data
            ? String(widgetData.data.error)
            : 'No data received';
        throw new Error(errorMsg);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, isEditMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 計算百分比數據
  const data = useMemo<AwaitStatsData>(() => {
    if (!apiData) {
      return { percentage: 0, stillInAwait: 0, totalMoved: 0 };
    }

    return {
      percentage: apiData.percentage,
      stillInAwait: apiData.stillAwait,
      totalMoved: apiData.totalPallets,
      optimized: true,
    };
  }, [apiData]);

  if (isEditMode) {
    return (
      <MetricCardProgress
        title='Still In Await %'
        value='--'
        percentage={0}
        icon={ChartPieIcon}
        loading={true}
      />
    );
  }

  return (
    <MetricCardProgress
      title='Still In Await %'
      value={`${data.percentage.toFixed(1)}%`}
      label={`${data.stillInAwait.toLocaleString()} / ${data.totalMoved.toLocaleString()} pallets`}
      percentage={data.percentage}
      icon={ChartPieIcon}
      iconColor='from-purple-500 to-pink-500'
      progressColor='bg-gradient-to-r from-purple-500 to-pink-500'
      dateRange={format(dateRange.start, 'MMM d')}
      performanceMetrics={{
        source: 'REST API',
        optimized: data.optimized,
      }}
      loading={loading}
      error={error}
      animateOnMount={true}
    />
  );
});

export default StillInAwaitPercentageWidget;

/**
 * Updated for GraphQL removal (2025-07-16)
 *
 * Changes:
 * - Removed all GraphQL dependencies (useGraphQLFallback, gql, GraphQL query)
 * - Converted to direct REST API usage via Dashboard API client
 * - Maintained all functionality with simplified architecture
 * - Removed GraphQL-to-REST transformation logic
 *
 * Features:
 * - Pure REST API data fetching
 * - Progress bar visualization for percentage
 * - Performance monitoring built-in
 * - 2-minute caching via Dashboard API client
 */
