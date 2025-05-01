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

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const isNavigating = useRef(false);

  useEffect(() => {
    // 防止 SSR 渲染問題
    if (typeof window === 'undefined') return;
    
    const checkAuth = () => {
      // 檢查是否有用戶資訊
      const userStr = localStorage.getItem('user');
      const firstLogin = localStorage.getItem('firstLogin');
      
      if (!userStr || !firstLogin) {
        // 如果沒有用戶資訊或不是首次登入，重定向到登入頁面
        console.log('修改密碼頁: 用戶未登入或非首次登入，重定向到登入頁面');
        isNavigating.current = true;
        window.location.href = '/login';
        return;
      }
      
      try {
        const user = JSON.parse(userStr);
        setUserData(user);
        console.log('修改密碼頁: 已載入用戶數據:', user);
      } catch (e) {
        console.error('修改密碼頁: 解析用戶數據錯誤:', e);
        isNavigating.current = true;
        window.location.href = '/login';
        return;
      } finally {
        setInitialized(true);
      }
    };
    
    checkAuth();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError('密碼長度必須至少為6個字符');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!userData || !userData.id) {
        throw new Error('找不到用戶數據');
      }

      // 管理員帳戶特殊處理
      if (userData.id === 'admin') {
        localStorage.removeItem('firstLogin');
        router.replace('/dashboard');
        return;
      }

      // 更新 Supabase Auth 密碼
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) {
        throw authError;
      }

      // 更新數據庫中的密碼
      const { error: updateError } = await supabase
        .from('data_id')
        .update({ password: newPassword })
        .eq('id', userData.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // 清除首次登入標記
      localStorage.removeItem('firstLogin');
      
      // 提示成功並重定向
      alert('密碼更新成功！');
      router.replace('/dashboard');
    } catch (error) {
      console.error('更新密碼失敗:', error);
      setError(error instanceof Error ? error.message : '無法更新密碼');
    } finally {
      setLoading(false);
    }
  };

  // 如果還未初始化或正在導航，顯示載入中
  if (!initialized || isNavigating.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-3 text-gray-600">{isNavigating.current ? '正在跳轉...' : '載入中...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
      <div className="container mx-auto flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full p-3">
                <svg 
                  className="w-full h-full text-blue-500" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 15v3m-3-3h6M5 10V6a7 7 0 1114 0v4" strokeLinejoin="round" />
                  <rect x="3" y="10" width="18" height="12" rx="2" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">更改密碼</h1>
            <p className="mt-2 text-gray-600">
              歡迎使用 Pennine 庫存系統！請為您的帳戶設置新密碼。
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                新密碼
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="輸入新密碼"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                確認密碼
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="再次輸入新密碼"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                密碼長度必須至少為6個字符。
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    更新中...
                  </div>
                ) : (
                  '設置新密碼'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 