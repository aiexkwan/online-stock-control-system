'use server';

// import { supabase } from '@/lib/supabase'; // 舊的全局客戶端，將被替換
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js'; // 用於 Admin Client
import type { SupabaseClient } from '@supabase/supabase-js'; // 只導入類型
import _bcrypt from 'bcryptjs';
import { createClient as createServerSupabaseClient } from '@/app/utils/supabase/server'; // 新的服務器客戶端

import { getErrorMessage } from '@/lib/types/error-handling';

// Admin client 保持不變，它用於特殊權限操作，不依賴用戶會話
const _getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key is required for admin client');
  }
  return createAdminSupabaseClient(supabaseUrl, supabaseServiceKey);
};

/**
 * 更新用戶密碼並處理首次登入標記
 * 此函數已接收 supabaseActionClient (SupabaseClient 類型)
 */
export async function updatePasswordWithSupabaseAuth(
  newPassword: string,
  supabaseActionClient: SupabaseClient // 這個 client 應該是由 Server Action 創建並傳入的
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. 更新 Supabase Auth 中的用戶密碼
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(
        '[updatePasswordWithSupabaseAuth] Attempting to update password in Supabase Auth'
      );
    const { error: updateError } = await supabaseActionClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error(
        '[updatePasswordWithSupabaseAuth] Error updating password in Supabase Auth:',
        updateError
      );
      return {
        success: false,
        error: `Supabase Auth password update failed: ${getErrorMessage(updateError)}`,
      };
    }
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(
        '[updatePasswordWithSupabaseAuth] Successfully updated password in Supabase Auth'
      );

    // 2. 清除 needs_password_change 標誌
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(
        '[updatePasswordWithSupabaseAuth] Attempting to clear needs_password_change flag'
      );
    const { error: updateMetaError } = await supabaseActionClient.auth.updateUser({
      data: { needs_password_change: false },
    });

    if (updateMetaError) {
      // 如果清除標誌失敗，記錄錯誤但仍視為成功，因為密碼已更改
      console.error(
        '[updatePasswordWithSupabaseAuth] Error clearing needs_password_change flag:',
        updateMetaError
      );
      // 可以選擇返回一個特定的錯誤或警告，但主要操作（密碼更改）已成功
    } else {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(
          '[updatePasswordWithSupabaseAuth] Successfully cleared needs_password_change flag'
        );
    }

    // 移除舊系統 data_id 表的密碼更新邏輯 (如果需要保留，請確保使用正確的 client 和邏輯)
    // 例如，如果之前有這樣的代碼：
    // const { _error: dbError } = await supabaseAdmin // 或其他 client
    //   .from('data_id')
    //   .update({ password_hash: newPasswordHash }) // 注意：這裡需要正確的哈希
    //   .eq('id', clockNumber);
    // if (dbError) {
    //   console.error('[updatePasswordWithSupabaseAuth] Error updating password in data_id table:', dbError);
    //   // 考慮如何處理這種情況，可能需要回滾或記錄
    // }

    return { success: true };
  } catch (error: unknown) {
    console.error('[updatePasswordWithSupabaseAuth] Unexpected error:', error);
    return { success: false, error: `Update failed: ${getErrorMessage(error) || 'Unknown error'}` };
  }
}

/**
 * Signs out the current user.
 * If a SupabaseClient instance is provided, it will be used; otherwise, a new server client is created.
 */
export async function signOut(supabaseInstance?: SupabaseClient): Promise<void> {
  const supabase = supabaseInstance || (await createServerSupabaseClient());
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[signOut] Error signing out:', error);
  } else {
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log('[signOut] User signed out process initiated.');
  }
}
