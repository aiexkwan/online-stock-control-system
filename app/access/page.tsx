'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { unifiedAuth } from '../main-login/utils/unified-auth';
import { getUserRole } from '../hooks/useAuth';
// Starfield background is now handled globally

export default function AccessPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [securityInfo, setSecurityInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/home');

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // 檢查用戶是否已通過 main-login 認證
        const user = await unifiedAuth.getCurrentUser();
        
        if (!user || !user.email) {
          // 沒有認證用戶，重定向到 main-login
          router.push('/main-login?error=access_denied');
          return;
        }

        // 驗證 email 域名
        if (!user.email.endsWith('@pennineindustries.com')) {
          // 不是授權域名，重定向到 main-login
          router.push('/main-login?error=unauthorized_domain');
          return;
        }

        // 根據用戶角色設置重定向路徑
        const userRole = getUserRole(user.email);
        setRedirectPath(userRole.defaultPath);

        // 認證成功
        setUserEmail(user.email);
        setSecurityInfo(unifiedAuth.getSecurityInfo());
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/main-login?error=auth_check_failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [router]);

  // 倒計時和自動重定向
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-slate-900/30" />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">Verifying access...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // 未認證狀態（這個應該不會顯示，因為會重定向）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-purple-900/10 to-slate-900/30" />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
          <p className="text-red-400">Access denied. Redirecting...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/10 to-slate-900/30" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative group"
          >
            {/* Card background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-green-900/30 rounded-2xl blur-xl" />
            
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-green-900/20 hover:border-green-500/30 transition-all duration-300">
              {/* Card inner glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              
              {/* Top border glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-100 rounded-t-2xl" />
              
              <div className="relative z-10">
          {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mb-6"
                >
                  <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/25">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-2">
              Access Granted
            </h1>
                  <p className="text-slate-300 text-lg">
              Welcome to Pennine Industries Stock Control System
            </p>
                </motion.div>

          {/* Access Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-600/30"
                >
                  <h2 className="text-xl font-semibold text-slate-200 mb-4">
              System Access Confirmed
            </h2>
            <div className="text-left space-y-3">
                    <div className="flex items-center text-slate-300">
                      <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                      </div>
                <span>Authenticated as: {userEmail}</span>
              </div>

              {securityInfo?.useLocalStorage && (
                      <div className="flex items-center text-slate-300">
                        <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                        </div>
                  <span>Session expires in {Math.round((securityInfo.sessionTimeout || 0) / (60 * 60 * 1000))} hours</span>
                </div>
              )}
            </div>
                </motion.div>

          {/* Redirect Status */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="space-y-4"
                >
            {isRedirecting ? (
              <div className="text-center py-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                      />
                <p className="text-blue-400 text-lg font-medium">Redirecting...</p>
                      <p className="text-slate-400 text-sm mt-2">Taking you to the dashboard</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mb-4">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg shadow-blue-500/25"
                        >
                    <span className="text-2xl font-bold text-white">{countdown}</span>
                        </motion.div>
                </div>
                <p className="text-blue-400 text-lg font-medium">
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
                      <p className="text-slate-400 text-sm mt-2">
                  You will be automatically taken to the dashboard
                </p>
              </div>
            )}
            
                  <div className="pt-4 border-t border-slate-600/50">
              <Link
                href="/main-login"
                      className="text-slate-400 hover:text-slate-300 text-sm transition-all duration-300 hover:underline"
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
            className="mt-8 text-center text-slate-500 text-xs"
          >
          <p>© 2025 Pennine Industries. All rights reserved.</p>
          <p className="mt-1">Secure access portal for authorized personnel</p>
          </motion.div>
        </motion.div>
        </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400/30 rounded-full"
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