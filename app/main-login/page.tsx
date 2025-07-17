'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SimpleLoginForm from './components/SimpleLoginForm';
import { forceCleanupAllAuth } from './utils/cleanup-legacy-auth';

export default function MainLoginPage() {
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('confirmed') === 'true') {
      setShowConfirmation(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (urlParams.get('cleanup') === 'force') {
      console.log('[MainLoginPage] Force cleanup requested');
      forceCleanupAllAuth();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className='relative min-h-screen overflow-hidden'>
      {/* 背景漸層 */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-slate-900/30' />
      
      {/* 簡單浮動粒子效果 */}
      <div className='pointer-events-none absolute inset-0'>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute h-1 w-1 rounded-full bg-blue-400/30'
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

      {/* 主要內容 */}
      <div className='relative z-10 flex min-h-screen items-center justify-center px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='w-full max-w-md space-y-6'
        >
          {/* 品牌標題 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className='text-center'
          >
            <h1 className='mb-2 bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent'>
              Pennine Manufacturing
            </h1>
            <p className='text-slate-400'>Stock Management System</p>
          </motion.div>

          {/* 登入卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='group relative'
          >
            {/* 卡片背景光暈 */}
            <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-slate-800/50 to-blue-900/30 blur-xl' />
            
            <div className='relative rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-xl'>
              <div className='text-center mb-6'>
                <h2 className='text-xl font-semibold text-white'>Sign In</h2>
                <p className='text-slate-400 mt-1'>Access your account</p>
              </div>

              {/* 電郵確認訊息 */}
              {showConfirmation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='mb-4 rounded-lg border border-green-500/50 bg-green-900/50 p-3'
                >
                  <p className='text-green-300 text-sm'>
                    ✓ Email confirmed! You can now sign in.
                  </p>
                </motion.div>
              )}

              {/* 登入表單 */}
              <SimpleLoginForm />

              {/* 連結 */}
              <div className='mt-4 space-y-2 text-center text-sm'>
                <div>
                  <Link href='/main-login/reset' className='text-blue-400 hover:text-blue-300 transition-colors'>
                    Forgot your password?
                  </Link>
                </div>
                <div className='text-slate-400'>
                  Don't have an account?{' '}
                  <Link href='/main-login/register' className='text-blue-400 hover:text-blue-300 transition-colors'>
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 頁腳 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='text-center text-xs text-slate-500'
          >
            <p>© 2025 Pennine Industries. All rights reserved.</p>
            <p>Authorized personnel only</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}