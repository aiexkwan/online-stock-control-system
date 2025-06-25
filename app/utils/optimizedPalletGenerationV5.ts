/**
 * @deprecated Use generatePalletNumbers from '@/app/utils/palletGeneration' instead
 * This uses the old V5 RPC function. V6 is now the standard.
 */
import { createClient } from '@/app/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

interface GenerationOptions {
  count: number;
  maxRetries?: number;
  retryDelay?: number;
  enableFallback?: boolean;
}

interface GenerationResult {
  palletNumbers: string[];
  series: string[];
  method?: string;
  duration?: number;
  retries?: number;
  error?: string;
  success: boolean;
}

/**
 * 生成系列號
 */
function generateSeries(count: number): string[] {
  const series: string[] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    // 使用時間戳和隨機數生成唯一系列號
    const seriesNum = `${timestamp}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    series.push(seriesNum);
  }
  
  return series;
}

/**
 * 優化的托盤編號生成函數 - V5 版本修復排序問題
 * 使用數字排序而非字符串排序
 */
export async function generateOptimizedPalletNumbersV5(
  options: GenerationOptions,
  supabase?: SupabaseClient
): Promise<GenerationResult> {
  const startTime = Date.now();
  const { 
    count, 
    maxRetries = 3, 
    retryDelay = 1000,
    enableFallback = true 
  } = options;
  
  // 如果未提供 supabase client，創建一個
  if (!supabase) {
    supabase = createClient();
  }
  
  // 減少大批量的重試次數
  const effectiveMaxRetries = count > 5 ? 2 : maxRetries;
  
  let lastError = '';
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 嘗試使用 v5 RPC（如果存在）
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.rpc('generate_atomic_pallet_numbers_v5', {
        p_count: count,
        p_session_id: sessionId
      });
      
      if (!error && data && Array.isArray(data) && data.length === count) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[PalletGeneration] Success with v5 RPC on attempt ${attempt + 1}`);
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[PalletGeneration] Raw v5 data from DB:', data);
        const series = generateSeries(count);
        return {
          palletNumbers: data,
          series,
          method: 'rpc_v5',
          duration: Date.now() - startTime,
          retries: attempt,
          success: true
        };
      }
      
      if (error) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[PalletGeneration] v5 RPC error on attempt ${attempt + 1}:`, error);
        // 如果 v5 不存在，回退到 v4 但排序結果
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          break;
        }
        lastError = error.message;
      } else if (!data || !Array.isArray(data) || data.length !== count) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[PalletGeneration] v5 RPC returned invalid data:`, {
          data,
          isArray: Array.isArray(data),
          length: data?.length,
          expectedCount: count
        });
        lastError = `Invalid data returned: expected ${count} items, got ${data?.length || 0}`;
      }
    } catch (error: any) {
      lastError = error.message;
    }
    
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  // 回退到 v4 但對結果進行排序
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.rpc('generate_atomic_pallet_numbers_v4', {
        p_count: count,
        p_session_id: sessionId
      });
      
      if (!error && data && Array.isArray(data) && data.length === count) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[PalletGeneration] Success with v4 RPC on attempt ${attempt + 1}, applying numeric sort`);
        
        // 對結果進行數字排序
        const sortedPalletNumbers = data.sort((a, b) => {
          const numA = parseInt(a.split('/')[1]);
          const numB = parseInt(b.split('/')[1]);
          return numA - numB;
        });
        
        const series = generateSeries(count);
        return {
          palletNumbers: sortedPalletNumbers,
          series,
          method: 'rpc_v4_sorted',
          duration: Date.now() - startTime,
          retries: attempt,
          success: true
        };
      }
      
      if (error) {
        lastError = error.message;
      }
    } catch (error: any) {
      lastError = error.message;
    }
    
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  // 嘗試使用 v3 RPC
  for (let attempt = 0; attempt < effectiveMaxRetries; attempt++) {
    try {
      const { data, error } = await supabase.rpc('generate_atomic_pallet_numbers_v3', {
        count: count
      });
      
      if (!error && data && Array.isArray(data) && data.length === count) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[PalletGeneration] Success with v3 RPC on attempt ${attempt + 1}`);
        const series = generateSeries(count);
        return {
          palletNumbers: data,
          series,
          method: 'rpc_v3',
          duration: Date.now() - startTime,
          retries: attempt,
          success: true
        };
      }
      
      if (error) {
        lastError = error.message;
      }
    } catch (error: any) {
      lastError = error.message;
    }
    
    if (attempt < effectiveMaxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  return {
    palletNumbers: [],
    series: [],
    error: `Failed to generate pallet numbers: ${lastError}`,
    duration: Date.now() - startTime,
    success: false
  };
}