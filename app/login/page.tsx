'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      if (error) throw error;
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
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-50 items-center justify-center">
        <div className="w-full max-w-lg px-12 py-16 flex flex-col items-center justify-center">
          {/* Simple card illustration */}
          <div className="w-64 h-80 mx-auto relative">
            {/* Background circle */}
            <div className="absolute -inset-10 rounded-full bg-blue-100/50"></div>
            
            {/* Card */}
            <div className="absolute inset-0 bg-white rounded-xl border-2 border-blue-600 shadow-lg flex flex-col items-center justify-center p-6">
              {/* Lines */}
              <div className="w-full h-2 bg-blue-100 rounded-full mb-6"></div>
              <div className="w-full h-2 bg-blue-100 rounded-full mb-6"></div>
              <div className="w-full h-2 bg-blue-100 rounded-full mb-10"></div>
              
              {/* Circle */}
              <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Pennine Stock Control</h2>
            <p className="mt-2 text-gray-600">Manage your inventory efficiently and securely</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
            <p className="mt-2 text-gray-600">Please sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 