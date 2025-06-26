/**
 * Orders List Widget - GraphQL Version
 * 篩選條件：doc_type = 'order'
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DocumentArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { GET_ORDER_UPLOADS, GET_USERS_BY_IDS } from '@/lib/graphql/queries';

interface OrderRecord {
  uuid: string;
  doc_name: string;
  upload_by: string | number;
  created_at: string;
  uploader_name?: string;
}

export const OrdersListGraphQL = React.memo(function OrdersListGraphQL({ widget, isEditMode }: WidgetComponentProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const itemsPerPage = 15; // Always show 15 items initially

  // 初始載入 - 使用新的 stable client
  const { data: initialData, loading: initialLoading, error, refetch, isRefetching } = useGraphQLQuery(
    GET_ORDER_UPLOADS,
    {
      offset: 0,
      limit: itemsPerPage
    }
  );

  // 處理初始數據和用戶名稱查詢
  useEffect(() => {
    const processInitialData = async () => {
      if (!initialData?.doc_uploadCollection) return;

      const edges = initialData.doc_uploadCollection.edges || [];
      const pageInfo = initialData.doc_uploadCollection.pageInfo;
      
      setHasMore(pageInfo?.hasNextPage || false);

      if (edges.length === 0) {
        setOrders([]);
        return;
      }

      // 獲取唯一的用戶 ID
      const userIds = [...new Set(edges.map((edge: any) => edge.node.upload_by))]
        .filter(id => id)
        .map(id => Number(id));

      // 批量查詢用戶名稱
      let userMap = new Map<number, string>();
      if (userIds.length > 0) {
        try {
          const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/graphql/v1', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            },
            body: JSON.stringify({
              query: GET_USERS_BY_IDS,
              variables: { userIds }
            })
          });

          const userData = await response.json();
          if (userData?.data?.data_idCollection?.edges) {
            userData.data.data_idCollection.edges.forEach((edge: any) => {
              userMap.set(edge.node.id, edge.node.name);
            });
          }
        } catch (err) {
          console.error('[OrdersListGraphQL] Error fetching user names:', err);
        }
      }

      // 組合數據
      const processedData = edges.map((edge: any) => ({
        ...edge.node,
        uploader_name: userMap.get(Number(edge.node.upload_by)) || `User ${edge.node.upload_by}`
      }));

      setOrders(processedData);
      setPage(1);
    };

    processInitialData();
  }, [initialData]);

  // 載入更多
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/graphql/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        },
        body: JSON.stringify({
          query: GET_ORDER_UPLOADS,
          variables: {
            offset: page * itemsPerPage,
            limit: itemsPerPage
          }
        })
      });

      const result = await response.json();
      
      if (result?.data?.doc_uploadCollection) {
        const edges = result.data.doc_uploadCollection.edges || [];
        const pageInfo = result.data.doc_uploadCollection.pageInfo;
        
        setHasMore(pageInfo?.hasNextPage || false);

        if (edges.length > 0) {
          // 獲取用戶名稱
          const userIds = [...new Set(edges.map((edge: any) => edge.node.upload_by))]
            .filter(id => id)
            .map(id => Number(id));

          let userMap = new Map<number, string>();
          if (userIds.length > 0) {
            const userResponse = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/graphql/v1', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              },
              body: JSON.stringify({
                query: GET_USERS_BY_IDS,
                variables: { userIds }
              })
            });

            const userData = await userResponse.json();
            if (userData?.data?.data_idCollection?.edges) {
              userData.data.data_idCollection.edges.forEach((edge: any) => {
                userMap.set(edge.node.id, edge.node.name);
              });
            }
          }

          const processedData = edges.map((edge: any) => ({
            ...edge.node,
            uploader_name: userMap.get(Number(edge.node.upload_by)) || `User ${edge.node.upload_by}`
          }));

          setOrders(prev => [...prev, ...processedData]);
          setPage(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('[OrdersListGraphQL] Error loading more:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore]);

  const formatTime = (timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      return format(date, 'dd MMM yyyy HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  const loading = initialLoading;

  // Small size - 簡化顯示

  // Medium & Large sizes
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="CUSTOM" isEditMode={isEditMode} className="flex flex-col">
        {/* GraphQL 標識 */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white text-xs rounded-full shadow-lg backdrop-blur-sm z-10">
          GraphQL
        </div>
        
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <DocumentArrowUpIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-medium text-slate-200">Order Upload History</span>
            </div>
            <button
              onClick={() => !isEditMode && refetch()}
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
          {loading && !initialData && orders.length === 0 ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-400 text-sm">Error loading orders</p>
              </div>
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
                  onClick={() => loadMore()}
                  className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  disabled={isEditMode || loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more...'}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});