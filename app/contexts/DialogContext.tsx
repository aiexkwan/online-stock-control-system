/**
 * Dialog Context
 * 統一管理所有對話框的狀態
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// 定義所有對話框類型
export type DialogType = 
  | 'uploadFiles'
  | 'uploadFilesOnly'
  | 'uploadOrderPdf'
  | 'productSpec'
  | 'voidPallet'
  | 'viewHistory'
  | 'databaseUpdate'
  | 'askDatabase'
  | 'reprint'
  | 'loadStock'
  | 'stockTransfer'
  | 'exportData';

// 對話框數據類型
interface DialogData {
  reprintData?: any;
  [key: string]: any;
}

// Context 類型定義
interface DialogContextType {
  // 對話框開啟狀態
  dialogs: Record<DialogType, boolean>;
  // 對話框相關數據
  dialogData: DialogData;
  // 開啟對話框
  openDialog: (dialog: DialogType, data?: any) => void;
  // 關閉對話框
  closeDialog: (dialog: DialogType) => void;
  // 切換對話框
  toggleDialog: (dialog: DialogType) => void;
  // 檢查對話框是否開啟
  isDialogOpen: (dialog: DialogType) => boolean;
  // 設置對話框數據
  setDialogData: (data: DialogData) => void;
  // 清除對話框數據
  clearDialogData: () => void;
}

// 創建 Context
const DialogContext = createContext<DialogContextType | undefined>(undefined);

// Provider 組件
export function DialogProvider({ children }: { children: React.ReactNode }) {
  // 初始化所有對話框為關閉狀態
  const [dialogs, setDialogs] = useState<Record<DialogType, boolean>>({
    uploadFiles: false,
    uploadFilesOnly: false,
    uploadOrderPdf: false,
    productSpec: false,
    voidPallet: false,
    viewHistory: false,
    databaseUpdate: false,
    askDatabase: false,
    reprint: false,
    loadStock: false,
    stockTransfer: false,
    exportData: false,
  });

  const [dialogData, setDialogData] = useState<DialogData>({});

  // 開啟對話框
  const openDialog = useCallback((dialog: DialogType, data?: any) => {
    setDialogs(prev => ({ ...prev, [dialog]: true }));
    if (data) {
      setDialogData(prev => ({ ...prev, ...data }));
    }
  }, []);

  // 關閉對話框
  const closeDialog = useCallback((dialog: DialogType) => {
    setDialogs(prev => ({ ...prev, [dialog]: false }));
    // 清除相關數據
    if (dialog === 'reprint') {
      setDialogData(prev => {
        const { reprintData, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  // 切換對話框
  const toggleDialog = useCallback((dialog: DialogType) => {
    setDialogs(prev => ({ ...prev, [dialog]: !prev[dialog] }));
  }, []);

  // 檢查對話框是否開啟
  const isDialogOpen = useCallback((dialog: DialogType) => {
    return dialogs[dialog] || false;
  }, [dialogs]);

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

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
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

export function useVoidPalletDialog() {
  const { dialogs, openDialog, closeDialog } = useDialog();
  return {
    isOpen: dialogs.voidPallet,
    open: () => openDialog('voidPallet'),
    close: () => closeDialog('voidPallet'),
  };
}

export function useReprintDialog() {
  const { dialogs, dialogData, openDialog, closeDialog } = useDialog();
  return {
    isOpen: dialogs.reprint,
    reprintData: dialogData.reprintData,
    open: (data: any) => openDialog('reprint', { reprintData: data }),
    close: () => closeDialog('reprint'),
  };
}