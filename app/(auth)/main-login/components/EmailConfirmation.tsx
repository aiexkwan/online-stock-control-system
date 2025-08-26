'use client';

import React, { memo } from 'react';
import Link from 'next/link';

interface EmailConfirmationProps {
  email: string;
}

// Memoized EmailConfirmation component to prevent unnecessary re-renders
const EmailConfirmation = memo(function EmailConfirmation({ email }: EmailConfirmationProps) {
  return (
    <div className='space-y-6 text-center'>
      {/* Success Icon */}
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500'>
        <svg
          className='h-8 w-8 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
          />
        </svg>
      </div>

      {/* Title and Email */}
      <div>
        <h2 className='mb-2 text-2xl font-semibold text-white'>Check Your Email</h2>
        <p className='text-slate-400'>We&apos;ve sent a confirmation link to</p>
        <p className='mt-1 font-medium text-blue-400'>{email}</p>
      </div>

      {/* Instructions */}
      <div className='space-y-4 text-center'>
        <p className='text-sm text-slate-300'>
          Please check your email and click the confirmation link to activate your account. The link
          will redirect you back to the login page.
        </p>

        {/* Important Notice */}
        <div className='rounded-md border border-yellow-500/50 bg-yellow-900/30 p-3'>
          <p className='text-xs text-yellow-300'>
            <strong>Important:</strong> Make sure to check your spam folder if you don&apos;t see
            the email within a few minutes.
          </p>
        </div>

        {/* Back to Login Link */}
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
              aria-hidden='true'
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
  );
});

export default EmailConfirmation;
