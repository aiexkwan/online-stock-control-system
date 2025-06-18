/**
 * Admin Panel Page
 * Server component that wraps the client component with necessary providers
 */

import { AdminRefreshProvider } from './contexts/AdminRefreshContext';
import { AdminErrorBoundary } from './components/AdminErrorBoundary';
import { AdminPageClient } from './components/AdminPageClient';
import './utils/clearAdminDashboard';

export default function AdminPanelPage() {
  return (
    <AdminErrorBoundary>
      <AdminRefreshProvider>
        <AdminPageClient />
      </AdminRefreshProvider>
    </AdminErrorBoundary>
  );
}