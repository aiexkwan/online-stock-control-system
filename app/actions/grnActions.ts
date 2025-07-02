'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// V6 includes series generation, no need for separate series utils

// 創建 Supabase 客戶端的函數
function createSupabaseAdmin() {
  // 確保環境變數存在
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  
  // process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] 創建服務端 Supabase 客戶端...');
  
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
  
  // process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] 服務端客戶端創建完成，應該能夠繞過 RLS');
  
  return client;
}

// process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] grnActions 模塊已加載');

// Schema for validating the clock number string and converting to number
const clockNumberSchema = z.string().regex(/^\d+$/, { message: "Operator Clock Number must be a positive number string." }).transform(val => parseInt(val, 10));

// 確保 GrnDatabaseEntryPayload 與實際傳入的數據以及數據庫 schema 匹配
export interface GrnPalletInfoPayload {
  plt_num: string;
  series: string;
  product_code: string;
  product_qty: number; // 假設這是 number，後續會 Math.round
  plt_remark: string;
  pdf_url?: string; // 新增 PDF URL 欄位
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
  operatorClockNumberStr: string, // New parameter
  labelMode: 'weight' | 'qty' = 'weight' // 新增參數：標籤模式
): Promise<{ data?: string; error?: string; warning?: string }> {

  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    console.error('[grnActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten());
    return { error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}` };
  }
  const operatorIdForFunction = clockValidation.data;

  // 創建新的 Supabase 客戶端
  const supabaseAdmin = createSupabaseAdmin();

  try {
    // 🚀 新功能：使用統一的 GRN Label RPC 處理所有操作
    process.env.NODE_ENV !== "production" && console.log('[grnActions] 使用統一 GRN Label RPC 處理...', {
      grnRef: payload.grnRecord.grn_ref,
      materialCode: payload.grnRecord.material_code,
      supplierCode: payload.grnRecord.sup_code,
      labelMode,
      operatorId: operatorIdForFunction
    });

    // 準備統一 RPC 的參數
    const rpcParams: any = {
      p_count: 1, // 每次處理一個棧板
      p_grn_number: payload.grnRecord.grn_ref,
      p_material_code: payload.grnRecord.material_code,
      p_supplier_code: payload.grnRecord.sup_code,
      p_clock_number: operatorIdForFunction.toString(),
      p_label_mode: labelMode,
      p_session_id: `grn-${payload.grnRecord.grn_ref}-${Date.now()}`,
      p_pallet_count: payload.grnRecord.pallet_count,
      p_package_count: payload.grnRecord.package_count,
      p_pallet_type: payload.grnRecord.pallet,
      p_package_type: payload.grnRecord.package
    };

    // 根據標籤模式設置相應的數據
    if (labelMode === 'weight') {
      rpcParams.p_gross_weights = [payload.grnRecord.gross_weight];
      rpcParams.p_net_weights = [payload.grnRecord.net_weight];
      rpcParams.p_quantities = null;
    } else if (labelMode === 'qty') {
      rpcParams.p_gross_weights = null;
      rpcParams.p_net_weights = null;
      rpcParams.p_quantities = [payload.palletInfo.product_qty];
    }

    // 如果有 PDF URL，添加到參數中
    if (payload.palletInfo.pdf_url) {
      rpcParams.p_pdf_urls = [payload.palletInfo.pdf_url];
    }

    process.env.NODE_ENV !== "production" && console.log('[grnActions] 統一 RPC 參數:', rpcParams);

    // 調用統一 GRN RPC
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_grn_label_unified', rpcParams);

    if (rpcError) {
      console.error('[grnActions] 統一 GRN RPC 調用失敗:', rpcError);
      return { error: `Failed to process GRN label: ${rpcError.message}` };
    }

    if (!rpcResult || !rpcResult.success) {
      const errorMsg = rpcResult?.message || 'Unknown error from unified RPC';
      console.error('[grnActions] 統一 GRN RPC 處理失敗:', errorMsg);
      return { error: errorMsg };
    }

    process.env.NODE_ENV !== "production" && console.log('[grnActions] 統一 GRN RPC 處理成功:', rpcResult);

    return { 
      data: `GRN label processed successfully. ${rpcResult.data ? `Pallet: ${rpcResult.data.pallet_numbers?.[0] || 'N/A'}` : ''}` 
    };

  } catch (error: any) {
    console.error('[grnActions] 統一 GRN RPC 處理異常:', error);
    
    // 備用方案：如果統一 RPC 失敗，回退到舊的逐個插入方式
    console.log('[grnActions] 回退到逐個插入方式...');
    return await createGrnDatabaseEntriesLegacy(payload, operatorClockNumberStr, labelMode);
  }
}

/**
 * 批量處理 GRN 標籤的統一 RPC 函數
 * 使用新的統一 RPC 一次性處理多個棧板
 */
export async function createGrnDatabaseEntriesBatch(
  grnNumber: string,
  materialCode: string,
  supplierCode: string,
  operatorClockNumberStr: string,
  labelMode: 'weight' | 'qty',
  grossWeights: number[],
  netWeights: number[],
  quantities: number[],
  palletCount: number,
  packageCount: number,
  palletType: string,
  packageType: string,
  pdfUrls?: string[]
): Promise<{ success?: boolean; data?: any; error?: string; warning?: string; palletNumbers?: string[]; series?: string[] }> {

  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    console.error('[grnActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten());
    return { success: false, error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}` };
  }
  const operatorIdForFunction = clockValidation.data;

  const supabaseAdmin = createSupabaseAdmin();

  try {
    // 🚀 使用統一的 GRN Label RPC 批量處理所有棧板
    const count = Math.max(grossWeights.length, netWeights.length, quantities.length);
    
    process.env.NODE_ENV !== "production" && console.log('[grnActions] 批量處理 GRN 標籤，數量:', count, {
      grnNumber,
      materialCode,
      supplierCode,
      labelMode,
      operatorId: operatorIdForFunction
    });

    // 準備統一 RPC 的參數
    const rpcParams: any = {
      p_count: count,
      p_grn_number: grnNumber,
      p_material_code: materialCode,
      p_supplier_code: supplierCode,
      p_clock_number: operatorIdForFunction.toString(),
      p_label_mode: labelMode,
      p_session_id: `grn-batch-${grnNumber}-${Date.now()}`,
      p_pallet_count: palletCount,
      p_package_count: packageCount,
      p_pallet_type: palletType,
      p_package_type: packageType
    };

    // 根據標籤模式設置相應的數據
    if (labelMode === 'weight') {
      rpcParams.p_gross_weights = grossWeights;
      rpcParams.p_net_weights = netWeights;
      rpcParams.p_quantities = null;
    } else if (labelMode === 'qty') {
      rpcParams.p_gross_weights = null;
      rpcParams.p_net_weights = null;
      rpcParams.p_quantities = quantities;
    }

    // 如果有 PDF URLs，添加到參數中
    if (pdfUrls && pdfUrls.length > 0) {
      rpcParams.p_pdf_urls = pdfUrls;
    }

    process.env.NODE_ENV !== "production" && console.log('[grnActions] 統一批量 RPC 參數:', rpcParams);

    // 調用統一 GRN RPC
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_grn_label_unified', rpcParams);

    if (rpcError) {
      console.error('[grnActions] 統一批量 GRN RPC 調用失敗:', rpcError);
      return { success: false, error: `Failed to process GRN labels: ${rpcError.message}` };
    }

    if (!rpcResult || !rpcResult.success) {
      const errorMsg = rpcResult?.message || 'Unknown error from unified RPC';
      console.error('[grnActions] 統一批量 GRN RPC 處理失敗:', errorMsg);
      return { success: false, error: errorMsg };
    }

    process.env.NODE_ENV !== "production" && console.log('[grnActions] 統一批量 GRN RPC 處理成功:', rpcResult);

    return { 
      success: true,
      data: rpcResult,
      palletNumbers: rpcResult.data?.pallet_numbers || [],
      series: rpcResult.data?.series || []
    };

  } catch (error: any) {
    console.error('[grnActions] 統一批量 GRN RPC 處理異常:', error);
    return { success: false, error: `Batch processing failed: ${error.message}` };
  }
}

