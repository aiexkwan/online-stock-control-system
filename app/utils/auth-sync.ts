/**
 * auth-sync.ts
 * 
 * 該文件提供同步 Supabase Auth 認證狀態到 localStorage 的功能，
 * 以保持舊系統的相容性，確保系統可以平滑過渡到 Supabase Auth。
 */

import { supabase } from '@/lib/supabase';
import { emailToClockNumber } from './authUtils';

interface UserData {
  id: string;
  name: string;
  department: string;
  permissions: {
    qc: boolean;
    receive: boolean;
    void: boolean;
    view: boolean;
    resume: boolean;
    report: boolean;
  };
}

/**
 * 將 Supabase Auth 中的用戶數據同步到 localStorage，
 * 確保系統中使用舊式 localStorage 的地方仍然能正常工作。
 * @returns 同步是否成功
 */
export async function syncAuthStateToLocalStorage(): Promise<boolean> {
  try {
    // 獲取當前會話
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Auth Sync] Error fetching session:', error.message);
      // 清除本地存儲
      clearLocalAuthData();
      return false;
    }
    
    if (!session) {
      console.log('[Auth Sync] No active session');
      
      // 檢查是否應該保留狀態（例如，如果我們在等待會話刷新）
      const shouldPreserveState = localStorage.getItem('preserveAuthState') === 'true';
      if (!shouldPreserveState) {
        // 清除本地存儲
        clearLocalAuthData();
      } else {
        console.log('[Auth Sync] Preserving local auth state despite no session');
      }
      
      return false;
    }
    
    const user = session.user;
    
    // 獲取時鐘編號 - 首先從用戶元數據獲取，如果不存在則從郵件中提取
    let clockNumber = user.user_metadata?.clock_number as string || null;
    if (!clockNumber && user.email) {
      clockNumber = emailToClockNumber(user.email);
    }
    
    if (!clockNumber) {
      console.warn('[Auth Sync] User authenticated but no clock number found');
      return false;
    }
    
    // 將時鐘編號存儲到 localStorage
    localStorage.setItem('loggedInUserClockNumber', clockNumber);
    
    // 從用戶元數據中提取數據
    const userData: UserData = {
      id: clockNumber,
      name: user.user_metadata?.name || '',
      department: user.user_metadata?.department || '',
      permissions: user.user_metadata?.permissions || {
        qc: false,
        receive: false,
        void: false,
        view: false,
        resume: false,
        report: false
      }
    };
    
    // 將用戶數據存儲到 localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // 如果有第一次登錄標記，也存儲它
    if (typeof user.user_metadata?.first_login === 'boolean') {
      localStorage.setItem('firstLogin', user.user_metadata.first_login ? 'true' : 'false');
    }
    
    console.log(`[Auth Sync] Successfully synced auth state for user: ${clockNumber}`);
    return true;
  } catch (error: any) {
    console.error('[Auth Sync] Unexpected error:', error.message);
    return false;
  }
}

/**
 * 清除本地認證數據
 */
export function clearLocalAuthData(): void {
  localStorage.removeItem('loggedInUserClockNumber');
  localStorage.removeItem('user');
  localStorage.removeItem('firstLogin');
  localStorage.removeItem('isTemporaryLogin');
  console.log('[Auth Sync] Cleared local auth data');
}

/**
 * 檢查用戶是否已驗證
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error('[Auth] Error checking authentication status:', error);
    return false;
  }
} 