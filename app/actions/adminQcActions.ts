'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
// import { _createClient } from '@/app/utils/supabase/server';
import { getErrorMessage } from '@/lib/types/error-handling';

import {
  // _CACHE_CONTROL_TIMEOUT,
  MAX_DUPLICATE_CHECK_ATTEMPTS,
  DUPLICATE_CHECK_DELAY_BASE,
  // ONE_HOUR_CACHE
} from '@/app/(app)/admin/components/qc-label-constants';

// Schema for validating the clock number string and converting to number
const clockNumberSchema = z
  .string()
  .regex(/^\d+$/, { message: 'Clock Number must be a positive number string.' })
  .transform(val => parseInt(val, 10));

// 創建 Supabase 客戶端的函數 - 專門為 admin 頁面優化
function createSupabaseAdmin() {
  // Server actions should use server-side env vars
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }

  const client = createSupabaseClient(supabaseUrl, serviceRoleKey, {
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

// QC specific database payload interfaces (copied from qcActions.ts)
export interface QcPalletInfoPayload {
  plt_num: string;
  series: string;
  product_code: string;
  product_qty: number;
  plt_remark: string;
  pdf_url?: string;
}

export interface QcHistoryPayload {
  _time: string;
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

// Slate record interface removed - no longer writing to record_slate table

export interface QcDatabaseEntryPayload {
  palletInfo: QcPalletInfoPayload;
  historyRecord: QcHistoryPayload;
  inventoryRecord: QcInventoryPayload;
  acoOrderRef?: number;
  // slateRecords removed - no longer writing to record_slate table
}

// Admin-specific versions of PDF functions
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
      console.error('[adminQcActions] Error updating PDF URL:', error);
      return { success: false, error: `Failed to update PDF URL: ${getErrorMessage(error)}` };
    }
    return { success: true };
  } catch (error: unknown) {
    console.error('[adminQcActions] Unexpected error updating PDF URL:', error);
    return {
      success: false,
      error: `Update PDF URL error: ${getErrorMessage(error) || 'Unknown error'}`,
    };
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
    // 修復 RLS 政策問題：檔案必須上傳到 private/ 資料夾
    const fullPath = `private/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('pallet-label-pdf')
      .upload(fullPath, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });
    if (uploadError) {
      return { error: `Upload failed: ${getErrorMessage(uploadError)}` };
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
  } catch (error: unknown) {
    return { error: `Upload error: ${getErrorMessage(error) || 'Unknown error'}` };
  }
}

export async function createQcDatabaseEntriesWithTransaction(
  payload: QcDatabaseEntryPayload,
  operatorClockNumberStr: string,
  acoUpdateInfo?: { orderRef: number; productCode: string; quantityUsed: number }
): Promise<{ data?: string; error?: string; warning?: string }> {
  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
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
      if (
        checkError &&
        typeof checkError === 'object' &&
        'code' in checkError &&
        checkError.code !== 'PGRST116'
      ) {
        throw new Error(`Failed to check for duplicate pallet: ${getErrorMessage(checkError)}`);
      }
      if (checkResult) {
        existingPallet = checkResult;
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
      // 檢查是否是重複主鍵錯誤
      if (
        getErrorMessage(palletInfoError) &&
        getErrorMessage(palletInfoError).includes('duplicate key value violates unique constraint')
      ) {
        return {
          error: `Duplicate pallet number detected for ${payload.palletInfo.plt_num}: Pallet number ${payload.palletInfo.plt_num} already exists. Please try again to generate a new pallet number.`,
        };
      }
      // 檢查是否是 API key 相關錯誤
      if (
        getErrorMessage(palletInfoError) &&
        getErrorMessage(palletInfoError).toLowerCase().includes('api key')
      ) {
        return {
          error: `API Key Error: ${getErrorMessage(palletInfoError)}. 請檢查 SUPABASE_SERVICE_ROLE_KEY 環境變數。`,
        };
      }
      throw new Error(`Failed to insert pallet info: ${getErrorMessage(palletInfoError)}`);
    }
    // 🔥 插入歷史記錄 - 使用 insert() 而非 upsert()
    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(payload.historyRecord);
    if (historyError) {
      throw new Error(`Failed to insert history record: ${getErrorMessage(historyError)}`);
    }
    // Insert inventory record (no upsert needed for new pallets)
    const { error: inventoryError } = await supabaseAdmin
      .from('record_inventory')
      .insert(payload.inventoryRecord);
    if (inventoryError) {
      throw new Error(`Failed to insert inventory record: ${getErrorMessage(inventoryError)}`);
    }
    // Slate records removed - no longer writing to record_slate table
    // 🔥 處理 ACO 訂單更新
    let acoUpdateMessage = '';
    if (acoUpdateInfo) {
      const { orderRef, productCode, quantityUsed } = acoUpdateInfo;
      // 使用直接的 Supabase 查詢和更新來處理 ACO
      const { data: acoRecord, error: acoFetchError } = await supabaseAdmin
        .from('record_aco')
        .select('finished_qty, required_qty')
        .eq('order_ref', orderRef)
        .eq('code', productCode)
        .single();
      if (acoFetchError) {
        console.error('[adminQcActions] Error fetching ACO record:', acoFetchError);
        return {
          data: 'Database entries created successfully.',
          warning: `ACO update failed: ${getErrorMessage(acoFetchError)}`,
        };
      }
      if (!acoRecord) {
        return {
          data: 'Database entries created successfully.',
          warning: `ACO order not found: Order ${orderRef} with product ${productCode}`,
        };
      }
      const currentFinishedQty = acoRecord.finished_qty || 0;
      const requiredQty = acoRecord.required_qty || 0;
      const newFinishedQty = currentFinishedQty + quantityUsed;
      // const newRemainQty = Math.max(0, requiredQty - newFinishedQty); // For future use
      const { error: updateError } = await supabaseAdmin
        .from('record_aco')
        .update({ finished_qty: newFinishedQty })
        .eq('order_ref', orderRef)
        .eq('code', productCode);
      if (updateError) {
        console.error('[adminQcActions] Error updating ACO finished_qty:', updateError);
        return {
          data: 'Database entries created successfully.',
          warning: `ACO update failed: ${getErrorMessage(updateError)}`,
        };
      }
      acoUpdateMessage = ` ACO updated: Finished ${newFinishedQty}/${requiredQty}.`;
    }
    return {
      data: `Pallet ${payload.palletInfo.plt_num} created successfully.${acoUpdateMessage}`,
    };
  } catch (error: unknown) {
    console.error('[adminQcActions] Unexpected error:', error);
    return { error: `An unexpected error occurred: ${getErrorMessage(error) || 'Unknown error.'}` };
  }
}
