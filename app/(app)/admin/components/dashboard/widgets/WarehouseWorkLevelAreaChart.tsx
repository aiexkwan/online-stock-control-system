'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/types/components/dashboard';
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
  getWidgetCategoryColor,
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';
import {
  WarehouseWorkLevelData,
  WorkLevelStats as ImportedWorkLevelStats,
  PerformanceMetrics,
} from './types/SupplierWarehouseTypes';

interface WorkLevelData {
  date: string;
  value: number;
  fullDate?: string;
}

// 使用從 types 文件導入的類型
type WorkLevelStats = ImportedWorkLevelStats & {
  dailyStats: WorkLevelData[];
  totalMoves: number;
  uniqueOperators: number;
  avgMovesPerDay: number;
  peakDay?: string;
  optimized?: boolean;
  calculationTime?: string;
};

export const WarehouseWorkLevelAreaChart = React.memo(function WarehouseWorkLevelAreaChart({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

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

  // Using REST API only - GraphQL removed

  // Server Actions fallback
  const [serverActionsData, setServerActionsData] = useState<WorkLevelStats>({
    peak_hour: '',
    peak_level: 0,
    average_level: 0,
    total_efficiency: 0,
    busiest_warehouse: '',
    dailyStats: [],
    totalMoves: 0,
    uniqueOperators: 0,
    avgMovesPerDay: 0,
  });
  const [serverActionsLoading, setServerActionsLoading] = useState(true);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) return;

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

        if (
          widgetData &&
          !(
            typeof widgetData.data === 'object' &&
            widgetData.data !== null &&
            'error' in widgetData.data &&
            widgetData.data.error
          )
        ) {
          const dailyStats =
            typeof widgetData.data === 'object' &&
            widgetData.data !== null &&
            'value' in widgetData.data
              ? widgetData.data.value
              : [];
          const metadata =
            typeof widgetData.data === 'object' &&
            widgetData.data !== null &&
            'metadata' in widgetData.data
              ? widgetData.data.metadata
              : {};

          setServerActionsData({
            peak_hour:
              typeof metadata === 'object' && metadata !== null && 'peak_hour' in metadata
                ? String(metadata.peak_hour || '')
                : '',
            peak_level:
              typeof metadata === 'object' &&
              metadata !== null &&
              'peak_level' in metadata &&
              typeof metadata.peak_level === 'number'
                ? metadata.peak_level
                : 0,
            average_level:
              typeof metadata === 'object' &&
              metadata !== null &&
              'average_level' in metadata &&
              typeof metadata.average_level === 'number'
                ? metadata.average_level
                : 0,
            total_efficiency:
              typeof metadata === 'object' &&
              metadata !== null &&
              'total_efficiency' in metadata &&
              typeof metadata.total_efficiency === 'number'
                ? metadata.total_efficiency
                : 0,
            busiest_warehouse:
              typeof metadata === 'object' && metadata !== null && 'busiest_warehouse' in metadata
                ? String(metadata.busiest_warehouse || '')
                : '',
            dailyStats: Array.isArray(dailyStats) ? dailyStats : [],
            totalMoves:
              typeof metadata === 'object' &&
              metadata !== null &&
              'totalMoves' in metadata &&
              typeof metadata.totalMoves === 'number'
                ? metadata.totalMoves
                : 0,
            uniqueOperators:
              typeof metadata === 'object' &&
              metadata !== null &&
              'uniqueOperators' in metadata &&
              typeof metadata.uniqueOperators === 'number'
                ? metadata.uniqueOperators
                : 0,
            avgMovesPerDay:
              typeof metadata === 'object' &&
              metadata !== null &&
              'avgMovesPerDay' in metadata &&
              typeof metadata.avgMovesPerDay === 'number'
                ? metadata.avgMovesPerDay
                : 0,
            peakDay:
              typeof metadata === 'object' && metadata !== null && 'peakDay' in metadata
                ? String(metadata.peakDay || '')
                : undefined,
            optimized:
              typeof metadata === 'object' && metadata !== null && 'optimized' in metadata
                ? Boolean(metadata.optimized)
                : undefined,
            calculationTime:
              typeof metadata === 'object' && metadata !== null && 'calculationTime' in metadata
                ? String(metadata.calculationTime || '')
                : undefined,
          });

          setPerformanceMetrics({
            fetchTime,
            cacheHit: dashboardResult.metadata?.cacheHit || false,
          });
        } else {
          const errorMsg =
            typeof widgetData?.data === 'object' &&
            widgetData?.data !== null &&
            'error' in widgetData.data
              ? String(widgetData.data.error)
              : 'No data received';
          throw new Error(errorMsg);
        }

        setServerActionsError(null);
      } catch (err) {
        console.error('Error fetching warehouse work level:', err);
        setServerActionsError(
          err instanceof Error ? (err as { message: string }).message : 'Unknown error'
        );
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [dateRange, isEditMode]);

  // 使用 Server Actions 數據 (GraphQL 已移除)
  const data = serverActionsData;
  const loading = serverActionsLoading;
  const error = serverActionsError ? new Error(serverActionsError) : null;

  if (isEditMode) {
    return (
      <WidgetCard
        widgetType={(widget?.type?.toUpperCase() as keyof typeof WidgetStyles.borders) || 'DEFAULT'}
        isEditMode={true}
      >
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Warehouse Work Level Chart</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      widgetType={(widget?.type?.toUpperCase() as keyof typeof WidgetStyles.borders) || 'DEFAULT'}
    >
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
          <WidgetSkeleton type='chart-area' height={200} />
        ) : error ? (
          <div
            className={cn('text-center', textClasses['body-small'])}
            style={{ color: semanticColors.destructive.DEFAULT }}
          >
            <p>Error loading data</p>
            <p className={cn('mt-1', textClasses['label-small'])}>
              {(error as { message: string }).message}
            </p>
          </div>
        ) : data.dailyStats.length === 0 ? (
          <div
            className={cn(
              'py-8 text-center font-medium',
              textClasses['body-base'],
              'text-muted-foreground'
            )}
          >
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
                  <XAxis dataKey='date' stroke={widgetColors.charts.grid} fontSize={11} />
                  <YAxis stroke={widgetColors.charts.grid} fontSize={11} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelFormatter={label => `Date: ${label}`}
                    formatter={(value: unknown, name: string) => [`${value} moves`, 'Total Moves']}
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
                <div
                  className={cn(
                    'absolute right-2 top-2 flex items-center gap-2',
                    textClasses['label-small']
                  )}
                  style={{ color: semanticColors.info.DEFAULT }}
                >
                  <span>⚡</span>
                  <span>Optimized</span>
                  {performanceMetrics && performanceMetrics.fetchTime && (
                    <span className='ml-1'>({performanceMetrics.fetchTime.toFixed(0)}ms)</span>
                  )}
                </div>
              )}

              {/* Summary stats */}
              <div
                className={cn(
                  'absolute bottom-2 left-2 space-y-0.5',
                  textClasses['label-small'],
                  'text-muted-foreground'
                )}
              >
                <div>Total: {data.totalMoves.toLocaleString()} moves</div>
                <div>{data.uniqueOperators} operators</div>
                {data.peakDay && <div>Peak: {data.peakDay}</div>}
              </div>

              {data.avgMovesPerDay > 0 && (
                <div
                  className={cn(
                    'absolute bottom-2 right-2',
                    textClasses['label-small'],
                    'text-muted-foreground'
                  )}
                >
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
