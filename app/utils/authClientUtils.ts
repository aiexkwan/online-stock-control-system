'use client';

import { getCookie } from 'cookies-next';
import { supabase } from '@/lib/supabase';

/**
 * 從 cookie 中讀取時鐘號碼並設置到 localStorage
 * 這個函數應該在客戶端組件初始化時調用
 */
export function synchronizeAuthState(): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      // 檢查 Supabase 會話
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      if (session) {
        // 用戶已經登入 Supabase Auth
        const user = session.user;
        let clockNumber = null;
        
        // 從元數據中獲取時鐘編號
        if (user.user_metadata?.clock_number) {
          clockNumber = user.user_metadata.clock_number;
        }
        
        // 如果找不到，嘗試從 cookie 讀取
        if (!clockNumber) {
          clockNumber = getCookie('loggedInUserClockNumber') as string;
        }
        
        // 設置到 localStorage
        if (clockNumber && typeof window !== 'undefined') {
          localStorage.setItem('loggedInUserClockNumber', clockNumber);
          
          // 設置其他舊系統需要的值
          const isFirstLogin = user.user_metadata?.first_login === true;
          if (isFirstLogin) {
            localStorage.setItem('firstLogin', 'true');
          }
        }
      } else {
        // 如果沒有會話，清除 localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('loggedInUserClockNumber');
          localStorage.removeItem('user');
          localStorage.removeItem('isTemporaryLogin');
          localStorage.removeItem('firstLogin');
        }
      }
    } catch (error) {
      console.error('Error synchronizing auth state:', error);
    }
    
    resolve();
  });
}

/**
 * 獲取當前登入用戶的時鐘號碼
 */
export function getLoggedInClockNumber(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // 優先從 localStorage 中獲取
  const fromLocalStorage = localStorage.getItem('loggedInUserClockNumber');
  if (fromLocalStorage) {
    return fromLocalStorage;
  }
  
  // 如果不在 localStorage 中，嘗試從 cookie 讀取
  return getCookie('loggedInUserClockNumber') as string || null;
} 