/**
 * 報表儀表板 Hook
 * 提供程式化開啟報表儀表板的方法
 */

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReportsDashboardDialog } from './ReportsDashboardDialog';

interface ReportsDashboardContextType {
  openReportsDashboard: () => void;
  closeReportsDashboard: () => void;
  isOpen: boolean;
}

const ReportsDashboardContext = createContext<ReportsDashboardContextType | null>(null);

export function ReportsDashboardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openReportsDashboard = () => setIsOpen(true);
  const closeReportsDashboard = () => setIsOpen(false);

  return (
    <ReportsDashboardContext.Provider value={{ openReportsDashboard, closeReportsDashboard, isOpen }}>
      {children}
      <ReportsDashboardDialog
        isOpen={isOpen}
        onClose={closeReportsDashboard}
      />
    </ReportsDashboardContext.Provider>
  );
}

export function useReportsDashboard() {
  const context = useContext(ReportsDashboardContext);
  if (!context) {
    throw new Error('useReportsDashboard must be used within ReportsDashboardProvider');
  }
  return context;
}

/**
 * HOC to wrap a component with ReportsDashboardProvider
 */
export function withReportsDashboard<T extends object>(Component: React.ComponentType<T>) {
  return function WithReportsDashboardComponent(props: T) {
    return (
      <ReportsDashboardProvider>
        <Component {...props} />
      </ReportsDashboardProvider>
    );
  };
}