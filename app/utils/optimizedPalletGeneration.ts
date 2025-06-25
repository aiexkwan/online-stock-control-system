/**
 * @deprecated Use generatePalletNumbers from '@/app/utils/palletGeneration' instead
 * This uses the old V3 RPC function. V6 is now the standard.
 * 
 * 優化的托盤編號生成工具
 * 包含多重回退機制和錯誤處理
 */

import { createClient } from '@/app/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface GenerationResult {
  palletNumbers: string[];
  series: string[];
  error?: string;
  method?: 'rpc_v4' | 'rpc_v3' | 'local_fallback';
}

interface GenerationOptions {
  count: number;
  maxRetries?: number;
  retryDelay?: number;
  sessionId?: string;
  enableFallback?: boolean;
}

/**
 * 本地回退方法生成托盤編號
 * 當 RPC 失敗時使用
 */
async function generatePalletNumbersLocally(
  count: number,
  supabase: any
): Promise<string[]> {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear().toString().slice(-2);
  const dateStr = `${day}${month}${year}`;
  
  // 查詢當前最大編號
  const { data: existingPallets } = await supabase
    .from('record_palletinfo')
    .select('plt_num')
    .like('plt_num', `${dateStr}/%`)
    .order('plt_num', { ascending: false })
    .limit(1);
  
  let maxNum = 0;
  if (existingPallets && existingPallets.length > 0) {
    const lastNum = existingPallets[0].plt_num.split('/')[1];
    maxNum = parseInt(lastNum) || 0;
  }
  
  // 生成新編號
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    result.push(`${dateStr}/${maxNum + i}`);
  }
  
  return result;
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
 * 優化的托盤編號生成函數
 */
export async function generateOptimizedPalletNumbers(
  options: GenerationOptions
): Promise<GenerationResult> {
  const {
    count,
    maxRetries = 3,
    retryDelay = 1000,
    sessionId = uuidv4(),
    enableFallback = true
  } = options;
  
  // 對於大批量，減少重試次數以避免超時
  const effectiveMaxRetries = count > 5 ? 2 : maxRetries;
  
  const supabase = createClient();
  let lastError: string = '';
  
  // 嘗試使用 v4 RPC（如果已部署）
  for (let attempt = 0; attempt < effectiveMaxRetries; attempt++) {
    try {
      const { data, error } = await supabase.rpc('generate_atomic_pallet_numbers_v4', {
        p_count: count,
        p_session_id: sessionId
      });
      
      if (!error && data && Array.isArray(data) && data.length === count) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[PalletGeneration] Success with v4 RPC on attempt ${attempt + 1}`);
        const series = generateSeries(count);
        return {
          palletNumbers: data,
          series,
          method: 'rpc_v4'
        };
      }
      
      if (error) {
        // 如果 v4 不存在，回退到 v3
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          break; // 跳出循環，嘗試 v3
        }
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
  for (let attempt = 0; attempt < maxRetries; attempt++) {
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
          method: 'rpc_v3'
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
  
  // 本地回退機制
  if (enableFallback) {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[PalletGeneration] RPC failed, using local fallback');
    try {
      const palletNumbers = await generatePalletNumbersLocally(count, supabase);
      const series = generateSeries(count);
      
      // 驗證生成的編號不重複
      const validationPromises = palletNumbers.map(async (num) => {
        const { data } = await supabase
          .from('record_palletinfo')
          .select('plt_num')
          .eq('plt_num', num)
          .single();
        return { num, exists: !!data };
      });
      
      const validations = await Promise.all(validationPromises);
      const duplicates = validations.filter(v => v.exists);
      
      if (duplicates.length > 0) {
        throw new Error(`Local generation produced duplicates: ${duplicates.map(d => d.num).join(', ')}`);
      }
      
      return {
        palletNumbers,
        series,
        method: 'local_fallback'
      };
    } catch (fallbackError: any) {
      return {
        palletNumbers: [],
        series: [],
        error: `All methods failed. RPC: ${lastError}, Fallback: ${fallbackError.message}`
      };
    }
  }
  
  return {
    palletNumbers: [],
    series: [],
    error: `RPC generation failed after ${maxRetries} attempts: ${lastError}`
  };
}

/**
 * 批量驗證托盤編號唯一性
 */
export async function validatePalletNumbersUniqueness(
  palletNumbers: string[]
): Promise<{ valid: boolean; duplicates: string[] }> {
  const supabase = createClient();
  const duplicates: string[] = [];
  
  // 批量查詢已存在的編號
  const { data: existing } = await supabase
    .from('record_palletinfo')
    .select('plt_num')
    .in('plt_num', palletNumbers);
  
  if (existing && existing.length > 0) {
    duplicates.push(...existing.map(e => e.plt_num));
  }
  
  return {
    valid: duplicates.length === 0,
    duplicates
  };
}

/**
 * 預熱托盤編號緩衝區
 * 在系統空閒時調用，預生成一些編號
 */
export async function warmupPalletBuffer(
  targetCount: number = 20
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();
  
  try {
    // 檢查當前緩衝區狀態
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).split('/').join('');
    
    const { data: bufferStatus } = await supabase
      .from('pallet_number_buffer')
      .select('*')
      .eq('date_str', dateStr)
      .eq('used', false);
    
    const currentCount = bufferStatus?.length || 0;
    
    if (currentCount >= targetCount) {
      return {
        success: true,
        message: `Buffer already has ${currentCount} unused numbers`
      };
    }
    
    // 生成額外的編號
    const needed = targetCount - currentCount;
    const result = await generateOptimizedPalletNumbers({
      count: needed,
      enableFallback: false
    });
    
    if (result.error) {
      return {
        success: false,
        message: `Failed to warmup buffer: ${result.error}`
      };
    }
    
    return {
      success: true,
      message: `Added ${needed} numbers to buffer`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Warmup error: ${error.message}`
    };
  }
}