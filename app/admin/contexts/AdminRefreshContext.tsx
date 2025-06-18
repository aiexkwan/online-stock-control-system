/**
 * Admin Dashboard Refresh Context
 * 管理所有 widget 的手動更新
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface RefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {}
});

export function AdminRefreshProvider({ children }: { children: React.ReactNode }) {
  // Start with 1 to trigger initial load
  const [refreshTrigger, setRefreshTrigger] = useState(1);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useAdminRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useAdminRefresh must be used within AdminRefreshProvider');
  }
  return context;
}