'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { forceCleanupAllAuth } from './utils/cleanup-legacy-auth';
import LoginForm from './components/LoginForm';
import { useRouter } from 'next/navigation';

export default function MainLoginPage() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 🚀 性能優化：URL參數解析優化
  const urlSearchParams = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search);
  }, []);

  useEffect(() => {
    if (!urlSearchParams) return;

    try {
      if (urlSearchParams.get('confirmed') === 'true') {
        setShowConfirmation(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

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
              <div className='mb-6 text-center'>
                <h2 className='text-xl font-semibold text-white'>Sign In</h2>
                <p className='mt-1 text-slate-400'>Access your account</p>
              </div>

              {/* 電郵確認訊息 */}
              {showConfirmation && (
                <div className='mb-4 rounded-lg border border-green-500/50 bg-green-900/50 p-3'>
                  <p className='text-sm text-green-300'>✓ Email confirmed! You can now sign in.</p>
                </div>
              )}

              {/* 登入表單 */}
              <LoginForm />
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
