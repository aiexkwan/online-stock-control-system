/**
 * Real-time stock monitoring hook
 * Demonstrates client-side strategy for real-time data
 * NOTE: SWR dependency temporarily disabled for build compatibility
 */

// import useSWR, { SWRConfiguration } from 'swr';
import { useEffect, useRef, useCallback, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '../../../app/utils/supabase/client';

interface StockMovement {
  id: string;
  palletNum: string;
  productCode: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  timestamp: string;
  operator: string;
}

interface RealtimeStockData {
  movements: StockMovement[];
  activeTransfers: number;
  lastUpdate: string;
}

interface UseRealtimeStockResult {
  data: RealtimeStockData;
  error: Error | null;
  isLoading: boolean;
  isRealtime: boolean;
  movementsPerMinute: number;
  mutate: () => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
}

interface UseRealtimePalletResult {
  location?: string;
  status?: 'idle' | 'moving' | 'transferred';
  lastUpdate?: string;
  error: Error | null;
  isLoading: boolean;
}

// SWR fetcher
const _fetcher = async (url: string): Promise<RealtimeStockData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
};

// SWR configuration for real-time updates (temporarily disabled)
// const swrConfig: SWRConfiguration = {
//   refreshInterval: 5000, // Poll every 5 seconds
//   revalidateOnFocus: true,
//   revalidateOnReconnect: true,
//   dedupingInterval: 2000,
//   errorRetryCount: 3,
//   errorRetryInterval: 5000,
//   shouldRetryOnError: true,
// };

export function useRealtimeStock(
  warehouse?: string,
  options?: {
    enableWebSocket?: boolean;
    refreshInterval?: number;
  }
): UseRealtimeStockResult {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();
  const [error, setError] = useState<Error | null>(null);

  // Build API URL with filters
  const _apiUrl = `/api/inventory/realtime${warehouse ? `?warehouse=${warehouse}` : ''}`;

  // Temporarily disabled SWR for build compatibility
  // const { data, error, mutate, isLoading } = useSWR<RealtimeStockData>(
  //   apiUrl,
  //   fetcher,
  //   {
  //     ...swrConfig,
  //     refreshInterval: options?.refreshInterval || swrConfig.refreshInterval,
  //   }
  // );

  // Temporary mock data for build compatibility
  const data: RealtimeStockData = {
    movements: [],
    activeTransfers: 0,
    lastUpdate: new Date().toISOString(),
  };
  const isLoading = false;

  // Wrap mutate in useCallback to prevent recreation on every render
  const mutate = useCallback(
    (
      _updater?: (currentData: RealtimeStockData | undefined) => RealtimeStockData | undefined
    ): Promise<void> => Promise.resolve(),
    []
  );

  const refresh = useCallback((): Promise<void> => mutate(), [mutate]);
  const clear = useCallback((): Promise<void> => mutate(undefined), [mutate]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!options?.enableWebSocket) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel('stock-movements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'record_history',
          ...(warehouse ? { filter: `loc=like.${warehouse}%` } : {}),
        },
        payload => {
          try {
            console.log('[Realtime] Stock movement:', payload);

            // Optimistically update the data
            mutate((currentData: RealtimeStockData | undefined) => {
              if (!currentData) return currentData;

              const newPayload = payload.new as Record<string, unknown>;
              const oldPayload = payload.old as Record<string, unknown>;

              const movement: StockMovement = {
                id: (newPayload?.uuid as string) || crypto.randomUUID(),
                palletNum: (newPayload?.plt_num as string) || '',
                productCode: (newPayload?.product_code as string) || '',
                fromLocation: (oldPayload?.loc as string) || '',
                toLocation: (newPayload?.loc as string) || '',
                quantity: (newPayload?.quantity as number) || 0,
                timestamp: (newPayload?.time as string) || new Date().toISOString(),
                operator: (newPayload?.user_name as string) || 'System',
              };

              return {
                ...currentData,
                movements: [movement, ...currentData.movements.slice(0, 49)], // Keep last 50
                activeTransfers: currentData.activeTransfers + 1,
                lastUpdate: new Date().toISOString(),
              };
            }); // Don't revalidate immediately
          } catch (err) {
            console.error('[Realtime] Error processing stock movement:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
          }
        }
      )
      .subscribe(status => {
        console.log('[Realtime] Subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          setError(new Error('Real-time subscription failed'));
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [warehouse, options?.enableWebSocket, supabase, mutate]);

  // Calculate derived state
  const isRealtime = !!options?.enableWebSocket && channelRef.current?.state === 'joined';
  const movementsPerMinute = data?.movements
    ? data.movements.filter(m => {
        const moveTime = new Date(m.timestamp).getTime();
        const oneMinuteAgo = Date.now() - 60000;
        return moveTime > oneMinuteAgo;
      }).length
    : 0;

  return {
    data,
    error,
    isLoading,
    isRealtime,
    movementsPerMinute,
    mutate,
    // Helper methods
    refresh,
    clear,
  };
}

/**
 * Hook for monitoring specific pallet in real-time
 * Temporarily disabled SWR for build compatibility
 */
export function useRealtimePallet(palletNum: string): UseRealtimePalletResult {
  const supabase = createClient();
  const [error, setError] = useState<Error | null>(null);

  // Temporarily disabled SWR
  // const { data, error, mutate } = useSWR<{
  //   location: string;
  //   status: 'idle' | 'moving' | 'transferred';
  //   lastUpdate: string;
  // }>(
  //   `/api/pallets/${palletNum}/status`,
  //   fetcher,
  //   {
  //     refreshInterval: 3000, // More frequent updates for single pallet
  //     revalidateOnFocus: true,

  // Mock data for build compatibility
  const [data] = useState({
    location: 'Unknown',
    status: 'idle' as const,
    lastUpdate: new Date().toISOString(),
  });

  // Wrap mutate in useCallback
  const mutate = useCallback(
    (_updater?: {
      location: string;
      status: 'idle' | 'moving' | 'transferred';
      lastUpdate: string;
    }): Promise<void> => Promise.resolve(),
    []
  );

  // Subscribe to specific pallet changes
  useEffect(() => {
    const channel = supabase
      .channel(`pallet-${palletNum}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'data_code',
          filter: `plt_num=eq.${palletNum}`,
        },
        payload => {
          try {
            // Immediate optimistic update
            const newPayload = payload.new as Record<string, unknown>;
            mutate({
              location: (newPayload.current_plt_loc as string) || 'Unknown',
              status: 'transferred',
              lastUpdate: new Date().toISOString(),
            });
          } catch (err) {
            console.error('[Realtime] Error processing pallet update:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [palletNum, supabase, mutate]);

  return {
    location: data?.location,
    status: data?.status,
    lastUpdate: data?.lastUpdate,
    error,
    isLoading: !data && !error,
  };
}
