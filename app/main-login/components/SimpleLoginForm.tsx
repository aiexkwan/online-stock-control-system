'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/app/utils/supabase/client';

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
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('[SimpleLoginForm] Sign in successful:', data.user?.email);

      // 等待一小段時間確保 session 建立
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push('/access');
    } catch (err: any) {
      console.error('[SimpleLoginForm] Sign in failed:', err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='mb-4 rounded-xl border border-red-500/50 bg-red-900/50 p-4 backdrop-blur-sm'
        >
          <div className='flex items-center'>
            <div className='mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-400 to-red-500'>
              <svg
                className='h-3 w-3 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </div>
            <p className='text-sm text-red-300'>{error}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label htmlFor='email' className='mb-2 block text-sm font-medium text-slate-300'>
            Email Address
          </label>
          <div className='relative'>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
              placeholder='your.name@pennineindustries.com'
              disabled={isLoading}
            />
            <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 hover:opacity-100' />
          </div>
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label htmlFor='password' className='mb-2 block text-sm font-medium text-slate-300'>
            Password
          </label>
          <div className='relative'>
            <input
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
              placeholder='Enter your password'
              disabled={isLoading}
            />
            <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 hover:opacity-100' />
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          type='submit'
          disabled={isLoading}
          className='group relative w-full overflow-hidden'
        >
          {/* Button background */}
          <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600' />
          <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

          {/* Button content */}
          <div className='relative rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/90 to-purple-600/90 px-4 py-3 font-medium text-white backdrop-blur-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 group-hover:border-blue-400/50'>
            {isLoading ? (
              <div className='flex items-center justify-center'>
                <div className='mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                Signing in...
              </div>
            ) : (
              <span className='flex items-center justify-center'>
                Sign In
                <svg
                  className='ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7l5 5m0 0l-5 5m5-5H6'
                  />
                </svg>
              </span>
            )}
          </div>
        </motion.button>
      </form>
    </div>
  );
}
