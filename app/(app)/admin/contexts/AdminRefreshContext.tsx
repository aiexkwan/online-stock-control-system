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
  triggerRefresh: () => {},
});

export function AdminRefreshProvider({ children }: { children?: React.ReactNode }) {
  // Start with 0 to prevent auto-triggering on mount
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const safeChildren = children || null;

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {safeChildren}
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
