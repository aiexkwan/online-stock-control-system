'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { unifiedAuth } from '../main-login/utils/unified-auth';
import { getUserRole } from '../hooks/useAuth';

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 未認證狀態（這個應該不會顯示，因為會重定向）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 pt-16">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-600 p-8">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Access Granted
            </h1>
            <p className="text-gray-400 text-lg">
              Welcome to Pennine Industries Stock Control System
            </p>
          </div>

          {/* Access Information */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              System Access Confirmed
            </h2>
            <div className="text-left space-y-3">
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Authenticated as: {userEmail}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Email domain verified: @pennineindustries.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Security Mode: {securityInfo?.mode || 'unknown'} 
                  {securityInfo?.useLocalStorage ? ' (with secure localStorage)' : ' (no localStorage)'}
                </span>
              </div>
              {securityInfo?.useLocalStorage && (
                <div className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Session expires in {Math.round((securityInfo.sessionTimeout || 0) / (60 * 60 * 1000))} hours</span>
                </div>
              )}
            </div>
          </div>

          {/* Redirect Status */}
          <div className="space-y-4">
            {isRedirecting ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-blue-400 text-lg font-medium">Redirecting...</p>
                <p className="text-gray-400 text-sm mt-2">Taking you to the dashboard</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                    <span className="text-2xl font-bold text-white">{countdown}</span>
                  </div>
                </div>
                <p className="text-blue-400 text-lg font-medium">
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  You will be automatically taken to the dashboard
                </p>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-600">
              <Link
                href="/main-login"
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </div>

          {/*<button
            onClick={() => router.push(redirectPath)}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <span className="relative z-10">Enter Dashboard</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button> */}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>© 2025 Pennine Industries. All rights reserved.</p>
          <p className="mt-1">Secure access portal for authorized personnel</p>
        </div>
      </div>
    </div>
  );
} 