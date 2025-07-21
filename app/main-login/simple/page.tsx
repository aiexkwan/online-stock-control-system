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
      
      // 簡化版登入直接跳轉到 admin/analysis，唔使用 setTimeout
      router.push('/admin/analysis');
    } catch (err: unknown) {
      console.error('[SimpleLoginPage] Sign in failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pennine Manufacturing
          </h1>
          <p className="text-slate-400">Stock Management System</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-white">Sign In</h2>
            <p className="mt-1 text-slate-400">Access your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-300">✗ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                placeholder="your.name@pennineindustries.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm space-y-2">
            <div>
              <a href="/main-login/reset" className="text-blue-400 hover:text-blue-300">
                Forgot your password?
              </a>
            </div>
            <div className="text-slate-400">
              Don&apos;t have an account?{' '}
              <a href="/main-login/register" className="text-blue-400 hover:text-blue-300">
                Sign up
              </a>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          <p>© 2025 Pennine Industries. All rights reserved.</p>
          <p>Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}