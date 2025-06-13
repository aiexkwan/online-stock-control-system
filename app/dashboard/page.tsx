'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dashboard redirect page
 * This page has been moved to /home for better user understanding
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main dashboard page
    router.replace('/home');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to home...</p>
      </div>
    </div>
  );
} 