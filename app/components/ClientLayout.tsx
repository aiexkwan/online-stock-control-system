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

// Error boundary for dialog components - 保留用於向後兼容
class DialogErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dialog Error Boundary caught an error:', error, errorInfo);
    
    // Special handling for originalFactory.call errors
    if (error.message.includes('originalFactory.call') || 
        error.message.includes('undefined is not an object') ||
        error.message.includes('Cannot read properties of undefined')) {
      console.warn('Dynamic import error detected in dialog components');
      
      // Auto-retry after a delay for originalFactory errors
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 3000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-gray-500 p-2">
          Dialog loading error - recovering...
        </div>
      );
    }

    return this.props.children;
  }
}

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
        <ErrorBoundary>
          <UniversalBackground className='text-white'>{children}</UniversalBackground>
        </ErrorBoundary>

        {/* Global report dialogs with enhanced error boundary */}
        <ErrorBoundary>
          <React.Suspense fallback={<DialogSuspenseFallback />}>
            <GlobalReportDialogs />
          </React.Suspense>
        </ErrorBoundary>

        {/* Global analytics dialogs with enhanced error boundary */}
        <ErrorBoundary>
          <React.Suspense fallback={<DialogSuspenseFallback />}>
            <GlobalAnalyticsDialogs />
          </React.Suspense>
        </ErrorBoundary>

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
