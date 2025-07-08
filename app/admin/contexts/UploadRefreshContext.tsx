'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';

interface UploadRefreshContextType {
  // 觸發更新嘅函數
  triggerOrderHistoryRefresh: () => void;
  triggerOtherFilesRefresh: () => void;

  // 版本號碼 - 用於 hooks 訂閱
  orderHistoryVersion: number;
  otherFilesVersion: number;
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

  // 將版本號碼暴露出去，畀使用者自己處理 useEffect

  const value = React.useMemo(
    () => ({
      triggerOrderHistoryRefresh,
      triggerOtherFilesRefresh,
      orderHistoryVersion,
      otherFilesVersion,
    }),
    [triggerOrderHistoryRefresh, triggerOtherFilesRefresh, orderHistoryVersion, otherFilesVersion]
  );

  return <UploadRefreshContext.Provider value={value}>{children}</UploadRefreshContext.Provider>;
};

export const useUploadRefresh = () => {
  const context = useContext(UploadRefreshContext);
  if (!context) {
    throw new Error('useUploadRefresh must be used within UploadRefreshProvider');
  }
  return context;
};
