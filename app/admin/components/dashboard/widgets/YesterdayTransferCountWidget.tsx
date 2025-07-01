/**
 * Yesterday Transfer Count Widget
 * 顯示昨天 transfer done 的總數
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { TruckIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { gql } from '@/lib/graphql-client-stable';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getYesterdayRange, getTodayRange } from '@/app/utils/timezone';
import { format } from 'date-fns';

// GraphQL 查詢 - 獲取轉移記錄
const GET_TRANSFER_STATS = gql`
  query GetYesterdayTransferStats($startDate: Datetime!, $endDate: Datetime!) {
    record_transferCollection(
      filter: {
        tran_date: { gte: $startDate, lte: $endDate }
      }
    ) {
      edges {
        node {
          uuid
          operator_id
        }
      }
    }
  }
`;

export const YesterdayTransferCountWidget = React.memo(function YesterdayTransferCountWidget({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      // 使用昨天的範圍，已經是 ISO 字符串格式
      return getYesterdayRange();
    }
    
    // 如果選擇了 time frame，轉換為 ISO 字符串
    return {
      start: timeFrame.start.toISOString(),
      end: timeFrame.end.toISOString()
    };
  }, [timeFrame]);

  // 使用 GraphQL 查詢獲取數據
  const { data, loading, error } = useGraphQLQuery(GET_TRANSFER_STATS, {
    startDate: dateRange.start,
    endDate: dateRange.end
  });

  // 獲取今天的數據用於趨勢比較，已經是 ISO 字符串格式
  const todayRange = getTodayRange();
  const { data: todayData } = useGraphQLQuery(GET_TRANSFER_STATS, {
    startDate: todayRange.start,
    endDate: todayRange.end
  });

  // 計算總數 - 從 edges 數據中計算
  const transferCount = useMemo(() => {
    if (!data?.record_transferCollection?.edges) return 0;
    return data.record_transferCollection.edges.length || 0;
  }, [data]);

  // 計算趨勢
  const trend = useMemo(() => {
    if (!todayData?.record_transferCollection?.edges || transferCount === 0) return 0;
    const todayCount = todayData.record_transferCollection.edges.length || 0;
    if (todayCount === 0) return 0;
    return ((transferCount - todayCount) / todayCount) * 100;
  }, [transferCount, todayData]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Transfer Count Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
          <CardTitle className="widget-title flex items-center gap-2">
            <TruckIcon className="w-5 h-5" />
            Transfer Done
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            From {format(new Date(dateRange.start), 'MMM d')} to {format(new Date(dateRange.end), 'MMM d')}
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
                {transferCount.toLocaleString()}
              </motion.div>
              <p className="text-xs text-slate-400">Total Transfers</p>
              
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
                  <span>{Math.abs(trend).toFixed(1)}% vs Today</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
    </WidgetCard>
  );
});