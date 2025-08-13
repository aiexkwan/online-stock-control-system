/**
 * Business Dialog Type Definitions
 * Central type definitions for business logic dialog management system
 * Renamed from DialogType to BusinessDialogType to avoid naming conflicts
 */

// 定義所有業務對話框類型
export type BusinessDialogType =
  | 'askDatabase'
  | 'loadStock'
  | 'stockTransfer'
  | 'exportData'
  | 'uploadFiles';

// 業務對話框數據類型
export interface BusinessDialogData {
  reprintData?: unknown;
  [key: string]: unknown;
}

// Business Dialog Context 類型定義
export interface BusinessDialogContextType {
  // 對話框開啟狀態
  dialogs: Record<BusinessDialogType, boolean>;
  // 對話框相關數據
  dialogData: BusinessDialogData;
  // 開啟對話框
  openDialog: (dialog: BusinessDialogType, data?: unknown) => void;
  // 關閉對話框
  closeDialog: (dialog: BusinessDialogType) => void;
  // 切換對話框
  toggleDialog: (dialog: BusinessDialogType) => void;
  // 檢查對話框是否開啟
  isDialogOpen: (dialog: BusinessDialogType) => boolean;
  // 設置對話框數據
  setDialogData: (data: BusinessDialogData) => void;
  // 清除對話框數據
  clearDialogData: () => void;
}

// 便利 hook 返回類型
export interface BusinessDialogHookResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}