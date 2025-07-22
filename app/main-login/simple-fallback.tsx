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
        // 簡化版登入直接跳轉到 admin/analytics
        router.push('/admin/analytics');
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
    <div className='flex min-h-screen items-center justify-center bg-slate-900 px-4'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-3xl font-bold text-white'>Pennine Manufacturing</h1>
          <p className='text-slate-400'>Stock Management System</p>
          <p className='mt-2 text-xs text-slate-500'>Simplified Login - Fallback Mode</p>
        </div>

        {/* Login Card */}
        <div className='rounded-lg border border-slate-700 bg-slate-800 p-6'>
          <h2 className='mb-6 text-center text-xl font-semibold text-white'>Sign In</h2>

          {error && (
            <div className='mb-4 rounded border border-red-500/50 bg-red-900/50 p-3 text-sm text-red-300'>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className='space-y-4'>
            {/* Email */}
            <div>
              <label htmlFor='email' className='mb-1 block text-sm font-medium text-slate-300'>
                Email
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                className='w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-50'
                placeholder='Enter your email'
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor='password' className='mb-1 block text-sm font-medium text-slate-300'>
                Password
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                className='w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-50'
                placeholder='Enter your password'
              />
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading || !email.trim() || !password}
              className='w-full rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600'
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Links */}
          <div className='mt-4 text-center text-sm text-slate-400'>
            <button
              onClick={() => window.location.reload()}
              className='text-blue-400 underline hover:text-blue-300'
            >
              Try full login page
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className='mt-6 text-center text-xs text-slate-500'>
          <p>© 2025 Pennine Industries. All rights reserved.</p>
          <p>Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}
