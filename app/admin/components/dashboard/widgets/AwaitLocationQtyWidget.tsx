/**
 * Await Location Qty Widget
 * 顯示 record_inventory 表內 await 欄位的總和
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { BuildingOfficeIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const AwaitLocationQtyWidget = React.memo(function AwaitLocationQtyWidget({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  const [palletCount, setPalletCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    const fetchAwaitPalletCount = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        
        // 查詢當前在 Await 位置的棧板數量
        // 使用 RPC 函數或者複合查詢來獲取每個棧板的最新位置
        const { data, error } = await supabase.rpc('get_current_await_pallet_count');
        
        if (error) {
          // 如果 RPC 函數不存在，使用備選查詢方法
          console.warn('RPC function not found, using alternative query');
          
          // 備選方案：查詢所有棧板的最新歷史記錄
          const { data: historyData, error: historyError } = await supabase
            .from('record_history')
            .select('plt_num, loc, time')
            .not('plt_num', 'is', null)
            .order('time', { ascending: false });
            
          if (historyError) throw historyError;
          
          // 計算每個棧板的最新位置
          const palletLatestLocation = new Map<string, string>();
          historyData?.forEach(record => {
            if (!palletLatestLocation.has(record.plt_num)) {
              palletLatestLocation.set(record.plt_num, record.loc);
            }
          });
          
          // 統計在 Await 位置的棧板數量
          const awaitPallets = Array.from(palletLatestLocation.values())
            .filter(loc => loc === 'Await' || loc === 'Awaiting')
            .length;
            
          setPalletCount(awaitPallets);
        } else {
          setPalletCount(data || 0);
        }
      } catch (err) {
        console.error('Error fetching await pallet count:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAwaitPalletCount();
  }, []);

  // 模擬趨勢數據（實際應用中應該比較不同時間段的數據）
  const trend = 0; // 暫時設為 0，可以之後加入趨勢計算

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Await Location Qty Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
          <CardTitle className="widget-title flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5" />
            Await Location Qty
            {isRefetching && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="ml-auto"
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </motion.div>
            )}
          </CardTitle>
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
                {(palletCount || 0).toLocaleString()}
              </motion.div>
              <p className="text-xs text-slate-400">Pallets</p>
              
              {trend !== 0 && (
                <div className={cn(
                  "flex items-center gap-1 mt-2 text-sm justify-center",
                  trend > 0 ? "text-green-400" : "text-red-400"
                )}>
                  {trend > 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4" />
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