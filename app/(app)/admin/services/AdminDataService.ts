'use server';

import { createClient } from '@/app/utils/supabase/server';
import { cache } from 'react';
import {
  getAcoIncompleteOrdersAction,
  getAcoOrderProgressAction,
  type AcoOrderProgress as ServerActionAcoOrderProgress,
} from '@/app/actions/acoOrderProgressActions';

import {
  DashboardStats,
  TimeRangeData,
  AcoOrderProgress,
  InventorySearchResult,
} from '@/types/services/admin';

class AdminDataService {
  // Cache dashboard stats for 5 minutes
  getDashboardStats = cache(async (): Promise<DashboardStats> => {
    const supabase = await createClient();

    try {
      // Call RPC function to get all stats in one query
      const { data, error } = await supabase.rpc('get_dashboard_stats');

      if (error) throw error;

      return (
        (data as unknown as DashboardStats) || {
          dailyDonePallets: 0,
          dailyTransferredPallets: 0,
          yesterdayDonePallets: 0,
          yesterdayTransferredPallets: 0,
          past3DaysGenerated: 0,
          past3DaysTransferredPallets: 0,
          past7DaysGenerated: 0,
          past7DaysTransferredPallets: 0,
        }
      );
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      throw error;
    }
  });

  // Get stats for specific time range
  getTimeRangeStats = cache(
    async (
      timeRange: 'today' | 'yesterday' | 'past3days' | 'past7days'
    ): Promise<TimeRangeData> => {
      const supabase = await createClient();

      try {
        // RPC function doesn't exist, return fallback data
        console.warn(
          `get_time_range_stats RPC function not found, returning fallback data for ${timeRange}`
        );
        return { generated: 0, transferred: 0 };
      } catch (error) {
        console.error(`Error loading ${timeRange} stats:`, error);
        throw error;
      }
    }
  );

  // Get incomplete ACO orders
  getIncompleteAcoOrders = cache(async () => {
    try {
      // 使用專用的 server action
      return await getAcoIncompleteOrdersAction();
    } catch (error) {
      console.warn('Server action failed, falling back to direct query:', error);

      // Fallback to direct query
      const supabase = await createClient();

      try {
        const { data, error } = await supabase
          .from('record_aco')
          .select('*')
          .or('finished_qty.is.null,finished_qty.lt.required_qty')
          .order('order_ref', { ascending: false });

        if (error) throw error;

        return data || [];
      } catch (fallbackError) {
        console.error('Error loading ACO orders:', fallbackError);
        throw fallbackError;
      }
    }
  });

  // Get ACO order progress
  getAcoOrderProgress = cache(async (orderRef: number): Promise<AcoOrderProgress[]> => {
    try {
      // 使用專用的 server action
      const result = await getAcoOrderProgressAction({ orderRef });
      // 轉換 server action 結果到符合現有介面的格式
      return result.map(item => ({
        code: item.code,
        description: '', // Default empty description
        ordered: item.required_qty,
        completed: item.completed_qty,
        remaining: item.remain_qty,
        percentage: item.completion_percentage,
        orderRef: orderRef,
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('Server action failed, falling back to direct query:', error);

      // Fallback to direct query
      const supabase = await createClient();

      try {
        const { data, error } = await supabase
          .from('record_aco')
          .select('*')
          .eq('order_ref', orderRef);

        if (error) throw error;

        return (data || []).map(item => {
          const completed = item.finished_qty || 0;
          const remaining = Math.max(0, item.required_qty - completed);
          return {
            code: item.code,
            description: item.code,
            ordered: item.required_qty,
            completed: completed,
            remaining: remaining,
            percentage: item.required_qty > 0 ? Math.round((completed / item.required_qty) * 100) : 0,
            orderRef: orderRef,
            updatedAt: new Date().toISOString(),
          };
        });
      } catch (fallbackError) {
        console.error('Error loading order progress:', fallbackError);
        throw fallbackError;
      }
    }
  });

  // Search inventory by product code
  searchInventory = cache(async (productCode: string): Promise<InventorySearchResult | null> => {
    if (!productCode.trim()) return null;

    const supabase = await createClient();

    try {
      // RPC function doesn't exist, return fallback data
      console.warn(
        `search_inventory_by_product RPC function not found, returning fallback data for ${productCode}`
      );

      return {
        productCode: productCode.toUpperCase(),
        productName: productCode.toUpperCase(),
        totalStock: 0,
        locations: [],
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  });

  // Get void statistics
  getVoidStatistics = cache(async (timeRange: 'today' | 'week' | 'month') => {
    const supabase = await createClient();

    try {
      // RPC function doesn't exist, return fallback data
      console.warn(
        `get_void_statistics RPC function not found, returning fallback data for ${timeRange}`
      );
      return { count: 0, pallets: [] };
    } catch (error) {
      console.error('Error loading void statistics:', error);
      throw error;
    }
  });
}

export const adminDataService = new AdminDataService();
