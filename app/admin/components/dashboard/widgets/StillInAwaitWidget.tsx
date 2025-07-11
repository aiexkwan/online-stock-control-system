/**
 * Still In Await Widget
 * 顯示指定時間生成的棧板中仍在 await location 的數量
 * 使用統一的 useGraphQLFallback hook 和 MetricCard 組件
 */

'use client';

import React, { useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { getYesterdayRange } from '@/app/utils/timezone';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useGraphQLFallback, GraphQLFallbackPresets } from '@/app/admin/hooks/useGraphQLFallback';
import { MetricCard } from './common';
import { gql } from '@apollo/client';

// GraphQL Query
const GET_STILL_IN_AWAIT_OPTIMIZED = gql`
  query GetStillInAwaitOptimized($startDate: timestamptz!, $endDate: timestamptz!) {
    record_palletinfoCollection(
      filter: { generated_datetime: { gte: $startDate, lte: $endDate } }
      orderBy: [{ generated_datetime: DESC }]
    ) {
      edges {
        node {
          pallet_id
          generated_datetime
          record_inventoryCollection(
            filter: { await: { gt: 0 } }
            orderBy: [{ datetime_in: DESC }]
            first: 1
          ) {
            edges {
              node {
                await
                location
                datetime_in
              }
            }
          }
        }
      }
    }
  }
`;

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

  // 使用統一的 GraphQL fallback hook
  const { 
    data: graphqlData, 
    loading, 
    error 
  } = useGraphQLFallback<
    { record_palletinfoCollection: { edges: Array<{ node: any }> } },
    { startDate: string; endDate: string }
  >({
    graphqlQuery: GET_STILL_IN_AWAIT_OPTIMIZED,
    serverAction: async () => {
      // Server Actions fallback
      const dashboardAPI = createDashboardAPI();
      const dashboardResult = await dashboardAPI.fetch(
        {
          widgetIds: ['still_in_await'],
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
        w => w.widgetId === 'still_in_await'
      );

      if (widgetData && !widgetData.data.error) {
        // Transform server data to match GraphQL format
        const count = widgetData.data.value || 0;
        const totalPallets = widgetData.data.metadata?.totalPallets || 0;
        
        // Create mock GraphQL response
        const mockEdges = [];
        for (let i = 0; i < totalPallets; i++) {
          mockEdges.push({
            node: {
              pallet_id: `mock-${i}`,
              generated_datetime: dateRange.start.toISOString(),
              record_inventoryCollection: {
                edges: i < count ? [{ node: { await: 1 } }] : []
              }
            }
          });
        }
        
        return {
          record_palletinfoCollection: {
            edges: mockEdges
          }
        };
      }
      
      throw new Error(widgetData?.data.error || 'No data received');
    },
    variables: {
      startDate: startOfDay(dateRange.start).toISOString(),
      endDate: endOfDay(dateRange.end).toISOString(),
    },
    skip: isEditMode,
    fallbackEnabled: true,
    widgetId: 'StillInAwaitWidget',
    ...GraphQLFallbackPresets.cached,
  });

  // 計算數據
  const { count, totalPallets } = useMemo(() => {
    if (!graphqlData?.record_palletinfoCollection?.edges) {
      return { count: 0, totalPallets: 0 };
    }

    const edges = graphqlData.record_palletinfoCollection.edges;
    let awaitCount = 0;
    
    // 計算所有 await > 0 的總數
    edges.forEach((edge: any) => {
      const inventoryEdges = edge.node.record_inventoryCollection?.edges || [];
      inventoryEdges.forEach((invEdge: any) => {
        if (invEdge.node.await > 0) {
          awaitCount += invEdge.node.await;
        }
      });
    });
    
    return { 
      count: awaitCount, 
      totalPallets: edges.length 
    };
  }, [graphqlData]);

  if (isEditMode) {
    return (
      <MetricCard
        title="Still In Await"
        value="--"
        label="Pallets"
        icon={ClockIcon}
        loading={true}
      />
    );
  }

  return (
    <MetricCard
      title="Still In Await"
      value={count}
      label={totalPallets > 0 ? `of ${totalPallets.toLocaleString()} total pallets` : 'Pallets'}
      icon={ClockIcon}
      iconColor="from-yellow-500 to-orange-500"
      dateRange={`${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`}
      performanceMetrics={{
        source: 'GraphQL',
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
 * Refactored on 2025-07-31 (Week 4 Day 1)
 * 
 * Changes:
 * - Migrated to useGraphQLFallback hook for unified data fetching
 * - Simplified implementation using MetricCard component
 * - Removed redundant state management
 * - Reduced from 277 lines to ~160 lines (42% reduction)
 * 
 * Features:
 * - GraphQL primary with Server Actions fallback
 * - Automatic caching via GraphQLFallbackPresets
 * - Performance monitoring built-in
 * - Real-time updates with polling
 */
