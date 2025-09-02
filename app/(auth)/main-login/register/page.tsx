'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { LoginProvider } from '../context/LoginContext';

// Dynamic imports for code splitting
const RegisterForm = dynamic(() => import('@/app/(auth)/main-login/components/RegisterForm'), {
  loading: () => (
    <div className='animate-pulse space-y-4'>
      <div className='h-12 rounded-lg bg-slate-700/50'></div>
      <div className='h-12 rounded-lg bg-slate-700/50'></div>
      <div className='h-12 rounded-lg bg-slate-700/50'></div>
      <div className='h-12 rounded-lg bg-slate-700/50'></div>
    </div>
  ),
  ssr: false,
});

const EmailConfirmation = dynamic(
  () => import('@/app/(auth)/main-login/components/EmailConfirmation'),
  {
    loading: () => (
      <div className='animate-pulse space-y-4 text-center'>
        <div className='mx-auto h-16 w-16 rounded-full bg-slate-700/50'></div>
        <div className='mx-auto h-6 w-48 rounded bg-slate-700/50'></div>
        <div className='mx-auto h-4 w-32 rounded bg-slate-700/50'></div>
      </div>
    ),
    ssr: false,
  }
);

export default function RegisterPage() {
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Memoized callback for registration success
  const handleRegistrationSuccess = useCallback((email: string) => {
    setRegisteredEmail(email);
    setIsRegistered(true);
  }, []);

  // Show email confirmation if registered
  if (isRegistered) {
    return (
      <div className='relative min-h-screen overflow-hidden'>
        {/* Background */}
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' />

        {/* Content */}
        <div className='relative z-10 flex min-h-screen items-center justify-center px-4'>
          <div className='w-full max-w-md space-y-6'>
            {/* Brand Header */}
            <div className='text-center'>
              <h1 className='mb-2 bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent'>
                Pennine Manufacturing
              </h1>
              <p className='text-slate-400'>Stock Management System</p>
            </div>

            {/* Email Confirmation Card */}
            <div className='group relative'>
              {/* Card background glow */}
              <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-slate-800/50 to-blue-900/30 blur-xl' />

              <div className='relative rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-xl'>
                <EmailConfirmation email={registeredEmail} />
              </div>
            </div>

            {/* Footer */}
            <div className='text-center text-xs text-slate-500'>
              <p>© 2025 Pennine Industries. All rights reserved.</p>
              <p>Authorized personnel only</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen overflow-hidden'>
      {/* Background */}
      <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' />

      {/* Content */}
      <div className='relative z-10 flex min-h-screen items-center justify-center px-4'>
        <div className='w-full max-w-md space-y-6'>
          {/* Brand Header */}
          <div className='text-center'>
            <h1 className='mb-2 bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent'>
              Pennine Manufacturing
            </h1>
            <p className='text-slate-400'>Stock Management System</p>
          </div>

          {/* Register Card */}
          <div className='group relative'>
            {/* Card background glow */}
            <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-slate-800/50 to-blue-900/30 blur-xl' />

            <div className='relative rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-xl'>
              <div className='mb-6 text-center'>
                <h2 className='text-xl font-semibold text-white'>Create Account</h2>
                <p className='mt-1 text-slate-400'>Join the Pennine team</p>
              </div>

              {/* Register Form */}
              <LoginProvider initialView='register' enablePersistence={true}>
                <RegisterForm onRegistrationSuccess={handleRegistrationSuccess} />
              </LoginProvider>

              {/* Links */}
              <div className='mt-6 text-center'>
                <span className='text-sm text-slate-400'>Already have an account? </span>
                <Link
                  href='/main-login'
                  className='text-sm text-blue-400 transition-colors hover:text-blue-300'
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='text-center text-xs text-slate-500'>
            <p>© 2025 Pennine Industries. All rights reserved.</p>
            <p>Authorized personnel only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
