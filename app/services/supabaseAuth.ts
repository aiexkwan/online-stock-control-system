'use server';

import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { UserData } from './auth';
import { clockNumberToEmail, emailToClockNumber } from '../utils/authUtils';

// 使用 admin client 來執行需要更高權限的操作
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

/**
 * 檢查用戶是否已經在 Supabase Auth 中
 */
export async function userExistsInSupabaseAuth(clockNumber: string): Promise<boolean> {
  try {
    const email = clockNumberToEmail(clockNumber);
    const supabaseAdmin = getAdminClient();
    
    // 使用 listUsers API 查找所有用戶，然後在內存中過濾
    // 注意：Supabase Admin API 目前不直接支持通過郵件過濾
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100 // 獲取合理數量的用戶以進行過濾
    });
    
    if (error) {
      console.error('[userExistsInSupabaseAuth] Error checking if user exists:', error);
      throw error;
    }
    
    // 在結果中查找匹配的電子郵件
    const userExists = data.users.some(user => user.email === email);
    return userExists;
  } catch (error: any) {
    console.error('[userExistsInSupabaseAuth] Unexpected error:', error.message);
    // 如果出現錯誤，為了安全起見，返回 false
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
  try {
    console.log(`[migrateUserToSupabaseAuth] Starting migration for user: ${clockNumber}`);
    
    // 1. 從 data_id 表獲取用戶資料
    const { data: userData, error: userError } = await supabase
      .from('data_id')
      .select('*')
      .eq('id', clockNumber)
      .single();

    if (userError || !userData) {
      console.error('[migrateUserToSupabaseAuth] Error fetching user data:', userError);
      return { success: false, error: `User data not found: ${userError?.message || 'Unknown error'}` };
    }

    // 2. 檢查用戶是否已經存在於 Supabase Auth
    const userExists = await userExistsInSupabaseAuth(clockNumber);
    if (userExists) {
      console.log(`[migrateUserToSupabaseAuth] User ${clockNumber} already exists in Supabase Auth`);
      return { success: true }; // 用戶已經遷移，不需要再做任何事
    }

    // 3. 創建 Supabase Auth 用戶
    const supabaseAdmin = getAdminClient();
    const email = clockNumberToEmail(clockNumber);
    
    // 如果是首次登入或沒有密碼，設置一個臨時密碼（用戶 ID）
    const userPassword = userData.first_login || !password ? clockNumber : password;
    
    console.log(`[migrateUserToSupabaseAuth] Creating Supabase Auth user with email: ${email}`);
    
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true, // 直接確認電郵，不需要驗證
      user_metadata: {
        clock_number: clockNumber,
        name: userData.name,
        department: userData.department,
        first_login: !!userData.first_login,
        permissions: {
          qc: !!userData.qc,
          receive: !!userData.receive,
          void: !!userData.void,
          view: !!userData.view,
          resume: !!userData.resume,
          report: !!userData.report
        }
      }
    });

    if (createError) {
      console.error('[migrateUserToSupabaseAuth] Error creating Supabase Auth user:', createError);
      return { success: false, error: `Failed to create auth user: ${createError.message}` };
    }

    console.log(`[migrateUserToSupabaseAuth] Successfully migrated user ${clockNumber} to Supabase Auth`);
    return { success: true };
  } catch (error: any) {
    console.error('[migrateUserToSupabaseAuth] Error:', error);
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
  isTemporaryLogin?: boolean;
  error?: string;
  session?: any;
}> {
  try {
    console.log(`[signInWithSupabaseAuth] Attempting login for user: ${clockNumber}`);
    const email = clockNumberToEmail(clockNumber);
    
    // 嘗試登入
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

    // 從用戶元數據中提取資料
    const { user } = data;
    const metadata = user.user_metadata || {};
    
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

    // 檢查是否是首次登入
    const isFirstLogin = !!metadata.first_login;
    if (isFirstLogin) {
      console.log(`[signInWithSupabaseAuth] First login detected for user: ${clockNumber}`);
    }

    return {
      success: true,
      user: userData,
      isFirstLogin,
      session: data.session
    };
  } catch (error: any) {
    console.error('[signInWithSupabaseAuth] Unexpected error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * 更新用戶密碼並處理首次登入標記
 */
export async function updatePasswordWithSupabaseAuth(clockNumber: string, newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. 檢查用戶是否存在於 Supabase Auth
    const userExists = await userExistsInSupabaseAuth(clockNumber);
    
    if (!userExists) {
      // 如果用戶不存在於 Supabase Auth，嘗試遷移
      const migrationResult = await migrateUserToSupabaseAuth(clockNumber, null);
      if (!migrationResult.success) {
        return { success: false, error: `User migration failed: ${migrationResult.error}` };
      }
    }
    
    // 2. 更新密碼
    const supabaseAdmin = getAdminClient();
    const email = clockNumberToEmail(clockNumber);
    
    // 使用 listUsers 來獲取用戶，然後在 JavaScript 中查找匹配的電子郵件
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    if (listError) {
      console.error('[updatePasswordWithSupabaseAuth] Error listing users:', listError);
      return { success: false, error: `Could not find user: ${listError.message}` };
    }
    
    // 查找匹配電子郵件的用戶
    const user = usersData.users.find(user => user.email === email);
    
    if (!user) {
      return { success: false, error: `User with email ${email} not found` };
    }
    
    // 更新密碼
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        user_metadata: {
          ...user.user_metadata,
          first_login: false
        }
      }
    );
    
    if (updateError) {
      console.error('[updatePasswordWithSupabaseAuth] Error updating password:', updateError);
      return { success: false, error: `Password update failed: ${updateError.message}` };
    }
    
    // 3. 同時更新 data_id 表中的密碼和首次登入標記
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: dbError } = await supabase
      .from('data_id')
      .update({
        password: hashedPassword,
        first_login: false
      })
      .eq('id', clockNumber);
    
    if (dbError) {
      console.error('[updatePasswordWithSupabaseAuth] Error updating data_id table:', dbError);
      // 這裡我們不返回錯誤，因為 Supabase Auth 密碼已經成功更新
      // 只記錄錯誤，因為這不應該影響用戶體驗
      console.warn('Warning: Password updated in Supabase Auth but not in data_id table');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('[updatePasswordWithSupabaseAuth] Error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
} 