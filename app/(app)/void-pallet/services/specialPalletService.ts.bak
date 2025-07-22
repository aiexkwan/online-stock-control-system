'use server';

import { createClient } from '@/app/utils/supabase/server';
import { isNotProduction } from '@/lib/utils/env';
import { getErrorMessage } from '@/types/core/error';

/**
 * Check if pallet is an ACO Order Pallet
 */
export function isACOOrderPallet(plt_remark: string | null): {
  isACO: boolean;
  refNumber?: string;
} {
  if (!plt_remark) {
    isNotProduction() && isNotProduction() && console.log('[ACO Check] No plt_remark found');
    return { isACO: false };
  }

  isNotProduction() &&
    isNotProduction() &&
    console.log(`[ACO Check] Checking plt_remark: "${plt_remark}"`);

  // Look for ACO reference pattern in remarks - support multiple formats
  const acoPatterns = [
    /ACO\s+Ref\s*:\s*(\d+)/i, // "ACO Ref: 123456"
    /ACO\s+Reference\s*:\s*(\d+)/i, // "ACO Reference: 123456"
    /ACO\s*:\s*(\d+)/i, // "ACO: 123456"
    /ACO\s+(\d+)/i, // "ACO 123456"
    /Ref\s*:\s*(\d+)/i, // "Ref: 123456"
  ];

  for (const pattern of acoPatterns) {
    const match = plt_remark.match(pattern);
    if (match) {
      isNotProduction() &&
        isNotProduction() &&
        console.log(`[ACO Check] Found ACO reference: ${match[1]} using pattern: ${pattern}`);
      return { isACO: true, refNumber: match[1] };
    }
  }

  isNotProduction() && isNotProduction() && console.log('[ACO Check] No ACO reference found');
  return { isACO: false };
}

/**
 * Update ACO record when voiding ACO Order Pallet
 */
export async function updateACORecord(
  refNumber: string,
  productCode: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    isNotProduction() &&
      isNotProduction() &&
      console.log(
        `[ACO Update] Starting update: ref=${refNumber}, code=${productCode}, qty=${quantity}`
      );

    // Find the ACO record by order_ref and code
    const { data: acoRecord, error: findError } = await supabase
      .from('record_aco')
      .select('uuid, required_qty, finished_qty, code')
      .eq('order_ref', parseInt(refNumber))
      .ilike('code', productCode) // Case-insensitive matching
      .single();

    if (findError) {
      if ((findError as { code?: string }).code === 'PGRST116') {
        isNotProduction() &&
          isNotProduction() &&
          console.log(`[ACO Update] No record found for ref=${refNumber}, code=${productCode}`);
        return {
          success: false,
          error: `ACO record not found for ref: ${refNumber}, code: ${productCode}`,
        };
      }
      throw findError;
    }

    if (!acoRecord) {
      return {
        success: false,
        error: `ACO record not found for ref: ${refNumber}, code: ${productCode}`,
      };
    }

    // Update finished_qty by subtracting the voided quantity
    const currentFinishedQty = acoRecord.finished_qty || 0;
    const newFinishedQty = Math.max(0, currentFinishedQty - quantity);
    const newRemainQty = acoRecord.required_qty - newFinishedQty;

    const { error: updateError } = await supabase
      .from('record_aco')
      .update({ finished_qty: newFinishedQty })
      .eq('uuid', acoRecord.uuid);

    if (updateError) {
      console.error(`[ACO Update] Update failed:`, updateError);
      throw updateError;
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log(
        `[ACO Update] Successfully updated: new_finished_qty=${newFinishedQty}, new_remain_qty=${newRemainQty}`
      );
    return { success: true };
  } catch (error: unknown) {
    console.error('[ACO Update] Error:', error);
    return {
      success: false,
      error: `Failed to update ACO record: ${getErrorMessage(error)}`,
    };
  }
}

/**
 * Check if pallet is a Material GRN pallet
 */
export function isMaterialGRNPallet(plt_remark: string | null): {
  isGRN: boolean;
  grnNumber?: string;
} {
  if (!plt_remark) {
    isNotProduction() && isNotProduction() && console.log('[GRN Check] No plt_remark found');
    return { isGRN: false };
  }

  isNotProduction() &&
    isNotProduction() &&
    console.log(`[GRN Check] Checking plt_remark: "${plt_remark}"`);

  // Look for Material GRN pattern in remarks
  const grnPattern = /Material\s+GRN\s*-\s*(\w+)/i;
  const match = plt_remark.match(grnPattern);

  if (match) {
    isNotProduction() &&
      isNotProduction() &&
      console.log(`[GRN Check] Found GRN reference: ${match[1]}`);
    return { isGRN: true, grnNumber: match[1] };
  }

  isNotProduction() && isNotProduction() && console.log('[GRN Check] No GRN reference found');
  return { isGRN: false };
}

/**
 * Delete GRN record when voiding Material GRN pallet
 */
export async function deleteGRNRecord(
  pltNum: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    isNotProduction() &&
      isNotProduction() &&
      console.log(`[GRN Delete] Starting deletion for plt_num: ${pltNum}`);

    // Find and delete the GRN record by plt_num
    const { data: deletedRecord, error: deleteError } = await supabase
      .from('record_grn')
      .delete()
      .eq('plt_num', pltNum)
      .select(); // Return deleted records for logging

    if (deleteError) {
      console.error(`[GRN Delete] Delete failed:`, deleteError);
      throw deleteError;
    }

    if (!deletedRecord || deletedRecord.length === 0) {
      isNotProduction() &&
        isNotProduction() &&
        console.log(`[GRN Delete] No GRN record found for plt_num: ${pltNum}`);
      return {
        success: false,
        error: `No GRN record found for pallet: ${pltNum}`,
      };
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log(`[GRN Delete] Successfully deleted ${deletedRecord.length} GRN record(s)`);
    return { success: true };
  } catch (error: unknown) {
    console.error('[GRN Delete] Error:', error);
    return {
      success: false,
      error: `Failed to delete GRN record: ${getErrorMessage(error)}`,
    };
  }
}
