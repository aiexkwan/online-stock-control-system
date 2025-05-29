'use server';

import { createClient } from '@/app/utils/supabase/server';
import { clockNumberToEmail, emailToClockNumber } from '@/app/utils/authUtils';
import { 
  SearchParams, 
  SearchResult, 
  VoidParams, 
  VoidResult, 
  PalletInfo,
  HistoryRecord 
} from './types';

// 恢復模塊級別的客戶端實例，因為這個文件使用的是服務端客戶端，不會有混合客戶端問題
const supabase = createClient();

/**
 * Get user ID from data_id table by email
 */
async function getUserIdFromEmail(email: string): Promise<number | null> {
  try {
    console.log(`[getUserIdFromEmail] Looking up user ID for email: ${email}`);
    
    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, email')
      .eq('email', email)
      .single();

    console.log(`[getUserIdFromEmail] Query result:`, { data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        // No user found with this email
        console.log(`[getUserIdFromEmail] No user found for email: ${email}`);
        return null;
      }
      throw error;
    }

    const userId = data?.id;
    console.log(`[getUserIdFromEmail] Found user ID: ${userId} for email: ${email}`);
    
    return userId || null;
  } catch (error: any) {
    console.error('Error getting user ID from email:', error);
    return null;
  }
}

/**
 * Check if pallet is an ACO Order Pallet by checking plt_remark
 */
function isACOOrderPallet(plt_remark: string | null): { isACO: boolean; refNumber?: string } {
  if (!plt_remark) {
    console.log('[ACO Check] No plt_remark found');
    return { isACO: false };
  }
  
  console.log(`[ACO Check] Checking plt_remark: "${plt_remark}"`);
  
  // Look for ACO reference pattern in remarks - support multiple formats with flexible spacing
  const acoPatterns = [
    /ACO\s+Ref\s*:\s*(\d+)/i,           // "ACO Ref: 123456" or "ACO Ref : 123456"
    /ACO\s+Reference\s*:\s*(\d+)/i,     // "ACO Reference: 123456" or "ACO Reference : 123456"
    /ACO\s*:\s*(\d+)/i,                 // "ACO: 123456" or "ACO : 123456"
    /ACO\s+(\d+)/i,                     // "ACO 123456"
    /Ref\s*:\s*(\d+)/i,                 // "Ref: 123456" or "Ref : 123456"
  ];
  
  for (const pattern of acoPatterns) {
    const match = plt_remark.match(pattern);
    if (match) {
      console.log(`[ACO Check] Found ACO reference: ${match[1]} using pattern: ${pattern}`);
      return { isACO: true, refNumber: match[1] };
    }
  }
  
  console.log('[ACO Check] No ACO reference found');
  return { isACO: false };
}

/**
 * Update ACO record when voiding ACO Order Pallet
 */
