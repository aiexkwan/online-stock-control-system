/**
 * Data Management Page
 * Static route implementation for data management dashboard
 */

import { AdminRefreshProvider } from '../contexts/AdminRefreshContext';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { NewAdminDashboard } from '../components/NewAdminDashboard';

export default function DataManagementPage() {
  // No SSR prefetching needed for data-management theme
  return (
    <AdminErrorBoundary>
      <AdminRefreshProvider>
        <NewAdminDashboard 
          theme="data-management" 
        />
      </AdminRefreshProvider>
    </AdminErrorBoundary>
  );
}