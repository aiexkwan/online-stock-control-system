'use client';

import React from 'react';
import Link from 'next/link';
import SimpleLoginForm from './components/SimpleLoginForm';

export default function MainLoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pennine Manufacturing
          </h1>
          <p className="text-gray-400 text-lg">
            Stock Management System
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

          {/* Login Form */}
          <SimpleLoginForm />

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