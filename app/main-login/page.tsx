'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SimpleLoginForm from './components/SimpleLoginForm';
import { forceCleanupAllAuth } from './utils/cleanup-legacy-auth';
import StarfieldBackground from '../components/StarfieldBackground';

export default function MainLoginPage() {
  const [showConfirmation, setShowConfirmation] = useState(false);

  // 在開發環境中，可以通過 URL 參數強制清理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 檢查是否是電郵確認後的重定向
    if (urlParams.get('confirmed') === 'true') {
      setShowConfirmation(true);
      // 移除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (urlParams.get('cleanup') === 'force') {
      console.log('[MainLoginPage] Force cleanup requested via URL parameter');
      forceCleanupAllAuth();
      // 移除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Starfield Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <StarfieldBackground />
      </div>

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-slate-900/30" style={{ zIndex: 2 }} />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full space-y-8"
        >
        {/* Brand Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <div className="relative">
              {/* Glow effect behind title */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-3xl" />
              
              <h1 className="relative text-4xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-2">
            Pennine Manufacturing
          </h1>
            </div>
            <p className="text-slate-300 text-lg font-medium">
            Stock Management System
          </p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-4 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 mx-auto rounded-full"
            />
          </motion.div>

        {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative group"
          >
            {/* Card background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl" />
            
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
              {/* Card inner glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              
              {/* Top border glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-100 rounded-t-2xl" />
              
              <div className="relative z-10">
          <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent">
              Sign In
            </h2>
                  <p className="text-slate-400 mt-2">
              Access your account
            </p>
          </div>

          {/* Email Confirmation Success Message */}
          {showConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-xl backdrop-blur-sm"
                  >
              <div className="flex items-center">
                      <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                      </div>
                <div>
                  <p className="text-green-300 font-medium text-sm">Email Confirmed!</p>
                  <p className="text-green-400 text-xs mt-1">Your account has been activated. You can now sign in.</p>
                </div>
              </div>
                  </motion.div>
          )}

          {/* Login Form */}
          <SimpleLoginForm />

          {/* Links */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <Link
                href="/main-login/reset"
                      className="text-blue-400 hover:text-blue-300 text-sm transition-all duration-300 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            
            <div className="text-center">
                    <span className="text-slate-400 text-sm">Don&apos;t have an account? </span>
              <Link
                href="/main-login/register"
                      className="text-blue-400 hover:text-blue-300 text-sm transition-all duration-300 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
            </div>
          </motion.div>

        {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center text-slate-500 text-xs"
          >
          <p>© 2025 Pennine Industries. All rights reserved.</p>
          <p className="mt-1">Authorized personnel only</p>
          </motion.div>
        </motion.div>
        </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
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