async function updateACORecord(
  refNumber: string,
  productCode: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[ACO Update] Starting update: ref=${refNumber}, code=${productCode}, qty=${quantity}`);
    
    // Find the ACO record by order_ref and code (case-insensitive for product code)
    const { data: acoRecord, error: findError } = await supabase
      .from('record_aco')
      .select('uuid, remain_qty, code')
      .eq('order_ref', refNumber)
      .ilike('code', productCode) // Use ilike for case-insensitive matching
      .single();

    console.log(`[ACO Update] Query result:`, { acoRecord, findError });

    if (findError) {
      if (findError.code === 'PGRST116') {
        console.log(`[ACO Update] No record found for ref=${refNumber}, code=${productCode}`);
        
        // Try to find any records with this order_ref to see what's available
        const { data: allRecords } = await supabase
          .from('record_aco')
          .select('uuid, code, remain_qty')
          .eq('order_ref', refNumber);
        
        console.log(`[ACO Update] Available records for ref=${refNumber}:`, allRecords);
        
        return { 
          success: false, 
          error: `ACO record not found for ref: ${refNumber}, code: ${productCode}` 
        };
      }
      throw findError;
    }

    if (!acoRecord) {
      console.log(`[ACO Update] No ACO record returned`);
      return { 
        success: false, 
        error: `ACO record not found for ref: ${refNumber}, code: ${productCode}` 
      };
    }

    console.log(`[ACO Update] Found record: uuid=${acoRecord.uuid}, current_remain_qty=${acoRecord.remain_qty}`);

    // Update remain_qty by adding back the voided quantity
    const newRemainQty = acoRecord.remain_qty + quantity;
    
    console.log(`[ACO Update] Updating remain_qty: ${acoRecord.remain_qty} + ${quantity} = ${newRemainQty}`);
    
    const { error: updateError } = await supabase
      .from('record_aco')
      .update({ remain_qty: newRemainQty })
      .eq('uuid', acoRecord.uuid);

    if (updateError) {
      console.error(`[ACO Update] Update failed:`, updateError);
      throw updateError;
    }

    console.log(`[ACO Update] Successfully updated: ref=${refNumber}, code=${productCode}, added=${quantity}, new_remain_qty=${newRemainQty}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('[ACO Update] Error updating ACO record:', error);
    return { 
      success: false, 
      error: `Failed to update ACO record: ${error.message}` 
    };
  }
}

/**
 * Verify current user password using Supabase Auth
 */
export async function verifyPasswordWithSupabaseAuth(
  password: string
): Promise<{ success: boolean; error?: string; clockNumber?: string }> {
  try {
    // 1. Get current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'Invalid user session, please login again' 
      };
    }

    // 2. Look up user ID in data_id table by email
    if (!user.email) {
      return { 
        success: false, 
        error: 'User email not found' 
      };
    }

    const userId = await getUserIdFromEmail(user.email);
    if (!userId) {
      return { 
        success: false, 
        error: 'User not found in system. Please contact administrator.' 
      };
    }

    const clockNumber = userId.toString();

    // 3. Verify password using Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        return { 
          success: false, 
          error: 'Incorrect password, please try again' 
        };
      }
      return { 
        success: false, 
        error: 'Password verification failed, please retry' 
      };
    }

    return { 
      success: true, 
      clockNumber 
    };

  } catch (error: any) {
    console.error('Error in verifyPasswordWithSupabaseAuth:', error);
    return { 
      success: false, 
      error: 'Error occurred during password verification' 
    };
  }
}

/**
 * Get latest pallet location from record_history
 */
async function getLatestPalletLocation(plt_num: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('record_history')
      .select('loc')
      .eq('plt_num', plt_num)
      .not('loc', 'is', null)
      .order('time', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No history record found, return null
        return null;
      }
      throw error;
    }

    return data?.loc || null;
  } catch (error: any) {
    console.error('Error getting latest pallet location:', error);
    return null;
  }
}

/**
 * Search pallet information - using pure SQL syntax
 */
export async function searchPalletAction(params: SearchParams): Promise<SearchResult> {
  try {
    const { searchValue, searchType } = params;
    
    if (!searchValue.trim()) {
      return { success: false, error: 'Search value cannot be empty' };
    }

    let query = supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty, series, plt_remark, generate_time');

    // Build query based on search type
    if (searchType === 'qr') {
      // QR Code search (series)
      query = query.eq('series', searchValue.trim());
    } else {
      // Pallet number search
      query = query.eq('plt_num', searchValue.trim());
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Pallet not found' };
      }
      throw error;
    }

    if (!data) {
      return { success: false, error: 'Pallet not found' };
    }

    // Get latest location from record_history
    const latestLocation = await getLatestPalletLocation(data.plt_num);

    // Check if pallet is already voided
    if (latestLocation === 'Voided' || latestLocation === 'Damaged') {
      return { success: false, error: `Pallet is already ${latestLocation.toLowerCase()}` };
    }

    const palletInfo: PalletInfo = {
      plt_num: data.plt_num,
      product_code: data.product_code,
      product_qty: data.product_qty,
      series: data.series,
      plt_remark: data.plt_remark,
      plt_loc: latestLocation,
      creation_date: data.generate_time,
      user_id: undefined, // user_id field doesn't exist in record_palletinfo
    };

    return { success: true, data: palletInfo };

  } catch (error: any) {
    console.error('Error searching pallet:', error);
    return { 
      success: false, 
      error: `Search failed: ${error.message || 'Unknown error'}` 
    };
  }
}

