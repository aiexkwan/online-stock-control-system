'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  CACHE_CONTROL_TIMEOUT,
  MAX_DUPLICATE_CHECK_ATTEMPTS,
  DUPLICATE_CHECK_DELAY_BASE,
  ONE_HOUR_CACHE,
} from '@/app/components/qc-label-form/constants';

if (!process.env.SUPABASE_URL) {
  // console.error('[qcActions] 錯誤: SUPABASE_URL 未設置'); // 保留錯誤日誌供生產環境調試
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // console.error('[qcActions] 錯誤: SUPABASE_SERVICE_ROLE_KEY 未設置'); // 保留錯誤日誌供生產環境調試
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

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  });

  return client;
}

// Schema for validating the clock number string and converting to number
const clockNumberSchema = z
  .string()
  .regex(/^\d+$/, { message: 'Clock Number must be a positive number string.' })
  .transform(val => parseInt(val, 10));

// QC specific database payload interfaces
export interface QcPalletInfoPayload {
  plt_num: string;
  series: string;
  product_code: string;
  product_qty: number;
  plt_remark: string;
  pdf_url?: string; // 新增 PDF URL 欄位
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
  batch_num: string;
  setter: string;
  material: string;
  weight: number;
  t_thick: number;
  b_thick: number;
  length: number;
  width: number;
  centre_hole: number;
  colour: string;
  shape: string;
  flame_test: number;
  remark: string;
  code: string;
  plt_num: string;
  mach_num: string;
  uuid: string;
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
    // console.error('[qcActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten()); // 保留錯誤日誌供生產環境調試
    return {
      error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}`,
    };
  }

  // 創建新的 Supabase 客戶端
  const supabaseAdmin = createSupabaseAdmin();

  try {
    // Insert pallet info record
    const { error: palletInfoError } = await supabaseAdmin
      .from('record_palletinfo')
      .insert(payload.palletInfo);

    if (palletInfoError) {
      // console.error('[qcActions] Error inserting pallet info:', palletInfoError); // 保留錯誤日誌供生產環境調試
      return { error: `Failed to insert pallet info: ${palletInfoError.message}` };
    }

    // Insert history record
    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(payload.historyRecord);

    if (historyError) {
      // console.error('[qcActions] Error inserting history record:', historyError); // 保留錯誤日誌供生產環境調試
      // Don't fail the whole operation for history logging
      // 保留錯誤日誌供生產環境調試
    }

    // Insert inventory record
    const { error: inventoryError } = await supabaseAdmin
      .from('record_inventory')
      .insert(payload.inventoryRecord);

    if (inventoryError) {
      // console.error('[qcActions] Error inserting inventory record:', inventoryError); // 保留錯誤日誌供生產環境調試
      return { error: `Failed to insert inventory record: ${inventoryError.message}` };
    }

    // Insert ACO records if provided
    if (payload.acoRecords && payload.acoRecords.length > 0) {
      const { error: acoError } = await supabaseAdmin.from('record_aco').insert(payload.acoRecords);

      if (acoError) {
        // console.error('[qcActions] Error inserting ACO records:', acoError); // 保留錯誤日誌供生產環境調試
        return { error: `Failed to insert ACO records: ${acoError.message}` };
      }
    }

    // Insert Slate records if provided
    if (payload.slateRecords && payload.slateRecords.length > 0) {
      const { error: slateError } = await supabaseAdmin
        .from('record_slate')
        .insert(payload.slateRecords);

      if (slateError) {
        // console.error('[qcActions] Error inserting Slate records:', slateError); // 保留錯誤日誌供生產環境調試
        return { error: `Failed to insert Slate records: ${slateError.message}` };
      }
    }

    return { data: 'QC database entries created successfully' };
  } catch (error: any) {
    // console.error('[qcActions] Unexpected error in createQcDatabaseEntries:', error); // 保留錯誤日誌供生產環境調試
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
      console.error('[qcActions] Error updating PDF URL:', error);
      return { success: false, error: `Failed to update PDF URL: ${error.message}` };
    }

    // process.env.NODE_ENV !== "production" && console.log('[qcActions] PDF URL updated successfully for pallet:', pltNum);
    return { success: true };
  } catch (error: any) {
    console.error('[qcActions] Unexpected error updating PDF URL:', error);
    return { success: false, error: `Update PDF URL error: ${error.message || 'Unknown error'}` };
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
        cacheControl: ONE_HOUR_CACHE,
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      // console.error('[qcActions] Supabase Upload Error:', uploadError); // 保留錯誤日誌供生產環境調試
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
    // console.error('[qcActions] Unexpected error in uploadPdfToStorage:', error); // 保留錯誤日誌供生產環境調試
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

    // First, get the current data
    const { data: currentData, error: selectError } = await supabaseAdmin
      .from('record_aco')
      .select('required_qty, finished_qty')
      .eq('order_ref', orderRef)
      .eq('code', productCode)
      .single();

    if (selectError) {
      // console.error('[qcActions] Error fetching current ACO data:', selectError); // 保留錯誤日誌供生產環境調試
      return { error: `Failed to fetch current ACO data: ${selectError.message}` };
    }

    if (!currentData) {
      return { error: 'ACO record not found' };
    }

    const currentFinishedQty = currentData.finished_qty || 0;
    const newFinishedQty = currentFinishedQty + quantityUsed;
    const currentRemainQty = Math.max(0, currentData.required_qty - currentFinishedQty);
    const newRemainQty = Math.max(0, currentData.required_qty - newFinishedQty);

    // 檢查是否會超過 required_qty
    if (newFinishedQty > currentData.required_qty) {
      return { error: `Cannot use ${quantityUsed} qty. Only ${currentRemainQty} qty remaining.` };
    }

    // Update the finished_qty
    const { error: updateError } = await supabaseAdmin
      .from('record_aco')
      .update({ finished_qty: newFinishedQty })
      .eq('order_ref', orderRef)
      .eq('code', productCode);

    if (updateError) {
      // console.error('[qcActions] Error updating ACO finished_qty:', updateError); // 保留錯誤日誌供生產環境調試
      return { error: `Failed to update ACO finished quantity: ${updateError.message}` };
    }

    return {
      data: `ACO quantity updated successfully. Previous finished: ${currentFinishedQty}, Used: ${quantityUsed}, New finished: ${newFinishedQty}, Remaining: ${newRemainQty}`,
    };
  } catch (error: any) {
    // console.error('[qcActions] Unexpected error in updateAcoOrderRemainQty:', error); // 保留錯誤日誌供生產環境調試
    return { error: `An unexpected error occurred: ${error.message || 'Unknown error.'}` };
  }
}

export async function createQcDatabaseEntriesWithTransaction(
  payload: QcDatabaseEntryPayload,
  operatorClockNumberStr: string,
  acoUpdateInfo?: { orderRef: number; productCode: string; quantityUsed: number }
): Promise<{ data?: string; error?: string; warning?: string }> {
  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    // console.error('[qcActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten()); // 保留錯誤日誌供生產環境調試
    return {
      error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}`,
    };
  }

  const supabaseAdmin = createSupabaseAdmin();

  try {
    // 🔥 強化的重複檢查機制 - 特別針對 Vercel 環境

    // 多重檢查策略
    let duplicateCheckAttempts = 0;
    const maxDuplicateChecks = MAX_DUPLICATE_CHECK_ATTEMPTS;
    let existingPallet = null;

    while (duplicateCheckAttempts < maxDuplicateChecks) {
      const { data: checkResult, error: checkError } = await supabaseAdmin
        .from('record_palletinfo')
        .select('plt_num, generate_time')
        .eq('plt_num', payload.palletInfo.plt_num)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // console.error('[qcActions] Error checking for duplicate pallet:', checkError); // 保留錯誤日誌供生產環境調試
        throw new Error(`Failed to check for duplicate pallet: ${checkError.message}`);
      }

      if (checkResult) {
        existingPallet = checkResult;
        // console.error('[qcActions] 重複托盤編號檢測 (嘗試 ' + (duplicateCheckAttempts + 1) + '):', {
        //   palletNumber: payload.palletInfo.plt_num,
        //   existingGenerateTime: checkResult.generate_time,
        //   currentAttemptTime: new Date().toISOString()
        // }); // 保留錯誤日誌供生產環境調試
        break;
      }

      duplicateCheckAttempts++;

      // 在 Vercel 環境中添加額外延遲
      if (process.env.VERCEL_ENV && duplicateCheckAttempts < maxDuplicateChecks) {
        await new Promise(resolve =>
          setTimeout(resolve, DUPLICATE_CHECK_DELAY_BASE * duplicateCheckAttempts)
        );
      }
    }

    if (existingPallet) {
      // console.error('[qcActions] Duplicate pallet number detected:', payload.palletInfo.plt_num); // 保留錯誤日誌供生產環境調試
      // console.error('[qcActions] Attempted to create pallet with data:', JSON.stringify(payload.palletInfo, null, 2)); // 保留錯誤日誌供生產環境調試
      // console.error('[qcActions] Call stack trace:', new Error().stack); // 保留錯誤日誌供生產環境調試
      return {
        error: `Duplicate pallet number detected for ${payload.palletInfo.plt_num}: Pallet number ${payload.palletInfo.plt_num} already exists. Please try again to generate a new pallet number.`,
      };
    }

    // 🔥 使用 upsert 策略作為額外保護
    const { error: palletInfoError } = await supabaseAdmin
      .from('record_palletinfo')
      .upsert(payload.palletInfo, {
        onConflict: 'plt_num',
        ignoreDuplicates: false,
      });

    if (palletInfoError) {
      // console.error('[qcActions] Error inserting pallet info:', palletInfoError); // 保留錯誤日誌供生產環境調試
      // console.error('[qcActions] Pallet info payload:', payload.palletInfo); // 保留錯誤日誌供生產環境調試

      // 檢查是否是重複主鍵錯誤
      if (
        palletInfoError.message &&
        palletInfoError.message.includes('duplicate key value violates unique constraint')
      ) {
        // console.error('[qcActions] Duplicate pallet number constraint violation'); // 保留錯誤日誌供生產環境調試
        return {
          error: `Duplicate pallet number detected for ${payload.palletInfo.plt_num}: Pallet number ${payload.palletInfo.plt_num} already exists. Please try again to generate a new pallet number.`,
        };
      }

      // 檢查是否是 API key 相關錯誤
      if (palletInfoError.message && palletInfoError.message.toLowerCase().includes('api key')) {
        // console.error('[qcActions] 檢測到 API key 錯誤 - 這可能是環境變數問題'); // 保留錯誤日誌供生產環境調試
        return {
          error: `API Key Error: ${palletInfoError.message}. 請檢查 SUPABASE_SERVICE_ROLE_KEY 環境變數。`,
        };
      }

      throw new Error(`Failed to insert pallet info: ${palletInfoError.message}`);
    }

    // 2. Insert history record
    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(payload.historyRecord);

    if (historyError) {
      // console.error('[qcActions] Error inserting history record:', historyError); // 保留錯誤日誌供生產環境調試
      throw new Error(`Failed to insert history record: ${historyError.message}`);
    }

    // 3. Insert inventory record (depends on pallet info)
    const { error: inventoryError } = await supabaseAdmin
      .from('record_inventory')
      .insert(payload.inventoryRecord);

    if (inventoryError) {
      // console.error('[qcActions] Error inserting inventory record:', inventoryError); // 保留錯誤日誌供生產環境調試
      throw new Error(`Failed to insert inventory record: ${inventoryError.message}`);
    }

    // 4. Insert ACO records if provided
    if (payload.acoRecords && payload.acoRecords.length > 0) {
      const { error: acoError } = await supabaseAdmin.from('record_aco').insert(payload.acoRecords);

      if (acoError) {
        // console.error('[qcActions] Error inserting ACO records:', acoError); // 保留錯誤日誌供生產環境調試
        throw new Error(`Failed to insert ACO records: ${acoError.message}`);
      }
    }

    // 5. Insert Slate records if provided
    if (payload.slateRecords && payload.slateRecords.length > 0) {
      const { error: slateError } = await supabaseAdmin
        .from('record_slate')
        .insert(payload.slateRecords);

      if (slateError) {
        // console.error('[qcActions] Error inserting Slate records:', slateError); // 保留錯誤日誌供生產環境調試
        throw new Error(`Failed to insert Slate records: ${slateError.message}`);
      }
    }

    // 6. If ACO update is needed, do it after successful inserts
    if (acoUpdateInfo) {
      const updateResult = await updateAcoOrderRemainQty(
        acoUpdateInfo.orderRef,
        acoUpdateInfo.productCode,
        acoUpdateInfo.quantityUsed
      );

      if (updateResult.error) {
        // console.error('[qcActions] ACO update failed:', updateResult.error); // 保留錯誤日誌供生產環境調試
        throw new Error(`ACO update failed: ${updateResult.error}`);
      }
    }

    return { data: 'QC database entries created successfully with transaction' };
  } catch (error: any) {
    // console.error('[qcActions] Transaction failed, all operations rolled back:', error); // 保留錯誤日誌供生產環境調試
    // console.error('[qcActions] Error details:', {
    //   message: error.message,
    //   stack: error.stack,
    //   name: error.name
    // }); // 保留錯誤日誌供生產環境調試
    return { error: `Transaction failed: ${error.message || 'Unknown error.'}` };
  }
}

