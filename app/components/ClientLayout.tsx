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

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const hideSidebar = pathname === '/login' || pathname === '/change-password' || pathname === '/new-password';
  const [isTemporaryLogin, setIsTemporaryLogin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // 檢查認證狀態
    const checkAuth = () => {
      // 登入、密碼更改和新密碼頁面不需要檢查認證
      if (hideSidebar) {
        setAuthChecked(true);
        return;
      }
      
      // 1. 檢查 localStorage
      const userId = localStorage.getItem('loggedInUserClockNumber');
      
      // 2. 檢查 cookie
      const userIdFromCookie = getCookie('loggedInUserClockNumber');
      
      if (!userId && !userIdFromCookie) {
        console.warn('[ClientLayout] No auth data found in localStorage or cookie');
        toast.error('Your session has expired. Please log in again.', {
          id: 'session-timeout',
          duration: 3000,
        });
        
        // 延遲重定向，給用戶時間看到提示
        setTimeout(() => {
          router.push('/login');
        }, 1000);
        return;
      }
      
      // 如果在 cookie 中找到用戶 ID 但不在 localStorage 中，則設置到 localStorage
      if (!userId && userIdFromCookie) {
        localStorage.setItem('loggedInUserClockNumber', userIdFromCookie.toString());
        console.log('[ClientLayout] Set userId in localStorage from cookie:', userIdFromCookie);
      }
      
      setAuthChecked(true);
      
      // 檢查是否是臨時登入
      const tempLoginFlag = localStorage.getItem('isTemporaryLogin');
      setIsTemporaryLogin(tempLoginFlag === 'true');
    };
    
    checkAuth();
  }, [hideSidebar, router, pathname]);

  // 如果認證檢查尚未完成，顯示最小內容
  if (!authChecked && !hideSidebar) {
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