/**
 * 舊版本的 GRN 數據庫插入方式，作為統一 RPC 的備用方案
 */
async function createGrnDatabaseEntriesLegacy(
  payload: GrnDatabaseEntryPayload, 
  operatorClockNumberStr: string,
  labelMode: 'weight' | 'qty' = 'weight'
): Promise<{ data?: string; error?: string; warning?: string }> {

  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    return { error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}` };
  }
  const operatorIdForFunction = clockValidation.data;

  const supabaseAdmin = createSupabaseAdmin();

  try {
    // 🔥 舊版：逐個插入記錄的方式
    
    // 1. Insert pallet info record
    const { error: palletInfoError } = await supabaseAdmin
      .from('record_palletinfo')
      .insert(payload.palletInfo);

    if (palletInfoError) {
      console.error('[grnActions] Error inserting pallet info:', palletInfoError);
      return { error: `Failed to insert pallet info: ${palletInfoError.message}` };
    }

    // 2. Insert GRN record
    const grnRecordForInsert = {
      grn_ref: parseInt(payload.grnRecord.grn_ref), // Convert to integer
      material_code: payload.grnRecord.material_code,
      sup_code: payload.grnRecord.sup_code,
      plt_num: payload.grnRecord.plt_num,
      gross_weight: payload.grnRecord.gross_weight,
      net_weight: payload.grnRecord.net_weight,
      pallet_count: payload.grnRecord.pallet_count,
      package_count: payload.grnRecord.package_count,
      pallet: payload.grnRecord.pallet,
      package: payload.grnRecord.package,
    };

    const { error: grnError } = await supabaseAdmin
      .from('record_grn')
      .insert(grnRecordForInsert);

    if (grnError) {
      console.error('[grnActions] Error inserting GRN record:', grnError);
      return { error: `Failed to insert GRN record: ${grnError.message}` };
    }

    // 3. Insert inventory record
    const inventoryRecord = {
      product_code: payload.grnRecord.material_code,
      plt_num: payload.palletInfo.plt_num,
      await_grn: payload.grnRecord.net_weight,  // 改為寫入 await_grn 欄位
      latest_update: new Date().toISOString(),
    };

    const { error: inventoryError } = await supabaseAdmin
      .from('record_inventory')
      .insert(inventoryRecord);

    if (inventoryError) {
      console.error('[grnActions] Error inserting inventory record:', inventoryError);
      return { error: `Failed to insert inventory record: ${inventoryError.message}` };
    }

    // 4. Insert history record
    const historyRecord = {
      action: 'GRN Receiving',
      id: operatorIdForFunction.toString(),
      plt_num: payload.palletInfo.plt_num,
      loc: 'Await_grn',  // 改為 Await_grn
      remark: `GRN: ${payload.grnRecord.grn_ref}, Material: ${payload.grnRecord.material_code}`,
      time: new Date().toISOString(),
    };

    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(historyRecord);

    if (historyError) {
      console.error('[grnActions] Error inserting history record:', historyError);
      // Don't fail the whole operation for history logging
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[grnActions] History logging failed, but continuing with operation');
    }

    // 5. 成功完成所有資料庫操作

    // 🚀 新功能：調用 GRN workflow 優化函數
    try {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] 調用 GRN workflow 優化函數...', {
        grnRef: payload.grnRecord.grn_ref,
        labelMode,
        operatorId: operatorIdForFunction,
        productCode: payload.grnRecord.material_code,
        grossWeight: payload.grnRecord.gross_weight,
        netWeight: payload.grnRecord.net_weight
      });

      const workflowParams: any = {
        p_grn_ref: payload.grnRecord.grn_ref,
        p_label_mode: labelMode,
        p_user_id: operatorIdForFunction,
        p_product_code: payload.grnRecord.material_code,
        p_product_description: null,
        p_grn_count: 1
      };

      // 根據標籤模式添加相應參數
      if (labelMode === 'weight') {
        workflowParams.p_gross_weight = payload.grnRecord.gross_weight;
        workflowParams.p_net_weight = payload.grnRecord.net_weight;
        workflowParams.p_quantity = null;
      } else if (labelMode === 'qty') {
        workflowParams.p_gross_weight = null;
        workflowParams.p_net_weight = null;
        workflowParams.p_quantity = payload.palletInfo.product_qty;
      }

      const { data: workflowData, error: workflowError } = await supabaseAdmin.rpc('update_grn_workflow', workflowParams);

      if (workflowError) {
        console.error('[grnActions] GRN workflow 更新失敗:', workflowError);
        // 不中斷主流程，只記錄警告
        return { 
          data: 'GRN database entries created successfully', 
          warning: `GRN workflow update failed: ${workflowError.message}` 
        };
      }

      if (workflowData && !workflowData.success) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[grnActions] GRN workflow 更新部分失敗:', workflowData);
        const failureDetails = [
          workflowData.grn_level_result?.includes('ERROR:') ? 'GRN Level' : null,
          workflowData.work_level_result?.includes('ERROR:') ? 'Work Level' : null,
          workflowData.stock_level_result?.includes('ERROR:') ? 'Stock Level' : null
        ].filter(Boolean).join(', ');
        
        return { 
          data: 'GRN database entries created successfully', 
          warning: `GRN workflow partially failed (${failureDetails}): ${workflowData.grn_level_result || workflowData.work_level_result || workflowData.stock_level_result}` 
        };
      }

      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] GRN workflow 更新成功:', workflowData);
      return { data: 'GRN database entries created successfully' };

    } catch (workflowError: any) {
      console.error('[grnActions] GRN workflow 更新異常:', workflowError);
      // 不中斷主流程，只記錄警告
      return { 
        data: 'GRN database entries created successfully', 
        warning: `GRN workflow update exception: ${workflowError.message}` 
      };
    }

  } catch (error: any) {
    console.error('[grnActions] Unexpected error in createGrnDatabaseEntries (RPC call):', error);
    return { error: `An unexpected error occurred: ${error.message || 'Unknown error.'}` };
  }
}


/**
 * Update pallet PDF URL in database
 */
export async function updatePalletPdfUrl(
  pltNum: string,
  pdfUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    
    const { error } = await supabaseAdmin
      .from('record_palletinfo')
      .update({ pdf_url: pdfUrl })
      .eq('plt_num', pltNum);

    if (error) {
      console.error('[grnActions] Error updating PDF URL:', error);
      return { success: false, error: `Failed to update PDF URL: ${error.message}` };
    }

    process.env.NODE_ENV !== "production" && console.log('[grnActions] PDF URL updated successfully for pallet:', pltNum);
    return { success: true };
  } catch (error: any) {
    console.error('[grnActions] Unexpected error updating PDF URL:', error);
    return { success: false, error: `Update PDF URL error: ${error.message || 'Unknown error'}` };
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
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] 開始上傳 PDF 到 Storage...', {
      fileName,
      storagePath,
      arrayLength: pdfUint8Array.length
    });
    
    // 創建新的 Supabase 客戶端
    const supabaseAdmin = createSupabaseAdmin();
    
    // Convert number array back to Uint8Array and then to Blob
    const uint8Array = new Uint8Array(pdfUint8Array);
    const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] PDF Blob 創建完成:', {
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

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] 文件上傳成功，路徑:', uploadData.path);

    const { data: urlData } = supabaseAdmin.storage
      .from('pallet-label-pdf')
      .getPublicUrl(uploadData.path);

    if (!urlData || !urlData.publicUrl) {
      console.error('[grnActions] 無法獲取公共 URL');
      return { error: 'Failed to get public URL' };
    }

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[grnActions] 公共 URL 生成成功:', urlData.publicUrl);
    return { publicUrl: urlData.publicUrl };

  } catch (error: any) {
    console.error('[grnActions] uploadPdfToStorage 意外錯誤:', error);
    return { error: `Upload error: ${error.message || 'Unknown error'}` };
  }
} 