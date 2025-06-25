'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';

interface UploadRefreshContextType {
  // 觸發更新嘅函數
  triggerOrderHistoryRefresh: () => void;
  triggerOtherFilesRefresh: () => void;
  
  // 訂閱更新事件嘅 hooks
  useOrderHistoryRefresh: (callback: () => void) => void;
  useOtherFilesRefresh: (callback: () => void) => void;
}

const UploadRefreshContext = createContext<UploadRefreshContextType | undefined>(undefined);

export const UploadRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 使用計數器來觸發更新
  const [orderHistoryVersion, setOrderHistoryVersion] = useState(0);
  const [otherFilesVersion, setOtherFilesVersion] = useState(0);

  // 觸發更新函數
  const triggerOrderHistoryRefresh = useCallback(() => {
    setOrderHistoryVersion(v => v + 1);
  }, []);

  const triggerOtherFilesRefresh = useCallback(() => {
    setOtherFilesVersion(v => v + 1);
  }, []);

  // 訂閱 hooks
  const useOrderHistoryRefresh = useCallback((callback: () => void) => {
    React.useEffect(() => {
      if (orderHistoryVersion > 0) {
        callback();
      }
    }, [orderHistoryVersion, callback]);
  }, [orderHistoryVersion]);

  const useOtherFilesRefresh = useCallback((callback: () => void) => {
    React.useEffect(() => {
      if (otherFilesVersion > 0) {
        callback();
      }
    }, [otherFilesVersion, callback]);
  }, [otherFilesVersion]);

  const value = React.useMemo(() => ({
    triggerOrderHistoryRefresh,
    triggerOtherFilesRefresh,
    useOrderHistoryRefresh,
    useOtherFilesRefresh
  }), [
    triggerOrderHistoryRefresh,
    triggerOtherFilesRefresh,
    useOrderHistoryRefresh,
    useOtherFilesRefresh
  ]);

  return (
    <UploadRefreshContext.Provider value={value}>
      {children}
    </UploadRefreshContext.Provider>
  );
};

export const useUploadRefresh = () => {
  const context = useContext(UploadRefreshContext);
  if (!context) {
    throw new Error('useUploadRefresh must be used within UploadRefreshProvider');
  }
  return context;
};