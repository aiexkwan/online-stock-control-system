/**
 * Still In Await Percentage Widget
 * 顯示指定時間生成的棧板中仍在 await location 的百分比
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
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
        
        // 1. 獲取指定時間生成的所有棧板
        const { data: palletData, error: palletError } = await supabase
          .from('record_palletinfo')
          .select('plt_num, generate_time')
          .gte('generate_time', dateRange.start.toISOString())
          .lte('generate_time', dateRange.end.toISOString());

        if (palletError) throw palletError;

        if (!palletData || palletData.length === 0) {
          setPercentage(0);
          setStillInAwait(0);
          setTotalMoved(0);
          setLoading(false);
          return;
        }

        const palletNumbers = palletData.map(p => p.plt_num);
        const totalPallets = palletNumbers.length;
        setTotalMoved(totalPallets);
        
        // 2. 獲取這些棧板的最新位置
        const { data: historyData, error: historyError } = await supabase
          .from('record_history')
          .select('plt_num, loc, time')
          .in('plt_num', palletNumbers)
          .order('time', { ascending: false });

        if (historyError) throw historyError;

        // 3. 找出每個棧板的最新位置
        const latestLocations = new Map<string, string>();
        historyData?.forEach(record => {
          if (!latestLocations.has(record.plt_num)) {
            latestLocations.set(record.plt_num, record.loc);
          }
        });

        // 4. 計算仍在 Await 的棧板數量
        const stillInAwaitCount = Array.from(latestLocations.entries())
          .filter(([_, loc]) => loc === 'Await' || loc === 'Awaiting')
          .length;

        setStillInAwait(stillInAwaitCount);

        // 計算百分比
        const pct = totalPallets > 0 ? (stillInAwaitCount / totalPallets) * 100 : 0;
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
          <p className="text-slate-400 font-medium">Still In Await % Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
          <CardTitle className="widget-title flex items-center gap-2">
            <ChartPieIcon className="w-5 h-5" />
            Still In Await %
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
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
                <div className="widget-text-sm">
                  {stillInAwait.toLocaleString()} / {totalMoved.toLocaleString()} pallets
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
    </WidgetCard>
  );
});