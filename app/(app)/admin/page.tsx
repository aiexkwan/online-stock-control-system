/**
 * Admin Dashboard Page
 * 重定向到 Analytics Dashboard
 * Updated to use analytics as the main dashboard
 */

import { redirect } from 'next/navigation';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  // Redirect to the analytics dashboard
  redirect('/admin/analytics');
}
