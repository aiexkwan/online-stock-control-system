'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import { ApolloProvider } from '@apollo/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getApolloClient } from '@/lib/apollo-client';
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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

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
  
  // Get Apollo client safely (will be null on server)
  const apolloClient = getApolloClient();

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

  return (
    <QueryClientProvider client={queryClient}>
      {apolloClient ? (
        <ApolloProvider client={apolloClient}>
          {content}
        </ApolloProvider>
      ) : (
        content
      )}
    </QueryClientProvider>
  );
}
