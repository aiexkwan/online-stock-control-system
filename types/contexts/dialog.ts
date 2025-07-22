/**
 * Dialog Context Type Definitions
 * Central type definitions for dialog management system
 */

// 定義所有對話框類型
export type DialogType =
  | 'askDatabase'
  | 'loadStock'
  | 'stockTransfer'
  | 'exportData'
  | 'uploadFiles';

// 對話框數據類型
export interface DialogData {
  reprintData?: unknown;
  [key: string]: unknown;
}

// Context 類型定義
export interface DialogContextType {
  // 對話框開啟狀態
  dialogs: Record<DialogType, boolean>;
  // 對話框相關數據
  dialogData: DialogData;
  // 開啟對話框
  openDialog: (dialog: DialogType, data?: unknown) => void;
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

// 便利 hook 返回類型
export interface DialogHookResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}
