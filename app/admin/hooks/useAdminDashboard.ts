'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  adminDataService,
  DashboardStats,
  AcoOrderProgress,
  InventorySearchResult,
} from '../services/AdminDataService';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Hook for dashboard statistics
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    dailyDonePallets: 0,
    dailyTransferredPallets: 0,
    yesterdayDonePallets: 0,
    yesterdayTransferredPallets: 0,
    past3DaysGenerated: 0,
    past3DaysTransferredPallets: 0,
    past7DaysGenerated: 0,
    past7DaysTransferredPallets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'dashboard-stats';

    // Check cache first
    if (!forceRefresh) {
      const cachedStats = getCachedData<DashboardStats>(cacheKey);
      if (cachedStats) {
        setStats(cachedStats);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const data = await adminDataService.getDashboardStats();
      setStats(data);
      setCachedData(cacheKey, data);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, refresh: () => loadStats(true) };
}

// Hook for ACO orders
export function useAcoOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'aco-orders';

    if (!forceRefresh) {
      const cachedOrders = getCachedData<any[]>(cacheKey);
      if (cachedOrders) {
        setOrders(cachedOrders);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const data = await adminDataService.getIncompleteAcoOrders();
      setOrders(data);
      setCachedData(cacheKey, data);
    } catch (err: any) {
      console.error('Error loading ACO orders:', err);
      setError(err.message);
      toast.error('Failed to load ACO orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return { orders, loading, error, refresh: () => loadOrders(true) };
}

// Hook for ACO order progress
export function useAcoOrderProgress(orderRef: number | null) {
  const [progress, setProgress] = useState<AcoOrderProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!orderRef) {
      setProgress([]);
      return;
    }

    const cacheKey = `aco-progress-${orderRef}`;
    const cachedProgress = getCachedData<AcoOrderProgress[]>(cacheKey);
    if (cachedProgress) {
      setProgress(cachedProgress);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await adminDataService.getAcoOrderProgress(orderRef);
      setProgress(data);
      setCachedData(cacheKey, data);
    } catch (err: any) {
      console.error('Error loading order progress:', err);
      setError(err.message);
      toast.error('Failed to load order progress');
    } finally {
      setLoading(false);
    }
  }, [orderRef]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return { progress, loading, error, refresh: loadProgress };
}

// Hook for inventory search
export function useInventorySearch() {
  const [result, setResult] = useState<InventorySearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (productCode: string) => {
    if (!productCode.trim()) {
      setResult(null);
      return;
    }

    const cacheKey = `inventory-${productCode.toUpperCase()}`;
    const cachedResult = getCachedData<InventorySearchResult>(cacheKey);
    if (cachedResult) {
      setResult(cachedResult);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await adminDataService.searchInventory(productCode);
      setResult(data);
      if (data) {
        setCachedData(cacheKey, data);
      }
    } catch (err: any) {
      console.error('Error searching inventory:', err);
      setError(err.message);
      toast.error('Failed to search inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, search };
}

// Hook for real-time updates
export function useRealtimeStats() {
  const supabase = createClient();
  const { refresh: refreshStats } = useDashboardStats();
  const { refresh: refreshOrders } = useAcoOrders();

  useEffect(() => {
    // Subscribe to palletinfo changes
    const palletChannel = supabase
      .channel('admin-pallets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'record_palletinfo',
        },
        () => {
          process.env.NODE_ENV !== 'production' &&
            process.env.NODE_ENV !== 'production' &&
            console.log('Pallet data changed, refreshing stats...');
          refreshStats();
        }
      )
      .subscribe();

    // Subscribe to transfer changes
    const transferChannel = supabase
      .channel('admin-transfers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'record_transfer',
        },
        () => {
          process.env.NODE_ENV !== 'production' &&
            process.env.NODE_ENV !== 'production' &&
            console.log('Transfer data changed, refreshing stats...');
          refreshStats();
        }
      )
      .subscribe();

    // Subscribe to ACO changes
    const acoChannel = supabase
      .channel('admin-aco')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'record_aco',
        },
        () => {
          process.env.NODE_ENV !== 'production' &&
            process.env.NODE_ENV !== 'production' &&
            console.log('ACO data changed, refreshing orders...');
          refreshOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(palletChannel);
      supabase.removeChannel(transferChannel);
      supabase.removeChannel(acoChannel);
    };
  }, [supabase, refreshStats, refreshOrders]);
}

// Hook for managing time ranges
export function useTimeRange(defaultRange: string = 'Today') {
  const [timeRange, setTimeRange] = useState(defaultRange);
  const [isOpen, setIsOpen] = useState(false);

  const getDataForTimeRange = useCallback(
    (stats: DashboardStats, type: 'generated' | 'transferred') => {
      switch (timeRange) {
        case 'Today':
          return type === 'generated' ? stats.dailyDonePallets : stats.dailyTransferredPallets;
        case 'Yesterday':
          return type === 'generated'
            ? stats.yesterdayDonePallets
            : stats.yesterdayTransferredPallets;
        case 'Past 3 days':
          return type === 'generated'
            ? stats.past3DaysGenerated
            : stats.past3DaysTransferredPallets;
        case 'This week':
        case 'Past 7 days':
          return type === 'generated'
            ? stats.past7DaysGenerated
            : stats.past7DaysTransferredPallets;
        default:
          return 0;
      }
    },
    [timeRange]
  );

  return {
    timeRange,
    setTimeRange,
    isOpen,
    setIsOpen,
    getDataForTimeRange,
  };
}
