'use client';

import React from 'react';
import LoginForm from '../components/LoginForm';

export default function SimpleLoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-8">
          Pennine Login
        </h1>
        
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <LoginForm />
        </div>
        
        <p className="text-center text-gray-500 text-sm mt-4">
          © 2025 Pennine Industries
        </p>
      </div>
    </div>
  );
}