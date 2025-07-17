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

      if (error) throw error;

      console.log('[SimpleLoginForm] Sign in successful:', data.user?.email);
      
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
      {/* 錯誤訊息 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='mb-4 rounded-lg border border-red-500/50 bg-red-900/50 p-3'
        >
          <p className='text-red-300 text-sm'>✗ {error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Email */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <label htmlFor='email' className='block text-sm font-medium text-slate-300 mb-1'>
            Email Address
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all'
            placeholder='your.name@pennineindustries.com'
            disabled={isLoading}
          />
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <label htmlFor='password' className='block text-sm font-medium text-slate-300 mb-1'>
            Password
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            className='w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all'
            placeholder='Enter your password'
            disabled={isLoading}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          type='submit'
          disabled={isLoading}
          className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-800 disabled:to-blue-900 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200'
        >
          {isLoading ? (
            <div className='flex items-center justify-center'>
              <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </motion.button>
      </form>
    </div>
  );
}