'use server';

import { createClient } from '@/app/utils/supabase/server';
import { clockNumberToEmail, emailToClockNumber } from '@/app/utils/authUtils';
import { LocationMapper } from '@/lib/inventory/utils/locationMapper';
import { createInventoryService } from '@/lib/inventory/services';
import { 
  SearchParams, 
  SearchResult, 
  VoidParams, 
  VoidResult, 
  PalletInfo,
  HistoryRecord 
} from './types';

// 移除模塊級別的客戶端實例，改為在每個函數內部創建

/**
 * Get user ID from data_id table by email
 */
async function getUserIdFromEmail(email: string): Promise<number | null> {
  const supabase = await createClient();
  
  try {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[getUserIdFromEmail] Looking up user ID for email: ${email}`);
    
    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, email')
      .eq('email', email)
      .single();

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[getUserIdFromEmail] Query result:`, { data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        // No user found with this email
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[getUserIdFromEmail] No user found for email: ${email}`);
        return null;
      }
      throw error;
    }

    const userId = data?.id;
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[getUserIdFromEmail] Found user ID: ${userId} for email: ${email}`);
    
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
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[ACO Check] No plt_remark found');
    return { isACO: false };
  }
  
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Check] Checking plt_remark: "${plt_remark}"`);
  
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
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Check] Found ACO reference: ${match[1]} using pattern: ${pattern}`);
      return { isACO: true, refNumber: match[1] };
    }
  }
  
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[ACO Check] No ACO reference found');
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
  const supabase = await createClient();
  
  try {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Update] Starting update: ref=${refNumber}, code=${productCode}, qty=${quantity}`);
    
    // Find the ACO record by order_ref and code (case-insensitive for product code)
    const { data: acoRecord, error: findError } = await supabase
      .from('record_aco')
      .select('uuid, required_qty, finished_qty, code')
      .eq('order_ref', refNumber)
      .ilike('code', productCode) // Use ilike for case-insensitive matching
      .single();

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Update] Query result:`, { acoRecord, findError });

    if (findError) {
      if (findError.code === 'PGRST116') {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Update] No record found for ref=${refNumber}, code=${productCode}`);
        
        // Try to find any records with this order_ref to see what's available
        const { data: allRecords } = await supabase
          .from('record_aco')
          .select('uuid, code, required_qty, finished_qty')
          .eq('order_ref', refNumber);
        
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Update] Available records for ref=${refNumber}:`, allRecords);
        
        return { 
          success: false, 
          error: `ACO record not found for ref: ${refNumber}, code: ${productCode}` 
        };
      }
      throw findError;
    }

    if (!acoRecord) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Update] No ACO record returned`);
      return { 
        success: false, 
        error: `ACO record not found for ref: ${refNumber}, code: ${productCode}` 
      };
    }

    const currentFinishedQty = acoRecord.finished_qty || 0;
    const currentRemainQty = Math.max(0, acoRecord.required_qty - currentFinishedQty);
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Update] Found record: uuid=${acoRecord.uuid}, required_qty=${acoRecord.required_qty}, finished_qty=${currentFinishedQty}, current_remain_qty=${currentRemainQty}`);

    // Update finished_qty by subtracting the voided quantity
    const newFinishedQty = Math.max(0, currentFinishedQty - quantity);
    const newRemainQty = acoRecord.required_qty - newFinishedQty;
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Update] Updating finished_qty: ${currentFinishedQty} - ${quantity} = ${newFinishedQty}, new_remain_qty=${newRemainQty}`);
    
    const { error: updateError } = await supabase
      .from('record_aco')
      .update({ finished_qty: newFinishedQty })
      .eq('uuid', acoRecord.uuid);

    if (updateError) {
      console.error(`[ACO Update] Update failed:`, updateError);
      throw updateError;
    }

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[ACO Update] Successfully updated: ref=${refNumber}, code=${productCode}, added=${quantity}, new_remain_qty=${newRemainQty}`);
    
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
  const supabase = await createClient();
  
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
  const supabase = await createClient();
  
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
 * Search pallet information - using UnifiedInventoryService
 */
