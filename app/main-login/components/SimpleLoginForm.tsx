'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// 移除 motion 依賴避免 webpack 錯誤
import { unifiedAuth } from '../utils/unified-auth';
import { getUserRoleFromDatabase } from '@/app/hooks/useAuth';

export default function SimpleLoginForm() {
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

      console.log('[SimpleLoginForm] Sign in successful:', user?.email);

      // 獲取用戶角色並直接跳轉到相應頁面
      let redirectPath = '/admin/analysis'; // 預設路徑
      
      if (user?.email) {
        try {
          const userRole = await getUserRoleFromDatabase(user.email);
          if (userRole) {
            redirectPath = userRole.defaultPath;
            console.log('[SimpleLoginForm] User role determined, redirecting to:', redirectPath);
          } else {
            console.warn('[SimpleLoginForm] Could not determine user role, using default path');
          }
        } catch (roleError) {
          console.error('[SimpleLoginForm] Error getting user role:', roleError);
          // 使用預設路徑
        }
      }

      // 短暫延遲以確保 session 完全建立
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(redirectPath);
    } catch (err: unknown) {
      console.error('[SimpleLoginForm] Sign in failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* 錯誤訊息 */}
      {error && (
        <div className='mb-4 rounded-lg border border-red-500/50 bg-red-900/50 p-3 animate-pulse'>
          <p className='text-sm text-red-300'>✗ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Email */}
        <div className='opacity-100 transition-all duration-300'>
          <label htmlFor='email' className='mb-1 block text-sm font-medium text-slate-300'>
            Email Address
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white placeholder-slate-400 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50'
            placeholder='your.name@pennineindustries.com'
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className='opacity-100 transition-all duration-300'>
          <label htmlFor='password' className='mb-1 block text-sm font-medium text-slate-300'>
            Password
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white placeholder-slate-400 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50'
            placeholder='Enter your password'
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={isLoading}
          className='w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-blue-800 disabled:to-blue-900'
        >
          {isLoading ? (
            <div className='flex items-center justify-center'>
              <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}
