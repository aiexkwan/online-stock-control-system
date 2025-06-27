/**
 * Still In Await Widget
 * 顯示指定時間生成的棧板中仍在 await location 的數量
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
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
        
        // 1. 獲取指定時間生成的棧板
        const { data: palletData, error: palletError } = await supabase
          .from('record_palletinfo')
          .select('plt_num, generate_time')
          .gte('generate_time', dateRange.start.toISOString())
          .lte('generate_time', dateRange.end.toISOString());

        if (palletError) throw palletError;

        if (!palletData || palletData.length === 0) {
          setStillInAwaitCount(0);
          setLoading(false);
          return;
        }

        // 2. 獲取這些棧板的最新位置
        const palletNumbers = palletData.map(p => p.plt_num);
        
        // 查詢每個棧板的歷史記錄，找出最新位置
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
        const palletCount = Array.from(latestLocations.entries())
          .filter(([_, loc]) => loc === 'Await' || loc === 'Awaiting')
          .length;

        setStillInAwaitCount(palletCount);
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
          <p className="text-slate-400 font-medium">Still In Await Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
          <CardTitle className="widget-title flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Still In Await
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
                className="text-4xl font-bold text-white mb-2"
              >
                {stillInAwaitCount.toLocaleString()}
              </motion.div>
              <p className="text-xs text-slate-400">Pallets</p>
            </div>
          )}
        </CardContent>
    </WidgetCard>
  );
});