'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { unifiedAuth } from '../main-login/utils/unified-auth';

interface AuthCheckerProps {
  children: React.ReactNode;
}

// 定義公開路由列表 - 只有主登入頁面和密碼重設頁面是公開的
const publicPaths = [
  '/main-login',
  '/new-password',  // 密碼重設頁面需要公開，用戶通過電郵連結訪問
  '/print-label/html-preview'  // HTML 標籤預覽頁面（用於測試和預覽）
];

// 定義受保護路由列表 - 除了公開路由外的所有頁面都需要認證
const protectedPaths = [
  '/access',
  '/dashboard',
  '/history',
  '/productUpdate',
  '/stock-transfer',
  //'/print-label',
  '/print-grnlabel',
  '/change-password'  // 密碼修改頁面需要認證，用戶必須已登入
];

export default function AuthChecker({ children }: AuthCheckerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('[AuthChecker] Checking authentication for path:', pathname);

      // 如果是公開路由，直接通過
      const isPublicRoute = publicPaths.some(path => pathname.startsWith(path));
      if (isPublicRoute) {
        console.log('[AuthChecker] Public route, skipping auth check');
        setIsAuthChecked(true);
        setIsAuthenticated(true);
        return;
      }

      // 除了公開路由外，所有其他路由都需要認證
      try {
        console.log('[AuthChecker] Checking user authentication...');
        const user = await unifiedAuth.getCurrentUser();
        
        if (user) {
          console.log('[AuthChecker] User authenticated:', user.email);
          setIsAuthenticated(true);
        } else {
          console.log('[AuthChecker] No authenticated user found');
          setIsAuthenticated(false);
          
          toast.error('Please log in to access this page.', {
            id: 'auth-required',
            duration: 3000,
          });
          
          setTimeout(() => {
            router.push('/main-login');
          }, 1000);
        }
      } catch (error) {
        console.error('[AuthChecker] Authentication check failed:', error);
        setIsAuthenticated(false);
        
        toast.error('Authentication failed. Please log in again.', {
          id: 'auth-failed',
          duration: 3000,
        });
        
        setTimeout(() => {
          router.push('/main-login');
        }, 1000);
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuthentication();
  }, [pathname, router]);

  // 如果還在檢查認證狀態，顯示載入畫面
  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181c2f]">
        <div className="animate-pulse text-white text-lg">Checking authentication...</div>
      </div>
    );
  }

  // 如果未認證且不是公開路由，顯示載入畫面（等待重定向）
  if (!isAuthenticated && !publicPaths.some(path => pathname.startsWith(path))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181c2f]">
        <div className="animate-pulse text-white text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
} 