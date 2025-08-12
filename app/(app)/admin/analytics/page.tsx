/**
 * Analytics & Reports Page
 * Simplified implementation - authentication handled by middleware
 * Updated: Direct lazy loading of TabSelectorCard, removed AnalysisLayout and AdminDashboardContent layers
 */

'use client';

import React, { lazy, Suspense } from 'react';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { ErrorProvider } from '@/lib/error-handling';
import { Skeleton } from '@/components/ui/skeleton';

// Direct lazy loading of TabSelectorCard
const TabSelectorCard = lazy(() =>
  import('../cards/TabSelectorCard').then(m => ({
    default: m.TabSelectorCard,
  }))
);

// Loading skeleton for dashboard
const DashboardLoadingSkeleton = () => (
  <div className='h-full w-full space-y-4 p-6'>
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className='space-y-3'>
          <Skeleton className='h-48 w-full bg-slate-700' />
          <Skeleton className='h-4 w-3/4 bg-slate-700' />
          <Skeleton className='h-4 w-1/2 bg-slate-700' />
        </div>
      ))}
    </div>
  </div>
);

// Force dynamic rendering to avoid SSR issues with Supabase client
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  // Main content - directly render AnalysisLayout
  // Authentication is handled by middleware, so we can assume user is authenticated
  return (
    <AdminErrorBoundary>
      <ErrorProvider>
          <div className='min-h-screen'>
            <div className='relative z-10 flex min-h-screen flex-col overflow-x-hidden text-white'>
              {/* Dashboard Content Area */}
              <div className='flex-1 pb-8'>
                <div className='mx-auto h-full max-w-[1920px] px-4 pt-12 sm:px-6 lg:px-8'>
                  {/* Main content */}
                  <div
                    className='h-full'
                    style={{ minHeight: 'calc(100vh - 260px)' }}
                  >
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <TabSelectorCard />
                    </Suspense>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className='relative z-10 py-8 text-center'>
                <div className='inline-flex items-center space-x-2 text-sm text-slate-500'>
                  <div className='h-1 w-1 rounded-full bg-slate-500'></div>
                  <span>Pennine Manufacturing Stock Control System</span>
                  <div className='h-1 w-1 rounded-full bg-slate-500'></div>
                </div>
              </div>
            </div>
          </div>
      </ErrorProvider>
    </AdminErrorBoundary>
  );
}
