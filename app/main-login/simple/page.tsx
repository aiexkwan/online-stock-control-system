'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { unifiedAuth } from '../utils/unified-auth';

export default function SimpleLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.endsWith('@pennineindustries.com')) {
      setError('Only @pennineindustries.com email addresses are allowed');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { user } = await unifiedAuth.signIn(email, password);

      if (!user) throw new Error('Login failed');

      console.log('[SimpleLoginPage] Sign in successful:', user?.email);

      // 簡化版登入直接跳轉到 admin/analytics，唔使用 setTimeout
      router.push('/admin/analytics');
    } catch (err: unknown) {
      console.error('[SimpleLoginPage] Sign in failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-slate-900 px-4'>
      <div className='w-full max-w-md space-y-6'>
        <div className='text-center'>
          <h1 className='mb-2 text-3xl font-bold text-white'>Pennine Manufacturing</h1>
          <p className='text-slate-400'>Stock Management System</p>
        </div>

        <div className='rounded-lg border border-slate-700 bg-slate-800 p-6'>
          <div className='mb-6 text-center'>
            <h2 className='text-xl font-semibold text-white'>Sign In</h2>
            <p className='mt-1 text-slate-400'>Access your account</p>
          </div>

          {error && (
            <div className='mb-4 rounded-lg border border-red-500/50 bg-red-900/50 p-3'>
              <p className='text-sm text-red-300'>✗ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label htmlFor='email' className='mb-1 block text-sm font-medium text-slate-300'>
                Email Address
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50'
                placeholder='your.name@pennineindustries.com'
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor='password' className='mb-1 block text-sm font-medium text-slate-300'>
                Password
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50'
                placeholder='Enter your password'
                disabled={isLoading}
              />
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className='w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-800'
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className='mt-4 space-y-2 text-center text-sm'>
            <div>
              <a href='/main-login/reset' className='text-blue-400 hover:text-blue-300'>
                Forgot your password?
              </a>
            </div>
            <div className='text-slate-400'>
              Don&apos;t have an account?{' '}
              <a href='/main-login/register' className='text-blue-400 hover:text-blue-300'>
                Sign up
              </a>
            </div>
          </div>
        </div>

        <div className='text-center text-xs text-slate-500'>
          <p>© 2025 Pennine Industries. All rights reserved.</p>
          <p>Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}