/**
 * Record history operation - with proper user ID lookup
 */
export async function recordHistoryAction(
  clockNumber: string,
  action: string,
  plt_num: string | null,
  loc: string | null,
  remark: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    let numericId: number | null = null;

    // If clockNumber is 'unknown', try to get current user from Supabase Auth
    if (clockNumber === 'unknown') {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user?.email) {
          numericId = await getUserIdFromEmail(user.email);
        }
      } catch (authError) {
        console.warn('Could not get user from auth for history recording:', authError);
      }
    } else {
      // Convert clockNumber to numeric ID
      const parsed = parseInt(clockNumber, 10);
      if (!isNaN(parsed)) {
        numericId = parsed;
      }
    }

    // If we still don't have a valid user ID, return error
    if (!numericId) {
      const errorMsg = `Invalid user ID for history recording. ClockNumber: ${clockNumber}`;
      console.error(errorMsg);
      return { 
        success: false, 
        error: errorMsg
      };
    }

    const { error } = await supabase
      .from('record_history')
      .insert({
        time: new Date().toISOString(),
        id: numericId,
        action: action,
        plt_num: plt_num,
        loc: loc,
        remark: remark,
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error recording history:', error);
    return { 
      success: false, 
      error: `Failed to record history: ${error.message}` 
    };
  }
}

/**
 * Log error to database - with proper user ID lookup
 */
export async function logErrorAction(
  clockNumber: string,
  errorInfo: string
): Promise<void> {
  try {
    let numericId: number | null = null;

    // If clockNumber is 'unknown', try to get current user from Supabase Auth
    if (clockNumber === 'unknown') {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user?.email) {
          numericId = await getUserIdFromEmail(user.email);
        }
      } catch (authError) {
        console.warn('Could not get user from auth for error logging:', authError);
      }
    } else {
      // Convert clockNumber to numeric ID
      const parsed = parseInt(clockNumber, 10);
      if (!isNaN(parsed)) {
        numericId = parsed;
      }
    }

    // If we still don't have a valid user ID, skip logging to avoid database errors
    if (!numericId) {
      console.warn(`Cannot log error to database: invalid user ID. ClockNumber: ${clockNumber}, ErrorInfo: ${errorInfo}`);
      return;
    }

    await supabase
      .from('report_log')
      .insert({
        error: 'Void Pallet Error',
        error_info: errorInfo.substring(0, 255),
        user_id: numericId,
        state: false,
      });
  } catch (error) {
    console.error('Failed to log error to database:', error);
  }
}

/**
 * General void processing - using Supabase Auth verification
 */
