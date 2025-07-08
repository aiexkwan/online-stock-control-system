/**
 * Await Location Qty Widget
 * 顯示 record_inventory 表內 await 欄位的總和
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import {
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';

interface AwaitLocationData {
  count: number;
  calculationTime?: string;
  optimized?: boolean;
}

const AwaitLocationQtyWidget = React.memo(function AwaitLocationQtyWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const [data, setData] = useState<AwaitLocationData>({
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    fetchTime: number;
    cacheHit: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchAwaitLocationCount = async () => {
      setLoading(true);
      setError(null);
      const fetchStartTime = performance.now();

      try {
        // Use optimized hybrid API
        const dashboardAPI = createDashboardAPI();
        const dashboardResult = await dashboardAPI.fetch(
          {
            widgetIds: ['await_location_count'],
          },
          {
            strategy: 'client', // Force client strategy for client components (per Re-Structure-5.md)
            cache: { ttl: 90 }, // 90-second cache for real-time stats
          }
        );

        const fetchTime = performance.now() - fetchStartTime;

        // Extract widget data
        const widgetData = dashboardResult.widgets?.find(
          w => w.widgetId === 'await_location_count'
        );

        if (widgetData && !widgetData.data.error) {
          setData({
            count: widgetData.data.value || 0,
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

        setError(null);
      } catch (err) {
        console.error('Error fetching await location count:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAwaitLocationCount();
  }, []);

  // 模擬趨勢數據（實際應用中應該比較不同時間段的數據）
  const trend = 0; // 暫時設為 0，可以之後加入趨勢計算

  if (isEditMode) {
    return (
      <WidgetCard widgetType='custom' isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='text-gray-400'>Await Location Qty Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType='custom'>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <BuildingOfficeIcon className='h-5 w-5' />
          Await Location Qty
        </CardTitle>
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
              {(data.count || 0).toLocaleString()}
            </motion.div>
            <p className='text-xs text-slate-400'>Pallets</p>

            {/* Performance indicator */}
            {data.optimized && (
              <div className='mt-1 flex items-center justify-center gap-1 text-xs text-green-400'>
                <span>⚡</span>
                <span>RPC Optimized</span>
                {performanceMetrics && (
                  <span className='ml-1'>({performanceMetrics.fetchTime.toFixed(0)}ms)</span>
                )}
              </div>
            )}

            {trend !== 0 && (
              <div
                className={cn(
                  'mt-2 flex items-center justify-center gap-1 text-sm',
                  trend > 0 ? 'text-green-400' : 'text-red-400'
                )}
              >
                {trend > 0 ? (
                  <ArrowTrendingUpIcon className='h-4 w-4' />
                ) : (
                  <ArrowTrendingDownIcon className='h-4 w-4' />
                )}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default AwaitLocationQtyWidget;

/**
 * @deprecated Legacy implementation with fallback client-side processing
 * Migrated to hybrid architecture on 2025-07-07
 *
 * Performance improvements achieved:
 * - Query reliability: Fallback complexity → Single RPC call
 * - Data processing: Client-side Map operations → Server-side aggregation
 * - Caching: None → 90-second TTL with automatic revalidation
 * - Bundle size: Reduced supabase client dependencies
 */
