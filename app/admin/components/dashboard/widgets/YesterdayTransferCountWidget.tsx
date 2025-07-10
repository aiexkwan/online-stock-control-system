/**
 * Yesterday Transfer Count Widget
 * 顯示昨天 transfer done 的總數
 * 支援頁面的 time frame selector
 * 
 * 已優化為使用批量查詢系統
 * - 從 DashboardDataContext 獲取數據
 * - 減少獨立 API 調用
 * - 統一錯誤處理和加載狀態
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { TruckIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { format } from 'date-fns';
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';
import { WidgetSkeleton, WidgetError } from './common/WidgetStates';

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

  if (isEditMode) {
    return (
      <WidgetCard widgetType={widget.type.toUpperCase() as keyof typeof WidgetStyles.borders} isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='text-gray-400'>Transfer Count Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType={widget.type.toUpperCase() as keyof typeof WidgetStyles.borders}>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <TruckIcon className='h-5 w-5' />
          Transfer Done
        </CardTitle>
        <p className='mt-1 text-xs text-slate-400'>
          From {format(new Date(displayData.dateRange.start), 'MMM d')} to{' '}
          {format(new Date(displayData.dateRange.end), 'MMM d')}
        </p>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center'>
        {loading ? (
          <WidgetSkeleton 
            rows={0}
            className='w-full'
          >
            <div className='space-y-2'>
              <div className='h-10 w-24 animate-pulse rounded bg-slate-700/50 mx-auto' />
              <div className='h-4 w-20 animate-pulse rounded bg-slate-700/50 mx-auto' />
            </div>
          </WidgetSkeleton>
        ) : error ? (
          <WidgetError 
            error={error}
            onRetry={refetch}
            message='Failed to load transfer count'
          />
        ) : (
          <div className='text-center'>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className='mb-2 text-4xl font-bold text-white'
            >
              {displayData.count.toLocaleString()}
            </motion.div>
            <p className='text-xs text-slate-400'>Total Transfers</p>

            {/* Performance indicator - 來自批量查詢 */}
            {displayData.optimized && (
              <div className='mt-1 flex items-center justify-center gap-1 text-xs text-blue-400'>
                <span>⚡</span>
                <span>Batch Optimized</span>
              </div>
            )}

            {displayData.trend !== 0 && (
              <div
                className={cn(
                  'mt-2 flex items-center justify-center gap-1 text-sm',
                  displayData.trend > 0 ? 'text-green-400' : 'text-red-400'
                )}
              >
                {displayData.trend > 0 ? (
                  <ArrowTrendingUpIcon className='h-4 w-4' />
                ) : (
                  <ArrowTrendingDownIcon className='h-4 w-4' />
                )}
                <span>{Math.abs(displayData.trend).toFixed(1)}% vs Today</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </WidgetCard>
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
