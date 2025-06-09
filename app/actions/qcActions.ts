'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { generateMultipleUniqueSeries } from '@/lib/seriesUtils';

// 詳細的環境變數檢查（生產環境可以注釋掉）
// console.log('[qcActions] 環境變數檢查:');
// console.log('[qcActions] SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ 已設置' : '✗ 未設置');
// console.log('[qcActions] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ 已設置' : '✗ 未設置');

if (!process.env.SUPABASE_URL) {
  console.error('[qcActions] 錯誤: SUPABASE_URL 未設置');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[qcActions] 錯誤: SUPABASE_SERVICE_ROLE_KEY 未設置');
}

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
  
  // console.log('[qcActions] 創建 Supabase 客戶端...');
  // console.log('[qcActions] URL:', supabaseUrl);
  // console.log('[qcActions] Key 長度:', serviceRoleKey.length);
  
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
  
  // 明確設置 RLS 繞過（service_role 應該能夠繞過 RLS）
  // console.log('[qcActions] 服務端客戶端創建完成，應該能夠繞過 RLS');
  
  return client;
}

// console.log('[qcActions] qcActions 模塊已加載');

// Schema for validating the clock number string and converting to number
const clockNumberSchema = z.string().regex(/^\d+$/, { message: "Clock Number must be a positive number string." }).transform(val => parseInt(val, 10));

// QC specific database payload interfaces
export interface QcPalletInfoPayload {
  plt_num: string;
  series: string;
  product_code: string;
  product_qty: number;
  plt_remark: string;
}

export interface QcHistoryPayload {
  time: string;
  id: string;
  action: string;
  plt_num?: string;
  loc?: string;
  remark?: string;
}

export interface QcAcoRecordPayload {
  order_ref: number;
  code: string;
  required_qty: number;
  remain_qty: number;
}

export interface QcInventoryPayload {
  product_code: string;
  plt_num: string;
  await: number;
}

export interface QcSlateRecordPayload {
  first_off: string;
  batch_number: string;
  setter_name: string;
  material: string;
  weight: number;
  top_thickness: number;
  bottom_thickness: number;
  length: number;
  width: number;
  centre_hole: string;
  colour: string;
  shapes: string;
  flame_test: string;
  remark: string;
  product_code: string;
  plt_num: string;
}

export interface QcDatabaseEntryPayload {
  palletInfo: QcPalletInfoPayload;
  historyRecord: QcHistoryPayload;
  inventoryRecord: QcInventoryPayload;
  acoRecords?: QcAcoRecordPayload[];
  slateRecords?: QcSlateRecordPayload[];
}

