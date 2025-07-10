/**
 * Transfer Time Distribution Widget - Apollo GraphQL Version
 * 以 no dot 線形圖顯示 transfer done 的時間分布
 * 支援頁面的 time frame selector
 * 自動將 time frame 分成 12 節顯示
 *
 * GraphQL Migration:
 * - 使用 Apollo Client 查詢 record_transfer
 * - Client-side 時間分組計算
 * - 支援 cache-and-network 策略
 * - 保留 Server Actions fallback
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, startOfHour, addHours } from 'date-fns';
import { getYesterdayRange } from '@/app/utils/timezone';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { useGetTransferTimeDistributionQuery } from '@/lib/graphql/generated/apollo-hooks';

// GraphQL 查詢已經移動到 lib/graphql/generated/apollo-hooks.ts

interface TimeDistributionData {
  timeSlots: Array<{
    time: string;
    value: number;
    fullTime: string;
  }>;
  totalTransfers: number;
  optimized?: boolean;
  calculationTime?: string;
  peakHour?: string;
}

export const TransferTimeDistributionWidget = React.memo(function TransferTimeDistributionWidget({
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
  } = useGetTransferTimeDistributionQuery({
    skip: !useGraphQL || isEditMode,
    variables: {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    },
    pollInterval: 300000, // 5分鐘輪詢
    fetchPolicy: 'cache-and-network',
  });

  // Server Actions fallback
  const [serverActionsData, setServerActionsData] = useState<TimeDistributionData>({
    timeSlots: [],
    totalTransfers: 0,
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
        // Use optimized DashboardAPI with server-side time aggregation
        const dashboardAPI = createDashboardAPI();
        const dashboardResult = await dashboardAPI.fetch(
          {
            widgetIds: ['transfer_time_distribution'],
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
          },
          {
            strategy: 'client', // Force client strategy for client components
            cache: { ttl: 300 }, // 5-minute cache for time distribution analysis
          }
        );

        const fetchTime = performance.now() - fetchStartTime;

        // Extract widget data
        const widgetData = dashboardResult.widgets?.find(
          w => w.widgetId === 'transfer_time_distribution'
        );

        if (widgetData && !widgetData.data.error) {
          const timeSlots = widgetData.data.value || [];

          setServerActionsData({
            timeSlots,
            totalTransfers: widgetData.data.metadata?.totalTransfers || 0,
            optimized: widgetData.data.metadata?.optimized,
            calculationTime: widgetData.data.metadata?.calculationTime,
            peakHour: widgetData.data.metadata?.peakHour,
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
        console.error('Error fetching transfer time distribution:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [dateRange, useGraphQL, isEditMode]);

  // 處理 GraphQL 數據 - 將時間分組為 12 個時間段
  const graphqlTimeDistribution = useMemo<TimeDistributionData>(() => {
    if (!graphqlData?.record_transferCollection?.edges) {
      return { timeSlots: [], totalTransfers: 0 };
    }

    const edges = graphqlData.record_transferCollection.edges;
    const totalTransfers = edges.length;

    // 計算時間範圍並分成 12 個時間段
    const timeSlotCount = 12;
    const totalMillis = dateRange.end.getTime() - dateRange.start.getTime();
    const slotMillis = totalMillis / timeSlotCount;

    // 初始化時間段
    const slots: Map<number, { time: string; value: number; fullTime: string }> = new Map();
    for (let i = 0; i < timeSlotCount; i++) {
      const slotStart = new Date(dateRange.start.getTime() + i * slotMillis);
      slots.set(i, {
        time: format(slotStart, 'HH:mm'),
        fullTime: format(slotStart, 'yyyy-MM-dd HH:mm'),
        value: 0,
      });
    }

    // 統計每個時間段的傳輸數量
    edges.forEach((edge: any) => {
      const tranDate = new Date(edge.node.tran_date);
      const timeDiff = tranDate.getTime() - dateRange.start.getTime();
      const slotIndex = Math.min(Math.floor(timeDiff / slotMillis), timeSlotCount - 1);
      
      if (slotIndex >= 0 && slotIndex < timeSlotCount) {
        const slot = slots.get(slotIndex)!;
        slot.value++;
      }
    });

    const timeSlots = Array.from(slots.values());
    
    // 找出高峰時段
    let peakHour = '';
    let maxValue = 0;
    timeSlots.forEach(slot => {
      if (slot.value > maxValue) {
        maxValue = slot.value;
        peakHour = slot.time;
      }
    });

    return {
      timeSlots,
      totalTransfers,
      peakHour,
      optimized: true,
    };
  }, [graphqlData, dateRange]);

  // 合併數據源
  const data = useGraphQL ? graphqlTimeDistribution : serverActionsData;
  const loading = useGraphQL ? graphqlLoading : serverActionsLoading;
  const error = useGraphQL ? graphqlError : (serverActionsError ? new Error(serverActionsError) : null);

  if (isEditMode) {
    return (
      <WidgetCard widgetType={widget.type.toUpperCase() as keyof typeof WidgetStyles.borders} isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Transfer Time Distribution</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType={widget.type.toUpperCase() as keyof typeof WidgetStyles.borders}>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <ChartBarIcon className='h-5 w-5' />
          Transfer Time Distribution
        </CardTitle>
        <p className='mt-1 text-xs text-slate-400'>
          From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
        </p>
      </CardHeader>
      <CardContent className='flex-1'>
        {loading ? (
          <div className='flex h-full items-center justify-center'>
            <div className='h-32 w-full animate-pulse rounded bg-slate-700/50' />
          </div>
        ) : error ? (
          <div className='text-center text-sm text-red-400'>
            <p>Error loading data</p>
            <p className='mt-1 text-xs'>{error.message}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className='h-full'
          >
            <div className='h-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={data.timeSlots} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                  <XAxis
                    dataKey='time'
                    stroke='#94a3b8'
                    fontSize={10}
                    angle={-45}
                    textAnchor='end'
                    height={60}
                  />
                  <YAxis stroke='#94a3b8' fontSize={11} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={label => `Time: ${label}`}
                    formatter={(value: any) => [value, 'Transfers']}
                  />
                  <Line
                    type='monotone'
                    dataKey='value'
                    stroke='#3b82f6'
                    strokeWidth={2}
                    dot={false} // No dots as requested
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Performance and metadata indicators */}
              {data.optimized && (
                <div className='absolute right-2 top-2 flex items-center gap-1 text-xs text-blue-400'>
                  <span>⚡</span>
                  <span>{useGraphQL ? 'GraphQL' : 'Optimized'}</span>
                  {performanceMetrics && !useGraphQL && (
                    <span className='ml-1'>({performanceMetrics.fetchTime.toFixed(0)}ms)</span>
                  )}
                </div>
              )}

              {data.peakHour && (
                <div className='absolute bottom-2 left-2 text-xs text-slate-400'>
                  Peak: {data.peakHour}
                </div>
              )}

              <div className='absolute bottom-2 right-2 text-xs text-slate-400'>
                Total: {data.totalTransfers} transfers
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default TransferTimeDistributionWidget;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client with cache-and-network policy
 * - Client-side time slot aggregation (12 slots)
 * - Peak hour detection
 * - 5-minute polling for real-time updates
 * - Fallback to Server Actions when GraphQL disabled
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_AWAIT
 * 
 * Performance considerations:
 * - Query optimization: Fetches only required fields
 * - Time aggregation: Efficient client-side grouping algorithm
 * - Caching: Apollo InMemoryCache reduces redundant queries
 * - Visualization: No-dot line chart as per requirements
 */
