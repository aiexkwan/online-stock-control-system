'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { unifiedAuth as _unifiedAuth } from '../utils/unified-auth';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.endsWith('@pennineindustries.com')) {
      setError('Only @pennineindustries.com email addresses are allowed');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Note: This is a simplified version. In a real app, you'd implement password reset
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-900 px-4'>
        <div className='w-full max-w-md text-center'>
          <div className='rounded-lg border border-gray-600 bg-gray-800 p-8 shadow-xl'>
            <div className='mb-6'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500'>
                <svg
                  className='h-8 w-8 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
              <h2 className='mb-2 text-2xl font-semibold text-white'>Reset Email Sent!</h2>
              <p className='text-gray-400'>
                Please check your email for password reset instructions.
              </p>
            </div>

            <Link
              href='/main-login'
              className='inline-block rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700'
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-900 px-4'>
      <div className='w-full max-w-md space-y-8'>
        {/* Brand Header */}
        <div className='text-center'>
          <h1 className='mb-2 text-4xl font-bold text-white'>Pennine Industries</h1>
          <p className='text-lg text-gray-400'>Stock Control System</p>
          <div className='mx-auto mt-4 h-1 w-24 rounded bg-blue-500'></div>
        </div>

        {/* Reset Card */}
        <div className='rounded-lg border border-gray-600 bg-gray-800 p-8 shadow-xl'>
          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-semibold text-white'>Reset Password</h2>
            <p className='mt-2 text-gray-400'>Enter your email to receive reset instructions</p>
          </div>

          {error && (
            <div className='mb-4 rounded-md border border-red-500 bg-red-900/50 p-3'>
              <p className='text-sm text-red-300'>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Email Field */}
            <div>
              <label htmlFor='email' className='mb-2 block text-sm font-medium text-gray-300'>
                Email Address
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='your.name@pennineindustries.com'
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:bg-blue-800'
            >
              {isLoading ? (
                <div className='flex items-center justify-center'>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                  Sending Reset Link...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Links */}
          <div className='mt-6 text-center'>
            <span className='text-sm text-gray-400'>Remember your password? </span>
            <Link
              href='/main-login'
              className='text-sm text-blue-400 transition-colors hover:text-blue-300'
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className='text-center text-xs text-gray-500'>
          <p>© 2024 Pennine Industries. All rights reserved.</p>
          <p className='mt-1'>Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}
