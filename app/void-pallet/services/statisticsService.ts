'use server';

import { createClient } from '@/app/utils/supabase/server';

export interface VoidStatistics {
  summary: {
    totalVoids: number;
    totalQuantity: number;
    uniqueProducts: number;
    averagePerDay: number;
  };
  byReason: Array<{
    reason: string;
    count: number;
    quantity: number;
    percentage: number;
  }>;
  byProduct: Array<{
    productCode: string;
    count: number;
    quantity: number;
    percentage: number;
  }>;
  byDate: Array<{
    date: string;
    count: number;
    quantity: number;
  }>;
  recentVoids: Array<{
    plt_num: string;
    product_code: string;
    product_qty: number;
    reason: string;
    voided_at: string;
    voided_by?: string;
  }>;
}

/**
 * Get void statistics for a given period
 */
export async function getVoidStatistics(
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; data?: VoidStatistics; error?: string }> {
  try {
    const supabase = createClient();
    
    // Get void records within date range
    const { data: voidRecords, error: voidError } = await supabase
      .from('report_void')
      .select(`
        plt_num,
        reason,
        damage_qty,
        time
      `)
      .gte('time', startDate.toISOString())
      .lte('time', endDate.toISOString())
      .order('time', { ascending: false });

    if (voidError) throw voidError;

    // Get pallet info for voided pallets
    const palletNums = voidRecords?.map(v => v.plt_num) || [];
    const { data: palletInfo, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty')
      .in('plt_num', palletNums);

    if (palletError) throw palletError;

    // Create a map for quick lookup
    const palletMap = new Map(
      palletInfo?.map(p => [p.plt_num, p]) || []
    );

    // Calculate statistics
    const uniqueProducts = new Set<string>();
    const stats = {
      summary: {
        totalVoids: 0,
        totalQuantity: 0,
        uniqueProducts,
        averagePerDay: 0,
      },
      byReason: new Map<string, { count: number; quantity: number }>(),
      byProduct: new Map<string, { count: number; quantity: number }>(),
      byDate: new Map<string, { count: number; quantity: number }>(),
      recentVoids: [] as Array<{
        plt_num: string;
        product_code: string;
        product_qty: number;
        reason: string;
        voided_at: string;
        voided_by?: string;
      }>,
    };

    // Process each void record
    voidRecords?.forEach(record => {
      const pallet = palletMap.get(record.plt_num);
      if (!pallet) return;

      const quantity = record.damage_qty || pallet.product_qty;
      const date = new Date(record.time).toISOString().split('T')[0];

      // Update summary
      stats.summary.totalVoids++;
      stats.summary.totalQuantity += quantity;
      uniqueProducts.add(pallet.product_code);

      // Update by reason
      const reasonStats = stats.byReason.get(record.reason) || { count: 0, quantity: 0 };
      reasonStats.count++;
      reasonStats.quantity += quantity;
      stats.byReason.set(record.reason, reasonStats);

      // Update by product
      const productStats = stats.byProduct.get(pallet.product_code) || { count: 0, quantity: 0 };
      productStats.count++;
      productStats.quantity += quantity;
      stats.byProduct.set(pallet.product_code, productStats);

      // Update by date
      const dateStats = stats.byDate.get(date) || { count: 0, quantity: 0 };
      dateStats.count++;
      dateStats.quantity += quantity;
      stats.byDate.set(date, dateStats);

      // Add to recent voids (limit to 10)
      if (stats.recentVoids.length < 10) {
        stats.recentVoids.push({
          plt_num: record.plt_num,
          product_code: pallet.product_code,
          product_qty: quantity,
          reason: record.reason,
          voided_at: record.time,
        });
      }
    });

    // Calculate average per day
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    stats.summary.averagePerDay = Math.round(stats.summary.totalVoids / daysDiff * 10) / 10;

    // Convert maps to arrays and calculate percentages
    const totalVoids = stats.summary.totalVoids;
    
    return {
      success: true,
      data: {
        summary: {
          totalVoids: stats.summary.totalVoids,
          totalQuantity: stats.summary.totalQuantity,
          uniqueProducts: uniqueProducts.size,
          averagePerDay: stats.summary.averagePerDay,
        },
        byReason: Array.from(stats.byReason.entries())
          .map(([reason, data]) => ({
            reason,
            ...data,
            percentage: Math.round((data.count / totalVoids) * 100),
          }))
          .sort((a, b) => b.count - a.count),
        byProduct: Array.from(stats.byProduct.entries())
          .map(([productCode, data]) => ({
            productCode,
            ...data,
            percentage: Math.round((data.count / totalVoids) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10), // Top 10 products
        byDate: Array.from(stats.byDate.entries())
          .map(([date, data]) => ({
            date,
            ...data,
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        recentVoids: stats.recentVoids,
      },
    };
  } catch (error: any) {
    console.error('Error getting void statistics:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get damage trend analysis
 */
export async function getDamageTrend(
  productCode?: string,
  days: number = 30
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('report_void')
      .select('plt_num, damage_qty, time')
      .eq('reason', 'Damage')
      .gte('time', startDate.toISOString())
      .lte('time', endDate.toISOString());

    const { data: damageRecords, error } = await query;
    if (error) throw error;

    // Get pallet info if product code filter is applied
    if (productCode && damageRecords) {
      const palletNums = damageRecords.map(d => d.plt_num);
      const { data: palletInfo } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code')
        .in('plt_num', palletNums)
        .eq('product_code', productCode);

      const validPalletNums = new Set(palletInfo?.map(p => p.plt_num) || []);
      return {
        success: true,
        data: damageRecords.filter(d => validPalletNums.has(d.plt_num)),
      };
    }

    return {
      success: true,
      data: damageRecords,
    };
  } catch (error: any) {
    console.error('Error getting damage trend:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}