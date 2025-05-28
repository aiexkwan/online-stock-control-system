'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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

  const clockValidation = clockNumberSchema.safeParse(operatorClockNumberStr);
  if (!clockValidation.success) {
    console.error('[qcActions] Invalid Operator Clock Number format:', operatorClockNumberStr, clockValidation.error.flatten());
    return { error: `Invalid Operator Clock Number: ${clockValidation.error.errors[0]?.message || 'Format error.'}` };
  }

  try {
    // Execute inserts in correct order to satisfy foreign key constraints
    
    // 1. Insert pallet info record first (required by foreign key constraints)
    const { error: palletInfoError } = await supabaseAdmin
      .from('record_palletinfo')
      .insert(payload.palletInfo);

    if (palletInfoError) {
      console.error('[qcActions] Error inserting pallet info:', palletInfoError);
      throw new Error(`Failed to insert pallet info: ${palletInfoError.message}`);
    }

    // 2. Insert history record
    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert(payload.historyRecord);

    if (historyError) {
      console.error('[qcActions] Error inserting history record:', historyError);
      throw new Error(`Failed to insert history record: ${historyError.message}`);
    }

    // 3. Insert inventory record (depends on pallet info)
    const { error: inventoryError } = await supabaseAdmin
      .from('record_inventory')
      .insert(payload.inventoryRecord);

    if (inventoryError) {
      console.error('[qcActions] Error inserting inventory record:', inventoryError);
      throw new Error(`Failed to insert inventory record: ${inventoryError.message}`);
    }

    // 4. Insert ACO records if provided
    if (payload.acoRecords && payload.acoRecords.length > 0) {
      const { error: acoError } = await supabaseAdmin
        .from('record_aco')
        .insert(payload.acoRecords);

      if (acoError) {
        console.error('[qcActions] Error inserting ACO records:', acoError);
        throw new Error(`Failed to insert ACO records: ${acoError.message}`);
      }
    }

    // 5. Insert Slate records if provided
    if (payload.slateRecords && payload.slateRecords.length > 0) {
      const { error: slateError } = await supabaseAdmin
        .from('record_slate')
        .insert(payload.slateRecords);

      if (slateError) {
        console.error('[qcActions] Error inserting Slate records:', slateError);
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
        console.error('[qcActions] ACO update failed:', updateResult.error);
        throw new Error(`ACO update failed: ${updateResult.error}`);
      }
    }

    return { data: 'QC database entries created successfully with transaction' };

  } catch (error: any) {
    console.error('[qcActions] Transaction failed, all operations rolled back:', error);
    return { error: `Transaction failed: ${error.message || 'Unknown error.'}` };
  }
} 