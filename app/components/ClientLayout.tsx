'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import AuthChecker from './AuthChecker';
import GlobalHeader from '@/components/GlobalHeader';
import { UniversalBackground } from './UniversalBackground';
import { GlobalReportDialogs } from '@/app/components/reports/GlobalReportDialogs';
import { GlobalAnalyticsDialogs } from '@/app/components/analytics/GlobalAnalyticsDialogs';
import { useAuth } from '@/app/hooks/useAuth';
import { DynamicActionBar } from '@/components/ui/dynamic-action-bar';
import UniversalChatbot from '@/app/components/admin/UniversalChatbot';
import { UniversalProvider } from '@/components/layout/universal';
import { NavigationProvider } from '@/components/ui/dynamic-action-bar/NavigationProvider';
import { SmartReminder } from '@/components/ui/dynamic-action-bar/SmartReminder';
import { useAuth as useAuthForReminder } from '@/app/hooks/useAuth';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Check for special pages where navigation should not be shown
  const isLoginPage = pathname?.startsWith('/main-login') || pathname === '/';
  const isAccessPage = pathname === '/access';

  // 根據路徑動態決定主題
  const getThemeFromPath = (path: string): string => {
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/stock-transfer')) return 'warehouse';
    if (path.startsWith('/order-loading')) return 'production';
    if (path.startsWith('/print-label') || path.startsWith('/print-grnlabel')) return 'qc';
    if (path.startsWith('/void-pallet')) return 'production';
    return 'neutral';
  };

  const currentTheme = getThemeFromPath(pathname || '');

  return (
    <UniversalProvider
      defaultTheme={currentTheme}
      animationsEnabled={true}
      debugMode={process.env.NODE_ENV === 'development'}
    >
      {/* Toast notifications */}
      <Toaster
        position='top-right'
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
        {/* Global header - now empty */}
        <GlobalHeader />

        {/* Main layout - simplified without sidebar */}
        <UniversalBackground className='text-white'>{children}</UniversalBackground>

        {/* Global report dialogs */}
        <GlobalReportDialogs />

        {/* Global analytics dialogs */}
        <GlobalAnalyticsDialogs />

        {/* Dynamic Navigation Bar - Show only when authenticated and not on login/access pages */}
        {isAuthenticated && !isLoginPage && !isAccessPage && (
          <NavigationProvider>
            <DynamicActionBar />
          </NavigationProvider>
        )}

        {/* Universal Chatbot - Show for authenticated users */}
        {isAuthenticated && !isLoginPage && !isAccessPage && <UniversalChatbot />}

        {/* Smart Reminder - Show for authenticated users */}
        {isAuthenticated && user?.id && !isLoginPage && !isAccessPage && (
          <SmartReminder userId={user.id} />
        )}
      </AuthChecker>
    </UniversalProvider>
  );
}
