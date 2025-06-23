/**
 * Orders List Widget - 顯示訂單文件列表
 * 篩選條件：doc_type = 'order'
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DocumentArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetCard } from '../WidgetCard';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';

interface OrderRecord {
  uuid: string;
  doc_name: string;
  upload_by: string | number;
  created_at: string;
  uploader_name?: string;
}

export const OrdersListWidget = React.memo(function OrdersListWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const size = widget.config.size || WidgetSize.MEDIUM;
  const itemsPerPage = size === WidgetSize.LARGE ? 15 : size === WidgetSize.MEDIUM ? 10 : 5;

  // 載入訂單列表
  const loadOrders = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setPage(0);
      }
      
      const supabase = createClient();
      const offset = loadMore ? page * itemsPerPage : 0;
      
      // 查詢 doc_upload 表，篩選 doc_type = 'order'
      const { data, error, count } = await supabase
        .from('doc_upload')
        .select('*', { count: 'exact' })
        .eq('doc_type', 'order')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) {
        console.error('[OrdersListWidget] Error loading orders:', error);
        throw error;
      }

      // 批量查詢用戶名稱
      let processedData = data || [];
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(record => record.upload_by))].filter(id => id);
        
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
          uploader_name: userMap.get(Number(record.upload_by)) || `User ${record.upload_by}`
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
  }, []);

  const formatTime = (timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      return format(date, 'dd MMM yyyy HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  // Small size - 簡化顯示
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <WidgetCard size={widget.config.size} widgetType="CUSTOM" isEditMode={isEditMode}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DocumentArrowUpIcon className="w-4 h-4 text-blue-400" />
              <span>Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold text-blue-400">
              {loading ? '...' : orders.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Recent orders</p>
          </CardContent>
        </WidgetCard>
      </motion.div>
    );
  }

  // Medium & Large sizes
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard size={widget.config.size} widgetType="CUSTOM" isEditMode={isEditMode} className="flex flex-col">
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
        
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Column Headers */}
          <div className="border-b border-slate-700 pb-2 mb-2">
            <div className="grid grid-cols-3 gap-2 px-2 text-xs font-medium text-slate-400">
              <span>Date</span>
              <span>Order File</span>
              <span>Upload By</span>
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
                    <span className="text-xs text-cyan-300">{formatTime(order.created_at)}</span>
                    <span className="text-xs text-cyan-400 truncate" title={order.doc_name}>
                      {order.doc_name}
                    </span>
                    <span className="text-xs text-cyan-300 text-right truncate">
                      {order.uploader_name || order.upload_by}
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
      </WidgetCard>
    </motion.div>
  );
});