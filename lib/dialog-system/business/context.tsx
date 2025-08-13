/**
 * Business Dialog Context
 * 統一管理所有業務對話框的狀態
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { 
  BusinessDialogType, 
  BusinessDialogData, 
  BusinessDialogContextType 
} from './types';

// 創建 Business Dialog Context
const BusinessDialogContext = createContext<BusinessDialogContextType | undefined>(undefined);

// Provider 組件
export function BusinessDialogProvider({ children }: { children: React.ReactNode }) {
  // 初始化所有業務對話框為關閉狀態
  const [dialogs, setDialogs] = useState<Record<BusinessDialogType, boolean>>({
    askDatabase: false,
    loadStock: false,
    stockTransfer: false,
    exportData: false,
    uploadFiles: false,
  });

  const [dialogData, setDialogData] = useState<BusinessDialogData>({});

  // 開啟對話框
  const openDialog = useCallback((dialog: BusinessDialogType, data?: unknown) => {
    setDialogs(prev => ({ ...prev, [dialog]: true }));
    if (data) {
      setDialogData(prev => ({ ...prev, ...data }));
    }
  }, []);

  // 關閉對話框
  const closeDialog = useCallback((dialog: BusinessDialogType) => {
    setDialogs(prev => ({ ...prev, [dialog]: false }));
  }, []);

  // 切換對話框
  const toggleDialog = useCallback((dialog: BusinessDialogType) => {
    setDialogs(prev => ({ ...prev, [dialog]: !prev[dialog] }));
  }, []);

  // 檢查對話框是否開啟
  const isDialogOpen = useCallback(
    (dialog: BusinessDialogType) => {
      return dialogs[dialog] || false;
    },
    [dialogs]
  );

  // 清除所有對話框數據
  const clearDialogData = useCallback(() => {
    setDialogData({});
  }, []);

  const value: BusinessDialogContextType = {
    dialogs,
    dialogData,
    openDialog,
    closeDialog,
    toggleDialog,
    isDialogOpen,
    setDialogData,
    clearDialogData,
  };

  return <BusinessDialogContext.Provider value={value}>{children}</BusinessDialogContext.Provider>;
}

// Custom hook 使用 Business Dialog Context
export function useBusinessDialog() {
  const context = useContext(BusinessDialogContext);
  if (context === undefined) {
    throw new Error('useBusinessDialog must be used within a BusinessDialogProvider');
  }
  return context;
}

// 便利 hooks 針對特定對話框
export function useUploadDialog() {
  const { dialogs, openDialog, closeDialog } = useBusinessDialog();
  return {
    isOpen: dialogs.uploadFiles,
    open: () => openDialog('uploadFiles'),
    close: () => closeDialog('uploadFiles'),
  };
}