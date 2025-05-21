'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from 'sonner';
import { customLoginAction } from '../actions/authActions';
import { createClient } from '@/lib/supabase';
import { clearLocalAuthData, syncAuthStateToLocalStorage } from '../utils/auth-sync';

export default function LoginPage() {
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
        console.error('[Login] Error checking session:', error.message);
        return;
      }
      
      if (data.session) {
        console.log('[Login] Active session found, signing out');
        // 如果有現有會話，則登出
        await supabase.auth.signOut();
      }
    };
    
    checkSession();
  }, [searchParams]);

  const logToHistory = async (userIdToLog: string, actionType: 'LogIn' | 'Password Change', remarkText: string) => {
    try {
      console.log(`[Login] Logging history: User [${userIdToLog}], Action [${actionType}], Remark [${remarkText}]`);
    } catch (historyError) {
      console.error('[Login] Failed to log to record_history:', historyError);
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

    console.log(`[Login] Attempting login for clock number: ${trimmedClockNumber}`);
    
    try {
      const loginResult = await customLoginAction(trimmedClockNumber, password);

      if (loginResult.success && typeof loginResult.userId === 'number') {
        console.log('[Login] Login successful for clock number:', loginResult.userId);
        
        // 強化會話處理 - 直接設置本地存儲
        localStorage.setItem('loggedInUserClockNumber', loginResult.userId.toString());
        console.log('[Login] Set userId in localStorage:', loginResult.userId);
        
        // 手動設置 cookie 以確保中間件可以讀取認證狀態
        document.cookie = `loggedInUserClockNumber=${loginResult.userId}; path=/; max-age=86400; SameSite=Lax`;
        console.log('[Login] Set userId in cookie:', loginResult.userId);
        
        // 等待會話同步完成
        try {
          // 嘗試同步 Supabase 會話狀態
          await syncAuthStateToLocalStorage();
          console.log('[Login] Authentication state synced to localStorage');
        } catch (syncError) {
          console.error('[Login] Error syncing auth state:', syncError);
          // 但我們已經手動設置了 localStorage 和 cookie，所以繼續流程
        }
        
        // 設置標誌，告訴系統保留認證狀態
        localStorage.setItem('preserveAuthState', 'true');
        
        // 再次驗證存儲是否成功
        const storedId = localStorage.getItem('loggedInUserClockNumber');
        console.log('[Login] Verification - ID in localStorage:', storedId);

        const isFirstLogin = loginResult.isFirstLogin;

        if (isFirstLogin) {
          console.log('[Login] First login detected, redirecting to change password page');
          await logToHistory(loginResult.userId.toString(), 'LogIn', 'First LogIn - Redirect to Change Password');
          
          // 確保首次登入標誌正確設置到 localStorage
          localStorage.setItem('firstLogin', 'true');
          
          // 立即重定向到更改密碼頁面
          router.push(`/change-password?userId=${encodeURIComponent(loginResult.userId.toString())}`);
        } else {
          console.log('[Login] Regular login detected, redirecting to dashboard or previous page');
          await logToHistory(loginResult.userId.toString(), 'LogIn', 'LogIn Success');
          
          // 強制較長延遲以確保狀態完全同步
          toast.success('Login successful! Redirecting...', { duration: 2000 });
          
          setTimeout(() => {
            // 設置超時，在完成後清除 preserveAuthState 標誌
            setTimeout(() => {
              localStorage.removeItem('preserveAuthState');
            }, 5000);
            
            // 如果用戶從其他頁面被重定向過來，登入後返回那個頁面
            router.push(fromPage);
          }, 3000); // 增加延遲到 3 秒，確保 cookie 和 localStorage 更新有足夠時間
        }
      } else {
        console.error('[Login] Login failed:', loginResult.error);
        setError(loginResult.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[Login] Unexpected login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
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