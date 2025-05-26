'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RegisterForm from '../components/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegisterSuccess = () => {
    setSuccess(true);
    setError(null);
    
    // Redirect to login page after 3 seconds
    setTimeout(() => {
      router.push('/main-login');
    }, 3000);
  };

  const handleRegisterError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-600 p-8">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Registration Successful!
              </h2>
              <p className="text-gray-400">
                Your account has been created successfully. You will be redirected to the login page shortly.
              </p>
            </div>
            
            <Link
              href="/main-login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Register Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-600 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Create Account
            </h2>
            <p className="text-gray-400 mt-2">
              Join Pennine Industries team
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onError={handleRegisterError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {/* Links */}
          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">Already have an account? </span>
            <Link
              href="/main-login"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Sign in
            </Link>
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