/**
 * Admin Dashboard Theme Pages
 * 動態路由處理所有 admin 子頁面
 */

import { AdminRefreshProvider } from '../contexts/AdminRefreshContext';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { NewAdminDashboard } from '../components/NewAdminDashboard';

export default function AdminThemePage() {
  return (
    <AdminErrorBoundary>
      <AdminRefreshProvider>
        <NewAdminDashboard />
      </AdminRefreshProvider>
    </AdminErrorBoundary>
  );
}

// 生成靜態路徑
export async function generateStaticParams() {
  return [
    { theme: 'injection' },
    { theme: 'pipeline' },
    { theme: 'warehouse' },
    { theme: 'upload' },
    { theme: 'update' },
    { theme: 'stock-management' },
    { theme: 'system' },
    { theme: 'analysis' },
  ];
}