export async function voidPalletAction(params: Omit<VoidParams, 'userId'>): Promise<VoidResult> {
  try {
    const { palletInfo, voidReason, password } = params;

    console.log('[Void Pallet] Starting void operation:', {
      plt_num: palletInfo.plt_num,
      product_code: palletInfo.product_code,
      product_qty: palletInfo.product_qty,
      plt_remark: palletInfo.plt_remark,
      voidReason
    });

    // 1. Use Supabase Auth verification to get user information
    const passwordResult = await verifyPasswordWithSupabaseAuth(password);
    if (!passwordResult.success || !passwordResult.clockNumber) {
      await recordHistoryAction(
        passwordResult.clockNumber || 'unknown', 
        'Void Pallet Fail', 
        palletInfo.plt_num, 
        palletInfo.plt_loc, 
        `Password verification failed: ${passwordResult.error}`
      );
      return { 
        success: false, 
        error: passwordResult.error || 'Password verification failed' 
      };
    }

    const clockNumber = passwordResult.clockNumber;

    // 2. Update pallet remark only (plt_loc is now managed in record_history)
    const { error: updateError } = await supabase
      .from('record_palletinfo')
      .update({
        plt_remark: `${palletInfo.plt_remark || ''} | Voided: ${voidReason} at ${new Date().toISOString()}`
      })
      .eq('plt_num', palletInfo.plt_num);

    if (updateError) {
      await recordHistoryAction(
        clockNumber, 
        'Void Pallet Fail', 
        palletInfo.plt_num, 
        palletInfo.plt_loc, 
        `Update failed: ${updateError.message}`
      );
      return { 
        success: false, 
        error: `Failed to update pallet: ${updateError.message}` 
      };
    }

    // 3. Update inventory - deduct from original location
    const inventoryColumn = getInventoryColumn(palletInfo.plt_loc);
    const inventoryUpdate: any = {
      product_code: palletInfo.product_code,
      latest_update: new Date().toISOString(),
      plt_num: palletInfo.plt_num,
    };
    inventoryUpdate[inventoryColumn] = -palletInfo.product_qty;

    const { error: inventoryError } = await supabase
      .from('record_inventory')
      .insert(inventoryUpdate);

    if (inventoryError) {
      // Rollback pallet remark
      await supabase
        .from('record_palletinfo')
        .update({
          plt_remark: palletInfo.plt_remark
        })
        .eq('plt_num', palletInfo.plt_num);

      return { 
        success: false, 
        error: `Failed to update inventory: ${inventoryError.message}` 
      };
    }

    // 4. Record history with new location 'Voided'
    await recordHistoryAction(
      clockNumber,
      'Void Pallet',
      palletInfo.plt_num,
      'Voided',
      `Reason: ${voidReason}`
    );

    // 5. Record void report
    await supabase
      .from('report_void')
      .insert({
        plt_num: palletInfo.plt_num,
        reason: voidReason,
        time: new Date().toISOString(),
      });

    // 6. Handle ACO Order Pallet if applicable
    const acoCheck = isACOOrderPallet(palletInfo.plt_remark);
    if (acoCheck.isACO && acoCheck.refNumber) {
      console.log(`Processing ACO Order Pallet: ref=${acoCheck.refNumber}, code=${palletInfo.product_code}, qty=${palletInfo.product_qty}`);
      
      const acoResult = await updateACORecord(
        acoCheck.refNumber,
        palletInfo.product_code,
        palletInfo.product_qty
      );
      
      if (!acoResult.success) {
        console.warn(`ACO update failed: ${acoResult.error}`);
        // Log the ACO update failure but don't fail the entire void operation
        await recordHistoryAction(
          clockNumber,
          'ACO Update Failed',
          palletInfo.plt_num,
          'Voided',
          `ACO update failed: ${acoResult.error}`
        );
      } else {
        // Log successful ACO update
        await recordHistoryAction(
          clockNumber,
          'ACO Updated',
          palletInfo.plt_num,
          'Voided',
          `ACO remain_qty updated: ref=${acoCheck.refNumber}, added=${palletInfo.product_qty}`
        );
      }
    }

    // 7. Handle Material GRN Pallet if applicable
    const grnCheck = isMaterialGRNPallet(palletInfo.plt_remark);
    if (grnCheck.isGRN && grnCheck.grnNumber) {
      console.log(`Processing Material GRN Pallet: grn=${grnCheck.grnNumber}, plt_num=${palletInfo.plt_num}`);
      
      const grnResult = await deleteGRNRecord(palletInfo.plt_num);
      
      if (!grnResult.success) {
        console.warn(`GRN deletion failed: ${grnResult.error}`);
        // Log the GRN deletion failure but don't fail the entire void operation
        await recordHistoryAction(
          clockNumber,
          'GRN Delete Failed',
          palletInfo.plt_num,
          'Voided',
          `GRN deletion failed: ${grnResult.error}`
        );
      } else {
        // Log successful GRN deletion
        await recordHistoryAction(
          clockNumber,
          'GRN Deleted',
          palletInfo.plt_num,
          'Voided',
          `GRN record deleted: grn=${grnCheck.grnNumber}`
        );
      }
    }

    // 8. Determine if reprint is needed
    const needsReprint = ['Wrong Qty', 'Wrong Product Code', 'Wrong Label'].includes(voidReason);
    
    return { 
      success: true, 
      message: `Pallet ${palletInfo.plt_num} voided successfully`,
      requiresReprint: needsReprint,
      reprintInfo: needsReprint ? {
        product_code: palletInfo.product_code,
        quantity: palletInfo.product_qty,
        original_plt_num: palletInfo.plt_num,
        source_action: 'void_correction',
        target_location: palletInfo.plt_loc,
        reason: voidReason
      } : undefined
    };

  } catch (error: any) {
    console.error('Error in voidPalletAction:', error);
    await logErrorAction('unknown', `Void pallet error: ${error.message}`);
    return { 
      success: false, 
      error: `An unexpected error occurred: ${error.message}` 
    };
  }
}

