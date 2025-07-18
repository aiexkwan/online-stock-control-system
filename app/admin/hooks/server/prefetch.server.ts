import 'server-only';
import { createClient } from '@/app/utils/supabase/server';
import { DashboardBatchQueryData } from '@/app/admin/types/dashboard';

/**
 * Server-side critical widgets data prefetching
 * 服務器端關鍵 widgets 數據預取
 */
export async function prefetchCriticalWidgetsData(options?: {
  dateRange?: { startDate: Date | null; endDate: Date | null };
  criticalOnly?: boolean;
}): Promise<Partial<DashboardBatchQueryData>> {
  try {
    const supabase = await createClient();
    const results: Partial<DashboardBatchQueryData> = {};
    
    // Critical widgets 並行查詢
    const [totalPalletsResult, awaitLocationResult, yesterdayTransferResult] = await Promise.allSettled([
      // 1. Total pallets count
      supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true }),
      
      // 2. Await location quantity (查詢 record_inventory 表)
      supabase
        .from('record_inventory')
        .select('location, quantity:await')
        .gt('await', 0),
      
      // 3. Yesterday transfer count
      supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('createtime', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .lt('createtime', new Date().toISOString())
    ]);
    
    // 處理 total pallets 結果
    if (totalPalletsResult.status === 'fulfilled') {
      const { count, error } = totalPalletsResult.value;
      if (!error && count !== null) {
        results.total_pallets = count;
      }
    }
    
    // 處理 await location 結果
    if (awaitLocationResult.status === 'fulfilled') {
      const { data, error } = awaitLocationResult.value;
      if (!error && data) {
        // 轉換數據格式以匹配 widget 期望
        const records = data.map((item: Record<string, unknown>) => ({
          location: 'AWAIT',
          quantity: item.quantity || 0
        }));
        const totalQuantity = records.reduce((sum: number, record: Record<string, unknown>) => sum + record.quantity, 0);
        
        results.awaitLocationQty = {
          records,
          value: totalQuantity,
          trend: { value: 0, isPositive: true }
        };
      }
    }
    
    // 處理 yesterday transfer 結果
    if (yesterdayTransferResult.status === 'fulfilled') {
      const { count, error } = yesterdayTransferResult.value;
      if (!error && count !== null) {
        results.yesterdayTransferCount = {
          count: count,
          trend: 0, // 簡化處理，暫時設為0
          dateRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          optimized: true
        };
      }
    }
    
    console.log('[SSR] Critical widgets prefetched:', Object.keys(results));
    return results;
    
  } catch (error) {
    console.error('[SSR] Critical widgets prefetch error:', error);
    // 優雅降級 - 返回空對象讓客戶端 fallback
    return {};
  }
}

/**
 * Server-side full dashboard data prefetching
 * 服務器端完整儀表板數據預取
 */
export async function prefetchDashboardData(
  dateRange?: { startDate: Date | null; endDate: Date | null }
): Promise<Partial<DashboardBatchQueryData>> {
  try {
    const supabase = await createClient();
    const results: Partial<DashboardBatchQueryData> = {};
    
    // 獲取日期範圍
    const endDate = dateRange?.endDate || new Date();
    const startDate = dateRange?.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 默認 30 天
    
    // 並行執行所有查詢
    const queries = await Promise.allSettled([
      // 基礎統計
      supabase.from('record_palletinfo').select('*', { count: 'exact', head: true }),
      supabase
        .from('record_inventory')
        .select('location, quantity:await')
        .gt('await', 0),
      supabase.from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('createtime', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .lt('createtime', new Date().toISOString()),
      
      // 時間範圍相關查詢
      supabase.from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .gte('createtime', startDate.toISOString())
        .lte('createtime', endDate.toISOString()),
      
      // 其他統計（根據需要添加）
    ]);
    
    // 處理查詢結果
    queries.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { data, count, error } = result.value;
        if (!error) {
          // 根據 index 分配結果到對應的 key
          switch (index) {
            case 0:
              if (count !== null) results.total_pallets = count;
              break;
            case 1:
              if (data) {
                const records = data.map((item: Record<string, unknown>) => ({
                  location: 'AWAIT',
                  quantity: item.quantity || 0
                }));
                const totalQuantity = records.reduce((sum: number, record: Record<string, unknown>) => sum + record.quantity, 0);
                
                results.awaitLocationQty = {
                  records,
                  value: totalQuantity,
                  trend: { value: 0, isPositive: true }
                };
              }
              break;
            case 2:
              if (count !== null) {
                results.yesterdayTransferCount = {
                  count: count,
                  trend: 0,
                  dateRange: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString()
                  },
                  optimized: true
                };
              }
              break;
            case 3:
              if (count !== null) results.dateRangePallets = count;
              break;
          }
        }
      }
    });
    
    return results;
    
  } catch (error) {
    console.error('[SSR] Dashboard data prefetch error:', error);
    return {};
  }
}