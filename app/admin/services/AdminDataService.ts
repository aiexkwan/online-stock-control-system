'use server';

import { createClient } from '@/app/utils/supabase/server';
import { cache } from 'react';

export interface DashboardStats {
  dailyDonePallets: number;
  dailyTransferredPallets: number;
  yesterdayDonePallets: number;
  yesterdayTransferredPallets: number;
  past3DaysGenerated: number;
  past3DaysTransferredPallets: number;
  past7DaysGenerated: number;
  past7DaysTransferredPallets: number;
}

export interface TimeRangeData {
  generated: number;
  transferred: number;
}

export interface AcoOrderProgress {
  code: string;
  required_qty: number;
  remain_qty: number;
  completed_qty: number;
  completion_percentage: number;
}

export interface InventorySearchResult {
  product_code: string;
  injection: number;
  pipeline: number;
  await: number;
  fold: number;
  bulk: number;
  backcarpark: number;
  damage: number;
  total: number;
}

class AdminDataService {
  private acoOrderAdapter: any = null;
  
  // 初始化適配器（延遲加載，避免 server-side 問題）
  private getAcoOrderAdapter() {
    if (typeof window !== 'undefined' && !this.acoOrderAdapter) {
      const { AcoOrderProgressAdapter } = require('@/lib/orders/adapters/AcoOrderProgressAdapter');
      this.acoOrderAdapter = new AcoOrderProgressAdapter();
    }
    return this.acoOrderAdapter;
  }
  // Cache dashboard stats for 5 minutes
  getDashboardStats = cache(async (): Promise<DashboardStats> => {
    const supabase = await createClient();
    
    try {
      // Call RPC function to get all stats in one query
      const { data, error } = await supabase
        .rpc('get_admin_dashboard_stats');

      if (error) throw error;

      return data || {
        dailyDonePallets: 0,
        dailyTransferredPallets: 0,
        yesterdayDonePallets: 0,
        yesterdayTransferredPallets: 0,
        past3DaysGenerated: 0,
        past3DaysTransferredPallets: 0,
        past7DaysGenerated: 0,
        past7DaysTransferredPallets: 0,
      };
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      throw error;
    }
  });

  // Get stats for specific time range
  getTimeRangeStats = cache(async (timeRange: 'today' | 'yesterday' | 'past3days' | 'past7days'): Promise<TimeRangeData> => {
    const supabase = await createClient();
    
    try {
      const { data, error } = await supabase
        .rpc('get_time_range_stats', { time_range: timeRange });

      if (error) throw error;

      return data || { generated: 0, transferred: 0 };
    } catch (error) {
      console.error(`Error loading ${timeRange} stats:`, error);
      throw error;
    }
  });

  // Get incomplete ACO orders
  getIncompleteAcoOrders = cache(async () => {
    // 嘗試使用適配器（如果在 client side）
    const adapter = this.getAcoOrderAdapter();
    if (adapter) {
      try {
        return await adapter.getIncompleteAcoOrders();
      } catch (error) {
        console.warn('Adapter failed, falling back to direct query:', error);
      }
    }
    
    // Server side 或適配器失敗時使用直接查詢
    const supabase = await createClient();
    
    try {
      const { data, error } = await supabase
        .from('record_aco')
        .select('*')
        .or('finished_qty.is.null,finished_qty.lt.required_qty')
        .order('order_ref', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading ACO orders:', error);
      throw error;
    }
  });

  // Get ACO order progress
  getAcoOrderProgress = cache(async (orderRef: number): Promise<AcoOrderProgress[]> => {
    // 嘗試使用適配器（如果在 client side）
    const adapter = this.getAcoOrderAdapter();
    if (adapter) {
      try {
        return await adapter.getAcoOrderProgress(orderRef);
      } catch (error) {
        console.warn('Adapter failed, falling back to direct query:', error);
      }
    }
    
    // Server side 或適配器失敗時使用直接查詢
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
          required_qty: item.required_qty,
          remain_qty: remaining,
          completed_qty: completed,
          completion_percentage: item.required_qty > 0 
            ? Math.round((completed / item.required_qty) * 100)
            : 0
        };
      });
    } catch (error) {
      console.error('Error loading order progress:', error);
      throw error;
    }
  });

  // Search inventory by product code
  searchInventory = cache(async (productCode: string): Promise<InventorySearchResult | null> => {
    if (!productCode.trim()) return null;

    const supabase = await createClient();
    
    try {
      const { data, error } = await supabase
        .rpc('search_inventory_by_product', { 
          p_product_code: productCode.toUpperCase() 
        });

      if (error) throw error;

      return data || {
        product_code: productCode.toUpperCase(),
        injection: 0,
        pipeline: 0,
        await: 0,
        fold: 0,
        bulk: 0,
        backcarpark: 0,
        damage: 0,
        total: 0
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
      const { data, error } = await supabase
        .rpc('get_void_statistics', { time_range: timeRange });

      if (error) throw error;

      return data || { count: 0, pallets: [] };
    } catch (error) {
      console.error('Error loading void statistics:', error);
      throw error;
    }
  });
}

export const adminDataService = new AdminDataService();