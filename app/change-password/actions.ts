'use server';

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Initialize Supabase Admin Client
// Ensure these environment variables are set in your .env.local and Vercel environment
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const clockNumberSchema = z.string().regex(/^\d+$/, { message: 'Clock Number must be a positive number string.' }).transform(val => parseInt(val, 10));

// Password must be at least 6 characters, and contain at least one letter and one number.
const passwordSchema = z.string()
  .min(6, { message: 'Password must be at least 6 characters long.' })
  .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter.' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number.' });

interface UpdatePasswordResult {
  success: boolean;
  error?: string;
}

async function logPasswordChangeToHistory(userId: number, remark: string): Promise<void> {
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
  const clockNumberValidation = clockNumberSchema.safeParse(clockNumberStr);
  if (!clockNumberValidation.success) {
    return { success: false, error: clockNumberValidation.error.errors[0]?.message || 'Invalid Clock Number format.' };
  }
  const clockNumber = clockNumberValidation.data;

  const passwordValidation = passwordSchema.safeParse(newPassword);
  if (!passwordValidation.success) {
    return { success: false, error: passwordValidation.error.errors[0]?.message || 'Invalid password format.' };
  }

  try {
    console.log(`[actions.ts] Attempting to update password for clock number: ${clockNumber}`);

    const saltRounds = 10; // Standard salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const { error: updateError } = await supabaseAdmin
      .from('data_id')
      .update({
        password: hashedPassword,
        first_login: false, // Set first_login to false after password change
      })
      .eq('id', clockNumber);

    if (updateError) {
      console.error('[actions.ts] Error updating password in data_id for clock number:', clockNumber, updateError);
      if (updateError.code === 'PGRST116' || updateError.details.includes('0 rows')) { // Check if user was not found for update
         return { success: false, error: 'User not found. Password not updated.' };
      }
      return { success: false, error: 'Failed to update password in database. ' + updateError.message };
    }

    console.log(`[actions.ts] Password updated successfully for clock number: ${clockNumber}. first_login set to false.`);
    await logPasswordChangeToHistory(clockNumber, 'User updated password successfully after first login.');

    return { success: true };

  } catch (e: any) {
    console.error('[actions.ts] Unexpected error in updateUserPasswordInDbAction:', e);
    return { success: false, error: e.message || 'An unexpected server error occurred while updating password.' };
  }
} 