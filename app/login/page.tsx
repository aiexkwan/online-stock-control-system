'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from 'sonner';
import { customLoginAction } from '../actions/authActions';
import { createClient } from '@/lib/supabase';
import { clearLocalAuthData, syncAuthStateToLocalStorage, isUserAuthenticated } from '../utils/auth-sync';

// New component to handle logic depending on searchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const fromPage = searchParams?.get('from') || '/dashboard';
  
  const [clockNumber, setClockNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 清除之前的登入狀態
    clearLocalAuthData();
    
    // 檢查 URL 中是否有會話過期錯誤
    const errorParam = searchParams?.get('error');
    if (errorParam === 'session_expired') {
      toast.error('Your session has expired. Please log in again.', {
        id: 'session-expired',
        duration: 5000,
      });
    }
    
    // 檢查 Supabase Auth 會話
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[LoginContent] Error checking session:', error.message);
        return;
      }
      
      if (data.session) {
        console.log('[LoginContent] Active session found, signing out');
        // 如果有現有會話，則登出
        await supabase.auth.signOut();
      }
    };
    
    checkSession();
  }, [searchParams, supabase]);

  const logToHistory = async (userIdToLog: string, actionType: 'LogIn' | 'Password Change', remarkText: string) => {
    try {
      console.log(`[LoginContent] Logging history: User [${userIdToLog}], Action [${actionType}], Remark [${remarkText}]`);
    } catch (historyError) {
      console.error('[LoginContent] Failed to log to record_history:', historyError);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const trimmedClockNumber = clockNumber.trim();

    if (!trimmedClockNumber) {
        setError('Clock Number cannot be empty.');
        setLoading(false);
        return;
    }
    if (!password) {
        setError('Password cannot be empty.');
        setLoading(false);
        return;
    }

    console.log(`[LoginContent] Attempting login for clock number: ${trimmedClockNumber}`);
    
    try {
      const loginResult = await customLoginAction(trimmedClockNumber, password);
      console.log('[LoginContent] customLoginAction result (raw):', loginResult);
      console.log('[LoginContent] customLoginAction result (stringified):', JSON.stringify(loginResult, null, 2));

      if (loginResult.success && typeof loginResult.userId === 'number') {
        console.log('[LoginContent] Login successful for clock number:', loginResult.userId);
        
        // 等待會話同步完成
        try {
          await syncAuthStateToLocalStorage();
          console.log('[LoginContent] Authentication state synced to localStorage');
        } catch (syncError) {
          console.error('[LoginContent] Error syncing auth state:', syncError);
          setError('Failed to establish session. Please try again.');
          setLoading(false);
          return;
        }
        
        // 再次驗證存儲是否成功
        const storedId = localStorage.getItem('loggedInUserClockNumber');
        console.log('[LoginContent] Verification - ID in localStorage:', storedId);

        if (!storedId || storedId !== loginResult.userId.toString()) {
          console.error('[LoginContent] Session storage verification failed');
          setError('Failed to establish session. Please try again.');
          setLoading(false);
          return;
        }

        const isFirstLogin = loginResult.isFirstLogin;

        if (isFirstLogin) {
          console.log('[LoginContent] First login detected, redirecting to change password page');
          await logToHistory(loginResult.userId.toString(), 'LogIn', 'First LogIn - Redirect to Change Password');
          
          // 確保首次登入標誌正確設置到 localStorage
          localStorage.setItem('firstLogin', 'true');
          
          // 確保重定向前關閉 loading
          setLoading(false);
          
          // 使用 window.location 代替 router.replace
          window.location.href = `/change-password?userId=${encodeURIComponent(loginResult.userId.toString())}`;
          return;
        } else {
          console.log('[LoginContent] Regular login detected, redirecting to dashboard or previous page');
          await logToHistory(loginResult.userId.toString(), 'LogIn', 'LogIn Success');
          
          // 再次檢查認證狀態
          const isAuthenticated = await isUserAuthenticated();
          if (!isAuthenticated) {
            console.error('[LoginContent] Session not properly established after login');
            setError('Login successful but session not established. Please try again.');
            setLoading(false);
            return;
          }
          
          // 確保重定向前關閉 loading
          setLoading(false);
          
          // 使用 window.location 代替 router.replace
          window.location.href = fromPage;
          return;
        }
      } else {
        console.error('[LoginContent] Login failed:', loginResult.error);
        setError(loginResult.error || 'Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[LoginContent] Unexpected login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!clockNumber.trim()) {
      toast.error('Please enter your Clock Number to proceed with password assistance.');
      return;
    }
    toast.info('Please contact your administrator to reset your password.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e2533] p-4">
      <Card className="w-full max-w-md bg-[#252d3d] border-0 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Pennine Stock Control
          </CardTitle>
          <CardDescription className="text-gray-400">
            Please Enter Your Clock Number And Password To Login
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="clockNumber" className="text-sm font-medium text-gray-300">
                Clock Number
              </label>
              <Input
                id="clockNumber"
                type="text"
                value={clockNumber}
                onChange={(e) => setClockNumber(e.target.value)}
                className="bg-[#1e2533] border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                placeholder="Enter your clock number"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#1e2533] border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="text-right text-sm">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  Forgot Password?
                </button>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-900/50 border border-red-500">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Logging In...' : 'Login'}
            </Button>
            <p className="text-xs text-center text-gray-500">
              First-time users? Your password is your Clock Number
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1e2533] p-4"><div className="text-white text-xl">Loading login page...</div></div>}>
      <LoginContent />
    </Suspense>
  );
} 