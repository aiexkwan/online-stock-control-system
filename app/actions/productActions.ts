'use server';

import { createClient } from '@/lib/supabase';

export interface ProductData {
  code: string;
  description: string;
  colour: string;
  standard_qty: number;
  type: string;
}

export interface ProductActionResult {
  success: boolean;
  data?: ProductData;
  error?: string;
}

/**
 * 根據產品代碼查詢產品信息 (處理重複記錄問題)
 */
export async function getProductByCode(code: string): Promise<ProductActionResult> {
  try {
    console.log(`[getProductByCode] ===== FUNCTION CALLED =====`);
    console.log(`[getProductByCode] Searching for code: "${code}"`);
    
    const supabase = createClient();
    
    // 使用 ilike 進行忽略大小寫的搜尋，不使用 single()
    const { data, error } = await supabase
      .from('data_code')
      .select('*')
      .ilike('code', code);

    console.log(`[getProductByCode] Query result:`, { data, error });
    console.log(`[getProductByCode] Data length:`, data?.length);
    
    if (error) {
      console.error('Error in getProductByCode:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.log(`[getProductByCode] No products found for code: "${code}"`);
      return { success: false, error: 'Product not found' };
    }

    if (data.length > 1) {
      console.warn(`Multiple products found for code "${code}":`, data.map(p => p.code));
      // 如果有多個匹配，使用第一個
    }

    console.log(`[getProductByCode] Found product:`, data[0]);
    // 返回第一個匹配的產品
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in getProductByCode:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * 更新現有產品信息 (處理重複記錄問題)
 */
export async function updateProduct(code: string, productData: Partial<ProductData>): Promise<ProductActionResult> {
  try {
    console.log(`[updateProduct] ===== FUNCTION CALLED =====`);
    console.log(`[updateProduct] Code parameter:`, code);
    console.log(`[updateProduct] ProductData parameter:`, productData);
    
    const supabase = createClient();
    
    console.log(`[updateProduct] Starting update for code: "${code}"`);
    
    // 第一步：檢查是否有重複的產品代碼
    const { data: allMatches, error: checkError } = await supabase
      .from('data_code')
      .select('code')
      .ilike('code', code);

    console.log(`[updateProduct] Check result:`, { allMatches, checkError });

    if (checkError) {
      console.error('Error checking for duplicates:', checkError);
      return { success: false, error: checkError.message };
    }

    if (!allMatches || allMatches.length === 0) {
      console.log(`[updateProduct] No matches found for code: "${code}"`);
      return { success: false, error: 'Product not found for update' };
    }

    if (allMatches.length > 1) {
      console.warn(`Multiple products found for code "${code}":`, allMatches);
    }

    // 使用第一個匹配的實際代碼
    const actualCode = allMatches[0].code;
    console.log(`[updateProduct] Using actual code: "${actualCode}" for input: "${code}"`);
    
    // 移除 code 字段，因為它是主鍵不應該被更新
    const { code: _, ...updateData } = productData;
    console.log(`[updateProduct] Update data:`, updateData);
    
    // 第二步：使用實際代碼進行精確更新，不使用 .single()
    const { data, error } = await supabase
      .from('data_code')
      .update(updateData)
      .eq('code', actualCode)
      .select();

    console.log(`[updateProduct] Update query result:`, { data, error });

    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: `Update failed: ${error.message}` };
    }

    if (!data || data.length === 0) {
      console.error(`[updateProduct] Update returned no data for code: "${actualCode}"`);
      return { success: false, error: 'Update failed: No rows affected' };
    }

    console.log(`[updateProduct] Update successful for code: "${actualCode}"`);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

/**
 * 新增產品
 */
export async function createProduct(productData: ProductData): Promise<ProductActionResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('data_code')
      .insert(productData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return { success: false, error: 'Product code already exists' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createProduct:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

/**
 * 檢查產品代碼是否存在 (處理重複記錄問題)
 */
export async function checkProductExists(code: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // 使用 ilike 進行忽略大小寫的檢查，不使用 single()
    const { data, error } = await supabase
      .from('data_code')
      .select('code')
      .ilike('code', code);

    if (error) {
      console.error('Error in checkProductExists:', error);
      return { exists: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { exists: false };
    }

    if (data.length > 1) {
      console.warn(`Multiple products found for code "${code}":`, data.map(p => p.code));
    }

    return { exists: true };
  } catch (error) {
    console.error('Error in checkProductExists:', error);
    return { exists: false, error: 'Unexpected error occurred' };
  }
}

/**
 * 使用原生 SQL 更新產品信息 (推薦方式)
 */
export async function updateProductSQL(code: string, productData: Partial<ProductData>): Promise<ProductActionResult> {
  try {
    const supabase = createClient();
    
    console.log(`[updateProductSQL] Starting SQL update for code: "${code}"`);
    
    // 移除 code 字段，因為它是主鍵不應該被更新
    const { code: _, ...updateData } = productData;
    console.log(`[updateProductSQL] Update data:`, updateData);
    
    // 使用 Supabase 的 SQL 查詢，利用 UPPER() 函數進行大小寫不敏感比較
    let query = supabase
      .from('data_code')
      .update(updateData)
      .eq('code', code.toUpperCase()) // 先嘗試大寫匹配
      .select();
    
    let { data, error } = await query;
    
    // 如果大寫匹配失敗，嘗試小寫匹配
    if (!data || data.length === 0) {
      console.log(`[updateProductSQL] Uppercase match failed, trying lowercase for: "${code}"`);
      query = supabase
        .from('data_code')
        .update(updateData)
        .eq('code', code.toLowerCase())
        .select();
      
      const result = await query;
      data = result.data;
      error = result.error;
    }
    
    // 如果還是失敗，嘗試原始輸入匹配
    if (!data || data.length === 0) {
      console.log(`[updateProductSQL] Lowercase match failed, trying original case for: "${code}"`);
      query = supabase
        .from('data_code')
        .update(updateData)
        .eq('code', code)
        .select();
      
      const result = await query;
      data = result.data;
      error = result.error;
    }
    
    if (error) {
      console.error('Error executing SQL update:', error);
      return { success: false, error: `SQL update failed: ${error.message}` };
    }
    
    if (!data || data.length === 0) {
      console.log(`[updateProductSQL] No rows affected for code: "${code}"`);
      return { success: false, error: 'Product not found for update' };
    }
    
    console.log(`[updateProductSQL] SQL update successful for code: "${code}"`);
    return { success: true, data: data[0] };
    
  } catch (error) {
    console.error('Error in updateProductSQL:', error);
    return { success: false, error: 'Failed to execute SQL update' };
  }
}

/**
 * 使用原生 SQL 查詢產品信息 (推薦方式)
 */
export async function getProductByCodeSQL(code: string): Promise<ProductActionResult> {
  try {
    const supabase = createClient();
    
    console.log(`[getProductByCodeSQL] Starting SQL query for code: "${code}"`);
    
    // 使用 ilike 進行大小寫不敏感查詢（PostgreSQL 特有）
    const { data, error } = await supabase
      .from('data_code')
      .select('*')
      .ilike('code', code)
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Product not found' };
      }
      console.error('Error executing SQL query:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`[getProductByCodeSQL] SQL query successful for code: "${code}"`);
    return { success: true, data };
    
  } catch (error) {
    console.error('Error in getProductByCodeSQL:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * 使用優化 SQL 更新產品信息 (最佳方式)
 */
export async function updateProductOptimized(code: string, productData: Partial<ProductData>): Promise<ProductActionResult> {
  try {
    console.log(`[updateProductOptimized] ===== FUNCTION CALLED =====`);
    console.log(`[updateProductOptimized] Code parameter:`, code);
    console.log(`[updateProductOptimized] ProductData parameter:`, productData);
    
    const supabase = createClient();
    
    console.log(`[updateProductOptimized] Starting optimized update for code: "${code}"`);
    console.log(`[updateProductOptimized] Input productData:`, productData);
    
    // 第一步：先確認產品確實存在
    const { data: existingData, error: checkError } = await supabase
      .from('data_code')
      .select('*')
      .eq('code', code);
    
    console.log(`[updateProductOptimized] Check existing product result:`, { existingData, checkError });
    
    if (checkError) {
      console.error('Error checking existing product:', checkError);
      return { success: false, error: `Check failed: ${checkError.message}` };
    }
    
    if (!existingData || existingData.length === 0) {
      console.log(`[updateProductOptimized] Product not found with exact code: "${code}"`);
      return { success: false, error: 'Product not found for update' };
    }
    
    console.log(`[updateProductOptimized] Found existing product:`, existingData[0]);
    
    // 移除 code 字段，因為它是主鍵不應該被更新
    const { code: _, ...updateData } = productData;
    console.log(`[updateProductOptimized] Update data (without code):`, updateData);
    
    // 第二步：使用精確匹配進行更新
    const { data, error } = await supabase
      .from('data_code')
      .update(updateData)
      .eq('code', code)  // 使用精確匹配
      .select();
    
    console.log(`[updateProductOptimized] Update result:`, { data, error });
    
    if (error) {
      console.error('Error executing optimized update:', error);
      return { success: false, error: `Optimized update failed: ${error.message}` };
    }
    
    if (!data || data.length === 0) {
      console.log(`[updateProductOptimized] No rows affected for code: "${code}"`);
      return { success: false, error: 'Product not found for update' };
    }
    
    console.log(`[updateProductOptimized] Optimized update successful for code: "${code}"`);
    console.log(`[updateProductOptimized] Updated product:`, data[0]);
    return { success: true, data: data[0] };
    
  } catch (error) {
    console.error('Error in updateProductOptimized:', error);
    return { success: false, error: 'Failed to execute optimized update' };
  }
}

/**
 * 調試函數：檢查資料庫中的產品代碼
 */
export async function debugProductCodes(): Promise<void> {
  try {
    const supabase = createClient();
    
    // 獲取前10個產品代碼來檢查格式
    const { data, error } = await supabase
      .from('data_code')
      .select('code, description')
      .limit(10);
    
    console.log('[DEBUG] Sample product codes from database:');
    if (data) {
      data.forEach((product, index) => {
        console.log(`[DEBUG] ${index + 1}. Code: "${product.code}" (length: ${product.code.length})`);
        console.log(`[DEBUG]    Description: "${product.description}"`);
        console.log(`[DEBUG]    Code bytes:`, Array.from(product.code as string).map((c: string) => c.charCodeAt(0)));
      });
    }
    
    if (error) {
      console.error('[DEBUG] Error fetching sample codes:', error);
    }
  } catch (error) {
    console.error('[DEBUG] Error in debugProductCodes:', error);
  }
}

/**
 * 測試函數：檢查資料庫連接和數據
 */
export async function testDatabaseConnection(): Promise<void> {
  try {
    console.log('[TEST] Testing database connection...');
    const supabase = createClient();
    
    // 測試 1：檢查表是否存在，獲取前5條記錄
    console.log('[TEST] Test 1: Fetching first 5 records...');
    const { data: allData, error: allError } = await supabase
      .from('data_code')
      .select('*')
      .limit(5);
    
    console.log('[TEST] All data result:', { allData, allError });
    
    // 測試 2：搜尋特定的產品代碼（精確匹配）
    console.log('[TEST] Test 2: Exact match for MEP9090150...');
    const { data: exactData, error: exactError } = await supabase
      .from('data_code')
      .select('*')
      .eq('code', 'MEP9090150');
    
    console.log('[TEST] Exact match result:', { exactData, exactError });
    
    // 測試 3：搜尋特定的產品代碼（忽略大小寫）
    console.log('[TEST] Test 3: Case-insensitive match for mep9090150...');
    const { data: ilikeData, error: ilikeError } = await supabase
      .from('data_code')
      .select('*')
      .ilike('code', 'mep9090150');
    
    console.log('[TEST] Case-insensitive result:', { ilikeData, ilikeError });
    
    // 測試 4：檢查用戶認證狀態
    console.log('[TEST] Test 4: Checking user authentication...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('[TEST] User auth result:', { userData, userError });
    
  } catch (error) {
    console.error('[TEST] Error in testDatabaseConnection:', error);
  }
} 