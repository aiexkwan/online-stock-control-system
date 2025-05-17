'use server';

import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  series: string;
  current_location: string | null;
  plt_remark: string | null;
}

interface VoidPalletArgs {
  userId: number;
  palletInfo: PalletInfo;
  password: string;
  voidReason: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

// Helper function to log history (Only used for pre-RPC failures now)
async function logHistoryRecord(
  userId: number,
  action: string,
  plt_num: string | null,
  loc: string | null,
  remark: string | null
): Promise<{ error?: any }> {
  try {
    const { error } = await supabase.from('record_history').insert({
      time: new Date().toISOString(),
      id: userId,
      action: action,
      plt_num: plt_num,
      loc: loc,
      remark: remark,
    });
    if (error) throw error;
    return {};
  } catch (error) {
    console.error(`[SA] History logging failed for action '${action}', remark '${remark}':`, error);
    return { error }; // Return error
  }
}

export async function voidPalletAction(args: VoidPalletArgs): Promise<ActionResult> {
  console.log('[SA] Received args:', JSON.stringify(args, null, 2)); // Log the entire args object
  if (args && args.palletInfo) {
    console.log('[SA] Received palletInfo:', JSON.stringify(args.palletInfo, null, 2));
  } else {
    console.error('[SA] CRITICAL: args.palletInfo is missing or args itself is falsy.', args ? args.palletInfo : 'args is falsy');
    // Return an error immediately if palletInfo is not there, before destructuring attempt
    return { success: false, error: 'Internal Server Error: Pallet information missing in request.' };
  }

  const { userId, palletInfo, password, voidReason } = args;
  const { plt_num, product_code, product_qty, plt_remark, current_location, series } = palletInfo;
  const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss');

  console.log(`[SA] Voiding pallet ${plt_num} initiated by user ${userId} at ${formattedTime}`);

  // Basic validation before hitting DB for password
  if (userId === null || typeof userId === 'undefined') {
    console.error('[SA] User ID is missing or invalid in input args.');
    return { success: false, error: 'User ID is missing or invalid.' };
  }
  if (!palletInfo || !palletInfo.plt_num || !palletInfo.product_code || palletInfo.product_qty == null || !voidReason) {
    console.error('[SA] Missing critical pallet info or void reason in input args.');
    return { success: false, error: 'Missing required information to void pallet.' };
  }

  try {
    // 1. Verify Password (remains in Server Action)
    console.log('[SA] Verifying password...');
    const { data: userData, error: userError } = await supabase
      .from('data_id')
      .select('password')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[SA] Error fetching user data or user not found:', userError);
      // Log this specific failure before returning
      await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, current_location, 'User Data Fetch Error (SA)');
      return { success: false, error: 'Could not verify user information.' };
    }

    // Ensure password field exists before comparing
    if (!userData.password) {
        console.error('[SA] User password field is missing in database for user:', userId);
        await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, current_location, 'User Password Missing in DB (SA)');
        return { success: false, error: 'User account configuration error.' };
    }

    const isPasswordMatch = bcrypt.compareSync(password, userData.password);
    if (!isPasswordMatch) {
      console.warn('[SA] Password mismatch for user', userId);
      await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, current_location, 'Password Mismatch (SA)');
      return { success: false, error: 'Action Denied. Password Not Match. Please Try Again.' };
    }
    console.log('[SA] Password verified.');

    // Pre-RPC Check: Ensure current_location is provided and not already 'Voided'.
    // The RPC also performs these checks, but checking here avoids unnecessary RPC calls.
    if (current_location === null || typeof current_location === 'undefined') {
        console.error(`[SA] Pallet ${plt_num} has invalid current location: ${current_location}`);
        await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, null, 'Missing or invalid current location (SA)');
        return { success: false, error: 'Pallet current location is missing or invalid.' };
    }
    if (current_location === 'Voided') {
      console.warn(`[SA] Pallet ${plt_num} is already voided (checked in SA).`);
      // Log this attempt? Maybe not, as it's just a state check.
      return { success: false, error: 'Pallet Already Voided. Please Check Again.' };
    }

    // 2. Call the database function (RPC)
    console.log(`[SA] Calling RPC 'void_pallet_transaction' for plt_num: ${plt_num}`);
    const { data: rpcData, error: rpcError } = await supabase.rpc('void_pallet_transaction', {
      p_user_id: userId,
      p_plt_num: plt_num,
      p_product_code: product_code,
      p_product_qty: product_qty,
      p_void_location: current_location,
      p_void_reason: voidReason,
    });

    if (rpcError) {
      console.error('[SA] RPC call failed with rpcError:', rpcError); 
      await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, current_location, `RPC Call Error: ${rpcError.message} (SA)`);
      return { success: false, error: `Database operation failed: ${rpcError.message}` };
    }

    // Handle RPCs that return a JSON object with success and message properties
    console.log(`[SA] RPC call seemingly successful (no rpcError), response data:`, rpcData);
    if (rpcData && typeof rpcData === 'object') {
      const rpcResponse = rpcData as { success?: boolean; message?: string; [key: string]: any }; // Type assertion
      if (rpcResponse.success === true) {
        revalidatePath('/void-pallet');
        return { success: true, message: rpcResponse.message || 'Pallet voided successfully.' };
      } else {
        // RPC returned success:false or success is not explicitly true
        const errorMessage = rpcResponse.message || 'RPC indicated an issue but provided no specific message.';
        console.warn(`[SA] RPC reported an issue:`, rpcResponse);
        await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, current_location, `RPC Reported Issue: ${errorMessage.substring(0,150)} (SA)`);
        return { success: false, error: errorMessage };
      }
    } else {
      // Unexpected rpcData format (not an object, or null/undefined when rpcError was also null)
      console.error('[SA] RPC returned unexpected data format or null/undefined data when rpcError was also null:', rpcData);
      await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, current_location, 'RPC Unexpected Data Format (SA)');
      return { success: false, error: 'Database operation returned an unexpected data format.' };
    }

  } catch (error: any) {
    console.error('[SA] Unhandled error during voidPalletAction:', error);
    // Log a generic failure if something outside the RPC call fails
    await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, current_location, `Unhandled Server Error (SA): ${error.message}`);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
} 