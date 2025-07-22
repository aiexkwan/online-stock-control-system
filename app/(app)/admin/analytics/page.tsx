/**
 * Analytics & Reports Page
 * Static route implementation for analytics dashboard
 */

import { AdminRefreshProvider } from '../contexts/AdminRefreshContext';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { NewAdminDashboard } from '../components/NewAdminDashboard';

// Force dynamic rendering to avoid SSR issues with Supabase client
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  // No SSR prefetching needed for analytics theme
  return (
    <AdminErrorBoundary>
      <AdminRefreshProvider>
        <NewAdminDashboard 
          theme="analytics" 
        />
      </AdminRefreshProvider>
    </AdminErrorBoundary>
  );
}