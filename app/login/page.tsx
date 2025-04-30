'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 第一步：檢查用戶是否存在於 data_id 表中
      const { data: userData, error: userError } = await supabase
        .from('data_id')
        .select('id, email, password_hash')
        .eq('user_id', userId)
        .single();

      // 如果用戶不存在於 data_id 表中
      if (userError || !userData) {
        throw new Error('User ID not found. Access denied.');
      }

      // 使用 Supabase Auth 進行登入
      // 注意：這裡假設您的 data_id 表中有一個關聯的電子郵件和密碼雜湊
      // 如果您的系統不是這樣設置的，您可能需要調整此邏輯
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email || `${userId}@pennine.com`, // 使用 data_id 表中的電子郵件或生成一個
        password: password, // 使用用戶輸入的密碼
      });

      if (authError) {
        throw new Error('Invalid credentials. Please check your password and try again.');
      }

      if (authData?.user) {
        // 登入成功，將用戶重定向到主頁
        router.push('/');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-5/12 bg-blue-50 items-center justify-center">
        <div className="w-full max-w-md px-8 py-12 flex flex-col items-center justify-center">
          {/* Simple card illustration */}
          <div className="w-48 h-64 mx-auto relative">
            {/* Background circle */}
            <div className="absolute -inset-8 rounded-full bg-blue-100/50"></div>
            
            {/* Card */}
            <div className="absolute inset-0 bg-white rounded-xl border-2 border-blue-600 shadow-lg flex flex-col items-center justify-center p-6">
              {/* Lines */}
              <div className="w-full h-2 bg-blue-100 rounded-full mb-6"></div>
              <div className="w-full h-2 bg-blue-100 rounded-full mb-6"></div>
              <div className="w-full h-2 bg-blue-100 rounded-full mb-10"></div>
              
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
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
            <p className="mt-2 text-gray-600">Please sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <div className="mt-1">
                  <input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your user ID"
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
  );
} 