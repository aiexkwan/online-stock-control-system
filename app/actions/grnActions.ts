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

      p_operator_id: operatorIdForFunction
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