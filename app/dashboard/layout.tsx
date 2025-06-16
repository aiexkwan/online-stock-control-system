/**
 * Dashboard Layout
 * 為 Dashboard 頁面提供 Dialog Context 和相關功能
 */

'use client';

import { DialogProvider } from '@/app/contexts/DialogContext';
import { DialogManager } from '@/app/components/admin-panel/DialogManager';
import { AnalyticsDashboardDialog } from '@/app/components/analytics/AnalyticsDashboardDialog';
import { useCallback } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle reprint needed callback
  const handleReprintNeeded = useCallback((reprintInfo: any) => {
    console.log('Reprint needed:', reprintInfo);
  }, []);

  // Handle reprint confirm
  const handleReprintConfirm = useCallback(async (reprintInfo: any) => {
    console.log('Reprint confirmed:', reprintInfo);
  }, []);

  // Handle reprint cancel
  const handleReprintCancel = useCallback(() => {
    console.log('Reprint cancelled');
  }, []);

  return (
    <DialogProvider>
      {children}
      
      {/* Dialog Manager - Centralized dialog rendering */}
      <DialogManager
        onReprintNeeded={handleReprintNeeded}
        onReprintConfirm={handleReprintConfirm}
        onReprintCancel={handleReprintCancel}
        voidState={{
          selectedPallet: null,
          isLoading: false,
          confirmInfo: null,
          reprintInfo: null,
          error: null
        }}
      />
      
      {/* Analytics Dashboard Dialog */}
      <AnalyticsDashboardDialog />
    </DialogProvider>
  );
}