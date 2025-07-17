'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { isDevelopment } from '@/lib/utils/env';

// Create a client - OPTIMIZED FOR MINIMAL API CALLS
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes - much longer to reduce API calls
      gcTime: 1000 * 60 * 60, // 60 minutes - longer cache retention
      refetchOnWindowFocus: false, // No refetch on focus
      refetchOnMount: false, // No refetch on mount if data exists
      refetchOnReconnect: false, // No refetch on reconnect
      refetchInterval: false, // No automatic polling
      retry: 1, // Reduced retries
      retryDelay: 5000, // Fixed 5 second delay
    },
  },
});

// 導入新的錯誤邊界
import ErrorBoundary from './ErrorBoundary';

// Suspense fallback for dialogs
const DialogSuspenseFallback = () => (
  <div className="text-xs text-gray-500 p-2">
    Loading dialogs...
  </div>
);

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
  

  const content = (
    <UniversalProvider
      defaultTheme={currentTheme}
      animationsEnabled={true}
      debugMode={isDevelopment()}
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
        <ErrorBoundary>
          <UniversalBackground className='text-white'>{children}</UniversalBackground>
        </ErrorBoundary>

        {/* Global report dialogs with enhanced error boundary */}
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Report dialogs error:', error, errorInfo);
          }}
        >
          <React.Suspense fallback={<DialogSuspenseFallback />}>
            <GlobalReportDialogs />
          </React.Suspense>
        </ErrorBoundary>

        {/* Global analytics dialogs with enhanced error boundary */}
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Analytics dialogs error:', error, errorInfo);
          }}
        >
          <React.Suspense fallback={<DialogSuspenseFallback />}>
            <GlobalAnalyticsDialogs />
          </React.Suspense>
        </ErrorBoundary>

        {/* Dynamic Navigation Bar - Show only when authenticated and not on login/access pages */}
        {isAuthenticated && !isLoginPage && !isAccessPage && (
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Navigation system error:', error, errorInfo);
            }}
          >
            <NavigationProvider>
              <DynamicActionBar />
            </NavigationProvider>
          </ErrorBoundary>
        )}

        {/* Universal Chatbot - Show for authenticated users */}
        {isAuthenticated && !isLoginPage && !isAccessPage && (
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Chatbot error:', error, errorInfo);
            }}
          >
            <UniversalChatbot />
          </ErrorBoundary>
        )}

        {/* Smart Reminder - Show for authenticated users */}
        {isAuthenticated && user?.id && !isLoginPage && !isAccessPage && (
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Smart reminder error:', error, errorInfo);
            }}
          >
            <SmartReminder userId={user.id} />
          </ErrorBoundary>
        )}
      </AuthChecker>
    </UniversalProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {content}
    </QueryClientProvider>
  );
}
