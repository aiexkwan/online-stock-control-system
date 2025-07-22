/**
 * Admin Dashboard Page
 * 重定向到 Operations Monitoring Dashboard
 * Updated to use static route instead of dynamic theme route
 */

import { redirect } from 'next/navigation';

export default function AdminDashboardPage() {
  // Redirect to the main operations dashboard
  redirect('/admin/operations');
}
