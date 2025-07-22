/**
 * Operations & Production Monitoring Page
 * Static route implementation for operations monitoring dashboard
 */

import { AdminRefreshProvider } from '../contexts/AdminRefreshContext';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { NewAdminDashboard } from '../components/NewAdminDashboard';
import { prefetchCriticalWidgetsData } from '../hooks/server/prefetch.server';

export default async function OperationsPage() {
  // Server-side data prefetching for Critical Path Widgets
  let prefetchedData = null;
  let ssrMode = false;

  try {
    console.log('[SSR] Prefetching critical widgets data for operations');

    prefetchedData = await prefetchCriticalWidgetsData({
      dateRange: {
        startDate: null, // Use default date range
        endDate: null,
      },
      criticalOnly: true,
    });

    ssrMode = true;

    console.log(
      `[SSR] Successfully prefetched ${Object.keys(prefetchedData).length} critical widgets`
    );
  } catch (error) {
    console.error('[SSR] Critical widgets prefetch failed, falling back to CSR:', error);
    // Graceful degradation - fall back to CSR if SSR fails
    prefetchedData = undefined;
    ssrMode = false;
  }

  return (
    <AdminErrorBoundary>
      <AdminRefreshProvider>
        <NewAdminDashboard 
          prefetchedData={prefetchedData} 
          ssrMode={ssrMode} 
          theme="operations" 
        />
      </AdminRefreshProvider>
    </AdminErrorBoundary>
  );
}