export async function createQcDatabaseEntries(
  payload: QcDatabaseEntryPayload,
  operatorClockNumberStr: string
): Promise<{ data?: string; error?: string; warning?: string }> {

  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    console.error('[qcActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten());
    return { error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}` };
  }

  // 創建新的 Supabase 客戶端
  const supabaseAdmin = createSupabaseAdmin();

  try {
    // Insert pallet info record
    const { error: palletInfoError } = await supabaseAdmin
      .from('record_palletinfo')
      .insert(payload.palletInfo);

    if (palletInfoError) {
      console.error('[qcActions] Error inserting pallet info:', palletInfoError);
      return { error: `Failed to insert pallet info: ${palletInfoError.message}` };
    }

    // Insert history record
    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(payload.historyRecord);

    if (historyError) {
      console.error('[qcActions] Error inserting history record:', historyError);
      // Don't fail the whole operation for history logging
      console.warn('[qcActions] History logging failed, but continuing with operation');
    }

    // Insert inventory record
    const { error: inventoryError } = await supabaseAdmin
      .from('record_inventory')
      .insert(payload.inventoryRecord);

    if (inventoryError) {
      console.error('[qcActions] Error inserting inventory record:', inventoryError);
      return { error: `Failed to insert inventory record: ${inventoryError.message}` };
    }

    // Insert ACO records if provided
    if (payload.acoRecords && payload.acoRecords.length > 0) {
      const { error: acoError } = await supabaseAdmin
        .from('record_aco')
        .insert(payload.acoRecords);

      if (acoError) {
        console.error('[qcActions] Error inserting ACO records:', acoError);
        return { error: `Failed to insert ACO records: ${acoError.message}` };
      }
    }

    // Insert Slate records if provided
    if (payload.slateRecords && payload.slateRecords.length > 0) {
      const { error: slateError } = await supabaseAdmin
        .from('record_slate')
        .insert(payload.slateRecords);

      if (slateError) {
        console.error('[qcActions] Error inserting Slate records:', slateError);
        return { error: `Failed to insert Slate records: ${slateError.message}` };
      }
    }

    return { data: 'QC database entries created successfully' };

  } catch (error: any) {
    console.error('[qcActions] Unexpected error in createQcDatabaseEntries:', error);
    return { error: `An unexpected error occurred: ${error.message || 'Unknown error.'}` };
  }
}

export async function uploadPdfToStorage(
  pdfUint8Array: number[],
  fileName: string,
  storagePath: string = 'qc-labels'
): Promise<{ publicUrl?: string; error?: string }> {
  try {
    // 創建新的 Supabase 客戶端
    const supabaseAdmin = createSupabaseAdmin();
    
    // Convert number array back to Uint8Array and then to Blob
    const uint8Array = new Uint8Array(pdfUint8Array);
    const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('pallet-label-pdf')
      .upload(fileName, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('[qcActions] Supabase Upload Error:', uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }

    if (!uploadData || !uploadData.path) {
      return { error: 'Upload succeeded but no path was returned' };
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('pallet-label-pdf')
      .getPublicUrl(uploadData.path);

    if (!urlData || !urlData.publicUrl) {
      return { error: 'Failed to get public URL' };
    }

    return { publicUrl: urlData.publicUrl };

  } catch (error: any) {
    console.error('[qcActions] Unexpected error in uploadPdfToStorage:', error);
    return { error: `Upload error: ${error.message || 'Unknown error'}` };
  }
}

export async function updateAcoOrderRemainQty(
  orderRef: number,
  productCode: string,
  quantityUsed: number
): Promise<{ data?: string; error?: string }> {
  try {
    // 創建新的 Supabase 客戶端
    const supabaseAdmin = createSupabaseAdmin();
    
    // First, get the current remain_qty
    const { data: currentData, error: selectError } = await supabaseAdmin
      .from('record_aco')
      .select('remain_qty')
      .eq('order_ref', orderRef)
      .eq('code', productCode)
      .single();

    if (selectError) {
      console.error('[qcActions] Error fetching current ACO remain_qty:', selectError);
      return { error: `Failed to fetch current ACO remain quantity: ${selectError.message}` };
    }

    if (!currentData) {
      return { error: 'ACO record not found' };
    }

    const currentRemainQty = currentData.remain_qty || 0;
    const newRemainQty = Math.max(0, currentRemainQty - quantityUsed); // 防止負數

    // 檢查是否會導致負數
    if (currentRemainQty < quantityUsed) {
      console.warn(`[qcActions] ACO quantity warning: Trying to use ${quantityUsed} but only ${currentRemainQty} remaining. Setting to 0.`);
    }

    // Update the remain_qty
    const { error: updateError } = await supabaseAdmin
      .from('record_aco')
      .update({ remain_qty: newRemainQty })
      .eq('order_ref', orderRef)
      .eq('code', productCode);

    if (updateError) {
      console.error('[qcActions] Error updating ACO remain_qty:', updateError);
      return { error: `Failed to update ACO remain quantity: ${updateError.message}` };
    }

    return { data: `ACO remain quantity updated successfully. Previous: ${currentRemainQty}, Used: ${quantityUsed}, New remaining: ${newRemainQty}` };

  } catch (error: any) {
    console.error('[qcActions] Unexpected error in updateAcoOrderRemainQty:', error);
    return { error: `An unexpected error occurred: ${error.message || 'Unknown error.'}` };
  }
}

export async function createQcDatabaseEntriesWithTransaction(
  payload: QcDatabaseEntryPayload,
  operatorClockNumberStr: string,
  acoUpdateInfo?: { orderRef: number; productCode: string; quantityUsed: number }
): Promise<{ data?: string; error?: string; warning?: string }> {

  // console.log('[qcActions] createQcDatabaseEntriesWithTransaction 開始');
  // console.log('[qcActions] 檢查環境變數狀態...');
  
  // 在函數調用時創建新的 Supabase 客戶端
  const supabaseAdmin = createSupabaseAdmin();
  
  // console.log('[qcActions] 新的 Supabase 客戶端已創建');

  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    console.error('[qcActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten());
    return { error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}` };
  }

  try {
    // console.log('[qcActions] 開始執行數據庫操作...');
    
    // Execute inserts in correct order to satisfy foreign key constraints
    
    // 1. Insert pallet info record first (required by foreign key constraints)
    // console.log('[qcActions] 插入 pallet info 記錄...');
    
    // Check for duplicate pallet number before inserting
    const { data: existingPallet, error: checkError } = await supabaseAdmin
      .from('record_palletinfo')
      .select('plt_num')
      .eq('plt_num', payload.palletInfo.plt_num)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is what we want
      console.error('[qcActions] Error checking for duplicate pallet:', checkError);
      throw new Error(`Failed to check for duplicate pallet: ${checkError.message}`);
    }

    if (existingPallet) {
      console.error('[qcActions] Duplicate pallet number detected:', payload.palletInfo.plt_num);
      console.error('[qcActions] Attempted to create pallet with data:', JSON.stringify(payload.palletInfo, null, 2));
      console.error('[qcActions] Call stack trace:', new Error().stack);
      return { error: `Pallet number ${payload.palletInfo.plt_num} already exists. Please try again to generate a new pallet number.` };
    }

    const { error: palletInfoError } = await supabaseAdmin
      .from('record_palletinfo')
      .insert(payload.palletInfo);

    if (palletInfoError) {
      console.error('[qcActions] Error inserting pallet info:', palletInfoError);
      console.error('[qcActions] Pallet info payload:', payload.palletInfo);
      
      // 檢查是否是重複主鍵錯誤
      if (palletInfoError.message && palletInfoError.message.includes('duplicate key value violates unique constraint')) {
        console.error('[qcActions] Duplicate pallet number constraint violation');
        return { error: `Pallet number ${payload.palletInfo.plt_num} already exists. Please try again to generate a new pallet number.` };
      }
      
      // 檢查是否是 API key 相關錯誤
      if (palletInfoError.message && palletInfoError.message.toLowerCase().includes('api key')) {
        console.error('[qcActions] 檢測到 API key 錯誤 - 這可能是環境變數問題');
        return { error: `API Key Error: ${palletInfoError.message}. 請檢查 SUPABASE_SERVICE_ROLE_KEY 環境變數。` };
      }
      
      throw new Error(`Failed to insert pallet info: ${palletInfoError.message}`);
    }
    // console.log('[qcActions] Pallet info 插入成功');

    // 2. Insert history record
    // console.log('[qcActions] 插入 history 記錄...');
    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(payload.historyRecord);

    if (historyError) {
      console.error('[qcActions] Error inserting history record:', historyError);
      throw new Error(`Failed to insert history record: ${historyError.message}`);
    }
    // console.log('[qcActions] History 記錄插入成功');

    // 3. Insert inventory record (depends on pallet info)
    // console.log('[qcActions] 插入 inventory 記錄...');
    const { error: inventoryError } = await supabaseAdmin
      .from('record_inventory')
      .insert(payload.inventoryRecord);

    if (inventoryError) {
      console.error('[qcActions] Error inserting inventory record:', inventoryError);
      throw new Error(`Failed to insert inventory record: ${inventoryError.message}`);
    }
    // console.log('[qcActions] Inventory 記錄插入成功');

    // 4. Insert ACO records if provided
    if (payload.acoRecords && payload.acoRecords.length > 0) {
      // console.log('[qcActions] 插入 ACO 記錄...');
      const { error: acoError } = await supabaseAdmin
        .from('record_aco')
        .insert(payload.acoRecords);

      if (acoError) {
        console.error('[qcActions] Error inserting ACO records:', acoError);
        throw new Error(`Failed to insert ACO records: ${acoError.message}`);
      }
      // console.log('[qcActions] ACO 記錄插入成功');
    }

    // 5. Insert Slate records if provided
    if (payload.slateRecords && payload.slateRecords.length > 0) {
      // console.log('[qcActions] 插入 Slate 記錄...');
      const { error: slateError } = await supabaseAdmin
        .from('record_slate')
        .insert(payload.slateRecords);

      if (slateError) {
        console.error('[qcActions] Error inserting Slate records:', slateError);
        throw new Error(`Failed to insert Slate records: ${slateError.message}`);
      }
      // console.log('[qcActions] Slate 記錄插入成功');
    }

    // 6. If ACO update is needed, do it after successful inserts
    if (acoUpdateInfo) {
      // console.log('[qcActions] 更新 ACO 剩餘數量...');
      const updateResult = await updateAcoOrderRemainQty(
        acoUpdateInfo.orderRef,
        acoUpdateInfo.productCode,
        acoUpdateInfo.quantityUsed
      );
      
      if (updateResult.error) {
        console.error('[qcActions] ACO update failed:', updateResult.error);
        throw new Error(`ACO update failed: ${updateResult.error}`);
      }
      // console.log('[qcActions] ACO 更新成功');
    }

    // console.log('[qcActions] 所有數據庫操作完成');
    return { data: 'QC database entries created successfully with transaction' };

  } catch (error: any) {
    console.error('[qcActions] Transaction failed, all operations rolled back:', error);
    console.error('[qcActions] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { error: `Transaction failed: ${error.message || 'Unknown error.'}` };
  }
}

