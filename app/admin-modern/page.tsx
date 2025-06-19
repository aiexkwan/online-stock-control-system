/**
 * Modern Admin Dashboard Page
 * 基於截圖風格但保留深色主題
 */

'use client';

import React from 'react';
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.colors.background }}>
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="text-lg mt-4 text-[#EAEAEA]">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.colors.background }}>
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <h1 className="text-3xl font-bold mb-4 text-orange-500">Authentication Required</h1>
          <p className="text-lg mb-6 text-[#EAEAEA]">Please log in to access the Admin Panel.</p>
          <button 
            onClick={() => router.push('/main-login')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DialogProvider>
      <AdminRefreshProvider>
        <div className="min-h-screen flex" style={{ 
          backgroundColor: THEME.colors.background,
          fontFamily: 'Inter, sans-serif'
        }}>
          <ModernDashboard />
        </div>
      </AdminRefreshProvider>
    </DialogProvider>
  );
}