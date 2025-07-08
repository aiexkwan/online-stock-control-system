/**
 * OrdersListWidgetV2 - Real-time Orders List Widget
 * Part of Phase 3.1: Real-time Component Migration
 *
 * Features:
 * - Server-side initial data loading
 * - Real-time updates via Supabase Realtime
 * - SWR caching and optimistic updates
 * - Automatic fallback to polling
 * - PDF preview functionality
 */

'use client';

import React, { useState, useCallback } from 'react';
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
import { ordersAPI, OrdersListResponse } from '@/lib/api/modules/OrdersAPI';
import { cn } from '@/lib/utils';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';

// ================================
// Types
// ================================

export interface OrdersListWidgetV2Props extends WidgetComponentProps {
  initialData?: OrdersListResponse;
}

// ================================
// Component
// ================================

export const OrdersListWidgetV2 = React.memo(function OrdersListWidgetV2({
  widget,
  isEditMode,
  initialData,
}: OrdersListWidgetV2Props) {
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);

  // Use real-time orders hook
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
    autoRefresh: !isEditMode, // Disable real-time in edit mode
  });

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
        const pdfUrl = await ordersAPI.getPdfUrl(orderRef);

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
      {isRealtimeConnected ? (
        <>
          <WifiIcon className='h-3 w-3 text-emerald-400' />
          <span className='text-emerald-400'>Real-time</span>
        </>
      ) : isPolling ? (
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
            onClick={() => !isEditMode && refresh()}
            disabled={isEditMode || loading}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              'hover:bg-slate-700/50',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            title='Refresh'
          >
            <ArrowPathIcon className={cn('h-4 w-4 text-slate-400', loading && 'animate-spin')} />
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
        {error && !loading && (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <AlertCircle className='mx-auto mb-2 h-12 w-12 text-red-500' />
              <p className='mb-2 text-sm text-red-400'>Error loading orders</p>
              <button
                onClick={refresh}
                className='text-xs text-cyan-400 underline hover:text-cyan-300'
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && orders.length === 0 && !error ? (
          <div className='animate-pulse space-y-2'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-10 rounded-lg bg-white/10'></div>
            ))}
          </div>
        ) : orders.length === 0 && !error ? (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <DocumentArrowUpIcon className='mx-auto mb-2 h-12 w-12 text-slate-600' />
              <p className='text-sm text-slate-500'>No orders uploaded</p>
            </div>
          </div>
        ) : (
          !error && (
            <div className='flex-1 space-y-1 overflow-y-auto'>
              <AnimatePresence mode='popLayout'>
                {orders.map((order, index) => (
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
              {hasMore && !loadingMore && !error && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={loadMore}
                  className={cn(
                    'w-full py-2 text-sm text-cyan-400',
                    'transition-colors hover:text-cyan-300'
                  )}
                  disabled={isEditMode}
                >
                  Load more ({totalCount - orders.length} remaining)
                </motion.button>
              )}

              {/* Loading More Indicator */}
              {loadingMore && (
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
              {!hasMore && orders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='w-full py-2 text-center text-sm text-slate-500'
                >
                  End of list ({orders.length} orders)
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
