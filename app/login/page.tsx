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

    try {
      // 管理員登入邏輯
      if (userId === 'admin' && password === 'admin123') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@pennine.com',
          password: 'admin123'
        });

        if (signInError) throw signInError;
        
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

      // 一般用戶登入
      const { data: userData, error: userError } = await supabase
        .from('data_id')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw new Error('用戶不存在');
      if (!userData) throw new Error('找不到用戶');

      // 驗證密碼
      if (userData.password !== password && password !== userData.id) {
        throw new Error('密碼錯誤');
      }

      // 使用 Supabase Auth 登入
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: `${userId}@pennine.com`,
        password: password
      });

      if (authError) {
        // 如果是首次登入，使用 ID 作為密碼
        if (password === userId) {
          const { data: firstLoginData, error: firstLoginError } = await supabase.auth.signInWithPassword({
            email: `${userId}@pennine.com`,
            password: userId
          });

          if (firstLoginError) throw firstLoginError;
          localStorage.setItem('firstLogin', 'true');
        } else {
          throw authError;
        }
      }

      // 保存用戶資訊
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 檢查是否需要更改密碼
      if (password === userId || !userData.password) {
        router.replace('/change-password');
      } else {
        router.replace('/dashboard');
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