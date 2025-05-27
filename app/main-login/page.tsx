'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SimpleLoginForm from './components/SimpleLoginForm';
import { forceCleanupAllAuth } from './utils/cleanup-legacy-auth';

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pennine Manufacturing
          </h1>
          <p className="text-gray-400 text-lg">
            Stock Management System
          </p>
          <div className="mt-4 h-1 w-24 bg-blue-500 mx-auto rounded"></div>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-600 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Sign In
            </h2>
            <p className="text-gray-400 mt-2">
              Access your account
            </p>
          </div>

          {/* Email Confirmation Success Message */}
          {showConfirmation && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-green-300 font-medium text-sm">Email Confirmed!</p>
                  <p className="text-green-400 text-xs mt-1">Your account has been activated. You can now sign in.</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <SimpleLoginForm />

          {/* Links */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <Link
                href="/main-login/reset"
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
            
            <div className="text-center">
              <span className="text-gray-400 text-sm">Don't have an account? </span>
              <Link
                href="/main-login/register"
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs">
          <p>© 2024 Pennine Industries. All rights reserved.</p>
          <p className="mt-1">Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
} 