'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { unifiedAuth } from '../utils/unified-auth';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.email.endsWith('@pennineindustries.com')) {
      setError('Only @pennineindustries.com email addresses are allowed');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(formData.password)) {
      setError('Password must contain only letters and numbers');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await unifiedAuth.signUp(formData.email, formData.password);
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[RegisterPage] Registration result:', result);

      // 註冊成功，顯示電郵確認訊息
      setRegisteredEmail(formData.email);
      setIsRegistered(true);
      setError('');
    } catch (err: any) {
      console.error('[RegisterPage] Registration failed:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 如果已註冊，顯示電郵確認頁面
  if (isRegistered) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-900 px-4'>
        <div className='w-full max-w-md space-y-8'>
          {/* Brand Header */}
          <div className='text-center'>
            <h1 className='mb-2 text-4xl font-bold text-white'>Pennine Industries</h1>
            <p className='text-lg text-gray-400'>Stock Control System</p>
            <div className='mx-auto mt-4 h-1 w-24 rounded bg-blue-500'></div>
          </div>

          {/* Email Confirmation Card */}
          <div className='rounded-lg border border-gray-600 bg-gray-800 p-8 shadow-xl'>
            <div className='mb-6 text-center'>
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
                    d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <h2 className='mb-2 text-2xl font-semibold text-white'>Check Your Email</h2>
              <p className='text-gray-400'>We&apos;ve sent a confirmation link to</p>
              <p className='mt-1 font-medium text-blue-400'>{registeredEmail}</p>
            </div>

            <div className='space-y-4 text-center'>
              <p className='text-sm text-gray-300'>
                Please check your email and click the confirmation link to activate your account.
                The link will redirect you back to the login page.
              </p>

              <div className='rounded-md border border-yellow-600 bg-yellow-900/30 p-3'>
                <p className='text-xs text-yellow-300'>
                  <strong>Important:</strong> Make sure to check your spam folder if you don&apos;t
                  see the email within a few minutes.
                </p>
              </div>

              <div className='pt-4'>
                <Link
                  href='/main-login'
                  className='inline-flex items-center text-sm text-blue-400 transition-colors hover:text-blue-300'
                >
                  <svg
                    className='mr-2 h-4 w-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10 19l-7-7m0 0l7-7m-7 7h18'
                    />
                  </svg>
                  Back to Login
                </Link>
              </div>
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

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-900 px-4'>
      <div className='w-full max-w-md space-y-8'>
        {/* Brand Header */}
        <div className='text-center'>
          <h1 className='mb-2 text-4xl font-bold text-white'>Pennine Industries</h1>
          <p className='text-lg text-gray-400'>Stock Control System</p>
          <div className='mx-auto mt-4 h-1 w-24 rounded bg-blue-500'></div>
        </div>

        {/* Register Card */}
        <div className='rounded-lg border border-gray-600 bg-gray-800 p-8 shadow-xl'>
          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-semibold text-white'>Create Account</h2>
            <p className='mt-2 text-gray-400'>Join the Pennine team</p>
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
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='your.name@pennineindustries.com'
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor='password' className='mb-2 block text-sm font-medium text-gray-300'>
                Password
              </label>
              <input
                id='password'
                type='password'
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter your password'
                disabled={isLoading}
              />
              <p className='mt-1 text-xs text-gray-400'>
                Password must be at least 6 characters with letters and numbers only
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor='confirmPassword'
                className='mb-2 block text-sm font-medium text-gray-300'
              >
                Confirm Password
              </label>
              <input
                id='confirmPassword'
                type='password'
                value={formData.confirmPassword}
                onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Confirm your password'
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
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Links */}
          <div className='mt-6 text-center'>
            <span className='text-sm text-gray-400'>Already have an account? </span>
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
