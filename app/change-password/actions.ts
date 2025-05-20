'use server';

import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { clockNumberSchema, passwordSchema } from '@/app/actions/schemas';
import { updatePasswordWithSupabaseAuth } from '../services/supabaseAuth';

// COMMENT OUT or REMOVE the module-level supabaseAdmin instance AGAIN
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

interface UpdatePasswordResult {
  success: boolean;
  error?: string;
}

/**
 * 更新用戶密碼 - 使用 Supabase Auth + 保持與舊系統同步
 */
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
    // 使用 Supabase Auth 更新密碼
    const result = await updatePasswordWithSupabaseAuth(clockNumber.toString(), newPassword);
    
    if (!result.success) {
      console.error('[PW_CHANGE_ACTION] Error updating password with Supabase Auth:', result.error);
      return { success: false, error: result.error || 'Failed to update password.' };
    }
    
    console.log(`[PW_CHANGE_ACTION] Password updated successfully for clock number: ${clockNumber}.`);
    await logPasswordChangeToHistory(clockNumber.toString(), 'User updated password successfully.');

    return { success: true };
  } catch (e: any) {
    console.error('[PW_CHANGE_ACTION] Unexpected error in updateUserPasswordInDbAction:', e);
    return { success: false, error: e.message || 'An unexpected server error occurred while updating password.' };
  }
}

// 記錄密碼變更到歷史記錄
async function logPasswordChangeToHistory(clockNumber: string, message: string) {
  try {
    await supabase.from('record_history').insert({
      id: clockNumber,
      action: 'Password Change',
      remark: message
    });
    console.log(`[PW_CHANGE_ACTION] Password change logged to history for user ${clockNumber}`);
  } catch (error) {
    console.error('[PW_CHANGE_ACTION] Failed to log password change to history:', error);
  }
} 