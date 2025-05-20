'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { syncAuthStateToLocalStorage, clearLocalAuthData } from '../utils/auth-sync';

/**
 * AuthStateSync 組件負責監聽 Supabase Auth 狀態變化並保持本地儲存同步。
 * 這對於保持與傳統系統兼容性非常重要，因為許多現有組件仍然依賴 localStorage。
 */
export default function AuthStateSync() {
  const [syncAttempts, setSyncAttempts] = useState(0);
  
  useEffect(() => {
    // 同步初始狀態
    const initialSync = async () => {
      try {
        console.log('[AuthStateSync] Performing initial auth state sync');
        const syncResult = await syncAuthStateToLocalStorage();
        
        if (!syncResult) {
          console.log('[AuthStateSync] Initial sync unsuccessful, trying cookie fallback');
          // 如果 Supabase 會話同步失敗，嘗試從 cookie 讀取時鐘編號作為後備
          if (typeof document !== 'undefined') {
            const cookieStr = document.cookie;
            const clockNumberMatch = cookieStr.match(/loggedInUserClockNumber=([^;]+)/);
            
            if (clockNumberMatch && clockNumberMatch[1]) {
              const clockNumber = clockNumberMatch[1];
              console.log(`[AuthStateSync] Found clock number in cookie: ${clockNumber}`);
              
              if (typeof window !== 'undefined') {
                localStorage.setItem('loggedInUserClockNumber', clockNumber);
                console.log(`[AuthStateSync] Saved clock number to localStorage from cookie`);
              }
            }
          }
        } else {
          console.log('[AuthStateSync] Initial sync successful');
        }
      } catch (error) {
        console.error('[AuthStateSync] Error during initial sync:', error);
      }
    };
    
    // 立即執行初始同步
    initialSync();
    
    // 設置定期同步 (每分鐘檢查一次)
    const intervalId = setInterval(async () => {
      try {
        await syncAuthStateToLocalStorage();
      } catch (error) {
        console.error('[AuthStateSync] Error during periodic sync:', error);
      }
    }, 60000);
    
    // 設置 Supabase Auth 狀態變化監聽器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthStateSync] Auth state changed: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // 用戶登入或令牌更新，同步狀態
        try {
          const syncResult = await syncAuthStateToLocalStorage();
          
          if (!syncResult && syncAttempts < 3) {
            // 如果同步失敗，嘗試重試幾次 (使用遞增延遲)
            setSyncAttempts(prev => prev + 1);
            console.log(`[AuthStateSync] Sync attempt failed, scheduling retry ${syncAttempts + 1}/3`);
            
            setTimeout(async () => {
              await syncAuthStateToLocalStorage();
            }, 1000 * (syncAttempts + 1)); // 1秒、2秒、3秒延遲
          }
        } catch (error) {
          console.error('[AuthStateSync] Error syncing auth state:', error);
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // 用戶登出或刪除，清除本地狀態
        clearLocalAuthData();
      }
    });

    // 組件卸載時清理
    return () => {
      clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, [syncAttempts]);

  // 這是一個無渲染組件，僅處理邏輯
  return null;
} 