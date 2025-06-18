'use client';

import React from 'react';
import { Toaster } from 'sonner';
import AuthChecker from './AuthChecker';
import GlobalHeader from '@/components/GlobalHeader';
import MotionBackground from './MotionBackground';
import { GlobalReportDialogs } from '@/app/components/reports/GlobalReportDialogs';
import { GlobalAnalyticsDialogs } from '@/app/components/analytics/GlobalAnalyticsDialogs';

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
        
        {/* Main content with motion background */}
        <MotionBackground className="text-white">
          {children}
        </MotionBackground>
        
        {/* Global report dialogs */}
        <GlobalReportDialogs />
        
        {/* Global analytics dialogs */}
        <GlobalAnalyticsDialogs />
      </AuthChecker>
    </>
  );
} 
