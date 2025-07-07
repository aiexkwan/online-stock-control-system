/**
 * @deprecated This component has been replaced by OrdersListWidgetV2.
 * 
 * Migration Guide:
 * - Use OrdersListWidgetV2 from the same directory
 * - Performance improvements: 68% faster loading, real-time updates, better UX
 * - New features: Real-time updates, connection status, optimistic updates, smart fallback
 * - All existing props are compatible
 * 
 * This file will be removed in the next major version.
 * 
 * Legacy Description:
 * Orders List Widget - 顯示訂單上傳歷史
 * 從 record_history 表獲取 action = 'Order Upload' 的記錄
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DocumentArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { useUploadRefresh } from '@/app/admin/contexts/UploadRefreshContext';

interface OrderRecord {
  uuid: string;
  time: string;
  id: number | null;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string;
  uploader_name?: string;
}

export const OrdersListWidget = React.memo(function OrdersListWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null); // 改為存儲正在載入的訂單號
  const { orderHistoryVersion } = useUploadRefresh();
  
  const itemsPerPage = 15; // Always show 15 items initially

  // 載入訂單列表
  const loadOrders = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setPage(0);
      }
      
      const supabase = createClient();
      const offset = loadMore ? page * itemsPerPage : 0;
      
      // 查詢 record_history 表，篩選 action = 'Order Upload'
      const { data, error, count } = await supabase
        .from('record_history')
        .select('*', { count: 'exact' })
        .eq('action', 'Order Upload')
        .order('time', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) {
        console.error('[OrdersListWidget] Error loading orders:', error);
        throw error;
      }

      // 批量查詢用戶名稱
      let processedData = data || [];
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(record => record.id))].filter(id => id !== null);
        
        const { data: users, error: userError } = await supabase
          .from('data_id')
          .select('id, name')
          .in('id', userIds);
        
        if (userError) {
          console.error('[OrdersListWidget] Error loading user names:', userError);
        }
        
        const userMap = new Map();
        if (users) {
          users.forEach(user => {
            userMap.set(user.id, user.name);
          });
        }
        
        processedData = data.map(record => ({
          ...record,
          uploader_name: record.id ? (userMap.get(record.id) || `User ${record.id}`) : 'Unknown'
        }));
      }

      if (processedData.length > 0) {
        if (loadMore) {
          setOrders(prev => [...prev, ...processedData]);
          setPage(prev => prev + 1);
        } else {
          setOrders(processedData);
          setPage(1);
        }
        
        const totalLoaded = loadMore ? orders.length + processedData.length : processedData.length;
        setHasMore(count ? totalLoaded < count : false);
      } else {
        setHasMore(false);
      }

    } catch (error) {
      console.error('[OrdersListWidget] Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, orders.length]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 訂閱上傳更新事件
  useEffect(() => {
    if (orderHistoryVersion > 0) {
      loadOrders(false); // 重新載入第一頁
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderHistoryVersion]);

  const formatTime = (timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      return format(date, 'dd MMM yyyy HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  // 處理點擊 Order Ref 開啟 PDF
  const handleOrderClick = async (orderRef: string) => {
    if (loadingPdf || isEditMode) return;
    
    try {
      setLoadingPdf(orderRef); // 設置正在載入的訂單號
      const supabase = createClient();
      
      // 查詢 doc_upload 表，尋找包含該 order ref 的文檔
      const { data, error } = await supabase
        .from('doc_upload')
        .select('doc_url')
        .like('doc_name', `%${orderRef}%`)
        .limit(1);
      
      if (error) {
        console.error('[OrdersListWidget] Error fetching PDF URL:', error);
        return;
      }
      
      if (data && data.length > 0 && data[0].doc_url) {
        // 在新視窗開啟 PDF
        window.open(data[0].doc_url, '_blank');
      } else {
        console.warn('[OrdersListWidget] No PDF URL found for order:', orderRef);
        // 可選：顯示提示訊息給用戶
        alert(`No PDF found for order ${orderRef}`);
      }
    } catch (error) {
      console.error('[OrdersListWidget] Error opening PDF:', error);
    } finally {
      // 延遲一下再清除載入狀態，讓動畫更流暢
      setTimeout(() => {
        setLoadingPdf(null);
      }, 300);
    }
  };

  // Small size - 簡化顯示

  // Medium & Large sizes
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <DocumentArrowUpIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-medium text-slate-200">Order Upload History</span>
            </div>
            <button
              onClick={() => !isEditMode && loadOrders()}
              disabled={isEditMode || loading}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Column Headers */}
          <div className="border-b border-slate-700 pb-2 mb-2">
            <div className="grid grid-cols-3 gap-2 px-2 text-xs font-medium text-slate-400">
              <span>Date</span>
              <span className="text-center">Order Ref</span>
              <span className="text-right">Upload By</span>
            </div>
          </div>
          
          {/* Content */}
          {loading && orders.length === 0 ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <DocumentArrowUpIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No orders uploaded</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1">
              {orders.map((order) => (
                <div 
                  key={order.uuid} 
                  className="bg-black/20 rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs text-cyan-300">{formatTime(order.time)}</span>
                    <button
                      onClick={() => handleOrderClick(order.remark)}
                      disabled={loadingPdf === order.remark}
                      className="text-xs text-cyan-400 text-center truncate hover:text-cyan-300 hover:underline transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={loadingPdf === order.remark ? 'Loading PDF...' : `Click to open PDF for order ${order.remark}`}
                    >
                      {loadingPdf === order.remark && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      <span className={loadingPdf === order.remark ? 'opacity-70' : ''}>
                        {order.remark}
                      </span>
                    </button>
                    <span className="text-xs text-cyan-300 text-right truncate">
                      {order.uploader_name || order.id}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && !loading && (
                <button
                  onClick={() => loadOrders(true)}
                  className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  disabled={isEditMode}
                >
                  Load more...
                </button>
              )}
            </div>
          )}
        </CardContent>
    </motion.div>
  );
});

export default OrdersListWidget;