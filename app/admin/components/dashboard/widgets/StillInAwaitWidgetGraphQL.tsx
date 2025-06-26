/**
 * Still In Await Widget - GraphQL Version
 * 顯示指定時間範圍內完成但仍在 await location 的數量
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { ClockIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { GET_STILL_IN_AWAIT_STATS } from '@/lib/graphql/queries';
import { motion } from 'framer-motion';
import { getYesterdayRange, getDateRange } from '@/app/utils/timezone';
import { format } from 'date-fns';

export const StillInAwaitWidgetGraphQL = React.memo(function StillInAwaitWidgetGraphQL({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  
  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      // 默認使用昨天
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

  // 使用 GraphQL 查詢 - 使用新的 stable client
  const { data, loading, error, isRefetching } = useGraphQLQuery(
    GET_STILL_IN_AWAIT_STATS,
    {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString()
    }
  );

  // 計算仍在 await 的數量
  const stillInAwaitCount = useMemo(() => {
    if (!data) return 0;

    // 從 history 記錄中獲取所有移動到 Await 的棧板號
    const historyPallets = new Set(
      data.historyRecords?.edges?.map((edge: any) => edge.node.plt_num) || []
    );

    // 從 inventory 記錄中篩選出仍在 await 的棧板
    const inventoryData = data.inventoryRecords?.edges || [];
    
    // 計算同時存在於兩個集合中的棧板的總數量
    let totalQty = 0;
    inventoryData.forEach((edge: any) => {
      const { plt_num, await: awaitQty, record_palletinfo } = edge.node;
      
      // 檢查此棧板是否在指定時間範圍內移動到 Await
      if (historyPallets.has(plt_num) && awaitQty > 0) {
        // 使用 palletinfo 中的 product_qty
        const qty = record_palletinfo?.product_qty || 0;
        totalQty += qty;
      }
    });

    return totalQty;
  }, [data]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Still In Await Widget (GraphQL)</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <div className="relative h-full flex flex-col">
        {/* GraphQL 標識 */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full shadow-lg z-10">
          GraphQL
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Still In Await
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
          <p className="text-xs text-gray-400 mt-1">
            From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex items-center justify-center">
          {loading && !data ? (
            <div className="space-y-2 w-full">
              <div className="h-8 bg-slate-700/50 rounded animate-pulse" />
              <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center">
              <p>Error loading data</p>
              <p className="text-xs mt-1">{error.message}</p>
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