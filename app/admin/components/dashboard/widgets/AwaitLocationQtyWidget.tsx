/**
 * Await Location Qty Widget
 * 顯示 record_inventory 表內 await 欄位的總和
 * 支援頁面的 time frame selector
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { BuildingOfficeIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGraphQLQuery, gql } from '@/lib/graphql-client-stable';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// GraphQL 查詢 - 獲取所有 await 數值
const GET_AWAIT_LOCATION_QTY = gql`
  query GetAwaitLocationQty {
    record_inventoryCollection {
      edges {
        node {
          await
        }
      }
    }
  }
`;

export const AwaitLocationQtyWidget = React.memo(function AwaitLocationQtyWidget({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  // 使用 GraphQL 查詢獲取數據 - 使用新的 stable client
  const { data, loading, error, isRefetching } = useGraphQLQuery(GET_AWAIT_LOCATION_QTY, {
    // 這個查詢不需要時間範圍參數，因為是當前庫存狀態
  });

  // 計算總數 - 從 edges 數據中計算
  const totalQty = useMemo(() => {
    if (!data?.record_inventoryCollection?.edges) return 0;
    
    return data.record_inventoryCollection.edges.reduce((sum: number, edge: any) => {
      // 將 bigint 轉換為 number
      const awaitValue = edge.node.await ? parseInt(edge.node.await.toString()) : 0;
      return sum + awaitValue;
    }, 0);
  }, [data]);

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
      <div className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
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
                {totalQty.toLocaleString()}
              </motion.div>
              <p className="text-sm text-gray-400">Total Quantity</p>
              
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
      </div>
    </WidgetCard>
  );
});