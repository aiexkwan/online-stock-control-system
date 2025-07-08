/**
 * Admin Dashboard Page
 * 重定向到 Injection Dashboard
 */

import { redirect } from 'next/navigation';

export default function AdminDashboardPage() {
  redirect('/admin/injection');
}
