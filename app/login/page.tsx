'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          throw new Error('電子郵件或密碼不正確');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('請先確認您的電子郵件');
        } else {
          throw new Error('登入時發生錯誤，請稍後再試');
        }
      }

      if (data?.user) {
        router.push('/');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600">
      <div className="w-full max-w-md p-8 rounded-lg bg-white/10 backdrop-blur-md shadow-xl">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shadow-2xl">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          Member Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-white/20 rounded transition-colors duration-200"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-white">
              Remember me
            </label>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-200 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </div>
            ) : (
              'LOGIN'
            )}
          </button>

          <div className="flex items-center justify-between mt-6 text-sm">
            <a
              href="/register"
              className="text-white/80 hover:text-white transition-colors duration-200 hover:underline"
            >
              Don't have an account?
            </a>
            <a
              href="/forgot-password"
              className="text-white/80 hover:text-white transition-colors duration-200 hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
} 