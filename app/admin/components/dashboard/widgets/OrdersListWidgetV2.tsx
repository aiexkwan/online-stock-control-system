/**
 * OrdersListWidgetV2 - Optimized with useGraphQLFallback
 * 顯示訂單上傳歷史列表
 * 
 * Performance Optimizations:
 * - 使用 useGraphQLFallback hook 統一數據獲取
 * - Progressive Loading with useInViewport
 * - 保留無限滾動加載更多功能
 * - 保留 PDF 開啟功能和連線狀態顯示
 * - 使用 DataTable 通用組件簡化 UI
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  DocumentArrowUpIcon,
  WifiIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { Loader2, AlertCircle } from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { ordersAPI, OrdersListResponse, OrderRecord } from '@/lib/api/modules/OrdersAPI';
import { getPdfUrl } from '@/lib/api/modules/ordersActions';
import { cn } from '@/lib/utils';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';
// Note: Migrated to REST API - GraphQL hooks removed
import { DataTable, DataTableColumn } from './common/data-display';
import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';
import { useInViewport } from '@/app/admin/hooks/useInViewport';

// ================================
// Types
// ================================

export interface OrdersListWidgetV2Props extends WidgetComponentProps {
  initialData?: OrdersListResponse;
  useGraphQL?: boolean;
}

// Server Action for fetching orders
async function getOrdersListAction(variables?: { limit: number; offset: number }): Promise<OrdersListResponse> {
  const limit = variables?.limit || 15;
  const offset = variables?.offset || 0;
  return ordersAPI.getOrdersList(limit, offset);
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
  // Progressive loading with viewport detection
  const containerRef = useRef<HTMLDivElement>(null);
  const { isInViewport, hasBeenInViewport } = useInViewport(containerRef, {
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
  });

  // State management
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Use GraphQL Fallback hook for unified data fetching
  const {
    data,
    loading,
    error,
    refetch,
    mode,
    performanceMetrics,
  } = useGraphQLFallback<any, { limit: number; offset: number }>({
    graphqlQuery: GetOrdersListDocument,
    serverAction: getOrdersListAction,
    variables: {
      limit: 15,
      offset: page * 15,
    },
    skip: isEditMode || (!hasBeenInViewport && page === 0), // Progressive loading for first page only
    fetchPolicy: 'cache-and-network',
    fallbackEnabled: true,
    widgetId: 'orders-list-widget-v2',
    onCompleted: (data) => {
      // Process completed data
      if (data && 'record_historyCollection' in data) {
        // GraphQL response
        const graphqlData = data as GetOrdersListQuery;
        const edges = graphqlData.record_historyCollection?.edges || [];
        const newOrders: OrderRecord[] = edges.map((edge: any) => ({
          uuid: edge.node.uuid,
          time: edge.node.time,
          id: edge.node.id,
          action: edge.node.action,
          plt_num: edge.node.plt_num,
          loc: edge.node.loc,
          remark: edge.node.remark,
          uploader_name: edge.node.data_id?.name || 
            (edge.node.id ? `User ${edge.node.id}` : 'Unknown'),
          doc_url: null, // Will be fetched on demand
        }));
        
        if (page === 0) {
          setAllOrders(newOrders);
        } else {
          setAllOrders(prev => [...prev, ...newOrders]);
        }
        
        setHasMore(graphqlData.record_historyCollection?.pageInfo?.hasNextPage || false);
        // GraphQL API doesn't provide totalCount, estimate from current data
        setTotalCount(prev => {
          if (page === 0) return newOrders.length;
          return Math.max(prev, allOrders.length + newOrders.length);
        });
      } else if (data && 'orders' in data) {
        // Server action response
        const actionData = data as OrdersListResponse;
        if (page === 0) {
          setAllOrders(actionData.orders);
        } else {
          setAllOrders(prev => [...prev, ...actionData.orders]);
        }
        
        setHasMore(actionData.hasMore);
        setTotalCount(actionData.totalCount);
      }
    },
  });

  // Load more function
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  // Refresh function
  const handleRefresh = useCallback(async () => {
    setPage(0);
    setAllOrders([]);
    await refetch();
  }, [refetch]);

  // Loading states
  const isLoading = loading && page === 0;
  const isLoadingMore = loading && page > 0;
  const displayError = error;
  const displayOrders = allOrders;
  const displayHasMore = hasMore;
  const displayTotalCount = totalCount;
  const handleLoadMore = loadMore;

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
    async (order: OrderRecord) => {
      if (loadingPdf || isEditMode) return;

      const orderRef = order.remark;
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

  // Define columns for DataTable
  const columns: DataTableColumn<OrderRecord>[] = [
    {
      key: 'time',
      header: 'Date',
      align: 'left',
      render: (value) => (
        <span className="text-xs text-cyan-300">{formatTime(value)}</span>
      ),
    },
    {
      key: 'remark',
      header: 'Order Ref',
      align: 'center',
      render: (value, item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOrderClick(item);
          }}
          disabled={loadingPdf === value || item.uploader_name === 'Loading...'}
          className={cn(
            'truncate text-center text-xs text-cyan-400',
            'transition-colors hover:text-cyan-300 hover:underline',
            'flex items-center justify-center gap-1',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          title={
            loadingPdf === value
              ? 'Loading PDF...'
              : item.doc_url
                ? `Click to open PDF for order ${value}`
                : `No PDF available for order ${value}`
          }
        >
          {loadingPdf === value && (
            <Loader2 className='h-3 w-3 animate-spin' />
          )}
          <span className={loadingPdf === value ? 'opacity-70' : ''}>
            {value}
          </span>
        </button>
      ),
    },
    {
      key: 'uploader_name',
      header: 'Upload By',
      align: 'right',
      render: (value, item) => (
        <span className="truncate text-right text-xs text-cyan-300">
          {value || item.id || 'Unknown'}
        </span>
      ),
    },
  ];

  // Connection status configuration based on data mode
  const connectionStatus = (() => {
    if (mode === 'context') {
      return { type: 'context' as const, label: 'Cached' };
    } else if (mode === 'context') {
      return { type: 'context' as const, label: 'GraphQL' };
    } else if (mode === 'server-action' || mode === 'fallback') {
      return { type: 'polling' as const, label: 'Server Action' };
    } else {
      return { type: 'offline' as const, label: 'Offline' };
    }
  })();

  return (
    <div ref={containerRef}>
      <DataTable<OrderRecord>
        data={displayOrders}
        columns={columns}
        keyField="uuid"
        title="Order Upload History"
        icon={DocumentArrowUpIcon}
        iconColor="from-blue-500 to-cyan-500"
        loading={isLoading}
        error={displayError}
        emptyMessage="No orders uploaded"
        emptyIcon={DocumentArrowUpIcon}
        pagination={{
          enabled: true,
          loadMore: true,
          hasMore: displayHasMore,
          onLoadMore: handleLoadMore,
          loadingMore: isLoadingMore,
          totalCount: displayTotalCount,
          remainingCount: displayTotalCount - displayOrders.length,
        }}
        onRowClick={handleOrderClick}
        onRefresh={handleRefresh}
        showRefreshButton={!isEditMode}
        connectionStatus={connectionStatus}
        rowClassName={(item) => item.uploader_name === 'Loading...' ? 'animate-pulse' : ''}
        // @ts-ignore - performanceMetrics is optional on DataTable
      />
    </div>
  );
});

export default OrdersListWidgetV2;

/**
 * Optimized with useGraphQLFallback on 2025-07-10
 * 
 * Features:
 * - Unified data fetching with GraphQL → Server Action fallback
 * - Progressive loading with viewport detection
 * - Infinite scroll pagination
 * - PDF URL fetching on demand
 * - Real-time connection status display
 * - Performance metrics tracking
 * - DataTable common component for simplified UI
 * 
 * Performance improvements:
 * - Lazy loading when component enters viewport
 * - Automatic fallback to Server Actions on GraphQL failure
 * - Context data prioritization for instant loading
 * - Field selection reduces payload size
 * - Efficient pagination for large datasets
 * - Caching through Apollo InMemoryCache and SWR
 */