export async function searchPalletAction(params: SearchParams): Promise<SearchResult> {
  const supabase = await createClient();
  const inventoryService = createInventoryService(supabase);
  
  try {
    const { searchValue, searchType } = params;
    
    if (!searchValue.trim()) {
      return { success: false, error: 'Search value cannot be empty' };
    }

    // Auto-detect search type
    let finalSearchType: 'series' | 'pallet_num';
    if (searchType === 'qr') {
      // QR codes are usually series, but try to detect
      finalSearchType = searchValue.includes('/') ? 'pallet_num' : 'series';
    } else {
      finalSearchType = searchType as 'series' | 'pallet_num';
    }

    // Use unified inventory service for search
    const searchResult = await inventoryService.searchPallet(finalSearchType, searchValue.trim());
    
    if (!searchResult.pallet) {
      // If not found by detected type, try the other type
      const alternateType = finalSearchType === 'series' ? 'pallet_num' : 'series';
      const alternateResult = await inventoryService.searchPallet(alternateType, searchValue.trim());
      
      if (!alternateResult.pallet) {
        return { success: false, error: searchResult.error || 'Pallet not found' };
      }
      
      // Use alternate result
      const pallet = alternateResult.pallet;
      
      // Check if pallet is already voided
      if (pallet.is_voided) {
        return { success: false, error: `Pallet is already voided` };
      }

      const palletInfo: PalletInfo = {
        plt_num: pallet.plt_num,
        product_code: pallet.product_code,
        product_qty: pallet.product_qty,
        series: pallet.series,
        plt_remark: pallet.plt_remark,
        plt_loc: pallet.location || 'Await',
        creation_date: pallet.generate_time,
        user_id: undefined,
      };

      return { success: true, data: palletInfo };
    }
    
    const pallet = searchResult.pallet;
    
    // Check if pallet is already voided
    if (pallet.is_voided) {
      return { success: false, error: `Pallet is already voided` };
    }

    const palletInfo: PalletInfo = {
      plt_num: pallet.plt_num,
      product_code: pallet.product_code,
      product_qty: pallet.product_qty,
      series: pallet.series,
      plt_remark: pallet.plt_remark,
      plt_loc: pallet.location || 'Await',
      creation_date: pallet.generate_time,
      user_id: undefined,
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
  const supabase = await createClient();
  
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
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('Could not get user from auth for history recording:', authError);
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
  const supabase = await createClient();
  
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
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('Could not get user from auth for error logging:', authError);
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
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`Cannot log error to database: invalid user ID. ClockNumber: ${clockNumber}, ErrorInfo: ${errorInfo}`);
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
  const supabase = await createClient();
  
  try {
    const { palletInfo, voidReason, password } = params;

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Void Pallet] Starting void operation:', {
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

    // 3. Use UnifiedInventoryService for void operation
    const inventoryService = createInventoryService(supabase);
    
    try {
      await inventoryService.voidPallet({
        palletNum: palletInfo.plt_num,
        reason: voidReason,
        operator: clockNumber,
        remark: `Voided: ${voidReason} at ${new Date().toISOString()}`
      });
    } catch (voidError: any) {
      // Rollback pallet remark
      await supabase
        .from('record_palletinfo')
        .update({
          plt_remark: palletInfo.plt_remark
        })
        .eq('plt_num', palletInfo.plt_num);

      return { 
        success: false, 
        error: `Failed to void pallet: ${voidError.message}` 
      };
    }

    // 🚀 新增：同步更新 stock_level 表
    try {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Void Pallet] Updating stock_level for product:', {
        product_code: palletInfo.product_code,
        quantity: palletInfo.product_qty,
        operation: 'void'
      });

      const { data: stockResult, error: stockError } = await supabase
        .rpc('update_stock_level_void', {
          p_product_code: palletInfo.product_code,
          p_quantity: palletInfo.product_qty,
          p_operation: 'void'
        });

      if (stockError) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Void Pallet] Stock level update failed:', stockError);
        // 記錄警告但不中斷主要流程
        await recordHistoryAction(
          clockNumber,
          'Stock Level Update Failed',
          palletInfo.plt_num,
          'Voided',
          `Stock level update failed: ${stockError.message}`
        );
      } else {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Void Pallet] Stock level updated successfully:', stockResult);
        // 不需要記錄 Stock Level Updated，因為會同 Void Pallet 重複
      }
    } catch (stockUpdateError: any) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Void Pallet] Stock level update error:', stockUpdateError);
      // 記錄錯誤但不中斷主要流程
      await recordHistoryAction(
        clockNumber,
        'Stock Level Update Error',
        palletInfo.plt_num,
        'Voided',
        `Stock level update error: ${stockUpdateError.message}`
      );
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
        damage_qty: null, // Explicitly set to null for non-damage voids
        time: new Date().toISOString(),
      });

    // 6. Handle ACO Order Pallet if applicable
    const acoCheck = isACOOrderPallet(palletInfo.plt_remark);
    if (acoCheck.isACO && acoCheck.refNumber) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Processing ACO Order Pallet: ref=${acoCheck.refNumber}, code=${palletInfo.product_code}, qty=${palletInfo.product_qty}`);
      
      const acoResult = await updateACORecord(
        acoCheck.refNumber,
        palletInfo.product_code,
        palletInfo.product_qty
      );
      
      if (!acoResult.success) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`ACO update failed: ${acoResult.error}`);
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
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Processing Material GRN Pallet: grn=${grnCheck.grnNumber}, plt_num=${palletInfo.plt_num}`);
      
      const grnResult = await deleteGRNRecord(palletInfo.plt_num);
      
      if (!grnResult.success) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`GRN deletion failed: ${grnResult.error}`);
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
  const supabase = await createClient();
  
  try {
    const { palletInfo, voidReason, password, damageQuantity } = params;

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Damage Processing] Starting damage operation:', {
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

    // 🔥 新增：檢查 ACO pallet 是否支援部分損壞
    const acoCheck = isACOOrderPallet(palletInfo.plt_remark);
    const isPartialDamage = damageQuantity < palletInfo.product_qty;
    
    if (acoCheck.isACO && isPartialDamage) {
      return {
        success: false,
        error: 'ACO Order Pallets do not support partial damage. If damaged, the entire pallet must be voided.'
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
    
    // 確定新的位置狀態
    const newLocation = isFullDamage ? 'Damaged' : 'Voided (Partial)';

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

    // 3. Use TransactionService for damage operation
    const inventoryService = createInventoryService(supabase);
    const transactionService = (inventoryService as any).transactionService;
    
    try {
      // Execute damage operation within transaction
      const result = await transactionService.executeTransaction(async (client: any) => {
        // Update inventory
        const inventoryColumn = getInventoryColumn(palletInfo.plt_loc);
        const inventoryUpdate: any = {
          product_code: palletInfo.product_code,
          damage: damageQuantity,
          latest_update: new Date().toISOString(),
          plt_num: palletInfo.plt_num,
        };
        inventoryUpdate[inventoryColumn] = -palletInfo.product_qty;

        const { error: inventoryError } = await client
          .from('record_inventory')
          .insert(inventoryUpdate);

        if (inventoryError) {
          throw inventoryError;
        }
      }, {
        description: `Damage processing: ${palletInfo.plt_num}`,
        logTransaction: true
      });

      if (!result.success) {
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
          error: `Failed to update inventory: ${result.error}` 
        };
      }
    } catch (error: any) {
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
        error: `Failed to update inventory: ${error.message}` 
      };
    }

    // 🚀 優化：同步更新 stock_level 表 - 減去整個 pallet qty（因為後續 reprint 會再更新）
    try {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Damage Processing] Updating stock_level for product:', {
        product_code: palletInfo.product_code,
        total_quantity: palletInfo.product_qty, // 減去整個 pallet 數量
        damage_quantity: damageQuantity,
        operation: 'damage'
      });

      const { data: stockResult, error: stockError } = await supabase
        .rpc('update_stock_level_void', {
          p_product_code: palletInfo.product_code,
          p_quantity: palletInfo.product_qty, // 🔥 關鍵修改：減去整個 pallet 數量，因為後續 reprint 會再更新
          p_operation: 'damage'
        });

      if (stockError) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Damage Processing] Stock level update failed:', stockError);
        // 記錄警告但不中斷主要流程
        await recordHistoryAction(
          clockNumber,
          'Stock Level Update Failed',
          palletInfo.plt_num,
          newLocation,
          `Stock level update failed: ${stockError.message}`
        );
      } else {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Damage Processing] Stock level updated successfully:', stockResult);
        // 不需要記錄 Stock Level Updated，因為會同 Fully Damaged / Partially Damaged 重複
      }
    } catch (stockUpdateError: any) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Damage Processing] Stock level update error:', stockUpdateError);
      // 記錄錯誤但不中斷主要流程
      await recordHistoryAction(
        clockNumber,
        'Stock Level Update Error',
        palletInfo.plt_num,
        newLocation,
        `Stock level update error: ${stockUpdateError.message}`
      );
    }

    // 4. Record history with appropriate location status and optimized remark
    let historyRemark = '';
    if (isFullDamage) {
      historyRemark = `Damage: ${damageQuantity}/${palletInfo.product_qty}, Remaining: 0`;
    } else {
      // 🔥 優化 remark 格式 - 添加 "Replaced By" 信息
      const currentDate = new Date();
      const dateStr = String(currentDate.getDate()).padStart(2, '0') + 
                     String(currentDate.getMonth() + 1).padStart(2, '0') + 
                     String(currentDate.getFullYear()).slice(-2);
      historyRemark = `Damage: ${damageQuantity}/${palletInfo.product_qty}, Remaining: ${remainingQty} Replaced By ${dateStr}/XX`;
    }
    
    await recordHistoryAction(
      clockNumber,
      isFullDamage ? 'Fully Damaged' : 'Partially Damaged',
      palletInfo.plt_num,
      newLocation,
      historyRemark
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
    if (acoCheck.isACO && acoCheck.refNumber) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Processing ACO Order Pallet (Damage): ref=${acoCheck.refNumber}, code=${palletInfo.product_code}, qty=${palletInfo.product_qty}`);
      
      const acoResult = await updateACORecord(
        acoCheck.refNumber,
        palletInfo.product_code,
        palletInfo.product_qty
      );
      
      if (!acoResult.success) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`ACO update failed: ${acoResult.error}`);
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
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Processing Material GRN Pallet (Damage): grn=${grnCheck.grnNumber}, plt_num=${palletInfo.plt_num}`);
      
      const grnResult = await deleteGRNRecord(palletInfo.plt_num);
      
      if (!grnResult.success) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`GRN deletion failed: ${grnResult.error}`);
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

    // 8. Return result - 🔥 修改：ACO pallet 或完全損壞不需要重印
    if (isFullDamage || acoCheck.isACO) {
      return { 
        success: true, 
        message: `Pallet ${palletInfo.plt_num} ${isFullDamage ? 'fully damaged' : 'voided'}. No reprint needed.`,
        remainingQty: 0,
        requiresReprint: false // 🔥 明確設定不需要重印
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
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[GRN Check] No plt_remark found');
    return { isGRN: false };
  }
  
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[GRN Check] Checking plt_remark: "${plt_remark}"`);
  
  // Look for Material GRN pattern in remarks - support flexible spacing
  const grnPattern = /Material\s+GRN\s*-\s*(\w+)/i;
  const match = plt_remark.match(grnPattern);
  
  if (match) {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[GRN Check] Found GRN reference: ${match[1]}`);
    return { isGRN: true, grnNumber: match[1] };
  }
  
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[GRN Check] No GRN reference found');
  return { isGRN: false };
}

