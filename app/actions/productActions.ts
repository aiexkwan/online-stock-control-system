'use server';

import { createClient } from '@/app/utils/supabase/server';
import { getUserIdFromEmail } from '@/lib/utils/getUserId';
import { isDevelopment } from '@/lib/utils/env';

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
 * 記錄產品操作歷史到 record_history 表
 */
async function recordProductHistory(
  action: 'Add' | 'Edit',
  productCode: string,
  userEmail?: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // 獲取當前用戶信息
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const currentUserEmail = user?.email || userEmail || 'unknown';

    console.log('[recordProductHistory] Current user email:', currentUserEmail);

    // 獲取用戶 ID
    const userId = await getUserIdFromEmail(currentUserEmail);

    console.log('[recordProductHistory] Retrieved user ID:', userId);

    // 插入歷史記錄
    const { error } = await supabase.from('record_history').insert({
      time: new Date().toISOString(),
      id: userId || 999, // 使用從 data_id 表獲取的 ID，如果沒有則使用 999
      action: action === 'Add' ? 'Product Added' : 'Product Update',
      plt_num: null, // 產品操作不涉及棧板
      loc: null, // 產品操作不涉及位置
      remark: productCode, // 只記錄產品代碼
    });

    if (error) {
      console.error('[recordProductHistory] Error recording history:', error);
      // 不拋出錯誤，避免影響主要操作
    } else {
      isDevelopment() &&
        isDevelopment() &&
        console.log(
          `[recordProductHistory] Recorded: ${action} for ${productCode} by user ID ${userId}`
        );
    }
  } catch (error) {
    console.error('[recordProductHistory] Unexpected error:', error);
    // 不拋出錯誤，避免影響主要操作
  }
}

/**
 * 根據產品代碼查詢產品信息 (支援大小寫不敏感搜尋)
 */
