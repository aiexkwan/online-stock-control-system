'use client';

import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { usePathname, useRouter } from 'next/navigation';
import AuthStateSync from './AuthStateSync';
import AuthMeta from './AuthMeta';
import { getCookie } from 'cookies-next';
import { toast } from 'sonner';

interface ClientLayoutProps {
  children: React.ReactNode;
}

// 定義公開路由列表
const publicPathsForClientLayout = [
  '/login',
  '/new-password',
  '/change-password',
  // '/api', // API 路由通常不直接渲染此佈局，可選
  '/print-label',
  '/print-grnlabel',
  '/stock-transfer',
  '/dashboard/open-access'
];

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  // hideSidebar 的判斷可以保留，用於控制導航欄本身的顯示
  const hideSidebar = publicPathsForClientLayout.includes(pathname) || pathname === '/login' || pathname === '/change-password' || pathname === '/new-password';
  const [isTemporaryLogin, setIsTemporaryLogin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // 如果是定義的公開路徑，則不進行後續的 localStorage/cookie 檢查，直接認為已檢查
      if (publicPathsForClientLayout.includes(pathname)) {
        setAuthChecked(true);
        return;
      }
      
      // 對於非公開路徑，執行原有的檢查邏輯
      // 1. 檢查 localStorage
      const userId = localStorage.getItem('loggedInUserClockNumber');
      
      // 2. 檢查 cookie
      const userIdFromCookie = getCookie('loggedInUserClockNumber');
      
      if (!userId && !userIdFromCookie) {
        console.warn('[ClientLayout] No auth data found in localStorage or cookie for protected route:', pathname);
        toast.error('Your session has expired. Please log in again.', {
          id: 'session-timeout',
          duration: 3000,
        });
        
        setTimeout(() => {
          router.push('/login');
        }, 1000);
        return;
      }
      
      if (!userId && userIdFromCookie) {
        localStorage.setItem('loggedInUserClockNumber', userIdFromCookie.toString());
        console.log('[ClientLayout] Set userId in localStorage from cookie:', userIdFromCookie);
      }
      
      setAuthChecked(true);
      
      const tempLoginFlag = localStorage.getItem('isTemporaryLogin');
      setIsTemporaryLogin(tempLoginFlag === 'true');
    };
    
    checkAuth();
    // 將 pathname 添加到依賴項數組，確保路徑變化時重新執行檢查
  }, [pathname, router]); 

  // 如果 authChecked 為 false 且當前路徑不在公開列表（意味著是受保護路徑等待檢查），則顯示 "Authenticating..."
  // hideSidebar 的條件在這裡不再直接用來判斷是否顯示 Authenticating，因為公開路徑也應該直接渲染
  if (!authChecked && !publicPathsForClientLayout.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181c2f]">
        <div className="animate-pulse text-white text-lg">Authenticating...</div>
      </div>
    );
  }

  return (
    <>
      <AuthMeta />
      <AuthStateSync />
      
      {hideSidebar ? (
        <div className="min-h-screen bg-[#181c2f] flex flex-col">
          {children}
        </div>
      ) : (
        <div className="flex h-screen bg-gray-100">
          <Navigation />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Temporary Login Banner */}
            {isTemporaryLogin && (
              <div className="bg-yellow-500 text-black p-3 text-center text-sm font-semibold z-50 shadow">
                You are logged in with temporary access while your password reset is pending.
                Please log in with your Clock Number as the password after administrator confirmation to set a new permanent password.
              </div>
            )}
            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#232532]">
              {/* Removed the grid layout to allow Navigation to control sidebar visibility fully */}
              <div className="mx-auto px-0 py-0">
                 {children}
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientLayout; 
