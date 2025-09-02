/**
 * Dialog 組件導出
 * 集中管理所有對話框相關組件
 */

// 重新導出所有 Dialog 基礎組件
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogBody,
  type DialogProps,
} from './Dialog';

// 重新導出所有確認對話框組件
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

// 重新導出所有通知對話框組件
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

// 重新導出 Dialog 預設配置
export { dialogPresets } from './DialogPresets';
