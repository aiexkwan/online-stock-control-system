/**
 * Still In Await Widget
 * 顯示指定時間生成的棧板中仍在 await location 的數量
 * 支援頁面的 time frame selector
 *
 * 已遷移至統一架構：
 * - 使用 DashboardAPI 統一數據訪問
 * - 服務器端 JOIN 和計算
 * - 優化性能和代碼結構
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
import { format } from 'date-fns';

export const StillInAwaitWidget = React.memo(function StillInAwaitWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const [stillInAwaitCount, setStillInAwaitCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

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
            cache: { ttl: 120 }, // 2分鐘緩存
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];

          if (widgetData.data.error) {
            console.error('[StillInAwaitWidget] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setStillInAwaitCount(0);
            return;
          }

          const awaitCount = widgetData.data.value || 0;
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[StillInAwaitWidget] API returned count:', awaitCount);
          console.log('[StillInAwaitWidget] Metadata:', widgetMetadata);

          // 使用 API 返回的數據，已經經過優化處理
          setStillInAwaitCount(awaitCount);
          setMetadata(widgetMetadata);

          console.log('[StillInAwaitWidget] Data processed successfully using optimized API');
        } else {
          console.warn('[StillInAwaitWidget] No widget data returned from API');
          setStillInAwaitCount(0);
        }
      } catch (err) {
        console.error('[StillInAwaitWidget] Error fetching data from API:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStillInAwaitCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, dashboardAPI]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Still In Await Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <ClockIcon className='h-5 w-5' />
          Still In Await
        </CardTitle>
        <p className='mt-1 text-xs text-slate-400'>
          From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
          {metadata.calculationTime && (
            <span className='ml-2 text-xs text-emerald-400'>({metadata.calculationTime})</span>
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
