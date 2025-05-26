'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginForm from './components/LoginForm';

export default function MainLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = () => {
    // Redirect to access page without storing any local data
    router.push('/access');
  };

  const handleLoginError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pennine Industries
          </h1>
          <p className="text-gray-400 text-lg">
            Stock Control System
          </p>
          <div className="mt-4 h-1 w-24 bg-blue-500 mx-auto rounded"></div>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-600 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Sign In
            </h2>
            <p className="text-gray-400 mt-2">
              Access your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <LoginForm
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {/* Links */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <Link
                href="/main-login/reset"
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
            
            <div className="text-center">
              <span className="text-gray-400 text-sm">Don't have an account? </span>
              <Link
                href="/main-login/register"
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs">
          <p>© 2024 Pennine Industries. All rights reserved.</p>
          <p className="mt-1">Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
} 