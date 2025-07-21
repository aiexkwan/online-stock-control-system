'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { unifiedAuth } from './utils/unified-auth';

/**
 * 簡化版登入頁面 - 當主登入頁面載入失敗時使用
 */
export default function SimpleFallbackLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await unifiedAuth.signIn(email.trim(), password);

      if (user) {
        // 簡化版登入直接跳轉到 admin/analysis
        router.push('/admin/analysis');
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pennine Manufacturing
          </h1>
          <p className="text-slate-400">Stock Management System</p>
          <p className="text-xs text-slate-500 mt-2">
            Simplified Login - Fallback Mode
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Sign In
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-4 text-center text-sm text-slate-400">
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Try full login page
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 mt-6">
          <p>© 2025 Pennine Industries. All rights reserved.</p>
          <p>Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}