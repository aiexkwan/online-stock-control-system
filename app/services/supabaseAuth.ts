'use server';

// import { supabase } from '@/lib/supabase'; // 舊的全局客戶端，將被替換
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js'; // 用於 Admin Client
import type { SupabaseClient } from '@supabase/supabase-js'; // 只導入類型
import { createClient as createServerSupabaseClient } from '@/app/utils/supabase/server'; // 新的服務器客戶端

import bcrypt from 'bcryptjs';
import { UserData } from './auth';
import { clockNumberToEmail, emailToClockNumber } from '../utils/authUtils';

// Admin client 保持不變，它用於特殊權限操作，不依賴用戶會話
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key is required for admin client');
  }
  return createAdminSupabaseClient(supabaseUrl, supabaseServiceKey);
};

/**
 * 使用公共方法檢查用戶是否已經在 Supabase Auth 中
 */
export async function userExistsInSupabaseAuth(clockNumber: string): Promise<boolean> {
  const supabase = createServerSupabaseClient(); // 使用服務器客戶端
  try {
    const email = clockNumberToEmail(clockNumber);
    console.log(`[userExistsInSupabaseAuth] Checking if user exists: ${email}`);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error && error.message.includes('User not found')) {
      return false;
    }
    return true;
  } catch (error: any) {
    console.error('[userExistsInSupabaseAuth] Unexpected error:', error.message);
    return false;
  }
}

/**
 * 將現有用戶遷移到 Supabase Auth
 */
