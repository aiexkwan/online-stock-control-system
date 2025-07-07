/**
 * Order State List Widget
 * 以列表形式、進度條顯示現有所有 order 的完成進度
 * 預計顯示最新的 5 條 order progress
 * 支援上下滾動查看餘下
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface OrderProgress {
  uuid: string;
  order_ref: string;
  account_num: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  loaded_qty: number;
  created_at: string;
}

export const OrderStateListWidget = React.memo(function OrderStateListWidget({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  const [data, setData] = useState<OrderProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用 Supabase client 查詢未完成訂單
  useEffect(() => {
    const fetchPendingOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        
        // 查詢所有訂單
        const { data: ordersData, error: ordersError } = await supabase
          .from('data_order')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // 篩選未完成訂單 (loaded_qty < product_qty 或 loaded_qty 為 null)
        const pendingOrders = ordersData?.filter(order => {
          const loadedQty = order.loaded_qty || 0;
          const productQty = order.product_qty || 0;
          return productQty > 0 && loadedQty < productQty;
        }) || [];

        setData(pendingOrders);
      } catch (err) {
        console.error('Error fetching pending orders:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  // 處理訂單數據
  const orders = useMemo(() => {
    return data.map((order: OrderProgress) => {
      const loadedQty = order.loaded_qty || 0;
      const productQty = order.product_qty || 0;
      const progress = productQty > 0 ? (loadedQty / productQty) * 100 : 0;
      
      return {
        ...order,
        progress: Math.min(100, Math.max(0, progress)),
        progressText: `${loadedQty} / ${productQty}`,
        status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending',
        statusColor: progress === 0 ? 'red' : 
                     progress < 50 ? 'yellow' : 
                     progress < 100 ? 'orange' : 'green'
      };
    });
  }, [data]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-slate-400 font-medium">Order State List Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5" />
            Order Progress
          </CardTitle>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {orders.length} pending orders
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-2 bg-slate-700/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center">
              <p>Error loading orders</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center text-slate-400 font-medium py-8">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>All orders completed</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto h-full pr-2">
              {orders.map((order, index) => (
                <motion.div
                  key={order.uuid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/50 hover:border-slate-500/50 transition-colors"
                >
                  {/* 訂單標題和進度 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        order.statusColor === 'green' ? "bg-green-400" :
                        order.statusColor === 'orange' ? "bg-orange-400" :
                        order.statusColor === 'yellow' ? "bg-yellow-400" :
                        order.statusColor === 'red' ? "bg-red-400" : "bg-slate-400"
                      )} />
                      <span className="text-sm font-medium text-white truncate">
                        {order.order_ref}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg font-bold text-white">
                        {order.progress.toFixed(0)}%
                      </span>
                      {order.status === 'completed' && (
                        <TruckIcon className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* 進度條 */}
                  <div className="mt-2">
                    <Progress 
                      value={order.progress} 
                      className="h-2"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
    </WidgetCard>
  );
});

export default OrderStateListWidget;