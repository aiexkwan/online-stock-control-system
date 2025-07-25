'use server';

import { createClient } from '@/app/utils/supabase/server';
import { getErrorMessage } from '@/types/core/error';

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
    const supabase = await createClient();

    // Get void records within date range
    const { data: voidRecords, error: voidError } = await supabase
      .from('report_void')
      .select(
        `
        plt_num,
        reason,
        damage_qty,
        time
      `
      )
      .gte('time', startDate.toISOString())
      .lte('time', endDate.toISOString())
      .order('time', { ascending: false });

    if (voidError) throw voidError;

    // Get pallet info for voided pallets
    const palletNums = voidRecords?.map((v: Record<string, unknown>) => v.plt_num) || [];
    const { data: palletInfo, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty')
      .in('plt_num', palletNums as string[]);

    if (palletError) throw palletError;

    // Create a map for quick lookup
    const palletMap = new Map(
      palletInfo?.map((p: Record<string, unknown>) => [p.plt_num, p]) || []
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
    voidRecords?.forEach((recordRaw: unknown) => {
      // 策略4: unknown + type narrowing - 安全屬性訪問
      if (!recordRaw || typeof recordRaw !== 'object') return;
      const record = recordRaw as Record<string, unknown>;

      const pltNum = typeof record.plt_num === 'string' ? record.plt_num : '';
      const pallet = palletMap.get(pltNum);
      if (!pallet || typeof pallet !== 'object') return;

      const palletObj = pallet as Record<string, unknown>;
      const damageQty = typeof record.damage_qty === 'number' ? record.damage_qty : 0;
      const productQty = typeof palletObj.product_qty === 'number' ? palletObj.product_qty : 0;
      const productCode = typeof palletObj.product_code === 'string' ? palletObj.product_code : '';
      const recordTime = typeof record.time === 'string' ? record.time : new Date().toISOString();
      const reason = typeof record.reason === 'string' ? record.reason : 'unknown';

      const quantity = damageQty || productQty;
      const date = new Date(recordTime).toISOString().split('T')[0];

      // Update summary
      stats.summary.totalVoids++;
      stats.summary.totalQuantity += quantity;
      uniqueProducts.add(productCode);

      // Update by reason
      const reasonStats = stats.byReason.get(reason) || { count: 0, quantity: 0 };
      reasonStats.count++;
      reasonStats.quantity += quantity;
      stats.byReason.set(reason, reasonStats);

      // Update by product
      const productStats = stats.byProduct.get(productCode) || { count: 0, quantity: 0 };
      productStats.count++;
      productStats.quantity += quantity;
      stats.byProduct.set(productCode, productStats);

      // Update by date
      const dateStats = stats.byDate.get(date) || { count: 0, quantity: 0 };
      dateStats.count++;
      dateStats.quantity += quantity;
      stats.byDate.set(date, dateStats);

      // Add to recent voids (limit to 10)
      if (stats.recentVoids.length < 10) {
        stats.recentVoids.push({
          plt_num: pltNum,
          product_code: productCode,
          product_qty: quantity,
          reason: reason,
          voided_at: recordTime,
        });
      }
    });

    // Calculate average per day
    const daysDiff = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    stats.summary.averagePerDay = Math.round((stats.summary.totalVoids / daysDiff) * 10) / 10;

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
  } catch (error: unknown) {
    console.error('Error getting void statistics:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get damage trend analysis
 */
export async function getDamageTrend(
  productCode?: string,
  days: number = 30
): Promise<{
  success: boolean;
  data?: Array<{
    plt_num: string;
    product_code: string;
    product_qty: number;
    voided_at: string;
    reason?: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
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

    // Transform damage records to expected format
    const transformedRecords =
      damageRecords
        ?.map((recordRaw: unknown) => {
          // 策略4: unknown + type narrowing - 安全轉換數據結構
          if (!recordRaw || typeof recordRaw !== 'object') return null;
          const record = recordRaw as Record<string, unknown>;

          return {
            plt_num: typeof record.plt_num === 'string' ? record.plt_num : '',
            product_code: '', // Will be filled from palletInfo if needed
            product_qty: typeof record.damage_qty === 'number' ? record.damage_qty : 0,
            voided_at: typeof record.time === 'string' ? record.time : new Date().toISOString(),
            reason: typeof record.reason === 'string' ? record.reason : 'Damage',
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null) || [];

    // Get pallet info if product code filter is applied
    if (productCode && transformedRecords.length > 0) {
      const palletNums = transformedRecords.map(d => d.plt_num);
      const { data: palletInfo } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty')
        .in('plt_num', palletNums)
        .eq('product_code', productCode);

      const palletInfoMap = new Map(
        palletInfo?.map((p: unknown) => {
          if (!p || typeof p !== 'object') return ['', null];
          const palletObj = p as Record<string, unknown>;
          const pltNum = typeof palletObj.plt_num === 'string' ? palletObj.plt_num : '';
          return [
            pltNum,
            {
              product_code:
                typeof palletObj.product_code === 'string' ? palletObj.product_code : '',
              product_qty: typeof palletObj.product_qty === 'number' ? palletObj.product_qty : 0,
            },
          ];
        }) || []
      );

      const filteredRecords = transformedRecords
        .filter(d => palletInfoMap.has(d.plt_num))
        .map(d => {
          const palletInfo = palletInfoMap.get(d.plt_num);
          return {
            ...d,
            product_code: palletInfo?.product_code || '',
            product_qty: d.product_qty || palletInfo?.product_qty || 0,
          };
        });

      return {
        success: true,
        data: filteredRecords,
      };
    }

    return {
      success: true,
      data: transformedRecords,
    };
  } catch (error: unknown) {
    console.error('Error getting damage trend:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
