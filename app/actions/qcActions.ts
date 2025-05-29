'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// 詳細的環境變數檢查
console.log('[qcActions] 環境變數檢查:');
console.log('[qcActions] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 已設置' : '✗ 未設置');
console.log('[qcActions] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ 已設置' : '✗ 未設置');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('[qcActions] 錯誤: NEXT_PUBLIC_SUPABASE_URL 未設置');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[qcActions] 錯誤: SUPABASE_SERVICE_ROLE_KEY 未設置');
}

// 備用環境變數（從 vercel.json 中的值）
const FALLBACK_SUPABASE_URL = 'https://bbmkuiplnzvpudszrend.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MDAxNTYwNCwiZXhwIjoxOTk1NTkxNjA0fQ.lkRDHLCdZdP4YE5c3XFu_G26F1O_N1fxEP2Wa3M1NtM';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;

console.log('[qcActions] 使用的 URL:', supabaseUrl === FALLBACK_SUPABASE_URL ? '備用 URL' : '環境變數 URL');
console.log('[qcActions] 使用的 Key:', serviceRoleKey === FALLBACK_SERVICE_ROLE_KEY ? '備用 Key' : '環境變數 Key');

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('[qcActions] Supabase 客戶端已初始化');

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

  console.log('[qcActions] createQcDatabaseEntriesWithTransaction 開始');
  console.log('[qcActions] 檢查環境變數狀態...');
  
  // 再次檢查環境變數（使用相同的備用邏輯）
  const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const runtimeKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
  
  console.log('[qcActions] 運行時 URL:', runtimeUrl === FALLBACK_SUPABASE_URL ? '使用備用 URL' : '使用環境變數 URL');
  console.log('[qcActions] 運行時 Key:', runtimeKey === FALLBACK_SERVICE_ROLE_KEY ? '使用備用 Key' : '使用環境變數 Key');
  
  console.log('[qcActions] 環境變數檢查通過');

  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    console.error('[qcActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten());
    return { error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}` };
  }

  try {
    console.log('[qcActions] 開始執行數據庫操作...');
    
    // Execute inserts in correct order to satisfy foreign key constraints
    
    // 1. Insert pallet info record first (required by foreign key constraints)
    console.log('[qcActions] 插入 pallet info 記錄...');
    const { error: palletInfoError } = await supabaseAdmin
      .from('record_palletinfo')
      .insert(payload.palletInfo);

    if (palletInfoError) {
      console.error('[qcActions] Error inserting pallet info:', palletInfoError);
      console.error('[qcActions] Pallet info payload:', payload.palletInfo);
      
      // 檢查是否是 API key 相關錯誤
      if (palletInfoError.message && palletInfoError.message.toLowerCase().includes('api key')) {
        console.error('[qcActions] 檢測到 API key 錯誤 - 這可能是環境變數問題');
        return { error: `API Key Error: ${palletInfoError.message}. 請檢查 SUPABASE_SERVICE_ROLE_KEY 環境變數。` };
      }
      
      throw new Error(`Failed to insert pallet info: ${palletInfoError.message}`);
    }
    console.log('[qcActions] Pallet info 插入成功');

    // 2. Insert history record
    console.log('[qcActions] 插入 history 記錄...');
    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(payload.historyRecord);

    if (historyError) {
      console.error('[qcActions] Error inserting history record:', historyError);
      throw new Error(`Failed to insert history record: ${historyError.message}`);
    }
    console.log('[qcActions] History 記錄插入成功');

    // 3. Insert inventory record (depends on pallet info)
    console.log('[qcActions] 插入 inventory 記錄...');
    const { error: inventoryError } = await supabaseAdmin
      .from('record_inventory')
      .insert(payload.inventoryRecord);

    if (inventoryError) {
      console.error('[qcActions] Error inserting inventory record:', inventoryError);
      throw new Error(`Failed to insert inventory record: ${inventoryError.message}`);
    }
    console.log('[qcActions] Inventory 記錄插入成功');

    // 4. Insert ACO records if provided
    if (payload.acoRecords && payload.acoRecords.length > 0) {
      console.log('[qcActions] 插入 ACO 記錄...');
      const { error: acoError } = await supabaseAdmin
        .from('record_aco')
        .insert(payload.acoRecords);

      if (acoError) {
        console.error('[qcActions] Error inserting ACO records:', acoError);
        throw new Error(`Failed to insert ACO records: ${acoError.message}`);
      }
      console.log('[qcActions] ACO 記錄插入成功');
    }

    // 5. Insert Slate records if provided
    if (payload.slateRecords && payload.slateRecords.length > 0) {
      console.log('[qcActions] 插入 Slate 記錄...');
      const { error: slateError } = await supabaseAdmin
        .from('record_slate')
        .insert(payload.slateRecords);

      if (slateError) {
        console.error('[qcActions] Error inserting Slate records:', slateError);
        throw new Error(`Failed to insert Slate records: ${slateError.message}`);
      }
      console.log('[qcActions] Slate 記錄插入成功');
    }

    // 6. If ACO update is needed, do it after successful inserts
    if (acoUpdateInfo) {
      console.log('[qcActions] 更新 ACO 剩餘數量...');
      const updateResult = await updateAcoOrderRemainQty(
        acoUpdateInfo.orderRef,
        acoUpdateInfo.productCode,
        acoUpdateInfo.quantityUsed
      );
      
      if (updateResult.error) {
        console.error('[qcActions] ACO update failed:', updateResult.error);
        throw new Error(`ACO update failed: ${updateResult.error}`);
      }
      console.log('[qcActions] ACO 更新成功');
    }

    console.log('[qcActions] 所有數據庫操作完成');
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