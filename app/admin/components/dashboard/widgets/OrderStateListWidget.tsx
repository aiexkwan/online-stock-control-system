/**
 * Order State List Widget
 * 以列表形式、進度條顯示現有所有 order 的完成進度
 * 預計顯示最新的 5 條 order progress
 * 支援上下滾動查看餘下
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { GET_ORDER_PROGRESS } from '@/lib/graphql/queries';
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
  // 使用 GraphQL 查詢獲取數據
  const { data, loading, error } = useGraphQLQuery(GET_ORDER_PROGRESS, {
    limit: 10 // 獲取更多數據以便滾動
  });

  // 處理訂單數據
  const orders = useMemo(() => {
    if (!data?.data_orderCollection?.edges) return [];
    
    return data.data_orderCollection.edges.map((edge: any) => {
      const order = edge.node as OrderProgress;
      const progress = order.product_qty > 0 ? (order.loaded_qty / order.product_qty) * 100 : 0;
      
      return {
        ...order,
        progress: Math.min(100, Math.max(0, progress)),
        progressText: `${order.loaded_qty || 0} / ${order.product_qty || 0}`,
        status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending'
      };
    });
  }, [data]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Order State List Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <div className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5" />
            Order Progress
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">
            Latest {orders.length} orders
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
              <p className="text-xs mt-1">{error.message}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto h-full pr-2">
              {orders.map((order, index) => (
                <motion.div
                  key={order.uuid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50 hover:border-slate-500/50 transition-colors"
                >
                  {/* 訂單標題 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        order.status === 'completed' ? "bg-green-400" :
                        order.status === 'in_progress' ? "bg-yellow-400" : "bg-gray-400"
                      )} />
                      <span className="text-sm font-medium text-white truncate">
                        {order.order_ref}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {format(new Date(order.created_at), 'MMM d')}
                    </span>
                  </div>
                  
                  {/* 客戶和產品信息 */}
                  <div className="text-xs text-gray-400 mb-2">
                    <div className="truncate">{order.account_num}</div>
                    <div className="truncate">{order.product_code}</div>
                  </div>
                  
                  {/* 進度條 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">
                        {order.progressText} ({order.progress.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress 
                      value={order.progress} 
                      className="h-1.5"
                    />
                  </div>
                  
                  {/* 狀態指示器 */}
                  <div className="flex items-center gap-1 mt-2">
                    {order.status === 'completed' && (
                      <TruckIcon className="w-3 h-3 text-green-400" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      order.status === 'completed' ? "text-green-400" :
                      order.status === 'in_progress' ? "text-yellow-400" : "text-gray-400"
                    )}>
                      {order.status === 'completed' ? 'Completed' :
                       order.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </WidgetCard>
  );
});