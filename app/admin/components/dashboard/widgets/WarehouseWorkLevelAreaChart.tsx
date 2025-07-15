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
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
// Note: Migrated to REST API - GraphQL hooks removed
import { WidgetSkeleton } from './common/WidgetStates';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

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
        <p className={cn('mt-1', textClasses['label-small'], 'text-muted-foreground')}>
          From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
        </p>
      </CardHeader>
      <CardContent className='flex-1'>
        {loading ? (
          <WidgetSkeleton type="chart-area" height={200} />
        ) : error ? (
          <div className={cn('text-center', textClasses['body-small'])} style={{ color: semanticColors.destructive.DEFAULT }}>
            <p>Error loading data</p>
            <p className={cn('mt-1', textClasses['label-small'])}>{error.message}</p>
          </div>
        ) : data.dailyStats.length === 0 ? (
          <div className={cn('py-8 text-center font-medium', textClasses['body-base'], 'text-muted-foreground')}>
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
                  <CartesianGrid strokeDasharray='3 3' stroke={widgetColors.charts.grid} />
                  <XAxis dataKey='date' stroke={widgetColors.charts.axis} fontSize={11} />
                  <YAxis stroke={widgetColors.charts.axis} fontSize={11} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
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
                    stroke={widgetColors.charts.primary}
                    fill={widgetColors.charts.primary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Performance and metadata indicators */}
              {data.optimized && (
                <div className={cn(
                  'absolute right-2 top-2 flex items-center',
                  spacingUtilities.gap.small,
                  textClasses['label-small']
                )} style={{ color: semanticColors.info.DEFAULT }}>
                  <span>⚡</span>
                  <span>{useGraphQL ? 'GraphQL' : 'Optimized'}</span>
                  {performanceMetrics && !useGraphQL && (
                    <span className='ml-1'>({performanceMetrics.fetchTime.toFixed(0)}ms)</span>
                  )}
                </div>
              )}

              {/* Summary stats */}
              <div className={cn(
                'absolute bottom-2 left-2 space-y-0.5',
                textClasses['label-small'],
                'text-muted-foreground'
              )}>
                <div>Total: {data.totalMoves.toLocaleString()} moves</div>
                <div>{data.uniqueOperators} operators</div>
                {data.peakDay && <div>Peak: {data.peakDay}</div>}
              </div>

              {data.avgMovesPerDay > 0 && (
                <div className={cn(
                  'absolute bottom-2 right-2',
                  textClasses['label-small'],
                  'text-muted-foreground'
                )}>
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
