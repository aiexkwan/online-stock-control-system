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

    // 直接輸出登入嘗試信息
    console.log('==== Login attempt ====');
    console.log(`User ID: ${userId}, password length: ${password.length} characters`);

    try {
      // 先進行連接測試
      console.log('Testing Supabase connection...');
      
      // 簡單連接測試 - 嘗試載入 1 條記錄
      const { error: testError } = await supabase
        .from('data_id')
        .select('id')
        .limit(1);
      
      if (testError) {
        if (testError.message === 'Invalid API key') {
          console.error('Supabase API key invalid or expired');
          setError('System error: database connection invalid, please contact administrator');
          setLoading(false);
          return;
        }
      }
    } catch (testErr) {
      console.error('Connection test error:', testErr);
    }

    try {
      console.log('Attempting login...');
      
      // Admin login logic - use hardcoded credentials to avoid API key issues
      if (userId === 'admin' && password === 'admin123') {
        console.log('Admin login successful (hardcoded)');
        
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
        
        // Opening dashboard page...
        console.log('Opening dashboard page...');
        window.open('/dashboard', '_self');
        return;
      }

      // Hardcoded test user logic
      if (userId === '5997' && password === '5997') {
        console.log('Test user 5997 login successful (hardcoded)');
        
        const userData = {
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
        };
        
        // 保存用戶資訊
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('firstLogin', 'true');
        
        // Opening new password page...
        console.log('Opening new password page...');
        window.open('/new-password', '_self');
        return;
      }

      // Another test user
      if (userId === 'testuser' && password === 'testuser') {
        console.log('Test user testuser login successful (hardcoded)');
        
        const userData = {
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
        };
        
        // 保存用戶資訊
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Opening dashboard page...
        console.log('Opening dashboard page...');
        window.open('/dashboard', '_self');
        return;
      }

      // Regular user login - first check if user exists
      console.log(`Checking if user ID: ${userId} exists...`);
      
      try {
        console.log(`Querying data_id table for ID=${userId}...`);
        const { data: userData, error: userError } = await supabase
          .from('data_id')
          .select('*')
          .eq('id', userId)
          .single();

        console.log('Query result:', userData ? 'User found' : 'User not found', userError ? `Error: ${userError.message}` : 'No errors');
        
        if (userError) {
          console.error('User query error:', userError);
          if (userError.code === 'PGRST116') {
            throw new Error(`User ${userId} does not exist`);
          } else if (userError.code === 'Invalid API key') {
            throw new Error('System error: invalid API key, please contact administrator');
          } else {
            throw new Error(`User query error: ${userError.message}`);
          }
        }
        
        if (!userData) {
          throw new Error(`User ${userId} not found`);
        }

        // Checking user database password...
        console.log('Checking user database password...');
        
        // 情況 1: 用戶使用初始密碼登入（ID 與密碼相同）
        if (password === userId) {
          console.log('User logged in with initial password');
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('firstLogin', 'true');
          
          // Opening new password page...
          console.log('Opening new password page...');
          window.open('/new-password', '_self');
          return;
        }
        
        // 情況 2: 用戶有自定義密碼
        if (userData.password && password === userData.password) {
          console.log('User login successful with custom password');
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Opening dashboard page...
          console.log('Opening dashboard page...');
          window.open('/dashboard', '_self');
          return;
        }

        // 嘗試使用 Supabase Auth 登入 (僅作為備用)
        console.log('Attempting Supabase Auth login...');
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: `${userId}@pennine.com`,
            password: password
          });

          if (authError) {
            console.log('Supabase Auth login failed, error:', authError);
            throw new Error('Password incorrect');
          } else {
            console.log('Supabase Auth login successful');
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Opening dashboard page...
            console.log('Opening dashboard page...');
            window.open('/dashboard', '_self');
            return;
          }
        } catch (authErr) {
          console.error('Auth login error:', authErr);
          throw new Error('Password incorrect');
        }
      } catch (userQueryError) {
        console.error('User query processing error:', userQueryError);
        throw userQueryError;
      }
    } catch (err) {
      console.error('Error during login process:', err);
      setError(err instanceof Error ? err.message : 'Login failed, please try again later');
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