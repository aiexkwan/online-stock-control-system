/**
 * OrdersListWidgetV2 - REST API Version
 * 顯示訂單上傳歷史列表
 *
 * v1.4 系統清理:
 * - 完全改用 REST API 架構
 * - 使用純 REST API 調用
 * - 簡化代碼結構
 * - 保留無限滾動加載更多功能
 * - 保留 PDF 開啟功能和連線狀態顯示
 * - 使用 DataTable 通用組件簡化 UI
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DocumentArrowUpIcon, WifiIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Loader2, AlertCircle } from 'lucide-react';
import { TraditionalWidgetComponentProps } from '@/types/components/dashboard';
import type { WidgetComponentProps } from '@/types/components/widgets';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { ordersAPI, OrdersListResponse, OrderRecord } from '@/lib/api/modules/OrdersAPI';
import { getPdfUrl } from '@/lib/api/modules/ordersActions';
import { cn } from '@/lib/utils';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';
import { DataTable, DataTableColumn } from './common/data-display';
import { useInViewport } from '@/app/(app)/admin/hooks/useInViewport';
import { ReportOrderMapper } from './types/ReportOrderTypes';

// ================================
// Types
// ================================

export interface OrdersListWidgetV2Props extends TraditionalWidgetComponentProps {
  initialData?: OrdersListResponse;
}

// Server Action for fetching orders
async function getOrdersListAction(variables?: {
  limit: number;
  offset: number;
}): Promise<OrdersListResponse> {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch orders using REST API
  const fetchOrders = useCallback(
    async (currentPage: number) => {
      if (isEditMode || (!hasBeenInViewport && currentPage === 0)) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getOrdersListAction({
          limit: 15,
          offset: currentPage * 15,
        });

        if (currentPage === 0) {
          setAllOrders(response.orders);
        } else {
          setAllOrders(prev => [...prev, ...response.orders]);
        }

        setHasMore(response.hasMore);
        setTotalCount(response.totalCount);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
      } finally {
        setLoading(false);
      }
    },
    [isEditMode, hasBeenInViewport]
  );

  // Load initial data
  useEffect(() => {
    if (hasBeenInViewport && !isEditMode) {
      fetchOrders(0);
    }
  }, [hasBeenInViewport, isEditMode, fetchOrders]);

  // Load more data when page changes
  useEffect(() => {
    if (page > 0) {
      fetchOrders(page);
    }
  }, [page, fetchOrders]);

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
    await fetchOrders(0);
  }, [fetchOrders]);

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
      render: value => (
        <span className='text-xs text-cyan-300'>{formatTime(String(value || ''))}</span>
      ),
    },
    {
      key: 'remark',
      header: 'Order Ref',
      align: 'center',
      render: (value, item) => (
        <button
          onClick={e => {
            e.stopPropagation();
            handleOrderClick(item);
          }}
          disabled={
            loadingPdf === String(value || '') || String(item.uploader_name || '') === 'Loading...'
          }
          className={cn(
            'truncate text-center text-xs text-cyan-400',
            'transition-colors hover:text-cyan-300 hover:underline',
            'flex items-center justify-center gap-1',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          title={
            loadingPdf === String(value || '')
              ? 'Loading PDF...'
              : (item as OrderRecord).doc_url
                ? `Click to open PDF for order ${String(value || '')}`
                : `No PDF available for order ${String(value || '')}`
          }
        >
          {loadingPdf === String(value || '') && <div className='h-1.5 w-6 bg-slate-600 rounded-full opacity-75' />}
          <span className={loadingPdf === String(value || '') ? 'opacity-70' : ''}>
            {String(value || '')}
          </span>
        </button>
      ),
    },
    {
      key: 'uploader_name',
      header: 'Upload By',
      align: 'right',
      render: (value, item) => (
        <span className='truncate text-right text-xs text-cyan-300'>
          {String(value || '') || String((item as OrderRecord).id || '') || 'Unknown'}
        </span>
      ),
    },
  ];

  // Connection status configuration
  const connectionStatus = {
    type: 'polling' as const,
    label: 'REST API',
  };

  return (
    <div ref={containerRef}>
      <DataTable<OrderRecord>
        data={displayOrders}
        columns={columns}
        keyField='uuid'
        title='Order Upload History'
        icon={DocumentArrowUpIcon}
        iconColor='from-blue-500 to-cyan-500'
        loading={isLoading}
        error={displayError}
        emptyMessage='No orders uploaded'
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
        rowClassName={item => (item.uploader_name === 'Loading...' ? 'animate-pulse' : '')}
      />
    </div>
  );
});

export default OrdersListWidgetV2;

/**
 * v1.4 系統清理完成於 2025-07-16
 *
 * Changes:
 * - 完全改用 REST API 架構和標準 React hooks
 * - 使用純 REST API 調用
 * - 簡化代碼結構，減少複雜性
 * - 保持原有功能不變
 *
 * Features:
 * - Progressive loading with viewport detection
 * - Infinite scroll pagination
 * - PDF URL fetching on demand
 * - REST API connection status display
 * - DataTable common component for simplified UI
 *
 * Performance improvements:
 * - Lazy loading when component enters viewport
 * - 直接 REST API 調用，無額外開銷
 * - Efficient pagination for large datasets
 * - Optimized state management
 */
