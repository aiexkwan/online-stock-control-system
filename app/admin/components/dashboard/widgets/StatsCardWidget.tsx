/**
 * 統計卡片小部件 - Apollo GraphQL Version
 * 通用統計卡片，支援多種數據源
 * 
 * GraphQL Migration:
 * - 遷移至 Apollo Client
 * - 支援 count 查詢: total_pallets, today_transfers, active_products, pending_orders
 * - RPC 數據源保留 Server Actions (await_percentage_stats, warehouse_work_level)
 * - 保留 Server Actions fallback
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { createDashboardAPI } from '@/lib/api';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { systemLogger } from '@/lib/logger';
import {
  useGetTotalPalletsCountQuery,
  useGetTodayTransfersCountQuery,
  useGetActiveProductsCountQuery,
  useGetPendingOrdersCountQuery,
  useGetTransferCountQuery,
  useGetStockPalletsCountQuery,
  useGetInventoryStatsQuery,
} from '@/lib/graphql/generated/apollo-hooks';

interface StatsData {
  value: number | string;
  trend?: number;
  label?: string;
}

interface StatsCardWidgetProps extends WidgetComponentProps {
  useGraphQL?: boolean;
}

const StatsCardWidget = React.memo(function StatsCardWidget({
  widget,
  isEditMode,
  useGraphQL,
}: StatsCardWidgetProps) {
  const [data, setData] = useState<StatsData>({ value: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 使用環境變量控制是否使用 GraphQL
  const shouldUseGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_STOCK === 'true' || 
                          (useGraphQL ?? (widget as any)?.useGraphQL ?? false);
  
  const dataSource = widget.config.dataSource as string || 'total_pallets';
  
  // 準備 GraphQL 查詢變量
  const graphqlVariables = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startDate = widget.config.startDate as string || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endDate = widget.config.endDate as string || new Date().toISOString();
    const location = widget.config.location as string || null;
    
    return {
      todayStart,
      startDate,
      endDate,
      location,
    };
  }, [widget.config]);
  
  const shouldSkipGraphQL = !shouldUseGraphQL || isEditMode || 
                           // RPC-based data sources should stay with Server Actions
                           ['await_percentage_stats', 'await_location_count', 'warehouse_work_level', 'history_tree'].includes(dataSource);
  
  // 根據 dataSource 使用不同的 hook
  const totalPalletsQuery = useGetTotalPalletsCountQuery({
    skip: shouldSkipGraphQL || dataSource !== 'total_pallets',
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  
  const todayTransfersQuery = useGetTodayTransfersCountQuery({
    skip: shouldSkipGraphQL || dataSource !== 'today_transfers',
    variables: { todayStart: graphqlVariables.todayStart },
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  
  const activeProductsQuery = useGetActiveProductsCountQuery({
    skip: shouldSkipGraphQL || dataSource !== 'active_products',
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  
  const pendingOrdersQuery = useGetPendingOrdersCountQuery({
    skip: shouldSkipGraphQL || dataSource !== 'pending_orders',
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  
  const transferCountQuery = useGetTransferCountQuery({
    skip: shouldSkipGraphQL || dataSource !== 'transfer_count',
    variables: { 
      startDate: graphqlVariables.startDate,
      endDate: graphqlVariables.endDate 
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  
  const stockPalletsQuery = useGetStockPalletsCountQuery({
    skip: shouldSkipGraphQL || dataSource !== 'stock_pallets',
    variables: { location: graphqlVariables.location },
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  
  const inventoryStatsQuery = useGetInventoryStatsQuery({
    skip: shouldSkipGraphQL || dataSource !== 'inventory_stats',
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  
  // 選擇正確的查詢結果
  const getActiveQuery = () => {
    switch (dataSource) {
      case 'total_pallets': return totalPalletsQuery;
      case 'today_transfers': return todayTransfersQuery;
      case 'active_products': return activeProductsQuery;
      case 'pending_orders': return pendingOrdersQuery;
      case 'transfer_count': return transferCountQuery;
      case 'stock_pallets': return stockPalletsQuery;
      case 'inventory_stats': return inventoryStatsQuery;
      default: return null;
    }
  };
  
  const activeQuery = getActiveQuery();
  const graphqlData = activeQuery?.data;
  const graphqlLoading = activeQuery?.loading || false;
  const graphqlError = activeQuery?.error;
  const graphqlRefetch = activeQuery?.refetch;
  
  // 處理 GraphQL 數據
  const processGraphQLData = useCallback(() => {
    if (!graphqlData) return null;
    
    let value = 0;
    let label = '';
    
    switch (dataSource) {
      case 'total_pallets':
        value = graphqlData.record_palletinfoCollection?.totalCount || 0;
        label = 'Total Pallets';
        break;
      case 'today_transfers':
        value = graphqlData.record_transferCollection?.totalCount || 0;
        label = "Today's Transfers";
        break;
      case 'active_products':
        value = graphqlData.data_codeCollection?.totalCount || 0;
        label = 'Active Products';
        break;
      case 'pending_orders':
        value = graphqlData.data_orderCollection?.totalCount || 0;
        label = 'Pending Orders';
        break;
      case 'transfer_count':
        value = graphqlData.current?.totalCount || 0;
        label = 'Transfer Done';
        break;
      case 'stock_pallets':
        value = graphqlData.record_palletinfoCollection?.totalCount || 0;
        label = widget.config.location ? `Stock at ${widget.config.location}` : 'Stock Pallets';
        break;
      case 'inventory_stats':
        const activeCount = graphqlData.activeInventory?.totalCount || 0;
        const uniqueCount = graphqlData.uniqueProducts?.totalCount || 0;
        value = widget.config.statType === 'unique' ? uniqueCount : activeCount;
        label = widget.config.statType === 'unique' ? 'Unique Products' : 'Active Inventory';
        break;
    }
    
    return {
      value,
      label: widget.config.label as string || label,
      trend: undefined, // GraphQL version doesn't calculate trends yet
    };
  }, [graphqlData, dataSource, widget.config]);

  const loadData = useCallback(async () => {
    // If using GraphQL and data is available, don't fetch via Server Actions
    if (shouldUseGraphQL && !shouldSkipGraphQL && graphqlData) {
      return;
    }
    
    try {
      setLoading(true);

      // Use new hybrid API for data fetching
      const dashboardAPI = createDashboardAPI();
      const dashboardResult = await dashboardAPI.fetch(
        {
          widgetIds: [(widget.config.dataSource as string) || 'statsCard'],
          params: {
            dataSource: widget.config.dataSource as string | undefined,
            staticValue: widget.config.staticValue as string | number | undefined,
            label: widget.config.label as string | undefined,
          },
        },
        {
          strategy: 'client', // Force client strategy for client components (per Re-Structure-5.md)
          cache: { ttl: 60 }, // 1-minute cache for stats
        }
      );

      // Extract data for this widget
      const widgetData = dashboardResult.widgets?.find(
        w => w.widgetId === widget.config.dataSource || w.widgetId === 'statsCard'
      );

      if (widgetData) {
        setData({
          value: widgetData.data.value || 0,
          label: widgetData.data.label || widget.config.label || 'Stats',
          trend: widgetData.data.trend,
        });
      } else {
        // Fallback for static values
        setData({
          value: (widget.config.staticValue as string | number) || 0,
          label: (widget.config.label as string) || 'Stats',
        });
      }

      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      systemLogger.error(error, 'Error loading stats with hybrid API');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [widget.config, shouldUseGraphQL, shouldSkipGraphQL, graphqlData]);

  // 處理 GraphQL 數據更新
  useEffect(() => {
    if (shouldUseGraphQL && !shouldSkipGraphQL && graphqlData) {
      const processedData = processGraphQLData();
      if (processedData) {
        setData(processedData);
        setLoading(false);
        setError(null);
      }
    }
  }, [shouldUseGraphQL, shouldSkipGraphQL, graphqlData, processGraphQLData]);
  
  // 處理 GraphQL 錯誤
  useEffect(() => {
    if (shouldUseGraphQL && !shouldSkipGraphQL && graphqlError) {
      setError(graphqlError.message);
      setLoading(false);
    }
  }, [shouldUseGraphQL, shouldSkipGraphQL, graphqlError]);
  
  // 處理 GraphQL loading 狀態
  useEffect(() => {
    if (shouldUseGraphQL && !shouldSkipGraphQL) {
      setLoading(graphqlLoading);
    }
  }, [shouldUseGraphQL, shouldSkipGraphQL, graphqlLoading]);

  // 只在非 GraphQL 模式下使用 useWidgetData
  const skipWidgetDataLoad = shouldUseGraphQL && !shouldSkipGraphQL;
  
  useWidgetData({ 
    loadFunction: skipWidgetDataLoad ? async () => {} : loadData, 
    isEditMode
  });

  const getIcon = () => {
    switch (widget.config.icon) {
      case 'package':
        return <Package className={`h-4 w-4 ${iconColors.blue}`} />;
      case 'trending-up':
        return <TrendingUp className={`h-4 w-4 ${iconColors.green}`} />;
      case 'trending-down':
        return <TrendingDown className={`h-4 w-4 ${iconColors.red}`} />;
      case 'alert':
        return <AlertCircle className={`h-4 w-4 ${iconColors.yellow}`} />;
      default:
        return <Package className={`h-4 w-4 ${iconColors.blue}`} />;
    }
  };

  return (
    <Card
      className={`h-full border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl ${isEditMode ? 'border-2 border-dashed border-blue-500/50' : ''}`}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='flex items-center gap-2 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-sm font-medium text-transparent'>
          {'title' in widget ? widget.title : 'Stats'}
          {shouldUseGraphQL && !shouldSkipGraphQL && (
            <span className='text-xs text-blue-400'>
              ⚡ GraphQL
            </span>
          )}
        </CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='animate-pulse'>
            <div className='h-8 w-24 rounded bg-slate-700'></div>
            <div className='mt-2 h-4 w-16 rounded bg-slate-700'></div>
          </div>
        ) : error ? (
          <div className='text-sm text-red-400'>{error}</div>
        ) : (
          <>
            <div className='text-2xl font-bold text-white'>{data.value}</div>
            {data.label && <p className='text-xs text-slate-400'>{data.label}</p>}
            {data.trend !== undefined && (
              <p className={`text-xs ${data.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.trend > 0 ? '+' : ''}
                {data.trend}% from last period
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default StatsCardWidget;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client queries for count-based data sources
 * - Supports: total_pallets, today_transfers, active_products, pending_orders, transfer_count, stock_pallets, inventory_stats
 * - RPC-based sources remain with Server Actions: await_percentage_stats, await_location_count, warehouse_work_level
 * - 1-minute polling for real-time updates
 * - Fallback to Server Actions + Dashboard API when GraphQL disabled
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_STOCK
 * 
 * Notes:
 * - Trend calculations not yet implemented in GraphQL version
 * - Static values continue to work as before
 * - Compatible with all existing widget configurations
 */
