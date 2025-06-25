/**
 * Still In Await Percentage Widget
 * 顯示昨天完成但今天仍在 await location 的數量（以百分比顯示）
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { getYesterdayRange } from '@/app/utils/timezone';
import { format } from 'date-fns';

export const StillInAwaitPercentageWidget = React.memo(function StillInAwaitPercentageWidget({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  const [percentage, setPercentage] = useState(0);
  const [stillInAwait, setStillInAwait] = useState(0);
  const [totalMoved, setTotalMoved] = useState(0);
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
        
        // 1. 獲取昨天移動到 Await 的所有棧板
        const { data: historyData, error: historyError } = await supabase
          .from('record_history')
          .select('plt_num, time')
          .eq('action', 'Move')
          .eq('loc', 'Await')
          .gte('time', dateRange.start.toISOString())
          .lte('time', dateRange.end.toISOString());

        if (historyError) throw historyError;

        if (!historyData || historyData.length === 0) {
          setPercentage(0);
          setStillInAwait(0);
          setTotalMoved(0);
          setLoading(false);
          return;
        }

        const palletNumbers = historyData.map(h => h.plt_num);
        
        // 2. 獲取這些棧板的數量信息
        const { data: palletData, error: palletError } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_qty')
          .in('plt_num', palletNumbers);

        if (palletError) throw palletError;

        // 計算總數量
        const totalQty = palletData?.reduce((sum, pallet) => sum + (pallet.product_qty || 0), 0) || 0;
        setTotalMoved(totalQty);

        // 3. 獲取這些棧板中仍在 await 的
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('record_inventory')
          .select('plt_num, await')
          .in('plt_num', palletNumbers)
          .gt('await', 0);

        if (inventoryError) throw inventoryError;

        // 計算仍在 await 的數量
        const stillInAwaitPallets = inventoryData?.map(inv => inv.plt_num) || [];
        const stillInAwaitQty = palletData
          ?.filter(p => stillInAwaitPallets.includes(p.plt_num))
          ?.reduce((sum, pallet) => sum + (pallet.product_qty || 0), 0) || 0;

        setStillInAwait(stillInAwaitQty);

        // 計算百分比
        const pct = totalQty > 0 ? (stillInAwaitQty / totalQty) * 100 : 0;
        setPercentage(pct);

      } catch (err) {
        console.error('Error fetching still in await percentage:', err);
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
          <p className="text-gray-400">Still In Await % Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <div className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ChartPieIcon className="w-5 h-5" />
            Still In Await %
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
                className="relative"
              >
                <div className="text-4xl font-bold text-white mb-2">
                  {percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">
                  {stillInAwait.toLocaleString()} / {totalMoved.toLocaleString()}
                </div>
              </motion.div>
              
              {/* 進度條視覺化 */}
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-blue-500 h-2 rounded-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </WidgetCard>
  );
});