/**
 * Delete GRN record when voiding Material GRN pallet
 */
async function deleteGRNRecord(
  pltNum: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[GRN Delete] Starting deletion for plt_num: ${pltNum}`);
    
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
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[GRN Delete] No GRN record found for plt_num: ${pltNum}`);
      return { 
        success: false, 
        error: `No GRN record found for pallet: ${pltNum}` 
      };
    }

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[GRN Delete] Successfully deleted ${deletedRecord.length} GRN record(s) for plt_num: ${pltNum}`);
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[GRN Delete] Deleted records:`, deletedRecord);
    
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
 * @deprecated Use LocationMapper.toDbColumn() directly
 */
function getInventoryColumn(location: string | null): string {
  if (!location) return 'injection'; // Default value
  
  process.env.NODE_ENV !== "production" && console.log(`[Inventory] Mapping location "${location}" to inventory column`);
  
  // Use the unified LocationMapper
  const column = LocationMapper.toDbColumn(location) || 'injection';
  process.env.NODE_ENV !== "production" && console.log(`[Inventory] Location "${location}" mapped to column "${column}"`);
  
  return column;
}

/**
 * Get user history records
 */
export async function getUserHistoryAction(
  limit: number = 50
): Promise<{ success: boolean; data?: HistoryRecord[]; error?: string }> {
  const supabase = await createClient();
  
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