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
  userId: string;
  palletInfo: PalletInfo;
  password: string;
  voidReason: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

// Helper function to log history (avoids repetition)
async function logHistoryRecord(
  userId: string, 
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
    console.error(`History logging failed for action '${action}', remark '${remark}':`, error);
    return { error }; // Return error to potentially handle upstream
  }
}

export async function voidPalletAction(args: VoidPalletArgs): Promise<ActionResult> {
  const { userId, palletInfo, password, voidReason } = args;
  const { plt_num, product_code, product_qty, plt_remark } = palletInfo;
  const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss');

  console.log(`Voiding pallet ${plt_num} initiated by user ${userId} at ${formattedTime}`);

  try {
    // 1. Verify Password
    console.log('Verifying password...');
    const { data: userData, error: userError } = await supabase
      .from('data_id') // Assuming table is data_id
      .select('password')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data or user not found:', userError);
      await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, null, 'User Data Fetch Error');
      return { success: false, error: 'Could not verify user information.' };
    }

    // --- Password Verification using bcrypt ---
    console.log('Comparing submitted password with stored hash...');
    const isPasswordMatch = bcrypt.compareSync(password, userData.password); // Compare plaintext password with stored hash
    
    if (!isPasswordMatch) { 
      console.warn('Password mismatch for user', userId);
      await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, null, 'Password Mismatch');
      return { success: false, error: 'Action Denied. Password Not Match. Please Try Again.' };
    }
    console.log('Password verified.');
    // --- End of bcrypt verification ---

    // 2. Double-check pallet existence and get info (already have from args, but good practice)
    console.log('Pallet info received:', palletInfo);

    // 3. Check if already voided (using latest history)
    console.log('Checking if already voided...');
    const { data: latestHistory, error: historyError } = await supabase
        .from('record_history')
        .select('loc')
        .eq('plt_num', plt_num)
        .order('time', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to handle no history gracefully

    if (historyError) {
        console.error(`Error fetching history for ${plt_num}:`, historyError);
        await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, null, `History Fetch Error: ${historyError.message}`);
        return { success: false, error: 'Could not verify pallet history.' };
    }

    const latestLocation = latestHistory?.loc;
    console.log(`Latest location for ${plt_num} from history: ${latestLocation}`);

    if (latestLocation === 'Voided') {
        console.warn(`Pallet ${plt_num} is already voided.`);
        await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, null, 'Pallet Already Voided');
        return { success: false, error: 'Pallet Already Voided. Please Check Again.' };
    }

    // START THE VOIDING PROCESS (potentially wrap in transaction if using RPC)

    // 4. Inventory Adjustment
    console.log('Adjusting inventory...');
    let inventoryColumn: string | null = null;
    if (latestLocation === 'Awaiting') inventoryColumn = 'await';
    else if (latestLocation === 'Production') inventoryColumn = 'injection'; // Assuming 'Porduction' was typo
    else if (latestLocation === 'Fold Mill') inventoryColumn = 'fold';

    if (inventoryColumn) {
        // Fetch current inventory quantity first
        const { data: inventoryData, error: invFetchError } = await supabase
            .from('record_inventory')
            .select(inventoryColumn)
            .eq('product_code', product_code)
            .single();

        if (invFetchError) {
             console.error(`Error fetching inventory for ${product_code}, column ${inventoryColumn}:`, invFetchError);
             await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, latestLocation, `Inventory Fetch Error: ${invFetchError.message}`);
             return { success: false, error: 'Could not fetch current inventory count.' };
        }
        
        // Assert inventoryData as any to allow string index access
        const currentQty = inventoryData ? (inventoryData as any)[inventoryColumn] : 0;
        const newQty = (currentQty || 0) - product_qty;
        
        console.log(`Updating inventory column ${inventoryColumn} for ${product_code} from ${currentQty} to ${newQty}`);

        // Create an update object with explicit typing for the dynamic key
        const updateData: { [key: string]: string | number | Date } = {
            latest_update: new Date().toISOString()
        };
        updateData[inventoryColumn] = newQty;

        const { error: invUpdateError } = await supabase
            .from('record_inventory')
            .update(updateData)
            .eq('product_code', product_code);
        
        if (invUpdateError) {
            console.error(`Error updating inventory for ${product_code}:`, invUpdateError);
            await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, latestLocation, `Inventory Update Error: ${invUpdateError.message}`);
            return { success: false, error: 'Failed to update inventory.' };
        }
        await logHistoryRecord(userId, 'Void Pallet Step', plt_num, latestLocation, 'Deducted From Inventory');
        console.log('Inventory adjusted.');
    } else {
        console.log(`No inventory adjustment needed for location: ${latestLocation}`);
    }

    // 5. GRN Record Deletion
    console.log('Checking GRN records...');
    const { error: grnDeleteError } = await supabase
        .from('record_grn')
        .delete()
        .eq('plt_num', plt_num);
        
    // Ignore 'PGRST000' (No rows deleted) error if needed, but deleting non-existent is fine.
    if (grnDeleteError) {
        console.error(`Error deleting GRN record for ${plt_num}:`, grnDeleteError);
        await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, latestLocation, `GRN Delete Error: ${grnDeleteError.message}`);
        return { success: false, error: 'Failed to delete GRN record.' };
    }
    // Log success only if delete was attempted (or maybe check count > 0 before delete?)
    // For simplicity, log step if no error occurred.
    await logHistoryRecord(userId, 'Void Pallet Step', plt_num, latestLocation, 'Deducted From GRN Record');
    console.log('GRN records checked/deleted.');

    // 6. Slate Record Deletion
    console.log('Checking Slate records...');
    // First, check if a record exists
    const { count: slateCount, error: slateCountError } = await supabase
        .from('record_slate')
        .select('plt_num', { count: 'exact', head: true })
        .eq('plt_num', plt_num);

    if (slateCountError) {
        console.error(`Error counting Slate records for ${plt_num}:`, slateCountError);
        await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, latestLocation, `Slate Count Error: ${slateCountError.message}`);
        return { success: false, error: 'Failed to check Slate record existence.' };
    }

    if (slateCount !== null && slateCount > 0) {
        console.log(`Found ${slateCount} Slate record(s) for ${plt_num}. Attempting deletion...`);
        const { error: slateDeleteError } = await supabase
            .from('record_slate')
            .delete()
            .eq('plt_num', plt_num);

        if (slateDeleteError) {
            console.error(`Error deleting Slate record for ${plt_num}:`, slateDeleteError);
            await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, latestLocation, `Slate Delete Error: ${slateDeleteError.message}`);
            return { success: false, error: 'Failed to delete Slate record.' };
        }
        // Only log history if deletion was attempted and successful
        await logHistoryRecord(userId, 'Void Pallet Step', plt_num, latestLocation, 'Deducted From Slate Record');
        console.log('Slate records deleted.');
    } else {
        console.log(`No Slate record found for ${plt_num}. Skipping deletion.`);
        // No history log needed if nothing was deleted
    }

    // 7. ACO Adjustment
    console.log('Checking ACO remark...');
    if (plt_remark && plt_remark.includes('ACO')) {
        const match = plt_remark.match(/\d{5}$/); // Regex to get last 5 digits
        if (match) {
            const orderRef = match[0];
            console.log(`Found ACO Ref: ${orderRef} in remark. Adjusting ACO record...`);

             // Fetch current ACO quantity first
            const { data: acoData, error: acoFetchError } = await supabase
                .from('record_aco')
                .select('remain_qty')
                .eq('order_ref', orderRef)
                .eq('code', product_code)
                .single();

            if (acoFetchError && acoFetchError.code !== 'PGRST116') { // Ignore not found error here? Check requirements
                console.error(`Error fetching ACO record for ${orderRef}, ${product_code}:`, acoFetchError);
                await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, latestLocation, `ACO Fetch Error: ${acoFetchError.message}`);
                // Decide if critical. Assume critical for now.
                return { success: false, error: 'Could not fetch ACO record.' };
            }
            
            if (acoData) { // Only update if ACO record exists
                const currentRemainQty = acoData.remain_qty || 0;
                const newRemainQty = currentRemainQty + product_qty;
                console.log(`Updating ACO remain_qty for ${orderRef}, ${product_code} from ${currentRemainQty} to ${newRemainQty}`);

                const { error: acoUpdateError } = await supabase
                    .from('record_aco')
                    .update({ 
                        remain_qty: newRemainQty,
                        latest_update: new Date().toISOString()
                     })
                    .eq('order_ref', orderRef)
                    .eq('code', product_code);
                
                if (acoUpdateError) {
                    console.error(`Error updating ACO record for ${orderRef}, ${product_code}:`, acoUpdateError);
                    await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, latestLocation, `ACO Update Error: ${acoUpdateError.message}`);
                    return { success: false, error: 'Failed to update ACO record.' };
                }
                await logHistoryRecord(userId, 'Void Pallet Step', plt_num, latestLocation, 'Returned Qty to ACO Order');
                console.log('ACO record adjusted.');
            } else {
                 console.log(`No matching ACO record found for ${orderRef}, ${product_code}. Skipping adjustment.`);
                 // Log this skip? Maybe not needed for history.
            }
        } else {
            console.warn(`Could not extract 5-digit ACO Ref from remark: ${plt_remark}`);
        }
    } else {
        console.log('No ACO remark found. Skipping ACO adjustment.');
    }

    // 8. Final History Log (Success)
    console.log('Logging final success history...');
    const finalLogResult = await logHistoryRecord(userId, 'Void Pallet', plt_num, 'Voided', `${voidReason} - Success`);
    if (finalLogResult.error) {
         // Log failed, but previous steps succeeded. What to return? Return success but log error.
         console.error('CRITICAL: Failed to log final void success history!');
         // Optionally try logging a failure state?
         return { success: false, error: 'Void steps completed but failed to log final status.'}; // Treat as failure if final log fails
    }
    console.log(`Pallet ${plt_num} voided successfully.`);

    // Revalidate the path to update the UI potentially if data is displayed differently after void
    revalidatePath('/void-pallet'); 

    return { success: true };

  } catch (error: any) {
    console.error('Unhandled error during voidPalletAction:', error);
    // Log a generic failure
    await logHistoryRecord(userId, 'Void Pallet Fail', plt_num, null, `Unhandled Server Error: ${error.message}`);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
} 