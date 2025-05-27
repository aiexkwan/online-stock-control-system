'use client';

import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { usePathname } from 'next/navigation';
import AuthStateSync from './AuthStateSync';
import AuthMeta from './AuthMeta';
import AuthChecker from './AuthChecker';
import { toast } from 'sonner';
import { shouldCleanupLegacyAuth, cleanupLegacyAuth } from '../main-login/utils/cleanup-legacy-auth';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  // 只隱藏登入和密碼相關頁面的側邊欄，其他頁面都顯示
  const hideSidebar = pathname === '/main-login' || pathname === '/change-password' || pathname === '/new-password';
  const [isTemporaryLogin, setIsTemporaryLogin] = useState(false);

  useEffect(() => {
    // 檢查並清理舊版認證數據
    if (shouldCleanupLegacyAuth()) {
      console.log('[ClientLayout] Detected legacy auth data, cleaning up...');
      cleanupLegacyAuth();
      toast.info('Cleaning up old authentication data...', { duration: 2000 });
    }

    // 檢查舊的臨時登入標記（向後兼容）
    const tempLoginFlag = localStorage.getItem('isTemporaryLogin');
    setIsTemporaryLogin(tempLoginFlag === 'true');
  }, []);

  return (
    <>
      <AuthMeta />
      <AuthStateSync />
      <AuthChecker>
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
      </AuthChecker>
    </>
  );
};

export default ClientLayout; 
