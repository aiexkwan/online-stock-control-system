'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateUser } from '../services/auth';
import Image from 'next/image';

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

      const result = await authenticateUser(userId, password);

      if (!result.success || !result.user) {
        setError(result.error || 'Login failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(result.user));

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
    <div className="min-h-screen flex bg-[#1e2533]">
      {/* Sidebar */}
      <div className="w-64 bg-[#252d3d] p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg" />
          <span className="text-white text-xl font-semibold">Dashboard</span>
        </div>
        
        <nav className="space-y-2">
          <div className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-[#2a3446] rounded-lg cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Login to Dashboard</h2>
          
          <form onSubmit={handleLogin} className="space-y-6 bg-[#252d3d] p-6 rounded-lg">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-300">
                Clock Number
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-[#1e2533] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-[#1e2533] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-md p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white ${
                loading 
                  ? 'bg-blue-500/50 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 