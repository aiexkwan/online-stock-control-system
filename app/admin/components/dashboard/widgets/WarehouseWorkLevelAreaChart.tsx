/**
 * Warehouse Work Level Area Chart Widget - Apollo GraphQL Version
 * Area Chart 形式顯示 work_level 內容
 * 只顯示 operator department = "Warehouse"
 * 顯示 move 數據
 *
 * GraphQL Migration:
 * - 使用 Apollo Client 查詢 work_level + data_id JOIN
 * - GraphQL 層級過濾 department = "Warehouse"
 * - Client-side 日期分組聚合
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, startOfDay } from 'date-fns';
import { getYesterdayRange } from '@/app/utils/timezone';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { useGetWarehouseWorkLevelQuery } from '@/lib/graphql/generated/apollo-hooks';

// GraphQL 查詢已經移動到 lib/graphql/generated/apollo-hooks.ts

interface WorkLevelData {
  date: string;
  value: number;
  fullDate?: string;
}

interface WorkLevelStats {
  dailyStats: WorkLevelData[];
  totalMoves: number;
  uniqueOperators: number;
  avgMovesPerDay: number;
  peakDay?: string;
  optimized?: boolean;
  calculationTime?: string;
}

export const WarehouseWorkLevelAreaChart = React.memo(function WarehouseWorkLevelAreaChart({
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
  } = useGetWarehouseWorkLevelQuery({
    skip: !useGraphQL || isEditMode,
    variables: {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    },
    pollInterval: 180000, // 3分鐘輪詢
    fetchPolicy: 'cache-and-network',
  });

  // Server Actions fallback
  const [serverActionsData, setServerActionsData] = useState<WorkLevelStats>({
    dailyStats: [],
    totalMoves: 0,
    uniqueOperators: 0,
    avgMovesPerDay: 0,
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
        // Use optimized DashboardAPI with server-side JOIN and filtering
        const dashboardAPI = createDashboardAPI();
        const dashboardResult = await dashboardAPI.fetch(
          {
            widgetIds: ['warehouse_work_level'],
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
          },
          {
            strategy: 'client', // Force client strategy for client components
            cache: { ttl: 180 }, // 3-minute cache for work level analysis
          }
        );

        const fetchTime = performance.now() - fetchStartTime;

        // Extract widget data
        const widgetData = dashboardResult.widgets?.find(
          w => w.widgetId === 'warehouse_work_level'
        );

        if (widgetData && !widgetData.data.error) {
          const dailyStats = widgetData.data.value || [];

          setServerActionsData({
            dailyStats,
            totalMoves: widgetData.data.metadata?.totalMoves || 0,
            uniqueOperators: widgetData.data.metadata?.uniqueOperators || 0,
            avgMovesPerDay: widgetData.data.metadata?.avgMovesPerDay || 0,
            peakDay: widgetData.data.metadata?.peakDay,
            optimized: widgetData.data.metadata?.optimized,
            calculationTime: widgetData.data.metadata?.calculationTime,
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
        console.error('Error fetching warehouse work level:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [dateRange, useGraphQL, isEditMode]);

  // 處理 GraphQL 數據 - 按日期分組聚合
  const graphqlWorkLevelStats = useMemo<WorkLevelStats>(() => {
    if (!graphqlData?.work_levelCollection?.edges) {
      return { dailyStats: [], totalMoves: 0, uniqueOperators: 0, avgMovesPerDay: 0 };
    }

    const edges = graphqlData.work_levelCollection.edges;
    
    // 按日期分組聚合 move 數據
    const dailyMap = new Map<string, number>();
    const operatorSet = new Set<number>();
    let totalMoves = 0;

    edges.forEach((edge: any) => {
      const date = format(startOfDay(new Date(edge.node.latest_update)), 'MMM d');
      const moves = edge.node.move || 0;
      
      dailyMap.set(date, (dailyMap.get(date) || 0) + moves);
      operatorSet.add(edge.node.id);
      totalMoves += moves;
    });

    // 轉換為數組格式
    const dailyStats: WorkLevelData[] = Array.from(dailyMap.entries())
      .map(([date, value]) => ({
        date,
        value,
        fullDate: date,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 計算統計數據
    const avgMovesPerDay = dailyStats.length > 0 ? totalMoves / dailyStats.length : 0;
    
    // 找出高峰日
    let peakDay = '';
    let maxMoves = 0;
    dailyStats.forEach(stat => {
      if (stat.value > maxMoves) {
        maxMoves = stat.value;
        peakDay = stat.date;
      }
    });

    return {
      dailyStats,
      totalMoves,
      uniqueOperators: operatorSet.size,
      avgMovesPerDay,
      peakDay,
      optimized: true,
    };
  }, [graphqlData]);

  // 合併數據源
  const data = useGraphQL ? graphqlWorkLevelStats : serverActionsData;
  const loading = useGraphQL ? graphqlLoading : serverActionsLoading;
  const error = useGraphQL ? graphqlError : (serverActionsError ? new Error(serverActionsError) : null);

  if (isEditMode) {
    return (
      <WidgetCard widgetType={widget.type.toUpperCase() as keyof typeof WidgetStyles.borders} isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Warehouse Work Level Chart</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType={widget.type.toUpperCase() as keyof typeof WidgetStyles.borders}>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <ChartBarIcon className='h-5 w-5' />
          Warehouse Work Level
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
        ) : data.dailyStats.length === 0 ? (
          <div className='py-8 text-center font-medium text-slate-400'>
            <ChartBarIcon className='mx-auto mb-2 h-12 w-12 opacity-50' />
            <p>No work level data found</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className='h-full'
          >
            <div className='relative h-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={data.dailyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                  <XAxis dataKey='date' stroke='#94a3b8' fontSize={11} />
                  <YAxis stroke='#94a3b8' fontSize={11} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={label => `Date: ${label}`}
                    formatter={(value: any, name: any, props: any) => [
                      `${value} moves`,
                      'Total Moves',
                    ]}
                  />
                  <Area
                    type='monotone'
                    dataKey='value'
                    stroke='#3b82f6'
                    fill='#3b82f6'
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
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

              {/* Summary stats */}
              <div className='absolute bottom-2 left-2 space-y-0.5 text-xs text-slate-400'>
                <div>Total: {data.totalMoves.toLocaleString()} moves</div>
                <div>{data.uniqueOperators} operators</div>
                {data.peakDay && <div>Peak: {data.peakDay}</div>}
              </div>

              {data.avgMovesPerDay > 0 && (
                <div className='absolute bottom-2 right-2 text-xs text-slate-400'>
                  Avg: {data.avgMovesPerDay.toFixed(0)} moves/day
                </div>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default WarehouseWorkLevelAreaChart;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client with GraphQL relationship filtering
 * - Built-in JOIN with data_id table for department filtering
 * - Client-side daily aggregation of move data
 * - Peak day detection and statistics
 * - 3-minute polling for real-time updates
 * - Fallback to Server Actions when GraphQL disabled
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_AWAIT
 * 
 * Performance improvements:
 * - Query efficiency: GraphQL handles JOIN automatically
 * - Department filtering: Done at GraphQL layer, not client-side
 * - Data aggregation: Efficient Map-based daily grouping
 * - Caching: Apollo InMemoryCache with automatic updates
 */
