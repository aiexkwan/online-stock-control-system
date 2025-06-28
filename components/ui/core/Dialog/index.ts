/**
 * Dialog 組件導出
 * 統一導出所有 Dialog 相關組件
 */

// 核心 Dialog 組件
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogContext,
  dialogContentVariants,
  dialogAnimationVariants,
  type DialogProps,
  type DialogContentProps,
} from './Dialog';

// 預設配置
export {
  dialogPresets,
  mergeDialogProps,
  type DialogPreset,
  type DialogPresetName,
} from './DialogPresets';

// 通知類對話框
export {
  NotificationDialog,
  SuccessDialog,
  ErrorDialog,
  WarningDialog,
  InfoDialog,
  type NotificationDialogProps,
  type SuccessDialogProps,
  type ErrorDialogProps,
  type WarningDialogProps,
  type InfoDialogProps,
} from './NotificationDialog';

// 確認類對話框
export {
  ConfirmDialog,
  DeleteConfirmDialog,
  SaveConfirmDialog,
  LeaveConfirmDialog,
  type ConfirmDialogProps,
  type DeleteConfirmDialogProps,
  type SaveConfirmDialogProps,
  type LeaveConfirmDialogProps,
} from './ConfirmDialog';