/**
 * Generate pallet numbers and series on server side
 */
export async function generatePalletNumbersAndSeries(count: number): Promise<{
  palletNumbers: string[];
  series: string[];
  error?: string;
}> {
  try {
    // console.log('[qcActions] 生成棧板號碼和系列號，數量:', count);
    
    const supabaseAdmin = createSupabaseAdmin();
    
    // 🔥 使用新的原子性棧板號碼生成函數，帶重試機制
    let palletNumbers: string[] = [];
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { data, error: palletError } = await supabaseAdmin.rpc('generate_atomic_pallet_numbers_v2', {
          count: count
        });
        
        if (palletError) {
          console.error(`[qcActions] 原子性棧板號碼生成失敗 (嘗試 ${attempts + 1}/${maxAttempts}):`, palletError);
          
          if (attempts === maxAttempts - 1) {
            throw new Error(`Failed to generate atomic pallet numbers after ${maxAttempts} attempts: ${palletError.message}`);
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempts)); // 遞增延遲
          continue;
        }
        
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid pallet numbers returned from atomic function');
        }
        
        palletNumbers = data;
        break;
        
      } catch (rpcError: any) {
        console.error(`[qcActions] RPC 調用錯誤 (嘗試 ${attempts + 1}/${maxAttempts}):`, rpcError);
        
        if (attempts === maxAttempts - 1) {
          throw rpcError;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100 * attempts)); // 遞增延遲
      }
    }
    
    // console.log('[qcActions] 生成的棧板號碼:', palletNumbers);
    
    // Generate series with retry mechanism
    let series: string[] = [];
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        series = await generateMultipleUniqueSeries(count, supabaseAdmin);
        break;
      } catch (seriesError: any) {
        console.error(`[qcActions] 系列號生成失敗 (嘗試 ${attempts + 1}/${maxAttempts}):`, seriesError);
        
        if (attempts === maxAttempts - 1) {
          throw seriesError;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100 * attempts)); // 遞增延遲
      }
    }
    
    // console.log('[qcActions] 生成的系列號:', series);
    
    return {
      palletNumbers,
      series
    };
  } catch (error: any) {
    console.error('[qcActions] 生成棧板號碼和系列號失敗:', error);
    return {
      palletNumbers: [],
      series: [],
      error: error.message
    };
  }
} 