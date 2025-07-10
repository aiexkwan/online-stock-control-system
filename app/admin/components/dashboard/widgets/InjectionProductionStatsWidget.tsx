/**
 * Injection Production Stats Widget - Apollo GraphQL Version
 * 用於 Injection Route 的生產統計組件
 * 已遷移至 Apollo Client (2025-07-09)
 * 
 * Widget2: Today Produced (PLT)
 * Widget3: Today Produced (QTY)
 * 
 * GraphQL Migration:
 * - 使用 Apollo Client 查詢
 * - 支援 cache-and-network 策略
 * - 保留 Server Actions fallback
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CubeIcon } from '@heroicons/react/24/outline';
import { format, startOfDay, endOfDay } from 'date-fns';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGetInjectionProductionStatsQuery } from '@/lib/graphql/generated/apollo-hooks';

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
  // 使用類型斷言處理擴展屬性
  const widgetConfig = widget?.config as any;
  const widgetTitle = title || widgetConfig?.title || 'Production Stats';
  const widgetMetric = metric || widgetConfig?.metric || 'pallet_count';
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

  // 使用環境變量控制是否使用 GraphQL
  const useGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION === 'true' || 
                     widget?.config?.useGraphQL === true;

  // Apollo GraphQL 查詢 - 使用生成嘅 hook
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError 
  } = useGetInjectionProductionStatsQuery({
    skip: !useGraphQL || isEditMode,
    variables: { startDate, endDate },
    pollInterval: 300000, // 5分鐘輪詢
    fetchPolicy: 'cache-and-network',
  });

  // Server Actions fallback
  const [serverActionsData, setServerActionsData] = useState<any>(null);
  const [serverActionsLoading, setServerActionsLoading] = useState(!useGraphQL);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);

  useEffect(() => {
    if (useGraphQL || isEditMode) return;

    const fetchData = async () => {
      setServerActionsLoading(true);
      setServerActionsError(null);

      try {
        const dashboardAPI = createDashboardAPI();
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['injection_production_stats'],
            dateRange: { start: startDate, end: endDate },
          },
          {
            strategy: 'server',
            cache: { ttl: 300 },
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          setServerActionsData(result.widgets[0].data);
        }
      } catch (err) {
        console.error('Error fetching production stats:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, widgetMetric, useGraphQL, isEditMode]);

  // 合併 loading 和 error 狀態
  const data = useGraphQL ? graphqlData : serverActionsData;
  const loading = useGraphQL ? graphqlLoading : serverActionsLoading;
  const error = useGraphQL ? graphqlError : (serverActionsError ? new Error(serverActionsError) : null);

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
            {useGraphQL && (
              <p className="text-xs text-blue-400/70 mt-1">
                ⚡ GraphQL
              </p>
            )}
          </div>
        )}
      </CardContent>
    </motion.div>
  );
};

// Export as default for lazy loading compatibility
export default InjectionProductionStatsWidget;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client with cache-and-network policy
 * - 5-minute polling for real-time updates
 * - Fallback to Server Actions when GraphQL disabled
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION
 * - Supports both pallet_count and quantity_sum metrics
 * 
 * Performance improvements:
 * - Query reliability: Direct GraphQL queries with Apollo cache
 * - Data processing: Client-side aggregation for counts
 * - Caching: Apollo InMemoryCache with automatic updates
 */