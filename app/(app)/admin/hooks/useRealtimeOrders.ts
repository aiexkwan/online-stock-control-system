/**
 * useRealtimeOrders Hook
 * Part of Phase 3.1: Real-time Component Migration
 *
 * Provides real-time order updates with SWR caching,
 * Supabase Realtime subscriptions, and automatic fallback
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import useSWR from 'swr';
import { ordersAPI, OrdersListResponse, OrderRecord } from '@/lib/api/modules/OrdersAPI';
import { RealtimeChannel } from '@supabase/supabase-js';

// ================================
// Types
// ================================

interface UseRealtimeOrdersOptions {
  limit?: number;
  initialData?: OrdersListResponse;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
  autoRefresh?: boolean;
}

interface UseRealtimeOrdersReturn {
  orders: OrderRecord[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  totalCount: number;
  loadMore: () => void;
  refresh: () => Promise<void>;
  isRealtimeConnected: boolean;
  isPolling: boolean;
}

// ================================
// Hook Implementation
// ================================

export function useRealtimeOrders({
  limit = 15,
  initialData,
  fallbackToPolling = true,
  pollingInterval = 30000, // 30 seconds
  autoRefresh = true,
}: UseRealtimeOrdersOptions = {}): UseRealtimeOrdersReturn {
  // State management
  const [page, setPage] = useState(0);
  const [allOrders, setAllOrders] = useState<OrderRecord[]>(initialData?.orders || []);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  // Refs for stable references
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // SWR for data fetching with server action
  const {
    data,
    error,
    isLoading,
    mutate: swrMutate,
  } = useSWR(
    ['orders-list', page, limit],
    async ([_, currentPage, currentLimit]) => {
      const offset = currentPage * currentLimit;
      return await ordersAPI.getOrdersList(currentLimit, offset);
    },
    {
      fallbackData: page === 0 ? initialData : undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: autoRefresh,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  // Merge paginated data
  useEffect(() => {
    if (data?.orders) {
      if (page === 0) {
        setAllOrders(data.orders);
      } else {
        // Merge new page data, avoiding duplicates
        setAllOrders(prev => {
          const existingUuids = new Set(prev.map(order => order.uuid));
          const newOrders = data.orders.filter(order => !existingUuids.has(order.uuid));
          return [...prev, ...newOrders];
        });
      }
    }
  }, [data, page]);

  // Setup realtime subscription
  useEffect(() => {
    if (!autoRefresh) return;

    const supabase = createClient();

    const setupRealtime = () => {
      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel('orders-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'record_history',
            filter: 'action=eq.Order Upload',
          },
          async payload => {
            console.log('[useRealtimeOrders] New order received:', payload);

            // Optimistic update - immediately show new order
            const newOrder: OrderRecord = {
              uuid: payload.new.uuid,
              time: payload.new.time,
              id: payload.new.id,
              action: payload.new.action,
              plt_num: payload.new.plt_num,
              loc: payload.new.loc,
              remark: payload.new.remark,
              uploader_name: 'Loading...', // Will be updated by revalidation
              doc_url: null,
            };

            // Add to beginning of list
            setAllOrders(prev => {
              // Check if order already exists (avoid duplicates)
              if (prev.some(order => order.uuid === newOrder.uuid)) {
                return prev;
              }
              return [newOrder, ...prev];
            });

            // Trigger revalidation to get complete data with user name
            // Only revalidate first page
            if (page === 0) {
              await swrMutate();
            }
          }
        )
        .subscribe((status, error) => {
          console.log('[useRealtimeOrders] Subscription status:', status, error);

          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
            setPollingEnabled(false);
            retryCountRef.current = 0;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsRealtimeConnected(false);
            retryCountRef.current++;

            // Fallback to polling after max retries
            if (retryCountRef.current >= maxRetries && fallbackToPolling) {
              console.warn('[useRealtimeOrders] Realtime failed, falling back to polling');
              setPollingEnabled(true);
            }
          }
        });

      channelRef.current = channel;
      return channel;
    };

    // Setup realtime connection
    setupRealtime();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fallbackToPolling, page, swrMutate, autoRefresh]);

  // Polling fallback
  useEffect(() => {
    if (!pollingEnabled || !autoRefresh) return;

    console.log('[useRealtimeOrders] Polling enabled, interval:', pollingInterval);

    const interval = setInterval(() => {
      // Only refresh first page
      if (page === 0) {
        swrMutate();
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingEnabled, pollingInterval, swrMutate, page, autoRefresh]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!data?.hasMore || isLoading) return;
    setPage(prev => prev + 1);
  }, [data?.hasMore, isLoading]);

  // Refresh function - reset to first page
  const refresh = useCallback(async () => {
    setPage(0);
    setAllOrders([]);
    await swrMutate();
  }, [swrMutate]);

  // Return values
  return {
    orders: allOrders,
    loading: isLoading && page === 0,
    loadingMore: isLoading && page > 0,
    error: error || null,
    hasMore: data?.hasMore || false,
    totalCount: data?.totalCount || 0,
    loadMore,
    refresh,
    isRealtimeConnected,
    isPolling: pollingEnabled,
  };
}

// ================================
// Utility Functions
// ================================

/**
 * Hook to prefetch orders data for Server Components
 */
export async function prefetchOrders(limit: number = 15): Promise<OrdersListResponse> {
  return ordersAPI.getOrdersList(limit, 0);
}

/**
 * Helper to check connection status
 */
export function useRealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Test connection with a simple channel
    const channel = supabase.channel('connection-test').subscribe(status => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return isConnected;
}
