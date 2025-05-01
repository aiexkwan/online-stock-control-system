'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 先進行連接測試
    try {
      console.log('測試 Supabase 連接...');
      
      // 簡單連接測試 - 嘗試載入 1 條記錄
      const { error: testError } = await supabase
        .from('data_id')
        .select('id')
        .limit(1);
      
      if (testError) {
        if (testError.message === 'Invalid API key') {
          console.error('Supabase API 金鑰無效或已過期');
          setError('系統錯誤: 資料庫連接無效，請聯絡系統管理員');
          setLoading(false);
          return;
        }
      }
    } catch (testErr) {
      console.error('連接測試錯誤:', testErr);
    }

    try {
      console.log('嘗試登入...');
      
      // 管理員登入邏輯 - 使用硬編碼方式（避免因 API 金鑰問題無法登入）
      if (userId === 'admin' && password === 'admin123') {
        console.log('管理員登入成功 (硬編碼方式)');
        
        // 不再呼叫 Supabase，直接使用硬編碼方式登入
        const adminData = {
          id: 'admin',
          name: 'Administrator',
          department: 'IT',
          permissions: {
            qc: true,
            receive: true,
            void: true,
            view: true,
            resume: true,
            report: true
          }
        };

        localStorage.setItem('user', JSON.stringify(adminData));
        router.replace('/dashboard');
        return;
      }

      // 硬編碼測試用戶（用於應急）
      const testUsers: { [key: string]: any } = {
        '5997': {
          id: '5997',
          name: '測試用戶 5997',
          department: '測試部門',
          qc: false,
          receive: true,
          void: true,
          view: true,
          resume: false,
          report: false,
          password: '5997'
        },
        'testuser': {
          id: 'testuser',
          name: '測試用戶',
          department: 'IT',
          qc: true,
          receive: true,
          void: true,
          view: true,
          resume: true,
          report: true,
          password: 'testuser'
        }
      };

      // 檢查是否為測試用戶
      if (testUsers[userId]) {
        console.log(`使用硬編碼方式登入測試用戶 ${userId}`);
        const userData = testUsers[userId];
        
        // 檢查密碼
        if (password !== userData.password) {
          throw new Error('密碼不正確');
        }
        
        // 保存用戶資訊
        localStorage.setItem('user', JSON.stringify(userData));
        
        // 檢查是否需要更改密碼
        if (password === userId || !userData.password) {
          console.log('需要更改密碼，跳轉到密碼更改頁面');
          localStorage.setItem('firstLogin', 'true');
          
          // 使用新的密碼修改頁面
          console.log('跳轉到新密碼頁面...');
          window.location.href = '/new-password';
        } else {
          console.log('登入成功，跳轉到儀表板');
          router.push('/dashboard');
        }
        return;
      }

      // 一般用戶登入 - 先檢查用戶是否存在
      console.log(`檢查用戶 ID: ${userId} 是否存在...`);
      
      try {
        console.log(`查詢 data_id 表中 ID=${userId} 的記錄...`);
        const { data: userData, error: userError } = await supabase
          .from('data_id')
          .select('*')
          .eq('id', userId)
          .single();

        console.log('查詢結果:', userData ? '找到用戶' : '未找到用戶', userError ? `錯誤: ${userError.message}` : '無錯誤');
        
        if (userError) {
          console.error('用戶查詢錯誤:', userError);
          if (userError.code === 'PGRST116') {
            throw new Error(`用戶 ${userId} 不存在`);
          } else if (userError.code === 'Invalid API key') {
            throw new Error('系統錯誤: 無效的 API 金鑰，請聯絡管理員');
          } else {
            throw new Error(`用戶查詢錯誤: ${userError.message}`);
          }
        }
        
        if (!userData) {
          throw new Error(`找不到用戶 ${userId}`);
        }

        // 修改 - 先檢查用戶的數據庫密碼
        console.log('檢查用戶數據庫密碼...');
        
        // 情況 1: 用戶使用初始密碼登入（ID 與密碼相同）
        if (password === userId) {
          console.log('用戶使用初始密碼登入');
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('firstLogin', 'true');
          
          // 先嘗試跳轉到測試頁面進行診斷
          console.log('跳轉到測試頁面...');
          window.location.href = '/test-page';
          return;
        }
        
        // 情況 2: 用戶有自定義密碼
        if (userData.password && password === userData.password) {
          console.log('用戶使用自定義密碼登入成功');
          localStorage.setItem('user', JSON.stringify(userData));
          router.push('/dashboard');
          return;
        }

        // 嘗試使用 Supabase Auth 登入 (僅作為備用)
        console.log('嘗試使用 Supabase Auth 登入...');
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: `${userId}@pennine.com`,
            password: password
          });

          if (authError) {
            console.log('Supabase Auth 登入失敗, 錯誤:', authError);
            throw new Error('密碼不正確');
          } else {
            console.log('Supabase Auth 登入成功');
            localStorage.setItem('user', JSON.stringify(userData));
            router.push('/dashboard');
            return;
          }
        } catch (authErr) {
          console.error('Auth 登入錯誤:', authErr);
          throw new Error('密碼不正確');
        }
      } catch (userQueryError) {
        console.error('用戶查詢處理錯誤:', userQueryError);
        throw userQueryError;
      }
    } catch (err) {
      console.error('登入錯誤:', err);
      setError(err instanceof Error ? err.message : '登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-center rounded-2xl overflow-hidden shadow-xl bg-white max-w-5xl">
        {/* Left side - Illustration */}
        <div className="w-full lg:w-5/12 bg-blue-50 p-8 flex items-center justify-center">
          <div className="w-full max-w-md flex flex-col items-center justify-center">
            <div className="w-44 h-56 mx-auto relative">
              <div className="absolute inset-0 bg-white rounded-lg shadow-md"></div>
              <div className="absolute inset-2 bg-blue-100 rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="mt-8 text-2xl font-bold text-gray-700">Pennine Stock Control</h2>
            <p className="mt-2 text-gray-500">Manage your inventory efficiently and securely</p>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-7/12 p-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-gray-700">Welcome!</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  ID Number
                </label>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  First time login? Use your ID number as password.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 