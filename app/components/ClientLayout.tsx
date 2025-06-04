'use client';

import React from 'react';
import { Toaster } from 'sonner';
import AuthChecker from './AuthChecker';
import GlobalHeader from '@/components/GlobalHeader';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: 'rgb(30, 41, 59)',
            border: '1px solid rgb(51, 65, 85)',
            color: 'rgb(248, 250, 252)',
          },
        }}
      />
      
      {/* Authentication checker */}
      <AuthChecker>
        {/* Global header */}
        <GlobalHeader />
        
        {/* Main content */}
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          {children}
        </main>
      </AuthChecker>
    </>
  );
} 
