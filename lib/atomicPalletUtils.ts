import { SupabaseClient } from '@supabase/supabase-js';

/**
 * 使用原子性 RPC 函數生成唯一的棧板號碼
 * 這個函數解決了並發請求導致的棧板號碼重複問題
 * @param supabaseClient - Supabase 客戶端實例
 * @param count - 需要生成的棧板號碼數量
 * @returns Promise<string[]> - 生成的棧板號碼數組
 * @throws Error 如果 RPC 調用失敗
 */
export async function generateAtomicPalletNumbers(
  supabaseClient: SupabaseClient, 
  count: number
): Promise<string[]> {
  if (count <= 0) {
    return [];
  }

  if (count > 50) {
    throw new Error('Cannot generate more than 50 pallet numbers at once');
  }

  console.log(`[atomicPalletUtils] 調用原子性 RPC 函數生成 ${count} 個棧板號碼...`);

  const { data, error } = await supabaseClient.rpc('generate_atomic_pallet_numbers', {
    count: count
  });

  if (error) {
    console.error('[atomicPalletUtils] RPC 調用失敗:', error);
    throw new Error(`Failed to generate atomic pallet numbers: ${error.message}`);
  }

  if (!data || !Array.isArray(data)) {
    console.error('[atomicPalletUtils] RPC 返回無效數據:', data);
    throw new Error('RPC function returned invalid data');
  }

  console.log(`[atomicPalletUtils] 成功生成 ${data.length} 個棧板號碼:`, data);
  return data;
}

/**
 * 測試原子性棧板號碼生成功能
 * @param supabaseClient - Supabase 客戶端實例
 * @returns Promise<any> - 測試結果
 */
export async function testAtomicPalletGeneration(supabaseClient: SupabaseClient) {
  console.log('[atomicPalletUtils] 開始測試原子性棧板號碼生成...');

  const { data, error } = await supabaseClient.rpc('test_atomic_pallet_generation');

  if (error) {
    console.error('[atomicPalletUtils] 測試失敗:', error);
    throw new Error(`Test failed: ${error.message}`);
  }

  console.log('[atomicPalletUtils] 測試結果:', data);
  return data;
}

/**
 * 監控棧板號碼生成性能
 * @param supabaseClient - Supabase 客戶端實例
 * @returns Promise<any> - 性能監控數據
 */
export async function monitorPalletGenerationPerformance(supabaseClient: SupabaseClient) {
  console.log('[atomicPalletUtils] 獲取棧板號碼生成性能數據...');

  const { data, error } = await supabaseClient.rpc('monitor_pallet_generation_performance');

  if (error) {
    console.error('[atomicPalletUtils] 性能監控失敗:', error);
    throw new Error(`Performance monitoring failed: ${error.message}`);
  }

  console.log('[atomicPalletUtils] 性能數據:', data);
  return data;
}

/**
 * 並發測試函數 - 模擬多個並發請求
 * @param supabaseClient - Supabase 客戶端實例
 * @param concurrentRequests - 並發請求數量
 * @param palletsPerRequest - 每個請求生成的棧板數量
 * @returns Promise<{success: boolean, results: any[], errors: any[]}> - 測試結果
 */
export async function testConcurrentPalletGeneration(
  supabaseClient: SupabaseClient,
  concurrentRequests: number = 5,
  palletsPerRequest: number = 2
) {
  console.log(`[atomicPalletUtils] 開始並發測試: ${concurrentRequests} 個請求，每個生成 ${palletsPerRequest} 個棧板號碼`);

  const promises = Array.from({ length: concurrentRequests }, (_, index) => 
    generateAtomicPalletNumbers(supabaseClient, palletsPerRequest)
      .then(result => ({ success: true, index, result }))
      .catch(error => ({ success: false, index, error: error.message }))
  );

  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`[atomicPalletUtils] 並發測試完成: ${successful.length} 成功, ${failed.length} 失敗`);
  
  // 檢查是否有重複的棧板號碼
  const allPalletNumbers = successful.flatMap(r => (r as any).result);
  const uniquePalletNumbers = [...new Set(allPalletNumbers)];
  
  if (allPalletNumbers.length !== uniquePalletNumbers.length) {
    console.error('[atomicPalletUtils] ❌ 檢測到重複的棧板號碼!');
    console.error('所有號碼:', allPalletNumbers);
    console.error('唯一號碼:', uniquePalletNumbers);
  } else {
    console.log('[atomicPalletUtils] ✅ 所有棧板號碼都是唯一的');
  }

  return {
    success: failed.length === 0 && allPalletNumbers.length === uniquePalletNumbers.length,
    results: successful,
    errors: failed,
    totalGenerated: allPalletNumbers.length,
    uniqueCount: uniquePalletNumbers.length,
    hasDuplicates: allPalletNumbers.length !== uniquePalletNumbers.length
  };
} 