/**
 * Damage processing - using Supabase Auth verification
 */
export async function processDamageAction(params: Omit<VoidParams, 'userId'>): Promise<VoidResult> {
  try {
    const { palletInfo, voidReason, password, damageQuantity } = params;

    console.log('[Damage Processing] Starting damage operation:', {
      plt_num: palletInfo.plt_num,
      product_code: palletInfo.product_code,
      product_qty: palletInfo.product_qty,
      plt_remark: palletInfo.plt_remark,
      voidReason,
      damageQuantity
    });

    if (!damageQuantity || damageQuantity <= 0 || damageQuantity > palletInfo.product_qty) {
      return { 
        success: false, 
        error: `Invalid damage quantity. Must be between 1 and ${palletInfo.product_qty}` 
      };
    }

    // 1. Use Supabase Auth to verify password and get user information
    const passwordResult = await verifyPasswordWithSupabaseAuth(password);
    if (!passwordResult.success || !passwordResult.clockNumber) {
      return { 
        success: false, 
        error: passwordResult.error || 'Password verification failed' 
      };
    }

    const clockNumber = passwordResult.clockNumber;
    const remainingQty = palletInfo.product_qty - damageQuantity;
    const isFullDamage = remainingQty === 0;

    // 2. Update original pallet (only remark and quantity, plt_loc is now managed in record_history)
    const { error: updateError } = await supabase
      .from('record_palletinfo')
      .update({
        product_qty: 0,
        plt_remark: `${palletInfo.plt_remark || ''} | Damaged: ${damageQuantity}/${palletInfo.product_qty} at ${new Date().toISOString()}`
      })
      .eq('plt_num', palletInfo.plt_num);

    if (updateError) {
      return { 
        success: false, 
        error: `Failed to update pallet: ${updateError.message}` 
      };
    }

    // 3. Update inventory - deduct all from original location, add to damage
    const inventoryColumn = getInventoryColumn(palletInfo.plt_loc);
    const inventoryUpdate: any = {
      product_code: palletInfo.product_code,
      damage: damageQuantity,
      latest_update: new Date().toISOString(),
      plt_num: palletInfo.plt_num,
    };
    inventoryUpdate[inventoryColumn] = -palletInfo.product_qty;

    const { error: inventoryError } = await supabase
      .from('record_inventory')
      .insert(inventoryUpdate);

    if (inventoryError) {
      // Rollback pallet changes
      await supabase
        .from('record_palletinfo')
        .update({
          product_qty: palletInfo.product_qty,
          plt_remark: palletInfo.plt_remark
        })
        .eq('plt_num', palletInfo.plt_num);

      return { 
        success: false, 
        error: `Failed to update inventory: ${inventoryError.message}` 
      };
    }

    // 4. Record history with appropriate location status
    const newLocation = isFullDamage ? 'Damaged' : 'Voided (Partial)';
    await recordHistoryAction(
      clockNumber,
      isFullDamage ? 'Fully Damaged' : 'Partially Damaged',
      palletInfo.plt_num,
      newLocation,
      `Damage: ${damageQuantity}/${palletInfo.product_qty}, Remaining: ${remainingQty}`
    );

    // 5. Record void report
    await supabase
      .from('report_void')
      .insert({
        plt_num: palletInfo.plt_num,
        reason: voidReason,
        damage_qty: damageQuantity,
        time: new Date().toISOString(),
      });

    // 6. Handle ACO Order Pallet if applicable
    const acoCheck = isACOOrderPallet(palletInfo.plt_remark);
    if (acoCheck.isACO && acoCheck.refNumber) {
      console.log(`Processing ACO Order Pallet (Damage): ref=${acoCheck.refNumber}, code=${palletInfo.product_code}, qty=${palletInfo.product_qty}`);
      
      const acoResult = await updateACORecord(
        acoCheck.refNumber,
        palletInfo.product_code,
        palletInfo.product_qty
      );
      
      if (!acoResult.success) {
        console.warn(`ACO update failed: ${acoResult.error}`);
        // Log the ACO update failure but don't fail the entire void operation
        await recordHistoryAction(
          clockNumber,
          'ACO Update Failed',
          palletInfo.plt_num,
          newLocation,
          `ACO update failed: ${acoResult.error}`
        );
      } else {
        // Log successful ACO update
        await recordHistoryAction(
          clockNumber,
          'ACO Updated',
          palletInfo.plt_num,
          newLocation,
          `ACO remain_qty updated: ref=${acoCheck.refNumber}, added=${palletInfo.product_qty}`
        );
      }
    }

    // 7. Handle Material GRN Pallet if applicable
    const grnCheck = isMaterialGRNPallet(palletInfo.plt_remark);
    if (grnCheck.isGRN && grnCheck.grnNumber) {
      console.log(`Processing Material GRN Pallet (Damage): grn=${grnCheck.grnNumber}, plt_num=${palletInfo.plt_num}`);
      
      const grnResult = await deleteGRNRecord(palletInfo.plt_num);
      
      if (!grnResult.success) {
        console.warn(`GRN deletion failed: ${grnResult.error}`);
        // Log the GRN deletion failure but don't fail the entire void operation
        await recordHistoryAction(
          clockNumber,
          'GRN Delete Failed',
          palletInfo.plt_num,
          newLocation,
          `GRN deletion failed: ${grnResult.error}`
        );
      } else {
        // Log successful GRN deletion
        await recordHistoryAction(
          clockNumber,
          'GRN Deleted',
          palletInfo.plt_num,
          newLocation,
          `GRN record deleted: grn=${grnCheck.grnNumber}`
        );
      }
    }

    // 8. Return result
    if (isFullDamage) {
      return { 
        success: true, 
        message: `Pallet ${palletInfo.plt_num} fully damaged. No reprint needed.`,
        remainingQty: 0
      };
    } else {
      return { 
        success: true, 
        message: `Pallet ${palletInfo.plt_num} partially damaged. Remaining: ${remainingQty}`,
        remainingQty: remainingQty,
        actual_original_location: palletInfo.plt_loc,
        requiresReprint: true,
        reprintInfo: {
          product_code: palletInfo.product_code,
          quantity: remainingQty,
          original_plt_num: palletInfo.plt_num,
          source_action: 'void_correction_damage_partial',
          target_location: palletInfo.plt_loc,
          reason: voidReason
        }
      };
    }

  } catch (error: any) {
    console.error('Error in processDamageAction:', error);
    await logErrorAction('unknown', `Damage processing error: ${error.message}`);
    return { 
      success: false, 
      error: `An unexpected error occurred: ${error.message}` 
    };
  }
}

