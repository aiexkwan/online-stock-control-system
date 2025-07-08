/**
 * ACO Order Progress Widget
 * 顯示 ACO 訂單進度和完成狀態
 *
 * 已遷移至統一架構：
 * - 使用 DashboardAPI 統一數據訪問
 * - 服務器端 JOIN 和聚合計算
 * - 優化性能和代碼結構
 */

'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ClipboardDocumentListIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { WidgetTitle, WidgetText, WidgetLabel, WidgetValue } from '../WidgetTypography';

interface AcoOrder {
  order_ref: number;
  latest_update: string;
  total_required: number;
  total_finished: number;
  total_remaining: number;
  product_count: number;
  completion_percentage: number;
}

interface AcoOrderProgress {
  code: string;
  required_qty: number;
  completed_qty: number;
  remain_qty: number;
  completion_percentage: number;
}

export const AcoOrderProgressWidget = React.memo(function AcoOrderProgressWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  const [incompleteOrders, setIncompleteOrders] = useState<AcoOrder[]>([]);
  const [selectedOrderRef, setSelectedOrderRef] = useState<number | null>(null);
  const [orderProgress, setOrderProgress] = useState<AcoOrderProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [ordersMetadata, setOrdersMetadata] = useState<any>({});
  const [progressMetadata, setProgressMetadata] = useState<any>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);

  // Load incomplete orders using DashboardAPI
  const loadIncompleteOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 使用統一的 DashboardAPI 獲取未完成訂單列表
      const result = await dashboardAPI.fetch(
        {
          widgetIds: ['statsCard'],
          params: {
            dataSource: 'aco_incomplete_orders',
            limit: 50,
            offset: 0,
          },
        },
        {
          strategy: 'server',
          cache: { ttl: 300 }, // 5分鐘緩存
        }
      );

      if (result.widgets && result.widgets.length > 0) {
        const widgetData = result.widgets[0];

        if (widgetData.data.error) {
          console.error('[AcoOrderProgressWidget] API error:', widgetData.data.error);
          setError(widgetData.data.error);
          setIncompleteOrders([]);
          return;
        }

        const orders = widgetData.data.value || [];
        const metadata = widgetData.data.metadata || {};

        console.log('[AcoOrderProgressWidget] API returned', orders.length, 'orders');
        console.log('[AcoOrderProgressWidget] Metadata:', metadata);

        setIncompleteOrders(orders);
        setOrdersMetadata(metadata);

        console.log('[AcoOrderProgressWidget] Orders loaded successfully using optimized API');
      } else {
        console.warn('[AcoOrderProgressWidget] No widget data returned from API');
        setIncompleteOrders([]);
      }
    } catch (err: any) {
      console.error('[AcoOrderProgressWidget] Error loading ACO orders from API:', err);
      setError(err.message);
      setIncompleteOrders([]);
    } finally {
      setLoading(false);
    }
  }, [dashboardAPI]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOrderProgress = useCallback(
    async (orderRef: number) => {
      try {
        // 使用統一的 DashboardAPI 獲取特定訂單進度
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['statsCard'],
            params: {
              dataSource: 'aco_order_progress',
            },
          },
          {
            strategy: 'server',
            cache: { ttl: 180 }, // 3分鐘緩存
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];

          if (widgetData.data.error) {
            console.error('[AcoOrderProgressWidget] Progress API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setOrderProgress([]);
            return;
          }

          const progress = widgetData.data.value || [];
          const metadata = widgetData.data.metadata || {};

          console.log(
            '[AcoOrderProgressWidget] Progress API returned',
            progress.length,
            'products'
          );
          console.log('[AcoOrderProgressWidget] Progress Metadata:', metadata);

          setOrderProgress(progress);
          setProgressMetadata(metadata);

          console.log(
            '[AcoOrderProgressWidget] Order progress loaded successfully using optimized API'
          );
        } else {
          console.warn('[AcoOrderProgressWidget] No progress data returned from API');
          setOrderProgress([]);
        }
      } catch (err: any) {
        console.error('[AcoOrderProgressWidget] Error loading order progress from API:', err);
        setError(err.message);
        setOrderProgress([]);
      }
    },
    [dashboardAPI]
  );

  // Load order progress when selected order changes
  useEffect(() => {
    if (selectedOrderRef) {
      loadOrderProgress(selectedOrderRef);
    }
  }, [selectedOrderRef, loadOrderProgress]);

  // Initial load
  useEffect(() => {
    if (!isEditMode) {
      loadIncompleteOrders();
    }
  }, [loadIncompleteOrders, isEditMode]);

  // Auto-select first order
  useEffect(() => {
    if (incompleteOrders.length > 0 && !selectedOrderRef) {
      setSelectedOrderRef(incompleteOrders[0].order_ref);
    }
  }, [incompleteOrders, selectedOrderRef]);

  const handleOrderSelect = (orderRef: number) => {
    setSelectedOrderRef(orderRef);
    setIsDropdownOpen(false);
  };

  // Fixed layout widget - full functionality
  return (
    <WidgetCard widgetType='ACO_ORDER_PROGRESS' isEditMode={isEditMode}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500'>
              <ClipboardDocumentListIcon className='h-5 w-5 text-white' />
            </div>
            <span
              className={`bg-gradient-to-r from-orange-300 via-amber-300 to-orange-200 bg-clip-text text-sm font-medium text-transparent text-white [text-shadow:_0_0_10px_rgba(251,146,60,0.5),_0_0_20px_rgba(251,146,60,0.3)]`}
            >
              ACO Order Progress
            </span>
          </div>

          {/* Order Dropdown */}
          <div className='relative' ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='flex items-center gap-2 rounded-md border border-slate-600/30 bg-white/5 px-2 py-1 text-xs text-slate-300 transition-all duration-300 hover:bg-white/10 hover:text-white'
              disabled={loading || isEditMode}
            >
              <ClipboardDocumentListIcon className='h-4 w-4' />
              {selectedOrderRef ? `Order ${selectedOrderRef}` : 'Select Order'}
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className='absolute right-0 top-full z-50 mt-2 max-h-60 min-w-[200px] overflow-y-auto rounded-xl border border-slate-600/50 bg-black/80 shadow-2xl backdrop-blur-xl'
                >
                  {incompleteOrders.length === 0 ? (
                    <div className='px-4 py-3 text-sm text-slate-400'>No incomplete orders</div>
                  ) : (
                    incompleteOrders.map((order, idx) => (
                      <button
                        key={`dropdown-order-${order.order_ref}-${idx}`}
                        onClick={() => handleOrderSelect(order.order_ref)}
                        className={`w-full px-3 py-2 text-left text-xs transition-all duration-300 first:rounded-t-xl last:rounded-b-xl hover:bg-white/10 ${
                          selectedOrderRef === order.order_ref
                            ? 'bg-white/10 text-orange-400'
                            : 'text-slate-300'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <span>Order {order.order_ref}</span>
                          <div className='flex flex-col items-end gap-1'>
                            <div className='rounded-lg border border-orange-400/30 bg-orange-500/20 px-2 py-0.5 text-[10px] text-orange-300'>
                              {order.total_remaining} remain
                            </div>
                            <div className='text-[9px] text-slate-400'>
                              {order.completion_percentage}% done
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-4'>
            <div className='h-4 animate-pulse rounded bg-white/10'></div>
            <div className='h-4 w-3/4 animate-pulse rounded bg-white/10'></div>
            <div className='h-4 w-1/2 animate-pulse rounded bg-white/10'></div>
          </div>
        ) : error ? (
          <div className='text-sm text-red-400'>{error}</div>
        ) : orderProgress.length === 0 ? (
          <div className='py-12 text-center'>
            <ClipboardDocumentListIcon className='mx-auto mb-4 h-16 w-16 text-slate-600' />
            <WidgetText size='large' glow='gray'>
              Select an ACO order to view progress
            </WidgetText>
          </div>
        ) : (
          <div className='space-y-6'>
            {orderProgress.map((item, index) => (
              <div key={`${selectedOrderRef}-${item.code}-${index}`} className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <WidgetText size='xs' glow='white' className='text-xs font-medium'>
                    {item.code}
                  </WidgetText>
                  <span
                    className={`text-[10px] ${WidgetStyles.text.tableData} rounded-full bg-white/5 px-2 py-0.5`}
                  >
                    {item.completed_qty} / {item.required_qty}
                  </span>
                </div>
                <div className='h-3 w-full overflow-hidden rounded-full bg-white/10'>
                  <div
                    className='flex h-3 items-center justify-end rounded-full bg-gradient-to-r from-orange-500 to-amber-400 pr-2 transition-all duration-700'
                    style={{ width: `${item.completion_percentage}%` }}
                  >
                    {item.completion_percentage > 25 && (
                      <WidgetLabel size='xs' glow='strong' className='font-bold'>
                        {item.completion_percentage}%
                      </WidgetLabel>
                    )}
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  {item.completion_percentage <= 25 ? (
                    <WidgetText size='xs' glow='white' className='text-xs font-bold'>
                      {item.completion_percentage}%
                    </WidgetText>
                  ) : (
                    <span></span>
                  )}
                  {progressMetadata.orderRef && (
                    <WidgetLabel size='xs' glow='subtle' className='text-[10px]'>
                      Order {progressMetadata.orderRef} • {progressMetadata.productCount} products
                    </WidgetLabel>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default AcoOrderProgressWidget;
