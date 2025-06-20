/**
 * Modern Admin Dashboard Page
 * AI Terminal Style Design
 */

'use client';

import React, { useEffect } from 'react';
import { DialogProvider } from '@/app/contexts/DialogContext';
import { AdminRefreshProvider } from '../admin/contexts/AdminRefreshContext';
import { ModernDashboard } from '../admin/components/dashboard/ModernDashboard';
import { RefreshButton } from '../admin/components/RefreshButton';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { THEME } from '../admin/config/theme';

export default function ModernAdminPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Ensure Font Awesome is loaded
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
          <p className="text-lg mt-4 text-emerald-400 font-mono">INITIALIZING TERMINAL...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <h1 className="text-3xl font-bold mb-4 text-emerald-400 font-mono">ACCESS DENIED</h1>
          <p className="text-lg mb-6 text-gray-400 font-mono">Authentication required to access AI Terminal.</p>
          <button 
            onClick={() => router.push('/main-login')}
            className="px-6 py-3 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-all duration-300 font-bold font-mono border-2 border-emerald-400 shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/40 hover:-translate-y-0.5"
          >
            AUTHENTICATE
          </button>
        </div>
      </div>
    );
  }

  return (
    <DialogProvider>
      <AdminRefreshProvider>
        <ModernDashboard />
      </AdminRefreshProvider>
    </DialogProvider>
  );
}