/**
 * Check if pallet is a Material GRN pallet by checking plt_remark
 */
function isMaterialGRNPallet(plt_remark: string | null): { isGRN: boolean; grnNumber?: string } {
  if (!plt_remark) {
    console.log('[GRN Check] No plt_remark found');
    return { isGRN: false };
  }
  
  console.log(`[GRN Check] Checking plt_remark: "${plt_remark}"`);
  
  // Look for Material GRN pattern in remarks - support flexible spacing
  const grnPattern = /Material\s+GRN\s*-\s*(\w+)/i;
  const match = plt_remark.match(grnPattern);
  
  if (match) {
    console.log(`[GRN Check] Found GRN reference: ${match[1]}`);
    return { isGRN: true, grnNumber: match[1] };
  }
  
  console.log('[GRN Check] No GRN reference found');
  return { isGRN: false };
}

/**
 * Delete GRN record when voiding Material GRN pallet
 */
async function deleteGRNRecord(
  pltNum: string
): Promise<{ success: boolean; error?: string }> {
  try {
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
      console.log(`[GRN Delete] No GRN record found for plt_num: ${pltNum}`);
      return { 
        success: false, 
        error: `No GRN record found for pallet: ${pltNum}` 
      };
    }

    console.log(`[GRN Delete] Successfully deleted ${deletedRecord.length} GRN record(s) for plt_num: ${pltNum}`);
    console.log(`[GRN Delete] Deleted records:`, deletedRecord);
    
    return { success: true };
  } catch (error: any) {
    console.error('[GRN Delete] Error deleting GRN record:', error);
    return { 
      success: false, 
      error: `Failed to delete GRN record: ${error.message}` 
    };
  }
}

