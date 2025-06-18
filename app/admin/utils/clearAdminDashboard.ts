/**
 * Utility to clear admin dashboard layout
 * This file is kept for compatibility but no longer uses localStorage
 */

export function clearAdminDashboardLayout() {
  if (typeof window !== 'undefined') {
    console.log('Admin dashboard uses database storage only. Use the Reset button in Edit Dashboard mode to clear widgets.');
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAdminDashboard = clearAdminDashboardLayout;
}