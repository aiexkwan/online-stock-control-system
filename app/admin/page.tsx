/**
 * Admin Panel Page
 * 使用新的 Dashboard 系統
 */

import { AdminRefreshProvider } from './contexts/AdminRefreshContext';
import { AdminErrorBoundary } from './components/AdminErrorBoundary';
import { NewAdminDashboard } from './components/NewAdminDashboard';

export default function AdminPanelPage() {
  return (
    <AdminErrorBoundary>
      <AdminRefreshProvider>
        <NewAdminDashboard />
      </AdminRefreshProvider>
    </AdminErrorBoundary>
  );
}