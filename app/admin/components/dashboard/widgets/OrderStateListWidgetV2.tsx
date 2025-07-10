/**
 * Order State List Widget V2 - Apollo GraphQL Version
 * 顯示訂單進度列表
 * 遷移自原 OrderStateListWidget
 *
 * GraphQL Migration:
 * - 使用 Apollo Client 查詢 data_order
 * - Client-side 進度計算
 * - 支援實時更新
 * - 保留 Server Actions fallback
 */

'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { useGetOrderStateListWidgetQuery } from '@/lib/graphql/generated/apollo-hooks';

// GraphQL 查詢已經移動到 lib/graphql/generated/apollo-hooks.ts

interface OrderProgress {
  uuid: string;
  order_ref: string;
  account_num: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  loaded_qty: number;
  created_at: string;
  progress: number;
  progress_text: string;
  status: 'pending' | 'in_progress' | 'completed';
  status_color: 'red' | 'yellow' | 'orange' | 'green';
}

export const OrderStateListWidgetV2 = React.memo(function OrderStateListWidgetV2({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    apiResponseTime?: number;
    cacheHit?: boolean;
  }>({});

  // 使用環境變量控制是否使用 GraphQL
  const useGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_AWAIT === 'true' || 
                     widget?.config?.useGraphQL === true;

  // 使用 GraphQL Codegen 生成嘅 hook
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError 
  } = useGetOrderStateListWidgetQuery({
    skip: !useGraphQL || isEditMode,
    variables: {
      limit: 50,
      offset: 0,
    },
    pollInterval: 30000, // 30秒輪詢
    fetchPolicy: 'cache-and-network',
  });

  // Server Actions fallback
  const [serverActionsData, setServerActionsData] = useState<OrderProgress[]>([]);
  const [serverActionsLoading, setServerActionsLoading] = useState(!useGraphQL);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);
  const [serverActionsMetadata, setServerActionsMetadata] = useState<any>({});

  const fetchOrders = useCallback(async () => {
    if (useGraphQL || isEditMode) return;

    try {
      setServerActionsLoading(true);
      setServerActionsError(null);
      const startTime = performance.now();

      const api = createDashboardAPI();
      const result = await api.fetch({
        widgetIds: ['statsCard'],
        params: {
          dataSource: 'order_state_list',
          limit: 50,
          offset: 0,
        },
      });

      const endTime = performance.now();
      setPerformanceMetrics({
        apiResponseTime: Math.round(endTime - startTime),
        cacheHit: result.metadata?.cacheHit || false,
      });

      // Extract widget data from dashboard result
      const widgetData = result.widgets?.find(w => w.widgetId === 'statsCard');

      if (!widgetData || widgetData.data.error) {
        throw new Error(widgetData?.data.error || 'Failed to load orders data');
      }

      setServerActionsData(widgetData.data.value || []);
      setServerActionsMetadata(widgetData.data.metadata || {});
    } catch (err) {
      console.error('Error fetching orders:', err);
      setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setServerActionsLoading(false);
    }
  }, [useGraphQL, isEditMode]);

  useEffect(() => {
    if (!isEditMode && !useGraphQL) {
      fetchOrders();

      // Set up refresh interval for real-time updates
      const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchOrders, isEditMode, useGraphQL]);

  // 處理 GraphQL 數據 - 計算進度
  const graphqlOrders = useMemo<OrderProgress[]>(() => {
    if (!graphqlData?.data_orderCollection?.edges) {
      return [];
    }

    return graphqlData.data_orderCollection.edges
      .map((edge: any) => {
        const node = edge.node;
        const productQty = node.product_qty || 0;
        const loadedQty = parseInt(node.loaded_qty || '0', 10);
        
        // 計算進度
        const progress = productQty > 0 ? (loadedQty / productQty) * 100 : 0;
        
        // 判斷狀態
        let status: 'pending' | 'in_progress' | 'completed' = 'pending';
        let statusColor: 'red' | 'yellow' | 'orange' | 'green' = 'red';
        
        if (progress >= 100) {
          status = 'completed';
          statusColor = 'green';
        } else if (progress > 0) {
          status = 'in_progress';
          statusColor = progress >= 75 ? 'orange' : 'yellow';
        }

        return {
          uuid: node.uuid,
          order_ref: node.order_ref,
          account_num: node.account_num,
          product_code: node.product_code,
          product_desc: node.product_desc,
          product_qty: productQty,
          loaded_qty: loadedQty,
          created_at: node.created_at,
          progress,
          progress_text: `${loadedQty}/${productQty}`,
          status,
          status_color: statusColor,
        };
      })
      .filter((order: OrderProgress) => order.status !== 'completed'); // 只顯示未完成訂單
  }, [graphqlData]);

  // 計算 GraphQL metadata
  const graphqlMetadata = useMemo(() => {
    const pendingCount = graphqlOrders.length;
    const totalCount = graphqlData?.data_orderCollection?.edges?.length || 0;
    return {
      pendingCount,
      totalCount,
      hasMore: graphqlData?.data_orderCollection?.pageInfo?.hasNextPage || false,
      optimized: true,
    };
  }, [graphqlOrders, graphqlData]);

  // 合併數據源
  const orders = useGraphQL ? graphqlOrders : serverActionsData;
  const loading = useGraphQL ? graphqlLoading : serverActionsLoading;
  const error = useGraphQL ? graphqlError : (serverActionsError ? new Error(serverActionsError) : null);
  const metadata = useGraphQL ? graphqlMetadata : serverActionsMetadata;

  if (isEditMode) {
    return (
      <WidgetCard widgetType='custom' isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Order State List Widget V2</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType='custom'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center justify-between text-lg font-medium'>
          <div className='flex items-center gap-2'>
            <ClipboardDocumentListIcon className='h-5 w-5' />
            <span>Order Progress</span>
          </div>
          {!isEditMode && useGraphQL && (
            <span className='text-xs text-blue-400'>
              ⚡ GraphQL
            </span>
          )}
          {!isEditMode && !useGraphQL && performanceMetrics.apiResponseTime && (
            <span className='text-xs text-slate-400'>
              {performanceMetrics.apiResponseTime}ms
              {performanceMetrics.cacheHit && ' (cached)'}
            </span>
          )}
        </CardTitle>
        <p className='mt-1 text-xs font-medium text-slate-400'>
          {metadata.pendingCount || 0} pending orders
          {metadata.totalCount && ` of ${metadata.totalCount} total`}
        </p>
      </CardHeader>
      <CardContent className='flex-1 overflow-hidden'>
        {loading ? (
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className='space-y-2'>
                <div className='h-4 animate-pulse rounded bg-slate-700/50' />
                <div className='h-2 animate-pulse rounded bg-slate-700/50' />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className='text-center text-sm text-red-400'>
            <p>Error loading orders</p>
            <p className='mt-1 text-xs'>{error.message}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className='py-8 text-center font-medium text-slate-400'>
            <ClipboardDocumentListIcon className='mx-auto mb-2 h-12 w-12 opacity-50' />
            <p>All orders completed</p>
          </div>
        ) : (
          <>
            <div className='h-full space-y-3 overflow-y-auto pr-2'>
              {orders.map((order, index) => (
                <motion.div
                  key={order.uuid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className='rounded-lg border border-slate-600/50 bg-slate-700/30 p-2 transition-colors hover:border-slate-500/50'
                >
                  {/* 訂單標題和進度 */}
                  <div className='flex items-center justify-between'>
                    <div className='flex min-w-0 flex-1 items-center gap-2'>
                      <div
                        className={cn(
                          'h-2 w-2 flex-shrink-0 rounded-full',
                          order.status_color === 'green'
                            ? 'bg-green-400'
                            : order.status_color === 'orange'
                              ? 'bg-orange-400'
                              : order.status_color === 'yellow'
                                ? 'bg-yellow-400'
                                : order.status_color === 'red'
                                  ? 'bg-red-400'
                                  : 'bg-slate-400'
                        )}
                      />
                      <span className='truncate text-sm font-medium text-white'>
                        {order.order_ref}
                      </span>
                    </div>
                    <div className='flex flex-shrink-0 items-center gap-2'>
                      <span className='text-xs text-slate-400'>{order.progress_text}</span>
                      <span className='text-lg font-bold text-white'>
                        {Math.round(order.progress)}%
                      </span>
                      {order.status === 'completed' && (
                        <TruckIcon className='h-4 w-4 text-green-400' />
                      )}
                    </div>
                  </div>

                  {/* 產品信息 */}
                  <div className='mt-1 truncate text-xs text-slate-400'>
                    {order.product_code} - {order.product_desc}
                  </div>

                  {/* 進度條 */}
                  <div className='mt-2'>
                    <Progress value={order.progress} className='h-2' />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Metadata display */}
            {metadata.hasMore && (
              <div className='mt-2 text-center text-xs text-slate-400'>
                Showing {orders.length} of {metadata.pendingCount} pending orders
              </div>
            )}

            {metadata.optimized && (
              <div className='mt-1 text-center text-[10px] text-green-400'>
                ✓ Server-side optimized
              </div>
            )}
          </>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default OrderStateListWidgetV2;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client query for data_order table
 * - Client-side progress calculation (loaded_qty / product_qty)
 * - Status color coding based on progress
 * - Filters out completed orders client-side
 * - 30-second polling for real-time updates
 * - Fallback to Server Actions when GraphQL disabled
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_AWAIT
 * 
 * Performance improvements:
 * - Direct GraphQL queries reduce latency
 * - Client-side filtering for pending orders
 * - Progress calculation done efficiently in-memory
 * - Caching: Apollo InMemoryCache with automatic updates
 * 
 * Note: GraphQL doesn't support column comparisons directly,
 * so filtering loaded_qty < product_qty is done client-side
 */
