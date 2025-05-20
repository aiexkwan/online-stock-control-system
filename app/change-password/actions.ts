'use server';

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// COMMENT OUT or REMOVE the module-level supabaseAdmin instance AGAIN
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

const clockNumberSchema = z.string().regex(/^\d+$/, { message: 'Clock Number must be a positive number string.' }).transform(val => parseInt(val, 10));

// Updated password schema
const passwordSchema = z.string()
  .min(6, { message: 'Password must be at least 6 characters long.' })
  .regex(/^[a-zA-Z0-9]+$/, { message: 'Password can only contain letters and numbers.' });

interface UpdatePasswordResult {
  success: boolean;
  error?: string;
}

async function logPasswordChangeToHistory(userId: number, remark: string): Promise<void> {
  const supabaseAdmin = createClient( // Create instance inside function
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { error: historyError } = await supabaseAdmin
      .from('record_history')
      .insert({
        id: userId, // Assuming 'id' in record_history is the clockNumber
        action: 'PASSWORD_UPDATE',
        remark: remark,
        // plt_num and loc are not directly relevant here, ensure your table allows them to be null or provide defaults
      });

    if (historyError) {
      console.error('[actions.ts] Failed to log password change to record_history:', historyError);
      // Non-critical error, so we don't return failure for the whole action
    }
  } catch (e) {
    console.error('[actions.ts] Exception while logging password change to history:', e);
  }
}

export async function updateUserPasswordInDbAction(
  clockNumberStr: string, 
  newPassword: string
): Promise<UpdatePasswordResult> {
  const supabaseAdmin = createClient( // Create instance inside function
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  console.log(`[PW_CHANGE_ACTION] Called for clock: ${clockNumberStr}`); // Log entry

  const clockNumberValidation = clockNumberSchema.safeParse(clockNumberStr);
  if (!clockNumberValidation.success) {
    console.error('[PW_CHANGE_ACTION] Clock number validation failed:', clockNumberValidation.error.errors);
    return { success: false, error: clockNumberValidation.error.errors[0]?.message || 'Invalid Clock Number format.' };
  }
  const clockNumber = clockNumberValidation.data;

  const passwordValidation = passwordSchema.safeParse(newPassword);
  if (!passwordValidation.success) {
    console.error('[PW_CHANGE_ACTION] Password validation failed:', passwordValidation.error.errors);
    return { success: false, error: passwordValidation.error.errors[0]?.message || 'Invalid password format.' };
  }

  try {
    console.log(`[PW_CHANGE_ACTION] Attempting to update password for clock number: ${clockNumber}`);

    const saltRounds = 10; // Standard salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log(`[PW_CHANGE_ACTION] Generated hashedPassword for ${clockNumber}: ${hashedPassword.substring(0, 10)}...`); 

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('data_id')
      .update({
        password: hashedPassword, 
        first_login: false
      })
      .eq('id', clockNumber)
      .select(); 

    // Log the full updateError object and data
    console.log(`[PW_CHANGE_ACTION] Supabase update result for ${clockNumber} - Error:`, JSON.stringify(updateError));
    console.log(`[PW_CHANGE_ACTION] Supabase update result for ${clockNumber} - Data:`, JSON.stringify(updateData));

    if (updateError) {
      console.error('[PW_CHANGE_ACTION] Error updating password in data_id for clock number:', clockNumber, updateError);
      if (updateError.code === 'PGRST116' || (updateError.details && updateError.details.includes('0 rows'))) { 
         return { success: false, error: 'User not found. Password not updated.' };
      }
      return { success: false, error: 'Failed to update password in database. ' + updateError.message };
    }
    
    // Check if the update operation actually affected any rows
    if (!updateData || updateData.length === 0) {
        console.warn(`[PW_CHANGE_ACTION] Update for clock number ${clockNumber} matched 0 rows. User might not exist or ID is incorrect.`);
        // This indicates the .eq('id', clockNumber) did not find a match, so no update occurred.
        // This is a different scenario than updateError, which means the query itself had a problem.
        return { success: false, error: 'User not found for password update. Please check the Clock Number.' };
    }

    console.log(`[PW_CHANGE_ACTION] Password updated successfully in DB for clock number: ${clockNumber}. first_login set to false.`);
    await logPasswordChangeToHistory(clockNumber, 'User updated password successfully after first login.');

    console.log(`[PW_CHANGE_ACTION] Returning success for clock: ${clockNumber}`);
    return { success: true };

  } catch (e: any) {
    console.error('[PW_CHANGE_ACTION] Unexpected error in updateUserPasswordInDbAction:', e);
    return { success: false, error: e.message || 'An unexpected server error occurred while updating password.' };
  }
} 