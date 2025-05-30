'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AuthStateSync from './AuthStateSync';
import AuthMeta from './AuthMeta';
import AuthChecker from './AuthChecker';
import GlobalHeader from '../../components/GlobalHeader';
import { toast } from 'sonner';
import { shouldCleanupLegacyAuth, cleanupLegacyAuth } from '../main-login/utils/cleanup-legacy-auth';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  // 只隱藏登入和密碼相關頁面的 header
  const hideHeader = pathname === '/main-login' || pathname === '/change-password' || pathname === '/new-password' || pathname === '/';
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
    <div className="min-h-screen bg-gray-900 text-white">
      <AuthStateSync />
      <AuthMeta />
      
      <AuthChecker>
        {!hideHeader && <GlobalHeader />}
        
        <main className={hideHeader ? '' : 'pt-10'}>
          {children}
        </main>
      </AuthChecker>
    </div>
  );
};

export default ClientLayout; 
