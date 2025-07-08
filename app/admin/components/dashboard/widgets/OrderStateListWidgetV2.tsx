/**
 * Order State List Widget V2
 * 使用 DashboardAPI + 服務器端進度計算
 * 遷移自原 OrderStateListWidget
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
  const [orders, setOrders] = useState<OrderProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    apiResponseTime?: number;
    cacheHit?: boolean;
  }>({});

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const startTime = performance.now();

      const api = createDashboardAPI();
      const result = await api.fetchData({
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

      setOrders(widgetData.data.value || []);
      setMetadata(widgetData.data.metadata || {});
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      fetchOrders();

      // Set up refresh interval for real-time updates
      const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchOrders, isEditMode]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Order State List Widget V2</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center justify-between text-lg font-medium'>
          <div className='flex items-center gap-2'>
            <ClipboardDocumentListIcon className='h-5 w-5' />
            <span>Order Progress</span>
          </div>
          {!isEditMode && performanceMetrics.apiResponseTime && (
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
            <p className='mt-1 text-xs'>{error}</p>
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
