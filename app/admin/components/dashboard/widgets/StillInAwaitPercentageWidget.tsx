/**
 * Still In Await Percentage Widget - Apollo GraphQL Version
 * 顯示指定時間生成的棧板中仍在 await location 的百分比
 * 支援頁面的 time frame selector
 * 
 * GraphQL Migration:
 * - 使用 Apollo Client 共享查詢
 * - 複用 StillInAwaitWidget 的 GraphQL 查詢
 * - Client-side 計算百分比
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { motion } from 'framer-motion';
import { getYesterdayRange } from '@/app/utils/timezone';
import { format } from 'date-fns';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { useGetStillInAwaitPercentageWidgetQuery } from '@/lib/graphql/generated/apollo-hooks';

// GraphQL 查詢已經移動到 lib/graphql/generated/apollo-hooks.ts

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
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    fetchTime: number;
    cacheHit: boolean;
  } | null>(null);

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

  // 使用環境變量控制是否使用 GraphQL
  const useGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_AWAIT === 'true' || 
                     widget?.config?.useGraphQL === true;

  // 使用 GraphQL Codegen 生成嘅 hook
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError 
  } = useGetStillInAwaitPercentageWidgetQuery({
    skip: !useGraphQL || isEditMode,
    variables: {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    },
    pollInterval: 120000, // 2分鐘輪詢
    fetchPolicy: 'cache-and-network',
  });

  // Server Actions fallback
  const [serverActionsData, setServerActionsData] = useState<AwaitStatsData>({
    percentage: 0,
    stillInAwait: 0,
    totalMoved: 0,
  });
  const [serverActionsLoading, setServerActionsLoading] = useState(!useGraphQL);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);

  useEffect(() => {
    if (useGraphQL || isEditMode) return;

    const fetchData = async () => {
      setServerActionsLoading(true);
      setServerActionsError(null);
      const fetchStartTime = performance.now();

      try {
        // Use optimized hybrid API
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
            strategy: 'client', // Force client strategy for client components (per Re-Structure-5.md)
            cache: { ttl: 120 }, // 2-minute cache for complex calculations
          }
        );

        const fetchTime = performance.now() - fetchStartTime;

        // Extract widget data
        const widgetData = dashboardResult.widgets?.find(
          w => w.widgetId === 'await_percentage_stats'
        );

        if (widgetData && !widgetData.data.error) {
          setServerActionsData({
            percentage: widgetData.data.value || 0,
            stillInAwait: widgetData.data.metadata?.stillAwait || 0,
            totalMoved: widgetData.data.metadata?.totalPallets || 0,
            calculationTime: widgetData.data.metadata?.calculationTime,
            optimized: widgetData.data.metadata?.optimized,
          });

          setPerformanceMetrics({
            fetchTime,
            cacheHit: dashboardResult.metadata?.cacheHit || false,
          });
        } else {
          throw new Error(widgetData?.data.error || 'No data received');
        }

        setServerActionsError(null);
      } catch (err) {
        console.error('Error fetching await percentage stats:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [dateRange, useGraphQL, isEditMode]);

  // 計算 GraphQL 數據
  const graphqlStats = useMemo<AwaitStatsData>(() => {
    if (!graphqlData?.record_palletinfoCollection?.edges) {
      return { percentage: 0, stillInAwait: 0, totalMoved: 0 };
    }

    const edges = graphqlData.record_palletinfoCollection.edges;
    const totalPallets = edges.length;
    let stillInAwaitCount = 0;

    // 計算仍在 await location 的棧板數量
    edges.forEach((edge: any) => {
      const inventoryEdges = edge.node.record_inventoryCollection?.edges || [];
      // await 是數字，不是 boolean，检查是否 > 0
      const hasAwaitRecord = inventoryEdges.some((invEdge: any) => invEdge.node.await > 0);
      if (hasAwaitRecord) {
        stillInAwaitCount++;
      }
    });

    const percentage = totalPallets > 0 ? (stillInAwaitCount / totalPallets) * 100 : 0;

    return {
      percentage,
      stillInAwait: stillInAwaitCount,
      totalMoved: totalPallets,
      optimized: true,
    };
  }, [graphqlData]);

  // 合併數據源
  const data = useGraphQL ? graphqlStats : serverActionsData;
  const loading = useGraphQL ? graphqlLoading : serverActionsLoading;
  const error = useGraphQL ? graphqlError : (serverActionsError ? new Error(serverActionsError) : null);

  if (isEditMode) {
    return (
      <WidgetCard widgetType='custom' isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Still In Await % Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType='custom'>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <ChartPieIcon className='h-5 w-5' />
          Still In Await %
        </CardTitle>
        <p className='mt-1 text-xs text-slate-400'>From {format(dateRange.start, 'MMM d')}</p>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center'>
        {loading ? (
          <div className='w-full space-y-2'>
            <div className='h-8 animate-pulse rounded bg-slate-700/50' />
            <div className='h-4 w-3/4 animate-pulse rounded bg-slate-700/50' />
          </div>
        ) : error ? (
          <div className='text-center text-sm text-red-400'>
            <p>Error loading data</p>
            <p className='mt-1 text-xs'>{error.message}</p>
          </div>
        ) : (
          <div className='text-center'>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className='relative'
            >
              <div className='mb-2 text-4xl font-bold text-white'>
                {data.percentage.toFixed(1)}%
              </div>
              <div className='widget-text-sm'>
                {data.stillInAwait.toLocaleString()} / {data.totalMoved.toLocaleString()} pallets
              </div>

              {/* Performance indicator */}
              {data.optimized && (
                <div className='mt-1 flex items-center gap-1 text-xs text-blue-400'>
                  <span>⚡</span>
                  <span>{useGraphQL ? 'GraphQL' : 'Optimized'}</span>
                  {performanceMetrics && !useGraphQL && (
                    <span className='ml-1'>({performanceMetrics.fetchTime.toFixed(0)}ms)</span>
                  )}
                </div>
              )}
            </motion.div>

            {/* 進度條視覺化 */}
            <div className='mt-4 h-2 w-full rounded-full bg-slate-700'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.percentage}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className='h-2 rounded-full bg-blue-500'
              />
            </div>
          </div>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default StillInAwaitPercentageWidget;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client with cache-and-network policy
 * - Reuses GET_STILL_IN_AWAIT query from StillInAwaitWidget
 * - Client-side percentage calculation
 * - 2-minute polling for real-time updates
 * - Fallback to Server Actions when GraphQL disabled
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_AWAIT
 * 
 * Performance improvements:
 * - Query efficiency: Single GraphQL query shared with StillInAwaitWidget
 * - Data processing: Lightweight client-side calculation
 * - Caching: Apollo InMemoryCache with automatic updates
 * - Network optimization: Shared query reduces redundant requests
 */
