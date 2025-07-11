'use server';

import { createServerClient } from '@/app/utils/supabase/server';
import { cookies } from 'next/headers';

// Chart colors 配置
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#14b8a6',
  '#a855f7', '#eab308', '#059669', '#2563eb', '#7c3aed',
  '#db2777', '#d97706', '#0891b2', '#ea580c', '#4f46e5',
];

export interface StockDistributionData {
  name: string;
  size: number;
  value: number;
  percentage: number;
  color: string;
  fill: string;
  description?: string;
  type?: string;
}

/**
 * Server Action 獲取庫存分佈數據
 * 用作 GraphQL 查詢的 fallback
 */
export async function getStockDistributionAction(
  selectedType?: string
): Promise<StockDistributionData[]> {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  try {
    // 構建查詢
    let query = supabase
      .from('record_inventory')
      .select(`
        product_code,
        injection,
        pipeline,
        prebook,
        await,
        fold,
        bulk,
        await_grn,
        backcarpark,
        data_code (
          description,
          colour,
          type
        )
      `);

    // 如果指定了類型，添加過濾
    if (selectedType && selectedType !== 'all' && selectedType !== 'ALL TYPES') {
      query = query.eq('data_code.type', selectedType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getStockDistributionAction] Database error:', error);
      throw new Error(`Failed to fetch stock distribution: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // 處理數據
    const items = data.map((item: any) => {
      // 計算總庫存
      const stockTotal = 
        (item.injection || 0) + 
        (item.pipeline || 0) + 
        (item.prebook || 0) + 
        (item.await || 0) + 
        (item.fold || 0) + 
        (item.bulk || 0) + 
        (item.await_grn || 0) + 
        (item.backcarpark || 0);
      
      return {
        stock: item.product_code,
        stock_level: stockTotal,
        description: item.data_code?.description,
        type: item.data_code?.type,
      };
    });

    // 計算總庫存
    const totalStock = items.reduce(
      (sum: number, item: any) => sum + item.stock_level, 
      0
    );

    // 按庫存量排序並過濾掉零庫存
    const sortedData = items
      .filter((item: any) => item.stock_level > 0)
      .sort((a: any, b: any) => b.stock_level - a.stock_level);

    // 生成圖表數據
    const chartData: StockDistributionData[] = sortedData.map((item: any, index: number) => ({
      name: item.stock,
      size: item.stock_level,
      value: item.stock_level,
      percentage: totalStock > 0 ? (item.stock_level / totalStock) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
      fill: CHART_COLORS[index % CHART_COLORS.length],
      description: item.description || '-',
      type: item.type || '-',
    }));

    return chartData;
  } catch (error) {
    console.error('[getStockDistributionAction] Error:', error);
    throw error;
  }
}

/**
 * Server Action 獲取庫存分佈數據（使用 RPC）
 * 高性能版本，適用於大數據量
 */
export async function getStockDistributionRPCAction(
  selectedType?: string
): Promise<StockDistributionData[]> {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data, error } = await supabase.rpc('rpc_get_stock_distribution', {
      p_stock_type: selectedType || null
    });

    if (error) {
      console.error('[getStockDistributionRPCAction] RPC error:', error);
      // Fallback to regular query
      return getStockDistributionAction(selectedType);
    }

    if (!data) {
      return [];
    }

    // RPC 返回的是包含 total_stock 和 data 的對象
    const rpcResult = data as { total_stock: number; data: any[] };
    
    if (!rpcResult.data || !Array.isArray(rpcResult.data)) {
      return [];
    }

    // RPC 已經返回處理好的數據，包含顏色和百分比
    const chartData: StockDistributionData[] = rpcResult.data.map((item: any) => ({
      name: item.name,
      size: item.size,
      value: item.value,
      percentage: item.percentage || 0,
      color: item.color,
      fill: item.fill,
      description: item.description || '-',
      type: item.type || '-',
    }));

    return chartData;
  } catch (error) {
    console.error('[getStockDistributionRPCAction] Error:', error);
    // Fallback to regular action
    return getStockDistributionAction(selectedType);
  }
}