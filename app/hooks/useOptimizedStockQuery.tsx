import { useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';

interface OptimizedPalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  plt_remark?: string | null;
  series?: string | null;
  current_location: string;
  last_update?: string | null;
  is_from_mv?: boolean; // 標記數據來源
}

export const useOptimizedStockQuery = () => {
  const supabase = createClient();

  // 使用優化的查詢函數 V2（包含回退機制）
  const searchPalletOptimized = useCallback(async (
    searchType: 'series' | 'pallet_num',
    searchValue: string
  ): Promise<OptimizedPalletInfo | null> => {
    try {
      // 優先使用 V2 函數（包含回退機制）
      const { data: v2Data, error: v2Error } = await supabase.rpc('search_pallet_optimized_v2', {
        p_search_type: searchType,
        p_search_value: searchValue.trim()
      });

      if (!v2Error && v2Data && v2Data.length > 0) {
        const result = v2Data[0];
        console.log(`[OptimizedQuery] 查詢成功，數據來源: ${result.is_from_mv ? '物化視圖' : '實時查詢'}`);
        
        return {
          plt_num: result.plt_num,
          product_code: result.product_code,
          product_qty: result.product_qty,
          plt_remark: result.plt_remark,
          series: result.series,
          current_location: result.current_location || 'Await',
          last_update: result.last_update,
          is_from_mv: result.is_from_mv
        };
      }

      // 如果 V2 函數不存在，回退到 V1
      if (v2Error && v2Error.code === '42883') { // function does not exist
        console.log('[OptimizedQuery] V2 函數不存在，回退到 V1');
        
        const { data, error } = await supabase.rpc('search_pallet_optimized', {
          p_search_type: searchType,
          p_search_value: searchValue.trim()
        });

        if (error) {
          console.error('[OptimizedQuery] V1 查詢錯誤:', error);
          return null;
        }

        if (!data || data.length === 0) {
          return null;
        }

        // 返回第一個結果
        const result = data[0];
        return {
          plt_num: result.plt_num,
          product_code: result.product_code,
          product_qty: result.product_qty,
          plt_remark: result.plt_remark,
          series: result.series,
          current_location: result.current_location || 'Await',
          last_update: result.last_update,
          is_from_mv: true // V1 總是從物化視圖
        };
      }

      // V2 查詢沒有結果
      return null;
    } catch (error) {
      console.error('[OptimizedQuery] 異常:', error);
      return null;
    }
  }, [supabase]);

  // 批量查詢（用於預加載）
  const batchSearchPallets = useCallback(async (
    patterns: string[]
  ): Promise<OptimizedPalletInfo[]> => {
    try {
      const { data, error } = await supabase.rpc('batch_search_pallets', {
        p_patterns: patterns
      });

      if (error) {
        console.error('[OptimizedQuery] 批量查詢錯誤:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[OptimizedQuery] 批量查詢異常:', error);
      return [];
    }
  }, [supabase]);

  // 檢查物化視圖是否需要刷新
  const checkMaterializedViewStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mv_refresh_tracking')
        .select('needs_refresh, last_refresh')
        .eq('mv_name', 'mv_pallet_current_location')
        .single();

      if (error) {
        console.error('[OptimizedQuery] 檢查視圖狀態錯誤:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[OptimizedQuery] 檢查視圖狀態異常:', error);
      return null;
    }
  }, [supabase]);

  // 手動刷新物化視圖
  const refreshMaterializedView = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('refresh_pallet_location_mv');

      if (error) {
        console.error('[OptimizedQuery] 刷新視圖錯誤:', error);
        return false;
      }

      console.log('[OptimizedQuery] 物化視圖刷新成功');
      return true;
    } catch (error) {
      console.error('[OptimizedQuery] 刷新視圖異常:', error);
      return false;
    }
  }, [supabase]);

  // 智能刷新（只在需要時刷新）
  const smartRefreshMaterializedView = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('smart_refresh_mv');

      if (error) {
        console.error('[OptimizedQuery] 智能刷新錯誤:', error);
        return false;
      }

      console.log('[OptimizedQuery] 智能刷新完成');
      return true;
    } catch (error) {
      console.error('[OptimizedQuery] 智能刷新異常:', error);
      return false;
    }
  }, [supabase]);

  // 強制同步物化視圖
  const forceSyncMaterializedView = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('force_sync_pallet_mv');

      if (error) {
        console.error('[OptimizedQuery] 強制同步錯誤:', error);
        return false;
      }

      console.log('[OptimizedQuery] 強制同步完成:', data);
      return true;
    } catch (error) {
      console.error('[OptimizedQuery] 強制同步異常:', error);
      return false;
    }
  }, [supabase]);

  // 獲取查詢性能統計
  const getPerformanceStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_stock_transfer_performance')
        .select('*');

      if (error) {
        console.error('[OptimizedQuery] 獲取性能統計錯誤:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[OptimizedQuery] 獲取性能統計異常:', error);
      return null;
    }
  }, [supabase]);

  return {
    searchPalletOptimized,
    batchSearchPallets,
    checkMaterializedViewStatus,
    refreshMaterializedView,
    smartRefreshMaterializedView,
    forceSyncMaterializedView,
    getPerformanceStats
  };
};