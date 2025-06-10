'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { generateMultipleUniqueSeries } from '@/lib/seriesUtils';

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
    // 🔥 改用與 QC Label 相同的直接資料庫插入方式，不使用 RPC
    
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
      await: payload.grnRecord.net_weight,
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
      loc: 'Await',
      remark: `GRN: ${payload.grnRecord.grn_ref}, Material: ${payload.grnRecord.material_code}`,
      time: new Date().toISOString(),
    };

    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(historyRecord);

    if (historyError) {
      console.error('[grnActions] Error inserting history record:', historyError);
      // Don't fail the whole operation for history logging
      console.warn('[grnActions] History logging failed, but continuing with operation');
    }

    // 5. 成功完成所有資料庫操作

    // 🚀 新功能：調用 GRN workflow 優化函數
    try {
      console.log('[grnActions] 調用 GRN workflow 優化函數...', {
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
        console.warn('[grnActions] GRN workflow 更新部分失敗:', workflowData);
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

      console.log('[grnActions] GRN workflow 更新成功:', workflowData);
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
 * Generate pallet numbers and series for GRN labels on server side
 * 使用個別原子性 RPC 調用（無緩存）
 * 添加時間戳確保每次調用都是唯一的
 */
export async function generateGrnPalletNumbersAndSeries(count: number): Promise<{
  palletNumbers: string[];
  series: string[];
  error?: string;
}> {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[grnActions] 使用個別原子性 RPC 調用生成棧板號碼（無緩存），數量: ${count}, 時間戳: ${timestamp}`);
    
    // 清除任何可能的 Next.js 緩存
    revalidatePath('/print-grnlabel');
    
    const supabaseAdmin = createSupabaseAdmin();
    const palletNumbers: string[] = [];
    
    // 使用單次 RPC 調用生成所有托盤編號，避免循環中的併發問題
    console.log(`[grnActions] 使用單次 RPC 調用生成 ${count} 個托盤編號`);
    
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`[grnActions] 使用原子性 RPC 生成 ${count} 個托盤編號 (嘗試 ${attempts + 1}), 時間戳: ${timestamp}`);
        
        // 在每次嘗試前檢查當前序列號狀態
        const today = new Date();
        const dateStr = today.getDate().toString().padStart(2, '0') + 
                       (today.getMonth() + 1).toString().padStart(2, '0') + 
                       today.getFullYear().toString().slice(-2);
        const { data: currentSequence } = await supabaseAdmin
          .from('daily_pallet_sequence')
          .select('current_max')
          .eq('date_str', dateStr)
          .single();
          
        console.log(`[grnActions] 當前序列號狀態 (嘗試 ${attempts + 1}):`, currentSequence);
        
        // 使用單次 RPC 調用生成所有托盤編號
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('generate_atomic_pallet_numbers_v3', {
          count: count
        });
        
        if (rpcError) {
          console.error(`[grnActions] RPC 生成失敗:`, rpcError);
          throw new Error(`RPC generation failed: ${rpcError.message}`);
        }
        
        if (!rpcResult || !Array.isArray(rpcResult) || rpcResult.length !== count) {
          throw new Error(`Invalid result from RPC function: expected ${count} pallet numbers, got ${rpcResult?.length || 0}`);
        }
        
        palletNumbers.push(...rpcResult);
        console.log(`[grnActions] 成功生成托盤編號:`, rpcResult);
        break;
        
      } catch (error: any) {
        console.error(`[grnActions] 生成托盤編號失敗 (嘗試 ${attempts + 1}/${maxAttempts}):`, error);
        
        if (attempts === maxAttempts - 1) {
          throw new Error(`Failed to generate pallet numbers after ${maxAttempts} attempts: ${error.message}`);
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500 * attempts)); // 更長的延遲
      }
    }
    
    if (palletNumbers.length !== count) {
      throw new Error(`Failed to generate required number of pallet numbers: expected ${count}, got ${palletNumbers.length}`);
    }
    
    console.log('[grnActions] 所有托盤編號生成完成:', palletNumbers);
    
    // 驗證生成的托盤編號是否真的唯一
    const uniquePalletNumbers = [...new Set(palletNumbers)];
    if (uniquePalletNumbers.length !== palletNumbers.length) {
      console.error('[grnActions] 警告：生成的托盤編號中有重複!', {
        original: palletNumbers,
        unique: uniquePalletNumbers
      });
    }
    
    // 檢查這些托盤編號是否已經存在於資料庫中
    for (const palletNum of palletNumbers) {
      const { data: existingPallet } = await supabaseAdmin
        .from('record_palletinfo')
        .select('plt_num')
        .eq('plt_num', palletNum)
        .single();
        
      if (existingPallet) {
        console.error(`[grnActions] 嚴重錯誤：托盤編號 ${palletNum} 已存在於資料庫中!`);
      }
    }
    
    // Generate series
    const series = await generateMultipleUniqueSeries(count, supabaseAdmin);
    console.log('[grnActions] 生成的系列號:', series);
    
    return {
      palletNumbers,
      series
    };
  } catch (error: any) {
    console.error('[grnActions] 生成 GRN 棧板號碼和系列號異常:', error);
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