/**
 * Get inventory column name - corrected mapping based on database structure
 */
function getInventoryColumn(location: string | null): string {
  if (!location) return 'injection'; // Default value
  
  console.log(`[Inventory] Mapping location "${location}" to inventory column`);
  
  const locationMap: { [key: string]: string } = {
    // Exact matches for database locations
    'Injection': 'injection',
    'Pipeline': 'pipeline', 
    'Prebook': 'prebook',
    'Await': 'await',
    'Awaiting': 'await', // Alternative spelling
    'Fold Mill': 'fold',
    'Bulk': 'bulk',
    'Backcarpark': 'backcarpark',
    'Back Car Park': 'backcarpark', // Alternative spelling
    
    // Fallback mappings for other locations
    'Warehouse': 'injection',
    'QC': 'injection', 
    'Shipping': 'injection',
    'Production': 'injection',
    'Storage': 'injection',
  };
  
  const column = locationMap[location] || 'injection';
  console.log(`[Inventory] Location "${location}" mapped to column "${column}"`);
  
  return column;
}

/**
 * Get user history records
 */
export async function getUserHistoryAction(
  limit: number = 50
): Promise<{ success: boolean; data?: HistoryRecord[]; error?: string }> {
  try {
    // Get current user from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'Invalid user session, please login again' 
      };
    }

    // Look up user ID in data_id table by email
    if (!user.email) {
      return { 
        success: false, 
        error: 'User email not found' 
      };
    }

    const userId = await getUserIdFromEmail(user.email);
    if (!userId) {
      return { 
        success: false, 
        error: 'User not found in system. Please contact administrator.' 
      };
    }

    const { data, error } = await supabase
      .from('record_history')
      .select('time, id, action, plt_num, loc, remark')
      .eq('id', userId)
      .order('time', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching user history:', error);
    return { 
      success: false, 
      error: `Failed to fetch history: ${error.message}` 
    };
  }
} 