/**
 * Still In Await Widget
 * 顯示指定時間生成的棧板中仍在 await location 的數量
 * 使用統一的 useUnifiedAPI hook 和 MetricCard 組件
 */

'use client';

import React, { useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/types/components/dashboard';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { getYesterdayRange } from '@/app/utils/timezone';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useUnifiedAPI } from '@/app/(app)/admin/hooks/useUnifiedAPI';
import { MetricCard } from './common';

// REST API endpoint for still in await data
const STILL_IN_AWAIT_API_ENDPOINT = '/api/admin/dashboard/widgets/still-in-await';

export const StillInAwaitWidget = React.memo(function StillInAwaitWidget({
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

  // 使用統一的 API hook
  const {
    data: apiData,
    loading,
    error,
  } = useUnifiedAPI<
    { count: number; totalPallets: number },
    { startDate: string; endDate: string }
  >({
    restEndpoint: STILL_IN_AWAIT_API_ENDPOINT,
    restMethod: 'GET',
    variables: {
      startDate: startOfDay(dateRange.start).toISOString(),
      endDate: endOfDay(dateRange.end).toISOString(),
    },
    skip: isEditMode,
    widgetId: 'StillInAwaitWidget',
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    staleTime: 2 * 60 * 1000, // 2 minutes stale time
  });

  // 從 API 數據中提取計算結果
  const { count, totalPallets } = useMemo(() => {
    if (!apiData) {
      return { count: 0, totalPallets: 0 };
    }

    return {
      count: apiData.count || 0,
      totalPallets: apiData.totalPallets || 0,
    };
  }, [apiData]);

  if (isEditMode) {
    return (
      <MetricCard
        title='Still In Await'
        value='--'
        label='Pallets'
        icon={ClockIcon}
        loading={true}
      />
    );
  }

  return (
    <MetricCard
      title='Still In Await'
      value={count}
      label={totalPallets > 0 ? `of ${totalPallets.toLocaleString()} total pallets` : 'Pallets'}
      icon={ClockIcon}
      iconColor='from-yellow-500 to-orange-500'
      dateRange={`${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`}
      performanceMetrics={{
        source: 'REST API',
        optimized: true,
      }}
      loading={loading}
      error={error}
      animateOnMount={true}
    />
  );
});

export default StillInAwaitWidget;

/**
 * Refactored on 2025-07-15 (v1.4.3 GraphQL Cleanup)
 *
 * Changes:
 * - Migrated from useGraphQLFallback to useUnifiedAPI
 * - Replaced GraphQL query with REST API endpoint
 * - Simplified data processing logic
 * - Removed Apollo Client dependency
 *
 * Features:
 * - REST API primary with unified routing
 * - Automatic caching and performance monitoring
 * - Simplified data structure
 * - Better error handling
 */
