'use server';

import { createClient } from '@supabase/supabase-js'; // Ensure this is here for supabaseAdmin
// import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; // No longer needed
// import { cookies } from 'next/headers'; // No longer needed
// import type { Database } from '@/lib/database.types'; // Keep if type definitions are used for payload
import { z } from 'zod';

// Initialize Supabase Admin Client if not imported from a shared lib
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema for validating the clock number string and converting to number
const clockNumberSchema = z.string().regex(/^\d+$/, { message: "Operator Clock Number must be a positive number string." }).transform(val => parseInt(val, 10));

// 確保 GrnDatabaseEntryPayload 與實際傳入的數據以及數據庫 schema 匹配
interface GrnPalletInfoPayload {
  plt_num: string;
  series: string;
  product_code: string;
  product_qty: number; // 假設這是 number，後續會 Math.round
  plt_remark: string;
  // 確保沒有多餘或缺失的字段，與 record_palletinfo 表的 Insert 類型匹配
}

interface GrnRecordPayload {
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

interface GrnDatabaseEntryPayload {
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
  const dataIdForHistoryRecord = clockValidation.data;

  // REMOVED: Supabase auth related logic (getUser, querying data_id by auth_user_uuid)
  // console.log('[grnActions] All available cookie names in GRN Action:'); // No longer relevant
  // const { data: { user }, error: authError } = await supabase.auth.getUser(); // Removed
  // ... and subsequent logic for currentAuthUserUuid and fetching dataId from data_id based on it ...

  try {
    // 1. Insert into record_palletinfo
    const palletInfoToInsert = {
      ...payload.palletInfo,
      product_qty: Math.round(payload.palletInfo.product_qty),
    };
    const { error: palletInfoError } = await supabaseAdmin // Use admin client
      .from('record_palletinfo')
      .insert(palletInfoToInsert);

    if (palletInfoError) {
      console.error('[grnActions] Error inserting into record_palletinfo:', palletInfoError);
      return { error: `Failed to insert pallet info: ${palletInfoError.message}` };
    }

    // 2. Insert into record_grn
    const grnRefAsNumber = parseInt(payload.grnRecord.grn_ref, 10);
    if (isNaN(grnRefAsNumber)) {
      console.error('[grnActions] Invalid grn_ref value, cannot parse to number:', payload.grnRecord.grn_ref);
      return { error: `Invalid GRN Reference format: ${payload.grnRecord.grn_ref}. Must be a valid number.` };
    }
    const grnRecordToInsert = {
        ...payload.grnRecord,
        grn_ref: grnRefAsNumber,
    };
    const { error: grnError } = await supabaseAdmin // Use admin client
      .from('record_grn')
      .insert(grnRecordToInsert);

    if (grnError) {
      console.error('[grnActions] Error inserting into record_grn:', grnError);
      return { error: `Failed to insert GRN record: ${grnError.message}. Pallet info might have been created.` };
    }

    // 3. Insert into record_inventory (Consider upsert or more complex logic if needed)
    // This simplified version assumes a direct insert or that 'await' is a direct numeric field.
    // The original logic for record_inventory was simple. If it needs to be an update, this must change.
    const inventoryDataToInsert = {
      product_code: payload.grnRecord.material_code,
      // Ensure 'pallet_num' is a valid field and correctly mapped. It was plt_num in payload.
      // The original code had 'pallet_num', assuming it's a typo for 'plt_num' or a different mapping.
      // For now, using payload.grnRecord.plt_num which is available.
      plt_num: payload.grnRecord.plt_num, // Changed from pallet_num to plt_num based on payload
      await: payload.grnRecord.net_weight, 
    };
    const { error: inventoryInsertError } = await supabaseAdmin // Use admin client
      .from('record_inventory')
      .insert(inventoryDataToInsert);

    if (inventoryInsertError) {
      console.error('[grnActions] Error inserting into record_inventory:', inventoryInsertError);
      return { error: `Failed to insert inventory record: ${inventoryInsertError.message}. GRN and Pallet Info might have been created.` };
    }

    // 4. Insert into record_history
    const historyData = {
        action: 'GRN Pallet Received',
        id: dataIdForHistoryRecord, // Use the validated and parsed clock number
        plt_num: payload.palletInfo.plt_num,
        loc: 'GRN Area', 
        remark: `GRN: ${payload.grnRecord.grn_ref}, Material: ${payload.grnRecord.material_code}`,
    };
    const { error: historyError } = await supabaseAdmin // Use admin client
      .from('record_history')
      .insert(historyData);

    if (historyError) {
      console.error('[grnActions] Error inserting into record_history:', historyError);
      // Even if history fails, the main operations succeeded.
      return { data: 'Successfully created GRN database entries but history failed.', warning: `History record failed: ${historyError.message}` };
    }

    return { data: 'Successfully created GRN database entries.' };

  } catch (error: any) {
    console.error('[grnActions] Unexpected error in createGrnDatabaseEntries:', error);
    return { error: `An unexpected error occurred: ${error.message || 'Unknown error.'}` };
  }
} 