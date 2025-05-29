'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generatePalletNumbers } from '@/lib/palletNumUtils';
import { generateUniqueSeries } from '@/lib/seriesUtils';

// 創建 Supabase 客戶端的函數
function createSupabaseAdmin() {
  // 確保環境變數存在
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  
  // console.log('[grnActions] 創建服務端 Supabase 客戶端...');
  
  const client = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      }
    }
  );
  
  // console.log('[grnActions] 服務端客戶端創建完成，應該能夠繞過 RLS');
  
  return client;
}

// console.log('[grnActions] grnActions 模塊已加載');

// Schema for validating the clock number string and converting to number
const clockNumberSchema = z.string().regex(/^\d+$/, { message: "Operator Clock Number must be a positive number string." }).transform(val => parseInt(val, 10));

// 確保 GrnDatabaseEntryPayload 與實際傳入的數據以及數據庫 schema 匹配
export interface GrnPalletInfoPayload {
  plt_num: string;
  series: string;
  product_code: string;
  product_qty: number; // 假設這是 number，後續會 Math.round
  plt_remark: string;
  // 確保沒有多餘或缺失的字段，與 record_palletinfo 表的 Insert 類型匹配
}

export interface GrnRecordPayload {
  grn_ref: string; // 假設這是 string
  material_code: string;
  sup_code: string;
  plt_num: string;
  gross_weight: number;
  net_weight: number;
  pallet_count: number;
  package_count: number;
  pallet: string;
  package: string;
  // 確保沒有多餘或缺失的字段，與 record_grn 表的 Insert 類型匹配
}

export interface GrnDatabaseEntryPayload {
  palletInfo: GrnPalletInfoPayload;
  grnRecord: GrnRecordPayload;
}

