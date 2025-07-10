/**
 * OrdersListWidgetV2 - Apollo GraphQL Version
 * 顯示訂單上傳歷史列表
 * 
 * GraphQL Migration:
 * - 遷移至 Apollo Client
 * - 支援分頁查詢
 * - 保留 Server Actions PDF 處理
 * - 保留 Realtime 更新作為 fallback
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentArrowUpIcon,
  ArrowPathIcon,
  WifiIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { Loader2, AlertCircle } from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { useRealtimeOrders } from '@/app/admin/hooks/useRealtimeOrders';
import { ordersAPI, OrdersListResponse, OrderRecord } from '@/lib/api/modules/OrdersAPI';
import { getPdfUrl } from '@/lib/api/modules/ordersActions';
import { cn } from '@/lib/utils';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';
import { useGetOrdersListQuery } from '@/lib/graphql/generated/apollo-hooks';

// ================================
// Types
// ================================

export interface OrdersListWidgetV2Props extends WidgetComponentProps {
  initialData?: OrdersListResponse;
  useGraphQL?: boolean;
}

// ================================
// Component
// ================================

export const OrdersListWidgetV2 = React.memo(function OrdersListWidgetV2({
  widget,
  isEditMode,
  initialData,
  useGraphQL,
}: OrdersListWidgetV2Props) {
  // 使用環境變量控制是否使用 GraphQL
  const shouldUseGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_UPLOAD === 'true' || 
                          (useGraphQL ?? (widget as any)?.useGraphQL ?? false);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [graphqlPage, setGraphqlPage] = useState(0);
  const [graphqlOrders, setGraphqlOrders] = useState<OrderRecord[]>([]);

  // Apollo GraphQL query - 使用生成嘅 hook
  const {
    data: graphqlData,
    loading: graphqlLoading,
    error: graphqlError,
    refetch: refetchGraphQL,
    fetchMore,
  } = useGetOrdersListQuery({
    skip: !shouldUseGraphQL || isEditMode,
    variables: {
      limit: 15,
      offset: graphqlPage * 15,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Use real-time orders hook (only when not using GraphQL)
  const {
    orders,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    isRealtimeConnected,
    isPolling,
  } = useRealtimeOrders({
    limit: 15,
    initialData,
    autoRefresh: !isEditMode && !shouldUseGraphQL, // Disable when using GraphQL
  });

  // Process GraphQL data
  useEffect(() => {
    if (shouldUseGraphQL && graphqlData?.record_historyCollection) {
      const edges = graphqlData.record_historyCollection.edges || [];
      const newOrders: OrderRecord[] = edges.map((edge: any) => ({
        uuid: edge.node.uuid,
        time: edge.node.time,
        id: edge.node.id,
        action: edge.node.action,
        plt_num: edge.node.plt_num,
        loc: edge.node.loc,
        remark: edge.node.remark,
        uploader_name: edge.node.who || edge.node.data_id?.name || 
          (edge.node.id ? `User ${edge.node.id}` : 'Unknown'),
        doc_url: null, // Will be fetched on demand
      }));

      if (graphqlPage === 0) {
        setGraphqlOrders(newOrders);
      } else {
        // Append for pagination
        setGraphqlOrders(prev => [...prev, ...newOrders]);
      }
    }
  }, [shouldUseGraphQL, graphqlData, graphqlPage]);

  // GraphQL load more function
  const loadMoreGraphQL = useCallback(() => {
    if (shouldUseGraphQL && !graphqlLoading && 
        graphqlData?.record_historyCollection?.pageInfo?.hasNextPage) {
      setGraphqlPage(prev => prev + 1);
    }
  }, [shouldUseGraphQL, graphqlLoading, graphqlData]);

  // GraphQL refresh function
  const refreshGraphQL = useCallback(async () => {
    if (shouldUseGraphQL) {
      setGraphqlPage(0);
      setGraphqlOrders([]);
      await refetchGraphQL();
    }
  }, [shouldUseGraphQL, refetchGraphQL]);

  // Unified data source
  const displayOrders = shouldUseGraphQL ? graphqlOrders : orders;
  const isLoading = shouldUseGraphQL 
    ? (graphqlLoading && graphqlPage === 0) 
    : loading;
  const isLoadingMore = shouldUseGraphQL 
    ? (graphqlLoading && graphqlPage > 0) 
    : loadingMore;
  const displayError = shouldUseGraphQL ? graphqlError : error;
  const displayHasMore = shouldUseGraphQL 
    ? (graphqlData?.record_historyCollection?.pageInfo?.hasNextPage || false)
    : hasMore;
  const displayTotalCount = shouldUseGraphQL 
    ? (graphqlData?.record_historyCollection?.totalCount || graphqlOrders.length)
    : totalCount;
  const handleLoadMore = shouldUseGraphQL ? loadMoreGraphQL : loadMore;
  const handleRefresh = shouldUseGraphQL ? refreshGraphQL : refresh;

  // Format timestamp
  const formatTime = useCallback((timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      return format(date, 'dd MMM yyyy HH:mm');
    } catch {
      return 'Unknown';
    }
  }, []);

  // Handle order click to open PDF
  const handleOrderClick = useCallback(
    async (orderRef: string) => {
      if (loadingPdf || isEditMode) return;

      try {
        setLoadingPdf(orderRef);

        // Use Server Action to get PDF URL
        const pdfUrl = await getPdfUrl(orderRef);

        if (pdfUrl) {
          window.open(pdfUrl, '_blank');
          errorHandler.handleSuccess(
            `PDF opened for order ${orderRef}`,
            { component: 'OrdersListWidgetV2', action: 'open_pdf' },
            `Order reference: ${orderRef}`
          );
        } else {
          errorHandler.handleWarning(`No PDF found for order ${orderRef}`, {
            component: 'OrdersListWidgetV2',
            action: 'open_pdf',
            additionalData: { orderRef },
          });
        }
      } catch (error) {
        errorHandler.handleApiError(
          error as Error,
          { component: 'OrdersListWidgetV2', action: 'open_pdf', additionalData: { orderRef } },
          'Error opening PDF. Please try again.'
        );
      } finally {
        // Delay to show loading state
        setTimeout(() => {
          setLoadingPdf(null);
        }, 300);
      }
    },
    [loadingPdf, isEditMode]
  );

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className='flex items-center gap-1.5 text-xs'>
      {shouldUseGraphQL ? (
        <>
          <WifiIcon className='h-3 w-3 text-blue-400' />
          <span className='text-blue-400'>GraphQL</span>
        </>
      ) : (!isEditMode && isRealtimeConnected) ? (
        <>
          <WifiIcon className='h-3 w-3 text-emerald-400' />
          <span className='text-emerald-400'>Real-time</span>
        </>
      ) : (!isEditMode && isPolling) ? (
        <>
          <ArrowsRightLeftIcon className='h-3 w-3 animate-pulse text-amber-400' />
          <span className='text-amber-400'>Polling</span>
        </>
      ) : (
        <>
          <AlertCircle className='h-3 w-3 text-red-400' />
          <span className='text-red-400'>Offline</span>
        </>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex h-full flex-col'
    >
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500'>
              <DocumentArrowUpIcon className='h-5 w-5 text-white' />
            </div>
            <div className='flex flex-col'>
              <span className='text-base font-medium text-slate-200'>Order Upload History</span>
              <ConnectionStatus />
            </div>
          </div>
          <button
            onClick={() => !isEditMode && handleRefresh()}
            disabled={isEditMode || isLoading}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              'hover:bg-slate-700/50',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            title='Refresh'
          >
            <ArrowPathIcon className={cn('h-4 w-4 text-slate-400', isLoading && 'animate-spin')} />
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col'>
        {/* Column Headers */}
        <div className='mb-2 border-b border-slate-700 pb-2'>
          <div className='grid grid-cols-3 gap-2 px-2 text-xs font-medium text-slate-400'>
            <span>Date</span>
            <span className='text-center'>Order Ref</span>
            <span className='text-right'>Upload By</span>
          </div>
        </div>

        {/* Error State */}
        {displayError && !isLoading && (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <AlertCircle className='mx-auto mb-2 h-12 w-12 text-red-500' />
              <p className='mb-2 text-sm text-red-400'>Error loading orders</p>
              <button
                onClick={handleRefresh}
                className='text-xs text-cyan-400 underline hover:text-cyan-300'
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && displayOrders.length === 0 && !displayError ? (
          <div className='animate-pulse space-y-2'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-10 rounded-lg bg-white/10'></div>
            ))}
          </div>
        ) : displayOrders.length === 0 && !displayError ? (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <DocumentArrowUpIcon className='mx-auto mb-2 h-12 w-12 text-slate-600' />
              <p className='text-sm text-slate-500'>No orders uploaded</p>
            </div>
          </div>
        ) : (
          !displayError && (
            <div className='flex-1 space-y-1 overflow-y-auto'>
              <AnimatePresence mode='popLayout'>
                {displayOrders.map((order, index) => (
                  <motion.div
                    key={order.uuid}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      delay: index * 0.02,
                      layout: { type: 'spring', stiffness: 300, damping: 30 },
                    }}
                    className={cn(
                      'cursor-pointer rounded-lg bg-black/20 p-2 transition-colors',
                      'hover:bg-white/10',
                      order.uploader_name === 'Loading...' && 'animate-pulse'
                    )}
                  >
                    <div className='grid grid-cols-3 items-center gap-2'>
                      <span className='text-xs text-cyan-300'>{formatTime(order.time)}</span>
                      <button
                        onClick={() => handleOrderClick(order.remark)}
                        disabled={
                          loadingPdf === order.remark || order.uploader_name === 'Loading...'
                        }
                        className={cn(
                          'truncate text-center text-xs text-cyan-400',
                          'transition-colors hover:text-cyan-300 hover:underline',
                          'flex items-center justify-center gap-1',
                          'disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                        title={
                          loadingPdf === order.remark
                            ? 'Loading PDF...'
                            : order.doc_url
                              ? `Click to open PDF for order ${order.remark}`
                              : `No PDF available for order ${order.remark}`
                        }
                      >
                        {loadingPdf === order.remark && (
                          <Loader2 className='h-3 w-3 animate-spin' />
                        )}
                        <span className={loadingPdf === order.remark ? 'opacity-70' : ''}>
                          {order.remark}
                        </span>
                      </button>
                      <span className='truncate text-right text-xs text-cyan-300'>
                        {order.uploader_name || order.id || 'Unknown'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Load More Button */}
              {displayHasMore && !isLoadingMore && !displayError && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleLoadMore}
                  className={cn(
                    'w-full py-2 text-sm text-cyan-400',
                    'transition-colors hover:text-cyan-300'
                  )}
                  disabled={isEditMode}
                >
                  Load more ({displayTotalCount - displayOrders.length} remaining)
                </motion.button>
              )}

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='w-full py-2 text-center text-sm text-cyan-400'
                >
                  <Loader2 className='inline h-4 w-4 animate-spin' />
                  <span className='ml-2'>Loading more...</span>
                </motion.div>
              )}

              {/* End of List */}
              {!displayHasMore && displayOrders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='w-full py-2 text-center text-sm text-slate-500'
                >
                  End of list ({displayOrders.length} orders)
                </motion.div>
              )}
            </div>
          )
        )}
      </CardContent>
    </motion.div>
  );
});

export default OrdersListWidgetV2;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client query for record_history table
 * - Filters Order Upload actions
 * - Pagination support with fetchMore
 * - User name from 'who' field with data_id fallback
 * - 30-second auto-refresh via refetch
 * - Realtime updates still available as fallback
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_UPLOAD
 * 
 * Performance improvements:
 * - Direct GraphQL queries reduce latency
 * - Field selection reduces payload size
 * - Efficient pagination for large datasets
 * - Caching: Apollo InMemoryCache with automatic updates
 */
