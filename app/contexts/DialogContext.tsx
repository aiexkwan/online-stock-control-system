/**
 * Dialog Context
 * 統一管理所有對話框的狀態
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DialogType, DialogData, DialogContextType } from '@/types/contexts/dialog';

// 創建 Context
const DialogContext = createContext<DialogContextType | undefined>(undefined);

// Provider 組件
export function DialogProvider({ children }: { children: React.ReactNode }) {
  // 初始化所有對話框為關閉狀態
  const [dialogs, setDialogs] = useState<Record<DialogType, boolean>>({
    askDatabase: false,
    loadStock: false,
    stockTransfer: false,
    exportData: false,
    uploadFiles: false,
  });

  const [dialogData, setDialogData] = useState<DialogData>({});

  // 開啟對話框
  const openDialog = useCallback((dialog: DialogType, data?: unknown) => {
    setDialogs(prev => ({ ...prev, [dialog]: true }));
    if (data) {
      setDialogData(prev => ({ ...prev, ...data }));
    }
  }, []);

  // 關閉對話框
  const closeDialog = useCallback((dialog: DialogType) => {
    setDialogs(prev => ({ ...prev, [dialog]: false }));
  }, []);

  // 切換對話框
  const toggleDialog = useCallback((dialog: DialogType) => {
    setDialogs(prev => ({ ...prev, [dialog]: !prev[dialog] }));
  }, []);

  // 檢查對話框是否開啟
  const isDialogOpen = useCallback(
    (dialog: DialogType) => {
      return dialogs[dialog] || false;
    },
    [dialogs]
  );

  // 清除所有對話框數據
  const clearDialogData = useCallback(() => {
    setDialogData({});
  }, []);

  const value: DialogContextType = {
    dialogs,
    dialogData,
    openDialog,
    closeDialog,
    toggleDialog,
    isDialogOpen,
    setDialogData,
    clearDialogData,
  };

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

// Custom hook 使用 Dialog Context
export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

// 便利 hooks 針對特定對話框
export function useUploadDialog() {
  const { dialogs, openDialog, closeDialog } = useDialog();
  return {
    isOpen: dialogs.uploadFiles,
    open: () => openDialog('uploadFiles'),
    close: () => closeDialog('uploadFiles'),
  };
}
