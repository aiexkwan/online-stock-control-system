'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateUser } from '../services/auth';

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
      // Admin login logic
      if (userId === 'admin' && password === 'admin123') {
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
        router.push('/dashboard');
        return;
      }

      // Regular user authentication
      const result = await authenticateUser(userId, password);

      if (!result.success || !result.user) {
        setError(result.error || 'Login failed');
        return;
      }

      // 保存用戶信息
      localStorage.setItem('user', JSON.stringify(result.user));

      // 根據是否首次登錄決定跳轉頁面
      if (result.isFirstLogin) {
        localStorage.setItem('firstLogin', 'true');
        router.push('/new-password');
      } else {
        router.push('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Pennine Stock Control System</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
              Clock Number
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {loading ? 'Logging in...' : 'LogIn'}
          </button>
        </form>
      </div>
    </div>
  );
} 