'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthState } from '@/app/(auth)/main-login/context/AuthContext';

interface AuthCheckerProps {
  children: React.ReactNode;
}

// 定義公開路由列表 - 這些路由不需要身份驗證
const publicPaths = [
  '/main-login', // 登入頁面需要公開
  '/change-password', // 密碼更新頁面需要公開，用戶通過電郵連結訪問
  '/new-password', // 密碼重設頁面需要公開，用戶通過電郵連結訪問
];

// 定義受保護路由列表 - 除了公開路由外的所有頁面都需要認證
const protectedPaths = [
  '/dashboard',
  '/productUpdate',
  '/stock-transfer',
  '/print-grnlabel',
  '/change-password', // 密碼修改頁面需要認證，用戶必須已登入
];

export default function AuthChecker({ children }: AuthCheckerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuthState(); // 使用依賴注入的認證狀態
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      console.log('[AuthChecker] Checking authentication for path:', pathname);
      console.log('[AuthChecker] Auth state:', { user: !!user, loading, isAuthenticated });

      // 如果是公開路由，直接通過
      const isPublicRoute = publicPaths.some(path => pathname.startsWith(path));
      if (isPublicRoute) {
        console.log('[AuthChecker] Public route, skipping auth check');
        setAuthCheckComplete(true);
        setShouldRedirect(false);
        return;
      }

      // 如果還在載入中，等待
      if (loading) {
        console.log('[AuthChecker] Still loading, waiting...');
        setAuthCheckComplete(false);
        return;
      }

      // 載入完成後檢查認證狀態
      if (isAuthenticated && user) {
        console.log('[AuthChecker] User authenticated:', user.email);
        setAuthCheckComplete(true);
        setShouldRedirect(false);
      } else {
        console.log('[AuthChecker] No authenticated user found');
        setAuthCheckComplete(true);
        setShouldRedirect(true);

        toast.error('Please log in to access this page.', {
          id: 'auth-required',
          duration: 3000,
        });

        // 延遲重定向，讓 toast 有時間顯示
        setTimeout(() => {
          router.push('/main-login');
        }, 1000);
      }
    };

    checkAuthentication();
  }, [pathname, router, user, loading, isAuthenticated]);

  // 如果還在檢查認證狀態，顯示載入畫面
  if (loading || !authCheckComplete) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#181c2f]'>
        <div className='animate-pulse text-lg text-white'>Loading...</div>
      </div>
    );
  }

  // 如果需要重定向到登入頁面，顯示載入畫面
  if (shouldRedirect) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#181c2f]'>
        <div className='animate-pulse text-lg text-white'>Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
}
