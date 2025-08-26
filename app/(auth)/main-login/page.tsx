'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { forceCleanupAllAuth } from './utils/cleanup-legacy-auth';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCriticalLoading } from '@/lib/performance/use-critical-loading';
import { LoginProvider } from './context/LoginContext';
import Image from 'next/image';

// Dynamic import for LoginPageContent to reduce initial bundle size
const LoginPageContent = dynamic(() => import('./components/LoginPageContent'), {
  loading: () => (
    <div className='animate-pulse space-y-4'>
      <div className='mb-4 h-6 rounded bg-slate-700/50'></div>
      <div className='h-10 rounded bg-slate-700/50'></div>
      <div className='h-10 rounded bg-slate-700/50'></div>
      <div className='h-10 rounded bg-slate-700/50'></div>
    </div>
  ),
  ssr: false,
});

export default function MainLoginPage() {
  const [hasError, setHasError] = useState(false);

  // 關鍵路徑載入優化
  const {
    isReady,
    loadingProgress,
    error: loadingError,
  } = useCriticalLoading({
    criticalResources: ['/api/auth/session', '/_next/static/css/app/(auth)/layout.css'],
    deferredResources: ['/_next/static/js/chunks/framework.js', '/images/background-assets.webp'],
    criticalTimeout: 2000,
    enableProgressiveEnhancement: true,
  });

  // 🚀 性能優化：URL參數解析優化
  const urlSearchParams = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search);
  }, []);

  useEffect(() => {
    if (!urlSearchParams) return;

    try {
      // Handle cleanup parameter at page level (not in context)
      if (urlSearchParams.get('cleanup') === 'force') {
        console.log('[MainLoginPage] Force cleanup requested');
        forceCleanupAllAuth();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('[MainLoginPage] Initialization error:', error);
      setHasError(true);
    }
  }, [urlSearchParams]);

  // 顯示載入進度（僅在關鍵資源未載入完成時）
  if (!isReady && loadingProgress < 50) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-900 px-4'>
        <div className='text-center text-white'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent'></div>
          <h2 className='mb-2 text-xl font-semibold'>Loading Critical Resources</h2>
          <div className='mb-2 h-2 w-64 rounded-full bg-slate-700'>
            <div
              className='h-2 rounded-full bg-blue-600 transition-all duration-300'
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className='text-sm text-slate-400'>{loadingProgress}% loaded</p>
          {loadingError && (
            <p className='mt-2 text-sm text-red-400'>
              Fallback mode - Some features may be limited
            </p>
          )}
        </div>
      </div>
    );
  }

  // 如果有錯誤，提供備用登入
  if (hasError) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-900 px-4'>
        <div className='text-center text-white'>
          <h1 className='mb-4 text-2xl font-bold'>Loading Issue Detected</h1>
          <p className='mb-6 text-slate-300'>
            There was an issue loading the login page components.
          </p>
          <a
            href='/main-login/simple'
            className='inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700'
          >
            Use Simple Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen overflow-hidden'>
      {/* 星空背景由 MinimalProviders 提供 */}

      {/* 主要內容 */}
      <div className='relative z-10 flex min-h-screen items-center justify-center px-4'>
        <div className='w-full max-w-md space-y-6'>
          {/* 品牌標題 */}
          <div className='text-center'>
            <h1 className='mb-2 bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent'>
              Pennine Manufacturing
            </h1>
            <p className='text-slate-400'>Stock Management System</p>
          </div>

          {/* 登入卡片 */}
          <div className='group relative'>
            {/* 卡片背景光暈 */}
            <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-slate-800/50 to-blue-900/30 blur-xl' />

            <div className='relative rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-xl'>
              {/* Login Provider Context */}
              <LoginProvider initialView='login' enablePersistence={true}>
                <LoginPageContent urlSearchParams={urlSearchParams} onError={setHasError} />
              </LoginProvider>
            </div>
          </div>

          {/* 頁腳 */}
          <div className='text-center text-xs text-slate-500'>
            <p>© 2025 Pennine Industries. All rights reserved.</p>
            <p>Authorized personnel only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
