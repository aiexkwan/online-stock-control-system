'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { unifiedAuth } from '../utils/unified-auth';
import type { User } from '@supabase/supabase-js';

// Force dynamic rendering to avoid prerendering issues with client-side auth
export const dynamic = 'force-dynamic';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 檢查用戶是否已登入
    const checkUser = async () => {
      try {
        const currentUser = await unifiedAuth.getCurrentUser();
        if (!currentUser) {
          router.push('/main-login');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        router.push('/main-login');
      }
    };

    checkUser();
  }, [router]);

  const handleChangeSuccess = () => {
    setSuccess(true);
    setError(null);

    // 3秒後跳轉到 admin/analytics 頁面
    setTimeout(() => {
      router.push('/admin/analytics');
    }, 3000);
  };

  const handleChangeError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-900 px-4'>
        <div className='text-center'>
          <div className='mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
          <p className='mt-2 text-gray-400'>Loading...</p>
        </div>
      </div>
    );
  }

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
              <h2 className='mb-2 text-2xl font-semibold text-white'>
                Password Changed Successfully!
              </h2>
              <p className='text-gray-400'>
                Your password has been updated. You will be redirected to the dashboard shortly.
              </p>
            </div>

            <Link
              href='/admin/analytics'
              className='inline-block rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700'
            >
              Go to Dashboard
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

        {/* Change Password Card */}
        <div className='rounded-lg border border-gray-600 bg-gray-800 p-8 shadow-xl'>
          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-semibold text-white'>Change Password</h2>
            <p className='mt-2 text-gray-400'>Update your account password</p>
            {user?.email && <p className='mt-1 text-sm text-blue-400'>{user.email as string}</p>}
          </div>

          {/* Error Message */}
          {error && (
            <div className='mb-4 rounded-md border border-red-500 bg-red-900/50 p-3'>
              <p className='text-sm text-red-300'>{error}</p>
            </div>
          )}

          {/* Change Password Form */}
          <ChangePasswordForm
            onSuccess={handleChangeSuccess}
            onError={handleChangeError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {/* Links */}
          <div className='mt-6 text-center'>
            <Link
              href='/admin/analytics'
              className='text-sm text-gray-400 transition-colors hover:text-gray-300'
            >
              ← Back to Dashboard
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