export async function getProductByCode(code: string): Promise<ProductActionResult> {
  try {
    const supabase = await createClient();

    // 第一步：嘗試精確匹配（原本工作的方式）
    const { data: exactData, error: exactError } = await supabase
      .from('data_code')
      .select('code, description, colour, standard_qty, type')
      .eq('code', code.trim())
      .limit(1);

    // 如果精確匹配找到了，直接返回
    if (!exactError && exactData && exactData.length > 0) {
      const productData = exactData[0];
      const result: ProductData = {
        code: productData.code,
        description: productData.description,
        colour: productData.colour || '',
        standard_qty: parseInt(productData.standard_qty) || 0,
        type: productData.type,
      };
      return { success: true, data: result };
    }

    // 第二步：如果精確匹配失敗，嘗試大小寫不敏感搜尋
    const { data: fuzzyData, error: fuzzyError } = await supabase
      .from('data_code')
      .select('code, description, colour, standard_qty, type')
      .ilike('code', code.trim())
      .limit(1);

    if (fuzzyError) {
      console.error('[getProductByCode] Search error:', fuzzyError);
      return { success: false, error: `Search error: ${fuzzyError.message}` };
    }

    if (!fuzzyData || !Array.isArray(fuzzyData) || fuzzyData.length === 0) {
      return { success: false, error: 'Product not found' };
    }

    const productData = fuzzyData[0];
    const result: ProductData = {
      code: productData.code,
      description: productData.description,
      colour: productData.colour || '',
      standard_qty: parseInt(productData.standard_qty) || 0,
      type: productData.type,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error('[getProductByCode] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * 更新現有產品信息 (支援大小寫不敏感搜尋)
 */
export async function updateProduct(
  code: string,
  productData: Partial<ProductData>
): Promise<ProductActionResult> {
  try {
    const supabase = await createClient();

    // 第一步：檢查是否有匹配的產品代碼（大小寫不敏感）
    const { data: allMatches, error: checkError } = await supabase
      .from('data_code')
      .select('code')
      .ilike('code', code.trim());

    if (checkError) {
      console.error('Error checking for matches:', checkError);
      return { success: false, error: checkError.message };
    }

    if (!allMatches || allMatches.length === 0) {
      return { success: false, error: 'Product not found for update' };
    }

    if (allMatches.length > 1) {
      isDevelopment() &&
        isDevelopment() &&
        console.warn(`Multiple products found for code "${code}":`, allMatches);
    }

    // 使用第一個匹配的實際代碼
    const actualCode = allMatches[0].code;

    // 移除 code 字段，因為它是主鍵不應該被更新
    const { code: _, ...updateData } = productData;

    // 第二步：使用實際代碼進行精確更新
    const { data, error } = await supabase
      .from('data_code')
      .update(updateData)
      .eq('code', actualCode) // 更新時使用精確匹配實際代碼
      .select();

    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: `Update failed: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Update failed: No rows affected' };
    }

    // 記錄操作歷史
    await recordProductHistory('Edit', actualCode);

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
    const supabase = await createClient();
    const { data, error } = await supabase.from('data_code').insert(productData).select().single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return { success: false, error: 'Product code already exists' };
      }
      return { success: false, error: error.message };
    }

    // 記錄操作歷史
    await recordProductHistory('Add', productData.code);

    return { success: true, data };
  } catch (error) {
    console.error('Error in createProduct:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

/**
 * 檢查產品代碼是否存在 (支援大小寫不敏感搜尋)
 */
export async function checkProductExists(
  code: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 使用 ilike 進行大小寫不敏感的檢查
    const { data, error } = await supabase
      .from('data_code')
      .select('code')
      .ilike('code', code.trim());

    if (error) {
      console.error('Error in checkProductExists:', error);
      return { exists: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { exists: false };
    }

    if (data.length > 1) {
      isDevelopment() &&
        isDevelopment() &&
        console.warn(
          `Multiple products found for code "${code}":`,
          data.map(p => p.code)
        );
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
export async function updateProductSQL(
  code: string,
  productData: Partial<ProductData>
): Promise<ProductActionResult> {
  try {
    const supabase = await createClient();

    // 移除 code 字段，因為它是主鍵不應該被更新
    const { code: _, ...updateData } = productData;

    // 使用 Supabase 的 SQL 查詢，利用 UPPER() 函數進行大小寫不敏感比較
    let query = supabase
      .from('data_code')
      .update(updateData)
      .eq('code', code.toUpperCase()) // 先嘗試大寫匹配
      .select();

    let { data, error } = await query;

    // 如果大寫匹配失敗，嘗試小寫匹配
    if (!data || data.length === 0) {
      query = supabase.from('data_code').update(updateData).eq('code', code.toLowerCase()).select();

      const result = await query;
      data = result.data;
      error = result.error;
    }

    // 如果還是失敗，嘗試原始輸入匹配
    if (!data || data.length === 0) {
      query = supabase.from('data_code').update(updateData).eq('code', code).select();

      const result = await query;
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error executing SQL update:', error);
      return { success: false, error: `SQL update failed: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Product not found for update' };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in updateProductSQL:', error);
    return { success: false, error: 'Failed to execute SQL update' };
  }
}

/**
 * 使用原生 SQL 查詢產品信息 (支援大小寫不敏感搜尋)
 */
export async function getProductByCodeSQL(code: string): Promise<ProductActionResult> {
  try {
    const supabase = await createClient();

    // 使用 ilike 進行大小寫不敏感查詢（PostgreSQL 特有）
    const { data, error } = await supabase
      .from('data_code')
      .select('*')
      .ilike('code', code.trim())
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Product not found' };
      }
      console.error('Error executing SQL query:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getProductByCodeSQL:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * 使用優化 SQL 更新產品信息 (最佳方式)
 */
export async function updateProductOptimized(
  code: string,
  productData: Partial<ProductData>
): Promise<ProductActionResult> {
  try {
    const supabase = await createClient();

    // 第一步：先確認產品確實存在
    const { data: existingData, error: checkError } = await supabase
      .from('data_code')
      .select('*')
      .eq('code', code);

    if (checkError) {
      console.error('Error checking existing product:', checkError);
      return { success: false, error: `Check failed: ${checkError.message}` };
    }

    if (!existingData || existingData.length === 0) {
      return { success: false, error: 'Product not found for update' };
    }

    // 移除 code 字段，因為它是主鍵不應該被更新
    const { code: _, ...updateData } = productData;

    // 第二步：使用精確匹配進行更新
    const { data, error } = await supabase
      .from('data_code')
      .update(updateData)
      .eq('code', code) // 使用精確匹配
      .select();

    if (error) {
      console.error('Error executing optimized update:', error);
      return { success: false, error: `Optimized update failed: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Product not found for update' };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in updateProductOptimized:', error);
    return { success: false, error: 'Failed to execute optimized update' };
  }
}
