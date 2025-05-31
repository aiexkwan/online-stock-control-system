'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { createClient } from '@/lib/supabase';
import { syncAuthStateToLocalStorage, clearLocalAuthData } from '../utils/auth-sync';
import { getUserRole } from '../hooks/useAuth';

/**
 * AuthStateSync 組件負責監聽 Supabase Auth 狀態變化並保持本地儲存同步。
 * 這對於保持與傳統系統兼容性非常重要，因為許多現有組件仍然依賴 localStorage。
 */
export default function AuthStateSync() {
  const router = useRouter();
  const supabase = createClient();
  const [syncAttempts, setSyncAttempts] = useState(0);
  const maxAttempts = 5; // 增加最大嘗試次數
  const activeSessionRef = useRef(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // 定義需要認證的路由
  const protectedRoutes = [
    '/access',
    '/dashboard',
    '/admin',
    '/home',
    '/reports',
    '/view-history',
    '/void-pallet',
    '/tables',
    '/inventory',
    '/history',
    '/products',
    '/productUpdate',
    '/stock-transfer',
    '/print-label',
    '/print-grnlabel',
    '/change-password'
  ];
  
  // 強力保存認證狀態的函數
  const forcePreserveAuthState = () => {
    const userIdFromCookie = getCookie('loggedInUserClockNumber');
    const userIdFromStorage = localStorage.getItem('loggedInUserClockNumber');
    
    // 日誌用於調試
    console.log(`[AuthStateSync] Preserve check - Cookie: ${userIdFromCookie}, Storage: ${userIdFromStorage}`);
    
    if (userIdFromCookie || userIdFromStorage) {
      activeSessionRef.current = true;
      
      // 從 cookie 更新 localStorage（如果需要）
      if (userIdFromCookie && (!userIdFromStorage || userIdFromStorage !== userIdFromCookie)) {
        localStorage.setItem('loggedInUserClockNumber', userIdFromCookie.toString());
        console.log(`[AuthStateSync] Updated localStorage from cookie: ${userIdFromCookie}`);
      }
      
      // 從 localStorage 更新 cookie（如果需要）
      if (userIdFromStorage && !userIdFromCookie) {
        document.cookie = `loggedInUserClockNumber=${userIdFromStorage}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        console.log(`[AuthStateSync] Updated cookie from localStorage: ${userIdFromStorage}`);
      }
      
      // 在 meta 標籤中也存儲這個值（用於組件間通信）
      let metaTag = document.querySelector('meta[name="auth-user-id"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'auth-user-id');
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', userIdFromStorage || userIdFromCookie?.toString() || '');
      
      return true;
    }
    
    return false;
  };
  
  useEffect(() => {
    // 檢查是否為公開路徑，如果是則跳過認證邏輯 - 應與 ClientLayout 保持一致
    const publicPaths = [
      '/main-login',
      '/new-password'
    ];
    const currentPath = window.location.pathname;
    if (publicPaths.some(path => currentPath.startsWith(path))) {
      console.log(`[AuthStateSync] Public path detected (${currentPath}), skipping auth checks.`);
      return; // 跳過下面的認證邏輯
    }
    
    // 1. 檢查 header 中的 X-Auth-User-ID
    const checkHeaderAuth = () => {
      const userId = document.querySelector('meta[name="x-auth-user-id"]')?.getAttribute('content');
      
      if (userId) {
        console.log(`[AuthStateSync] Found user ID in response header: ${userId}`);
        localStorage.setItem('loggedInUserClockNumber', userId);
        // 同時設置到 cookie
        document.cookie = `loggedInUserClockNumber=${userId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        return true;
      }
      return false;
    };
    
    // 2. 檢查並同步 cookie 到 localStorage
    const syncCookieToStorage = () => {
      const userIdFromCookie = getCookie('loggedInUserClockNumber');
      if (userIdFromCookie) {
        console.log(`[AuthStateSync] Syncing cookie to localStorage: ${userIdFromCookie}`);
        localStorage.setItem('loggedInUserClockNumber', userIdFromCookie.toString());
        return true;
      }
      return false;
    };
    
    // 3. 檢查 localStorage 中是否已有用戶 ID
    const checkLocalStorage = () => {
      const userId = localStorage.getItem('loggedInUserClockNumber');
      if (userId) {
        // 確保 cookie 也被設置
        document.cookie = `loggedInUserClockNumber=${userId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        return true;
      }
      return false;
    };
    
    // 執行同步
    const attemptSync = () => {
      // 如果已經達到最大嘗試次數，放棄
      if (syncAttempts >= maxAttempts) {
        console.error(`[AuthStateSync] Max sync attempts (${maxAttempts}) reached on page ${window.location.pathname}. Auth state might be inconsistent. Will not redirect.`);
        // alert(`Authentication sync failed after ${maxAttempts} attempts. Please try refreshing the page or logging in again if issues persist.`);
        // setErrorState('Auth sync failed. Please refresh.'); // Example for global error state
        return; // 停止進一步操作，避免重定向
      }

      // 嘗試各種同步方法
      const headerSynced = checkHeaderAuth();
      const cookieSynced = syncCookieToStorage();
      const localStorageHasUser = checkLocalStorage();
      const forceSynced = forcePreserveAuthState();
      
      if (headerSynced || cookieSynced || localStorageHasUser || forceSynced) {
        console.log('[AuthStateSync] Auth state successfully synchronized');
        activeSessionRef.current = true;
      } else {
        // 增加嘗試次數並安排重試
        setSyncAttempts(prev => prev + 1);
        
        // 使用指數退避策略進行重試
        const delay = Math.min(1000 * Math.pow(1.5, syncAttempts), 5000); // 最大延遲 5 秒
        console.log(`[AuthStateSync] Auth sync failed, retrying in ${delay}ms (attempt ${syncAttempts + 1}/${maxAttempts})`);
        
        setTimeout(attemptSync, delay);
      }
    };
    
    // 開始同步過程
    attemptSync();
    
    // 設置頻繁的狀態保活檢查，每 10 秒檢查一次
    const preserveIntervalId = setInterval(() => {
      forcePreserveAuthState();
    }, 10000);
    
    // 設置定期檢查，確保認證狀態在頁面打開期間保持同步，每 30 秒一次
    const syncIntervalId = setInterval(() => {
      syncCookieToStorage();
      checkLocalStorage();
    }, 30000);
    
    // 頁面即將卸載時，也嘗試保存狀態
    const handleBeforeUnload = () => {
      forcePreserveAuthState();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 設置 Supabase Auth 狀態變化監聽器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthStateSync] Auth state changed: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // 用戶登入或令牌更新，同步狀態
        try {
          const syncResult = await syncAuthStateToLocalStorage();
          forcePreserveAuthState();
          
          // 處理角色導向重定向
          if (session?.user) {
            await handleRoleBasedRedirect(session.user);
          }
          
          if (!syncResult && syncAttempts < maxAttempts) {
            // 如果同步失敗，嘗試重試幾次 (使用遞增延遲)
            setSyncAttempts(prev => prev + 1);
            console.log(`[AuthStateSync] Sync attempt failed, scheduling retry ${syncAttempts + 1}/${maxAttempts}`);
            
            setTimeout(async () => {
              await syncAuthStateToLocalStorage();
              forcePreserveAuthState();
            }, 1000 * (syncAttempts + 1)); // 1秒、2秒、3秒延遲
          }
        } catch (error) {
          console.error('[AuthStateSync] Error syncing auth state:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        // 用戶登出
        activeSessionRef.current = false;
        clearLocalAuthData();
        setHasRedirected(false); // 重置重定向狀態
      }
    });

    // 頁面加載時檢查用戶訪問權限
    checkUserAccess();

    // 組件卸載時清理
    return () => {
      clearInterval(preserveIntervalId);
      clearInterval(syncIntervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      subscription.unsubscribe();
    };
  }, [router, syncAttempts, maxAttempts]);

  // 檢查用戶是否有權限訪問當前路徑
  const checkUserAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) return;

      const userRole = getUserRole(user.email);
      const currentPath = window.location.pathname;

      // Admin 用戶沒有限制
      if (userRole.type === 'admin') return;

      // 檢查當前路徑是否在允許的路徑中
      const isAllowed = userRole.allowedPaths.some(path => currentPath.startsWith(path));
      
      if (!isAllowed && !hasRedirected) {
        console.log(`[AuthStateSync] User ${user.email} (${userRole.type}) redirected from ${currentPath} to ${userRole.defaultPath}`);
        setHasRedirected(true);
        router.push(userRole.defaultPath);
      }
    } catch (error) {
      console.error('[AuthStateSync] Error checking user access:', error);
    }
  };

  // 處理登入後的角色導向重定向
  const handleRoleBasedRedirect = async (user: any) => {
    if (!user?.email || hasRedirected) return;

    const userRole = getUserRole(user.email);
    const currentPath = window.location.pathname;

    // 如果用戶在登入頁面，重定向到默認頁面
    if (currentPath.startsWith('/main-login') || currentPath === '/') {
      console.log(`[AuthStateSync] User ${user.email} (${userRole.type}) redirected to default page: ${userRole.defaultPath}`);
      setHasRedirected(true);
      router.push(userRole.defaultPath);
      return;
    }

    // 檢查當前頁面是否允許訪問
    if (userRole.type !== 'admin') {
      const isAllowed = userRole.allowedPaths.some(path => currentPath.startsWith(path));
      if (!isAllowed) {
        console.log(`[AuthStateSync] User ${user.email} (${userRole.type}) redirected from unauthorized page ${currentPath} to ${userRole.defaultPath}`);
        setHasRedirected(true);
        router.push(userRole.defaultPath);
      }
    }
  };

  // 這是一個無 UI 的組件，只處理同步邏輯
  return null;
} 