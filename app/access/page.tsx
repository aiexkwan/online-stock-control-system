'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/app/utils/supabase/client';
import { unifiedAuth } from '@/app/main-login/utils/unified-auth';
import { getUserRoleFromDatabase } from '../hooks/useAuth';
import { LoadingScreen } from '@/components/ui/loading';
// Starfield background is now handled globally

export default function AccessPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [securityInfo, setSecurityInfo] = useState<{
    useLocalStorage: boolean;
    sessionTimeout: number;
  } | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/admin/analysis');

  useEffect(() => {
    const initializeAccess = async () => {
      try {
        // 使用與中間件一致的統一認證系統
        const user = await unifiedAuth.getCurrentUser();

        if (!user?.email) {
          // 如果無法獲取用戶信息，說明認證狀態不一致，重新登入
          console.log('[AccessPage] Cannot get user info, redirecting to login');
          router.push('/main-login?error=session_error');
          return;
        }

        // 設置用戶信息和重定向路徑
        setUserEmail(user.email);
        setSecurityInfo({ 
          useLocalStorage: true, 
          sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
        });

        // 根據用戶角色設置重定向路徑
        try {
          const userRole = await getUserRoleFromDatabase(user.email);
          if (userRole) {
            setRedirectPath(userRole.defaultPath);
          } else {
            // 降級處理：預設為管理儀表板
            console.warn('[AccessPage] Could not determine user role, using default path');
            setRedirectPath('/admin');
          }
        } catch (roleError) {
          console.error('[AccessPage] Error getting user role:', roleError);
          setRedirectPath('/admin'); // 使用預設路徑
        }

        // 認證成功
        console.log('[AccessPage] Access granted for:', user.email);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('[AccessPage] Access initialization failed:', error);
        router.push('/main-login?error=init_failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAccess();
  }, [router]);

  // 倒計時和自動重定向
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsRedirecting(true);
            // 重定向到角色對應的頁面
            setTimeout(() => {
              router.push(redirectPath);
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isAuthenticated, isLoading, router, redirectPath]);

  // 載入中狀態
  if (isLoading) {
    return (
      <LoadingScreen isLoading={true} loadingText='Verifying access...'>
        <div />
      </LoadingScreen>
    );
  }

  // 未認證狀態（這個應該不會顯示，因為會重定向）
  if (!isAuthenticated) {
    return (
      <div className='relative min-h-screen overflow-hidden'>
        {/* Background Gradient Overlay */}
        <div className='absolute inset-0 bg-gradient-to-br from-red-900/20 via-purple-900/10 to-slate-900/30' />

        {/* Content */}
        <div className='relative z-10 flex min-h-screen items-center justify-center px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center'
          >
            <p className='text-red-400'>Access denied. Redirecting...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen overflow-hidden'>
      {/* Background Gradient Overlay */}
      <div className='absolute inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/10 to-slate-900/30' />

      {/* Main Content */}
      <div className='relative z-10 flex min-h-screen items-center justify-center px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='w-full max-w-2xl text-center'
        >
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='group relative'
          >
            {/* Card background glow */}
            <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-800/50 to-green-900/30 blur-xl' />

            <div className='relative rounded-2xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-2xl shadow-green-900/20 backdrop-blur-xl transition-all duration-300 hover:border-green-500/30'>
              {/* Card inner glow effect */}
              <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

              {/* Top border glow */}
              <div className='absolute left-0 right-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-100' />

              <div className='relative z-10'>
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className='mb-6'
                >
                  <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/25'>
                    <svg
                      className='h-10 w-10 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                  <h1 className='mb-2 bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent'>
                    Access Granted
                  </h1>
                  <p className='text-lg text-slate-300'>
                    Welcome to Pennine Industries Stock Control System
                  </p>
                </motion.div>

                {/* Access Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className='mb-6 rounded-xl border border-slate-600/30 bg-slate-700/30 p-6 backdrop-blur-sm'
                >
                  <h2 className='mb-4 text-xl font-semibold text-slate-200'>
                    System Access Confirmed
                  </h2>
                  <div className='space-y-3 text-left'>
                    <div className='flex items-center text-slate-300'>
                      <div className='mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-400'>
                        <svg
                          className='h-3 w-3 text-white'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 13l4 4L19 7'
                          />
                        </svg>
                      </div>
                      <span>Authenticated as: {userEmail}</span>
                    </div>

                    {securityInfo?.useLocalStorage && (
                      <div className='flex items-center text-slate-300'>
                        <div className='mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-cyan-400'>
                          <svg
                            className='h-3 w-3 text-white'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                            />
                          </svg>
                        </div>
                        <span>
                          Session expires in{' '}
                          {Math.round((securityInfo.sessionTimeout || 0) / (60 * 60 * 1000))} hours
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Redirect Status */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className='space-y-4'
                >
                  {isRedirecting ? (
                    <div className='py-6 text-center'>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className='mx-auto mb-4 h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent'
                      />
                      <p className='text-lg font-medium text-blue-400'>Redirecting...</p>
                      <p className='mt-2 text-sm text-slate-400'>Taking you to the dashboard</p>
                    </div>
                  ) : (
                    <div className='py-6 text-center'>
                      <div className='mb-4'>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25'
                        >
                          <span className='text-2xl font-bold text-white'>{countdown}</span>
                        </motion.div>
                      </div>
                      <p className='text-lg font-medium text-blue-400'>
                        Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                      </p>
                      <p className='mt-2 text-sm text-slate-400'>
                        You will be automatically taken to the dashboard
                      </p>
                    </div>
                  )}

                  <div className='border-t border-slate-600/50 pt-4'>
                    <Link
                      href='/main-login'
                      className='text-sm text-slate-400 transition-all duration-300 hover:text-slate-300 hover:underline'
                    >
                      ← Back to Login
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className='mt-8 text-center text-xs text-slate-500'
          >
            <p>© 2025 Pennine Industries. All rights reserved.</p>
            <p className='mt-1'>Secure access portal for authorized personnel</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating particles effect */}
      <div className='pointer-events-none absolute inset-0'>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute h-1 w-1 rounded-full bg-green-400/30'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
