import { createClient } from '@/app/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export interface GenerationOptions {
  count: number;
  sessionId?: string;
}

export interface GenerationResult {
  palletNumbers: string[];
  series: string[];
  success: boolean;
  error?: string;
  method: string;
}

interface PalletData {
  pallet_number: string;
  series: string;
}

/**
 * 簡化版的托盤編號生成函數 - V6
 * 使用預先生成的號碼池和 series，避免複雜的動態生成邏輯
 */
export async function generateOptimizedPalletNumbersV6(
  options: GenerationOptions,
  supabase?: SupabaseClient
): Promise<GenerationResult> {
  const { count, sessionId } = options;
  
  if (!supabase) {
    supabase = createClient();
  }
  
  try {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[PalletGenerationV6] Requesting', count, 'pallet numbers');
    
    // 調用 v6 RPC 函數，返回 pallet_number 和 series
    const { data, error } = await supabase.rpc('generate_atomic_pallet_numbers_v6', {
      p_count: count,
      p_session_id: sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
    
    if (error) {
      console.error('[PalletGenerationV6] RPC error:', error);
      return {
        palletNumbers: [],
        series: [],
        success: false,
        error: error.message,
        method: 'v6_failed'
      };
    }
    
    if (!data || !Array.isArray(data) || data.length !== count) {
      console.error('[PalletGenerationV6] Invalid data returned:', data);
      return {
        palletNumbers: [],
        series: [],
        success: false,
        error: `Invalid data: expected ${count} items, got ${data?.length || 0}`,
        method: 'v6_invalid'
      };
    }
    
    // 分離 pallet numbers 和 series
    const palletNumbers = data.map((item: PalletData) => item.pallet_number);
    const series = data.map((item: PalletData) => item.series);
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[PalletGenerationV6] Successfully reserved:', {
      palletNumbers,
      series
    });
    
    return {
      palletNumbers,
      series,
      success: true,
      method: 'v6'
    };
    
  } catch (error: any) {
    console.error('[PalletGenerationV6] Exception:', error);
    return {
      palletNumbers: [],
      series: [],
      success: false,
      error: error.message || 'Unknown error',
      method: 'v6_exception'
    };
  }
}

/**
 * 確認托盤編號已使用（列印成功後調用）
 */
export async function confirmPalletUsage(
  palletNumbers: string[],
  supabase?: SupabaseClient
): Promise<boolean> {
  if (!palletNumbers || palletNumbers.length === 0) {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[PalletGenerationV6] No pallet numbers to confirm');
    return true;
  }
  
  if (!supabase) {
    supabase = createClient();
  }
  
  try {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[PalletGenerationV6] Confirming usage for:', palletNumbers);
    
    const { data, error } = await supabase.rpc('confirm_pallet_usage', {
      p_pallet_numbers: palletNumbers
    });
    
    if (error) {
      console.error('[PalletGenerationV6] Error confirming usage:', error);
      return false;
    }
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[PalletGenerationV6] Successfully confirmed usage');
    return true;
    
  } catch (error) {
    console.error('[PalletGenerationV6] Exception confirming usage:', error);
    return false;
  }
}

/**
 * 釋放托盤編號保留（列印失敗或取消時調用）
 */
export async function releasePalletReservation(
  palletNumbers: string[],
  supabase?: SupabaseClient
): Promise<boolean> {
  if (!palletNumbers || palletNumbers.length === 0) {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[PalletGenerationV6] No pallet numbers to release');
    return true;
  }
  
  if (!supabase) {
    supabase = createClient();
  }
  
  try {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[PalletGenerationV6] Releasing reservation for:', palletNumbers);
    
    const { data, error } = await supabase.rpc('release_pallet_reservation', {
      p_pallet_numbers: palletNumbers
    });
    
    if (error) {
      console.error('[PalletGenerationV6] Error releasing reservation:', error);
      return false;
    }
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[PalletGenerationV6] Successfully released reservation');
    return true;
    
  } catch (error) {
    console.error('[PalletGenerationV6] Exception releasing reservation:', error);
    return false;
  }
}

/**
 * 獲取當前緩衝區狀態（用於調試或顯示）
 */
export async function getPalletBufferStatus(
  supabase?: SupabaseClient
): Promise<{
  totalCount: number;
  availableCount: number;
  holdedCount: number;
  usedCount: number;
  nextAvailableId: number;
} | null> {
  if (!supabase) {
    supabase = createClient();
  }
  
  try {
    const { data, error } = await supabase.rpc('get_pallet_buffer_status');
    
    if (error || !data || data.length === 0) {
      console.error('[PalletGenerationV6] Error getting buffer status:', error);
      return null;
    }
    
    const status = data[0];
    return {
      totalCount: status.total_count,
      availableCount: status.available_count,
      holdedCount: status.holded_count,
      usedCount: status.used_count,
      nextAvailableId: status.next_available_id
    };
    
  } catch (error) {
    console.error('[PalletGenerationV6] Exception getting buffer status:', error);
    return null;
  }
}