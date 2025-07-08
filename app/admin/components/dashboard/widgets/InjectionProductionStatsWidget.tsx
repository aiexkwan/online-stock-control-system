/**
 * Injection Production Stats Widget - GraphQL Version
 * 用於 Injection Route 的生產統計組件
 * 根據 Re-Structure-6.md 建議，使用 GraphQL 優化頻繁時間切換場景
 * 
 * Widget2: Today Produced (PLT)
 * Widget3: Today Produced (QTY)
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CubeIcon } from '@heroicons/react/24/outline';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { GET_PRODUCTION_STATS } from '@/lib/graphql/queries';
import { WidgetComponentProps } from '@/app/types/dashboard';

interface InjectionProductionStatsWidgetProps extends WidgetComponentProps {
  title?: string;
  metric?: 'pallet_count' | 'quantity_sum';
}

export const InjectionProductionStatsWidget: React.FC<InjectionProductionStatsWidgetProps> = ({ 
  title, 
  metric,
  timeFrame,
  isEditMode,
  widget
}) => {
  // 從 widget config 提取數據
  const widgetTitle = title || widget?.title || 'Production Stats';
  const widgetMetric = metric || widget?.metrics?.[0] || 'pallet_count';
  // 根據 timeFrame 設定查詢時間範圍
  const { startDate, endDate } = useMemo(() => {
    if (!timeFrame) {
      // 默認使用今天
      const today = new Date();
      return {
        startDate: startOfDay(today).toISOString(),
        endDate: endOfDay(today).toISOString(),
      };
    }
    return {
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString(),
    };
  }, [timeFrame]);

  // 使用 GraphQL 查詢，利用全局快取機制
  // 根據 Re-Structure-6.md 建議，優化頻繁時間切換場景
  const { data, loading, error } = useGraphQLQuery(
    GET_PRODUCTION_STATS,
    { startDate, endDate },
    {
      enabled: !isEditMode,
      refetchInterval: 300000, // 5分鐘刷新一次
      cacheTime: 300000, // 5分鐘快取
    }
  );

  // 計算統計值
  const statValue = useMemo(() => {
    if (!data?.record_palletinfoCollection?.edges) return 0;

    const edges = data.record_palletinfoCollection.edges;
    
    if (widgetMetric === 'pallet_count') {
      // 計算唯一托盤數量
      const uniquePallets = new Set(edges.map((edge: any) => edge.node.plt_num));
      return uniquePallets.size;
    } else {
      // 計算總數量
      return edges.reduce((sum: number, edge: any) => {
        return sum + (edge.node.product_qty || 0);
      }, 0);
    }
  }, [data, widgetMetric]);

  // 獲取實際數據時間範圍（用於顯示）
  const displayDateRange = useMemo(() => {
    const start = timeFrame?.start || new Date();
    const end = timeFrame?.end || new Date();
    
    // 如果是同一天，只顯示一個日期
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }
    
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }, [timeFrame]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full flex flex-col relative"
    >
      <CardHeader className="pb-2">
        <CardTitle className="widget-title flex items-center gap-2">
          <CubeIcon className="w-5 h-5" />
          {widgetTitle}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          {displayDateRange}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex items-center justify-center">
        {loading ? (
          <div className="space-y-2 w-full">
            <div className="h-8 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-4 bg-slate-700/30 rounded animate-pulse w-2/3" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm text-center">
            Error loading data: {error.message}
          </div>
        ) : (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold text-white mb-2"
            >
              {statValue.toLocaleString()}
            </motion.div>
            <p className="text-xs text-slate-400">
              {widgetMetric === 'pallet_count' ? 'Pallets produced' : 'Total quantity'}
            </p>
            <p className="text-xs text-blue-400/70 mt-1">
              ⚡ GraphQL optimized
            </p>
          </div>
        )}
      </CardContent>
    </motion.div>
  );
};

// Export as default for lazy loading compatibility
export default InjectionProductionStatsWidget;