export async function migrateUserToSupabaseAuth(clockNumber: string, password: string | null): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createServerSupabaseClient(); // 使用服務器客戶端
  const supabaseAdmin = getAdminClient(); // 用於讀取 data_id 和可能的管理操作

  try {
    console.log(`[migrateUserToSupabaseAuth] Starting migration for user: ${clockNumber}`);
    
    // 1. 從 data_id 表獲取用戶資料 (使用 admin client 可能更合適，如果 RLS 限制了普通服務器 client)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('data_id')
      .select('*')
      .eq('id', clockNumber)
      .single();

    if (userError || !userData) {
      return { success: false, error: `User data not found: ${userError?.message || 'Unknown error'}` };
    }

    const userExists = await userExistsInSupabaseAuth(clockNumber); // userExistsInSupabaseAuth 內部已使用 server client
    if (userExists) {
      return { success: true };
    }

    const email = clockNumberToEmail(clockNumber);
    const userPassword = !password ? clockNumber : password;
    
    // signUp 應該使用標準的服務器客戶端，它會處理用戶會話
    const { data: authData, error: createError } = await supabase.auth.signUp({
      email,
      password: userPassword,
      options: {
        data: {
          clock_number: clockNumber,
          name: userData.name,
          department: userData.department,
          needs_password_change: true,
          permissions: {
            qc: !!userData.qc,
            receive: !!userData.receive,
            void: !!userData.void,
            view: !!userData.view,
            resume: !!userData.resume,
            report: !!userData.report
          }
        }
      }
    });

    if (createError) {
      return { success: false, error: `Failed to create auth user: ${createError.message}` };
    }
    if (!authData || !authData.user) {
      return { success: false, error: 'User creation response did not include user data' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Migration failed: ${error.message || 'Unknown error'}` };
  }
}

/**
 * 使用 Supabase Auth 登入
 */
export async function signInWithSupabaseAuth(clockNumber: string, password: string): Promise<{
  success: boolean;
  user?: UserData;
  isFirstLogin?: boolean;
  error?: string;
  session?: any; // 注意：signInWithPassword 返回的 session 類型
}> {
  const supabase = createServerSupabaseClient(); // 使用服務器客戶端
  try {
    const email = clockNumberToEmail(clockNumber);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('[signInWithSupabaseAuth] Login error:', error);
      
      // 檢查是否是因為用戶不存在
      if (error.message.includes('Invalid login credentials')) {
        console.log('[signInWithSupabaseAuth] Invalid credentials, checking if user exists in Auth');
        
        // 檢查用戶是否存在於 Supabase Auth 中
        const userExists = await userExistsInSupabaseAuth(clockNumber);
        if (!userExists) {
          console.log('[signInWithSupabaseAuth] User does not exist in Auth, might need migration');
        }
      }
      
      return { success: false, error: error.message };
    }

    if (!data || !data.user) {
      console.error('[signInWithSupabaseAuth] No user data returned from Supabase Auth');
      return { success: false, error: 'Authentication failed: No user returned' };
    }

    const { user: authUser, session } = data;
    const metadata = authUser.user_metadata || {};
    
    console.log(`[signInWithSupabaseAuth] User ${clockNumber} logged in successfully`);
    
    // 構建符合現有 UserData 結構的用戶資料
    const userData: UserData = {
      id: metadata.clock_number || clockNumber,
      name: metadata.name || '',
      department: metadata.department || '',
      permissions: metadata.permissions || {
        qc: false,
        receive: false,
        void: false,
        view: false,
        resume: false,
        report: false
      }
    };

    // 檢查是否需要更改密碼（基於元數據）
    const needsPasswordChange = metadata.needs_password_change === true;
    
    if (needsPasswordChange) {
      console.log(`[signInWithSupabaseAuth] First login (needs password change) detected for user: ${clockNumber}`);
    }

    return {
      success: true,
      user: userData,
      isFirstLogin: needsPasswordChange,
      session: session
    };
  } catch (error: any) {
    console.error('[signInWithSupabaseAuth] Unexpected error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

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
    console.log('[updatePasswordWithSupabaseAuth] Attempting to update password in Supabase Auth');
    const { error: updateError } = await supabaseActionClient.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('[updatePasswordWithSupabaseAuth] Error updating password in Supabase Auth:', updateError);
      return { success: false, error: `Supabase Auth password update failed: ${updateError.message}` };
    }
    console.log('[updatePasswordWithSupabaseAuth] Successfully updated password in Supabase Auth');

    // 2. 清除 needs_password_change 標誌
    console.log('[updatePasswordWithSupabaseAuth] Attempting to clear needs_password_change flag');
    const { error: updateMetaError } = await supabaseActionClient.auth.updateUser({
      data: { needs_password_change: false }
    });

    if (updateMetaError) {
      // 如果清除標誌失敗，記錄錯誤但仍視為成功，因為密碼已更改
      console.error('[updatePasswordWithSupabaseAuth] Error clearing needs_password_change flag:', updateMetaError);
      // 可以選擇返回一個特定的錯誤或警告，但主要操作（密碼更改）已成功
    } else {
      console.log('[updatePasswordWithSupabaseAuth] Successfully cleared needs_password_change flag');
    }
    
    // 移除舊系統 data_id 表的密碼更新邏輯 (如果需要保留，請確保使用正確的 client 和邏輯)
    // 例如，如果之前有這樣的代碼：
    // const { error: dbError } = await supabaseAdmin // 或其他 client
    //   .from('data_id')
    //   .update({ password_hash: newPasswordHash }) // 注意：這裡需要正確的哈希
    //   .eq('id', clockNumber);
    // if (dbError) {
    //   console.error('[updatePasswordWithSupabaseAuth] Error updating password in data_id table:', dbError);
    //   // 考慮如何處理這種情況，可能需要回滾或記錄
    // }

    return { success: true };
  } catch (error: any) {
    console.error('[updatePasswordWithSupabaseAuth] Unexpected error:', error);
    return { success: false, error: `Update failed: ${error.message || 'Unknown error'}` };
  }
}

/**
 * 登出
 * 如果在服務器端調用 (例如 Server Action)，應傳入服務器客戶端
 * 如果在客戶端調用，則不傳參數，內部會使用客戶端 client (需要修改)
 */
export async function signOut(supabaseInstance?: SupabaseClient): Promise<void> {
  if (supabaseInstance) {
    // 從服務器端調用 (例如 Server Action)
    await supabaseInstance.auth.signOut();
  } else {
    // 從客戶端調用 - 需要創建客戶端 client
    // const supabase = createClientComponentClient(); // 假設您有一個 createClientComponentClient 的輔助函數
    // 為簡化，我們假設 signOut 主要從服務器 Action 或需要客戶端自行處理其 client 的地方調用
    // 如果需要在服務內部創建客戶端 client，則需要導入 app/utils/supabase/client.ts 中的 createClient
    // 例如: import { createClient as createBrowserClient } from '@/app/utils/supabase/client';
    // const browserClient = createBrowserClient();
    // await browserClient.auth.signOut();
    throw new Error("signOut called without a SupabaseClient instance on the server or not implemented for client-side without instance yet.");
  }
  // 客戶端 localStorage 清理邏輯應在實際的客戶端登出函數中處理，而不是在這裡的服務中
  console.log('[signOut] User signed out process initiated.');
} 