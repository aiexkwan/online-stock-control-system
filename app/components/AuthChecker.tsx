'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/app/hooks/useAuth';

interface AuthCheckerProps {
  children: React.ReactNode;
}

// 定義公開路由列表 - 只有主登入頁面和密碼重設頁面是公開的
const publicPaths = [
  '/main-login',
  '/new-password', // 密碼重設頁面需要公開，用戶通過電郵連結訪問
  '/print-label/html-preview', // HTML 標籤預覽頁面（用於測試和預覽）
];

// 測試模式：當 NEXT_PUBLIC_TEST_MODE=true 時，添加測試路由到公開路由列表
if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
  publicPaths.push(
    '/', // 首頁
    '/admin/injection', // Admin dashboard
    '/admin/pipeline',
    '/admin/warehouse',
    '/access', // Access page
    '/test-performance', // 專門的性能測試頁面
  );
  
  console.log('[AuthChecker] Test mode enabled - additional routes added to public list');
}

// 定義受保護路由列表 - 除了公開路由外的所有頁面都需要認證
const protectedPaths = [
  '/access',
  '/dashboard',
  '/productUpdate',
  '/stock-transfer',
  //'/print-label',
  '/print-grnlabel',
  '/change-password', // 密碼修改頁面需要認證，用戶必須已登入
];

export default function AuthChecker({ children }: AuthCheckerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth(); // 使用統一的認證狀態
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
        <div className='animate-pulse text-lg text-white'>
          Loading...
        </div>
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