export async function createGrnDatabaseEntries(
  payload: GrnDatabaseEntryPayload, 
  operatorClockNumberStr: string // New parameter
): Promise<{ data?: string; error?: string; warning?: string }> {

  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    console.error('[grnActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten());
    return { error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}` };
  }
  const operatorIdForFunction = clockValidation.data;

  // 創建新的 Supabase 客戶端
  const supabaseAdmin = createSupabaseAdmin();

  // REMOVED: Supabase auth related logic (getUser, querying data_id by auth_user_uuid)
  // console.log('[grnActions] All available cookie names in GRN Action:'); // No longer relevant
  // const { data: { user }, error: authError } = await supabase.auth.getUser(); // Removed
  // ... and subsequent logic for currentAuthUserUuid and fetching dataId from data_id based on it ...

  try {
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('create_grn_entries_atomic', {
      p_plt_num: payload.palletInfo.plt_num,
      p_series: payload.palletInfo.series,
      p_product_code: payload.palletInfo.product_code,
      p_product_qty: payload.palletInfo.product_qty, // SQL function will ROUND
      p_plt_remark: payload.palletInfo.plt_remark,
      
      p_grn_ref: payload.grnRecord.grn_ref, // Pass as string, SQL function converts to INT
      p_material_code: payload.grnRecord.material_code,
      p_sup_code: payload.grnRecord.sup_code,
      // p_plt_num is already mapped from palletInfo above for the SQL function context
      p_gross_weight: payload.grnRecord.gross_weight,
      p_net_weight: payload.grnRecord.net_weight,
      p_pallet_count: payload.grnRecord.pallet_count,
      p_package_count_param: payload.grnRecord.package_count, // Maps to p_package_count_param
      p_pallet: payload.grnRecord.pallet,
      p_package_col: payload.grnRecord.package, // Maps to p_package_col

      p_operator_id: operatorIdForFunction,
      p_loc: 'Await' // Set location to "Await" for GRN entries
    });

    if (rpcError) {
      console.error('[grnActions] RPC error calling create_grn_entries_atomic:', rpcError);
      // Check if the error message is one of our custom prefixed ones
      if (rpcError.message && rpcError.message.startsWith('GRN_ATOMIC_FAILURE:')) {
        const userFriendlyMessage = rpcError.message.replace('GRN_ATOMIC_FAILURE:', '').trim();
        return { error: `Database operation failed: ${userFriendlyMessage}` };
      } else if (rpcError.message && rpcError.message.includes('Invalid GRN Reference format')) {
        // Specific check for GRN ref format error raised by the function
        return { error: rpcError.message };
      }
      return { error: `Database operation failed: ${rpcError.message}` }; // Generic fallback
    }

    return { data: rpcData as string };

  } catch (error: any) {
    console.error('[grnActions] Unexpected error in createGrnDatabaseEntries (RPC call):', error);
    return { error: `An unexpected error occurred: ${error.message || 'Unknown error.'}` };
  }
}

/**
 * Generate pallet numbers and series for GRN labels on server side
 */
export async function generateGrnPalletNumbersAndSeries(count: number): Promise<{
  palletNumbers: string[];
  series: string[];
  error?: string;
}> {
  try {
    // console.log('[grnActions] 生成 GRN 棧板號碼和系列號，數量:', count);
    
    const supabaseAdmin = createSupabaseAdmin();
    
    // 測試基本連接
    // console.log('[grnActions] 測試基本 Supabase 連接...');
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('record_palletinfo')
        .select('plt_num')
        .limit(1);
      
      if (testError) {
        console.error('[grnActions] Supabase 連接測試失敗:', testError);
        return {
          palletNumbers: [],
          series: [],
          error: `Supabase connection test failed: ${testError.message}. This indicates an API key or permission issue.`
        };
      }
      
      // console.log('[grnActions] Supabase 連接測試成功');
    } catch (connectionError: any) {
      console.error('[grnActions] Supabase 連接測試異常:', connectionError);
      return {
        palletNumbers: [],
        series: [],
        error: `Supabase connection exception: ${connectionError.message}`
      };
    }
    
    // Generate pallet numbers
    const palletNumbers = await generatePalletNumbers(supabaseAdmin, count);
    // console.log('[grnActions] 生成的棧板號碼:', palletNumbers);
    
    // Generate series (one by one for GRN)
    const series: string[] = [];
    for (let i = 0; i < count; i++) {
      const singleSeries = await generateUniqueSeries(supabaseAdmin);
      series.push(singleSeries);
    }
    // console.log('[grnActions] 生成的系列號:', series);
    
    return {
      palletNumbers,
      series
    };
  } catch (error: any) {
    console.error('[grnActions] 生成 GRN 棧板號碼和系列號失敗:', error);
    return {
      palletNumbers: [],
      series: [],
      error: `Failed to generate pallet numbers: ${error.message}`
    };
  }
}

/**
 * Upload PDF to storage using server-side Supabase client
 */
export async function uploadPdfToStorage(
  pdfUint8Array: number[],
  fileName: string,
  storagePath: string = 'grn-labels'
): Promise<{ publicUrl?: string; error?: string }> {
  try {
    console.log('[grnActions] 開始上傳 PDF 到 Storage...', {
      fileName,
      storagePath,
      arrayLength: pdfUint8Array.length
    });
    
    // 創建新的 Supabase 客戶端
    const supabaseAdmin = createSupabaseAdmin();
    
    // Convert number array back to Uint8Array and then to Blob
    const uint8Array = new Uint8Array(pdfUint8Array);
    const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
    
    console.log('[grnActions] PDF Blob 創建完成:', {
      blobSize: pdfBlob.size,
      blobType: pdfBlob.type
    });
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('pallet-label-pdf')
      .upload(fileName, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('[grnActions] Supabase Upload Error:', uploadError);
      
      // 檢查是否是 API key 相關錯誤
      if (uploadError.message && uploadError.message.toLowerCase().includes('api key')) {
        console.error('[grnActions] 檢測到 API key 錯誤 - 這可能是環境變數問題');
        return { error: `API Key Error: ${uploadError.message}. 請檢查 SUPABASE_SERVICE_ROLE_KEY 環境變數。` };
      }
      
      return { error: `Upload failed: ${uploadError.message}` };
    }

    if (!uploadData || !uploadData.path) {
      console.error('[grnActions] 上傳成功但沒有返回路徑');
      return { error: 'Upload succeeded but no path was returned' };
    }

    console.log('[grnActions] 文件上傳成功，路徑:', uploadData.path);

    const { data: urlData } = supabaseAdmin.storage
      .from('pallet-label-pdf')
      .getPublicUrl(uploadData.path);

    if (!urlData || !urlData.publicUrl) {
      console.error('[grnActions] 無法獲取公共 URL');
      return { error: 'Failed to get public URL' };
    }

    console.log('[grnActions] 公共 URL 生成成功:', urlData.publicUrl);
    return { publicUrl: urlData.publicUrl };

  } catch (error: any) {
    console.error('[grnActions] uploadPdfToStorage 意外錯誤:', error);
    return { error: `Upload error: ${error.message || 'Unknown error'}` };
  }
} 