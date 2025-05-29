'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy Dashboard Redirect
 * 
 * This page has been moved to /dashboard/access for better access control
 * and modern design. This redirect ensures backward compatibility.
 */
export default function LegacyDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the new dashboard location
    router.replace('/dashboard/access');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-300 text-lg">Redirecting to dashboard...</p>
      </div>
    </div>
  );
} 