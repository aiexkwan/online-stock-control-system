/**
 * Analytics Dashboard Hook
 * Manages the state of the Analytics Dashboard Dialog
 */

'use client';

import { create } from 'zustand';

interface AnalyticsDashboardStore {
  isOpen: boolean;
  openDashboard: () => void;
  closeDashboard: () => void;
}

const useAnalyticsDashboardStore = create<AnalyticsDashboardStore>(set => ({
  isOpen: false,
  openDashboard: () => set({ isOpen: true }),
  closeDashboard: () => set({ isOpen: false }),
}));

export function useAnalyticsDashboard() {
  const { isOpen, openDashboard, closeDashboard } = useAnalyticsDashboardStore();

  return {
    isOpen,
    openDashboard,
    closeDashboard,
  };
}
