/**
 * Still In Await Widget - GraphQL 版本
 * 顯示指定時間生成的棧板中仍在 await location 的數量
 * 支援頁面的 time frame selector
 * 使用 Apollo Client 進行數據查詢
 *
 * GraphQL Migration:
 * - 使用 Apollo Client 查詢
 * - 支援 cache-and-network 策略
 * - 保留 Server Actions fallback
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ClockIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { motion } from 'framer-motion';
import { getYesterdayRange } from '@/app/utils/timezone';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useGetStillInAwaitOptimizedQuery } from '@/lib/graphql/generated/apollo-hooks';

// GraphQL 查詢已經移動到 lib/graphql/generated/apollo-hooks.ts

export const StillInAwaitWidget = React.memo(function StillInAwaitWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const [stillInAwaitCount, setStillInAwaitCount] = useState(0);
  const [metadata, setMetadata] = useState<any>({});
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);

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
  } = useGetStillInAwaitOptimizedQuery({
    skip: !useGraphQL || isEditMode,
    variables: {
      startDate: startOfDay(dateRange.start).toISOString(),
      endDate: endOfDay(dateRange.end).toISOString(),
    },
    pollInterval: 120000, // 2分鐘輪詢
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      // 處理查詢結果：計算指定時間生成且仍在 await 的棧板數量
      const palletInfo = data?.record_palletinfoCollection?.edges || [];
      
      let count = 0;
      let totalPallets = palletInfo.length;
      
      // 每個棧板都有嵌套嘅 inventory collection
      palletInfo.forEach((edge: any) => {
        const inventoryEdges = edge.node.record_inventoryCollection?.edges || [];
        // 如果該棧板有 await > 0 嘅庫存記錄，加入計算
        inventoryEdges.forEach((invEdge: any) => {
          if (invEdge.node.await > 0) {
            count += invEdge.node.await;
          }
        });
      });
      
      setStillInAwaitCount(count);
      setMetadata({
        totalPallets,
        useGraphQL: true,
        calculationTime: new Date().toISOString(),
      });
    }
  });

  // Server Actions fallback
  const [serverActionsLoading, setServerActionsLoading] = useState(!useGraphQL);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);

  useEffect(() => {
    if (useGraphQL || isEditMode) return;

    const fetchData = async () => {
      setServerActionsLoading(true);
      setServerActionsError(null);

      try {
        // 使用統一的 DashboardAPI 獲取數據
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['statsCard'],
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
            params: {
              dataSource: 'await_location_count_by_timeframe',
            },
          },
          {
            strategy: 'server',
            cache: { ttl: 120 },
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];

          if (widgetData.data.error) {
            console.error('[StillInAwaitWidget] API error:', widgetData.data.error);
            setServerActionsError(widgetData.data.error);
            setStillInAwaitCount(0);
            return;
          }

          const awaitCount = widgetData.data.value || 0;
          const widgetMetadata = widgetData.data.metadata || {};

          setStillInAwaitCount(awaitCount);
          setMetadata({
            ...widgetMetadata,
            useGraphQL: false,
          });
        } else {
          console.warn('[StillInAwaitWidget] No widget data returned from API');
          setStillInAwaitCount(0);
        }
      } catch (err) {
        console.error('[StillInAwaitWidget] Error fetching data from API:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
        setStillInAwaitCount(0);
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [dateRange, dashboardAPI, useGraphQL, isEditMode]);

  // 合併 loading 和 error 狀態
  const loading = useGraphQL ? graphqlLoading : serverActionsLoading;
  const error = useGraphQL ? graphqlError?.message : serverActionsError;

  if (isEditMode) {
    return (
      <WidgetCard widgetType='custom' isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Still In Await Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType='custom'>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <ClockIcon className='h-5 w-5' />
          Still In Await
        </CardTitle>
        <p className='mt-1 text-xs text-slate-400'>
          From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
          {metadata.useGraphQL && (
            <span className='ml-2 text-xs text-blue-400'>⚡ GraphQL</span>
          )}
        </p>
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
            <p className='mt-1 text-xs'>{error}</p>
          </div>
        ) : (
          <div className='text-center'>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className='mb-2 text-4xl font-bold text-white'
            >
              {stillInAwaitCount.toLocaleString()}
            </motion.div>
            <p className='text-xs text-slate-400'>
              Pallets
              {metadata.totalPallets && (
                <span className='mt-1 block text-xs text-slate-500'>
                  of {metadata.totalPallets.toLocaleString()} total
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default StillInAwaitWidget;
