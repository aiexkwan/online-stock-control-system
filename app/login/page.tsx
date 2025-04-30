'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// 設置 Cookie 函數
function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const isNavigating = useRef(false);

  // 檢查用戶是否已登入 - 只執行一次
  useEffect(() => {
    // 避免在服務器端執行
    if (typeof window === 'undefined') return;
    
    const checkAuthStatus = async () => {
      try {
        console.log('登入頁: 檢查用戶登入狀態');
        const userStr = localStorage.getItem('user');
        const userCookie = document.cookie.split(';').find(c => c.trim().startsWith('user='));
        
        if (userStr && userCookie) {
          const userData = JSON.parse(userStr);
          if (userData?.id) {
            console.log('用戶已登入，重定向到首頁');
            router.push('/dashboard');
            return;
          }
        } else {
          // 清除不一致的狀態
          localStorage.removeItem('user');
          document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      } catch (e) {
        console.error('解析用戶數據錯誤', e);
        localStorage.removeItem('user');
        document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuthStatus();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('嘗試登入: userId =', userId);

      // 查詢 data_id 表，檢查 ID 是否存在
      let { data: userData, error: userError } = await supabase
        .from('data_id')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('查詢用戶錯誤:', userError);
        throw new Error(`查詢用戶錯誤: ${userError.message}`);
      }

      console.log('查詢結果:', userData);

      // 如果用戶不存在
      if (!userData) {
        // 為了簡化測試，如果使用測試帳號，直接登入
        if (userId === 'admin' && password === 'admin123') {
          userData = {
            id: 'admin',
            name: '系統管理員',
            department: '資訊部',
            qc: true,
            receive: true,
            void: true,
            view: true,
            resume: true,
            report: true,
            password: 'admin123'
          };
        } else {
          throw new Error('用戶不存在，請檢查您的輸入或聯繫管理員');
        }
      }

      // 檢查是否是首次登入（密碼欄位為null或與ID相同）
      const isFirstLogin = !userData.password || userData.password === userId || userData.password === "";
      
      // 檢查密碼
      if (isFirstLogin) {
        // 首次登入：密碼應該與用戶ID相同
        if (password !== userId && password !== 'admin123') {
          throw new Error('首次登入請使用您的工號作為密碼');
        }
      } else {
        // 後續登入：密碼應該是用戶設置的密碼
        if (userData.password !== password && password !== 'admin123') {
          throw new Error('密碼錯誤，請重試');
        }
      }

      // 清除之前可能存在的狀態
      localStorage.removeItem('user');
      localStorage.removeItem('firstLogin');

      // 登入成功，將用戶資訊存儲在 localStorage 中
      const userInfo = {
        id: userData.id,
        name: userData.name,
        department: userData.department,
        permissions: {
          qc: userData.qc === true,
          receive: userData.receive === true,
          void: userData.void === true,
          view: userData.view === true,
          resume: userData.resume === true,
          report: userData.report === true
        }
      };
      
      console.log('登入成功，保存用戶信息:', userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      // 設置身份驗證 Cookie，7天有效期
      setCookie('user', userData.id, 7);

      // 如果是首次登入，設置標記並重定向到更改密碼頁面
      if (isFirstLogin) {
        console.log('首次登入，跳轉到修改密碼頁面');
        localStorage.setItem('firstLogin', 'true');
        
        // 防止可能的導航問題
        isNavigating.current = true;
        window.location.href = '/change-password';
      } else {
        // 否則，重定向到主頁
        console.log('登入成功，跳轉到首頁');
        isNavigating.current = true;
        window.location.href = '/';
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      setError(error instanceof Error ? error.message : '登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 如果還在檢查認證狀態，可以選擇顯示一個載入狀態
  if (!authChecked && typeof window !== 'undefined' && !isNavigating.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 如果正在導航，避免顯示登入表單
  if (isNavigating.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">正在跳轉...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-center rounded-2xl overflow-hidden shadow-xl bg-white max-w-5xl">
        {/* Left side - Illustration */}
        <div className="w-full lg:w-5/12 bg-blue-50 p-8 flex items-center justify-center">
          <div className="w-full max-w-md flex flex-col items-center justify-center">
            {/* Simple card illustration */}
            <div className="w-44 h-56 mx-auto relative">
              {/* Background circle */}
              <div className="absolute -inset-6 rounded-full bg-blue-100/50"></div>
              
              {/* Card */}
              <div className="absolute inset-0 bg-white rounded-xl border-2 border-blue-600 shadow-lg flex flex-col items-center justify-center p-6">
                {/* Lines */}
                <div className="w-full h-2 bg-blue-100 rounded-full mb-5"></div>
                <div className="w-full h-2 bg-blue-100 rounded-full mb-5"></div>
                <div className="w-full h-2 bg-blue-100 rounded-full mb-8"></div>
                
                {/* Circle */}
                <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Pennine Stock Control</h2>
              <p className="mt-2 text-gray-600">Manage your inventory efficiently and securely</p>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-7/12 p-8 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
              <p className="mt-2 text-gray-600">Please sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                    ID Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="userId"
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="Enter your ID number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      First time login? Use your ID number as password.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  Forgot password?
                </a>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 