'use client';

import React from 'react';
import LoginForm from '../components/LoginForm';

export default function SimpleLoginPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-slate-900 p-4'>
      <div className='w-full max-w-sm'>
        <h1 className='mb-8 text-center text-2xl font-bold text-white'>Pennine Login</h1>

        <div className='rounded-lg bg-slate-800 p-6 shadow-xl'>
          <LoginForm />
        </div>

        <p className='mt-4 text-center text-sm text-gray-500'>© 2025 Pennine Industries</p>
      </div>
    </div>
  );
}
