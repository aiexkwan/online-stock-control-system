/**
 * Still In Await Widget
 * 顯示昨天完成但今天仍在 await location 的數量
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { ClockIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { GET_STILL_IN_AWAIT_STATS } from '@/lib/graphql/queries';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getYesterdayRange, getDateRange } from '@/app/utils/timezone';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export const StillInAwaitWidget = React.memo(function StillInAwaitWidget({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  const [stillInAwaitCount, setStillInAwaitCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      const range = getYesterdayRange();
      return {
        start: new Date(range.start),
        end: new Date(range.end)
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end
    };
  }, [timeFrame]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        
        // 1. 獲取昨天移動到 Await 的棧板
        const { data: historyData, error: historyError } = await supabase
          .from('record_history')
          .select('plt_num, time')
          .eq('action', 'Move')
          .eq('loc', 'Await')
          .gte('time', dateRange.start.toISOString())
          .lte('time', dateRange.end.toISOString());

        if (historyError) throw historyError;

        if (!historyData || historyData.length === 0) {
          setStillInAwaitCount(0);
          setLoading(false);
          return;
        }

        // 2. 獲取這些棧板的當前位置
        const palletNumbers = historyData.map(h => h.plt_num);
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('record_inventory')
          .select('plt_num, await')
          .in('plt_num', palletNumbers)
          .gt('await', 0);

        if (inventoryError) throw inventoryError;

        // 3. 計算仍在 await 的數量
        const stillInAwait = inventoryData?.filter(inv => inv.await > 0) || [];
        
        // 獲取這些棧板的數量總和
        let totalQty = 0;
        if (stillInAwait.length > 0) {
          const { data: palletData, error: palletError } = await supabase
            .from('record_palletinfo')
            .select('plt_num, product_qty')
            .in('plt_num', stillInAwait.map(p => p.plt_num));

          if (palletError) throw palletError;

          totalQty = palletData?.reduce((sum, pallet) => sum + (pallet.product_qty || 0), 0) || 0;
        }

        setStillInAwaitCount(totalQty);
      } catch (err) {
        console.error('Error fetching still in await data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Still In Await Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <div className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Still In Await
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">
            From {format(dateRange.start, 'MMM d')}
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          {loading ? (
            <div className="space-y-2 w-full">
              <div className="h-8 bg-slate-700/50 rounded animate-pulse" />
              <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center">
              <p>Error loading data</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-4xl font-bold text-white mb-2"
              >
                {stillInAwaitCount.toLocaleString()}
              </motion.div>
              <p className="text-sm text-gray-400">Quantity</p>
            </div>
          )}
        </CardContent>
      </div>
    </WidgetCard>
  );
});