'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { generateMultipleUniqueSeries } from '@/lib/seriesUtils';
import {
  CACHE_CONTROL_TIMEOUT,
  MAX_DUPLICATE_CHECK_ATTEMPTS,
  DUPLICATE_CHECK_DELAY_BASE,
  MAX_ATTEMPTS_PRODUCTION,
  MAX_PALLET_GENERATION_RETRIES_DEV,
  RETRY_DELAY_BASE_VERCEL,
  RETRY_DELAY_BASE_DEV,
  INITIAL_RETRY_DELAY_VERCEL,
  MAX_SERIES_GENERATION_RETRIES,
  SERIES_RETRY_DELAY_BASE,
  MAX_ATTEMPTS_GENERAL,
  RPC_RETRY_DELAY_BASE,
  DATE_PAD_LENGTH,
  YEAR_SLICE_LENGTH,
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

/**
 * @deprecated Use generatePalletNumbers from '@/app/utils/palletGeneration' instead
 * This uses the old V3 RPC function. V6 is now the standard.
 *
 * Generate pallet numbers using individual atomic RPC calls
 * No caching - each call generates one pallet number atomically
 *
 * This function is kept for backward compatibility only.
 * All new code should use the unified pallet generation utility.
 */
export async function generatePalletNumbersDirectQuery(count: number): Promise<{
  palletNumbers: string[];
  series: string[];
  error?: string;
}> {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const palletNumbers: string[] = [];

    // 使用單次 RPC 調用生成所有托盤編號，避免循環中的併發問題

    let attempts = 0;
    const maxAttempts = process.env.VERCEL_ENV
      ? MAX_ATTEMPTS_PRODUCTION
      : MAX_PALLET_GENERATION_RETRIES_DEV;

    while (attempts < maxAttempts) {
      try {
        // 在 Vercel 環境中添加預延遲
        if (process.env.VERCEL_ENV && attempts > 0) {
          const delay = INITIAL_RETRY_DELAY_VERCEL * attempts; // 遞增延遲
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 檢查當前序列號狀態（調試用）
        const today = new Date();
        const day = today.getDate().toString().padStart(DATE_PAD_LENGTH, '0');
        const month = (today.getMonth() + 1).toString().padStart(DATE_PAD_LENGTH, '0');
        const year = today.getFullYear().toString().slice(YEAR_SLICE_LENGTH);
        const dateStr = `${day}${month}${year}`;

        const { data: currentSequence, error: seqError } = await supabaseAdmin
          .from('daily_pallet_sequence')
          .select('current_max')
          .eq('date_str', dateStr)
          .single();

        // 使用 V6 函數生成托盤編號和系列號
        const { data: v6Data, error: rpcError } = await supabaseAdmin.rpc(
          'generate_atomic_pallet_numbers_v6',
          {
            p_count: count,
            p_session_id: `qc-${Date.now()}`,
          }
        );

        if (rpcError) {
          throw new Error(`V6 RPC generation failed: ${rpcError.message}`);
        }

        if (!v6Data || !Array.isArray(v6Data) || v6Data.length !== count) {
          throw new Error(
            `Invalid result from V6 function: expected ${count} pallet numbers, got ${v6Data?.length || 0}`
          );
        }

        // Transform V6 format to arrays
        const rpcResult = v6Data.map((item: any) => item.pallet_number);
        const generatedSeries = v6Data.map((item: any) => item.series);

        // 🔥 強化唯一性驗證 - 檢查生成的托盤編號是否已存在
        const uniquenessChecks = [];

        for (const palletNum of rpcResult) {
          const { data: existing, error: checkError } = await supabaseAdmin
            .from('record_palletinfo')
            .select('plt_num')
            .eq('plt_num', palletNum)
            .single();

          uniquenessChecks.push({
            palletNumber: palletNum,
            exists: !!existing,
            checkError: checkError?.code !== 'PGRST116' ? checkError : null,
          });
        }

        const duplicates = uniquenessChecks.filter(check => check.exists);
        if (duplicates.length > 0) {
          // console.error(`[qcActions] 檢測到重複托盤編號:`, duplicates); // 保留錯誤日誌供生產環境調試
          throw new Error(
            `Generated pallet numbers contain duplicates: ${duplicates.map(d => d.palletNumber).join(', ')}`
          );
        }

        palletNumbers.push(...rpcResult);
        break;
      } catch (error: any) {
        // console.error(`[qcActions] 生成托盤編號失敗 (嘗試 ${attempts + 1}/${maxAttempts}):`, error); // 保留錯誤日誌供生產環境調試

        if (attempts === maxAttempts - 1) {
          throw new Error(
            `Failed to generate pallet numbers after ${maxAttempts} attempts: ${error.message}`
          );
        }

        attempts++;
        const baseDelay = process.env.VERCEL_ENV ? RETRY_DELAY_BASE_VERCEL : RETRY_DELAY_BASE_DEV;
        await new Promise(resolve => setTimeout(resolve, baseDelay * attempts));
      }
    }

    if (palletNumbers.length !== count) {
      throw new Error(
        `Failed to generate required number of pallet numbers: expected ${count}, got ${palletNumbers.length}`
      );
    }

    // V6 已經包含 series，不需要額外生成
    // 直接使用 V6 返回的 series
    const series = generatedSeries;

    // V3 to V6 Migration: 保留原始 series 生成代碼作為備份
    // let series: string[] = [];
    // let seriesAttempts = 0;
    // const seriesMaxAttempts = MAX_SERIES_GENERATION_RETRIES;
    // while (seriesAttempts < seriesMaxAttempts) {
    //   try {
    //     series = await generateMultipleUniqueSeries(count, supabaseAdmin);
    //     break;
    //   } catch (seriesError: any) {
    //     if (seriesAttempts === seriesMaxAttempts - 1) {
    //       throw seriesError;
    //     }
    //     seriesAttempts++;
    //     await new Promise(resolve => setTimeout(resolve, SERIES_RETRY_DELAY_BASE * seriesAttempts));
    //   }
    // }

    return {
      palletNumbers,
      series,
    };
  } catch (error: any) {
    // console.error('[qcActions] 個別原子性 RPC 調用生成棧板號碼失敗:', error); // 保留錯誤日誌供生產環境調試
    return {
      palletNumbers: [],
      series: [],
      error: error.message,
    };
  }
}

/**
 * @deprecated Use generatePalletNumbers from '@/app/utils/palletGeneration' instead
 * This function is kept for backward compatibility only.
 *
 * Generate pallet numbers and series on server side
 */
export async function generatePalletNumbersAndSeries(count: number): Promise<{
  palletNumbers: string[];
  series: string[];
  error?: string;
}> {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    // 🔥 使用 V6 函數生成棧板號碼和系列號，帶重試機制
    let palletNumbers: string[] = [];
    let generatedSeries: string[] = [];
    let attempts = 0;
    const maxAttempts = MAX_ATTEMPTS_GENERAL;

    while (attempts < maxAttempts) {
      try {
        // 直接使用 V6 函數
        const { data: v6Data, error: v6Error } = await supabaseAdmin.rpc(
          'generate_atomic_pallet_numbers_v6',
          {
            p_count: count,
            p_session_id: `qc-${Date.now()}`,
          }
        );

        if (v6Error) {
          throw new Error(`V6 RPC error: ${v6Error.message}`);
        }

        if (!v6Data || !Array.isArray(v6Data)) {
          throw new Error('Invalid data returned from V6 function');
        }

        // Transform V6 format to arrays
        palletNumbers = v6Data.map((item: any) => item.pallet_number);
        generatedSeries = v6Data.map((item: any) => item.series);
        break;
      } catch (rpcError: any) {
        // console.error(`[qcActions] V6 調用錯誤 (嘗試 ${attempts + 1}/${maxAttempts}):`, rpcError); // 保留錯誤日誌供生產環境調試

        if (attempts === maxAttempts - 1) {
          throw rpcError;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, RPC_RETRY_DELAY_BASE * attempts)); // 遞增延遲
      }
    }

    // V6 已經包含 series，不需要額外生成
    const series = generatedSeries;

    return {
      palletNumbers,
      series,
    };
  } catch (error: any) {
    // console.error('[qcActions] 生成棧板號碼和系列號失敗:', error); // 保留錯誤日誌供生產環境調試
    return {
      palletNumbers: [],
      series: [],
      error: error.message,
    };
  }
}
