/**
 * 統一的通知類型 Dialog 組件
 * 整合通知、錯誤、警告三種類型，使用 admin 風格和統一動畫
 */

'use client';

import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info,
  Bell,
  Trash2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  type DialogType
} from './unified-dialog';
import { Button } from './button';
import { dialogButtonStyles } from '@/lib/dialog-animation';
import { cn } from '@/lib/utils';

// 通知 Dialog
interface NotificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  onConfirm?: () => void;
}

export function NotificationDialog({
  isOpen,
  onOpenChange,
  title = "通知",
  message,
  onConfirm
}: NotificationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent type="notification" size="sm">
        <DialogHeader className="space-y-4">
          <DialogTitle type="notification" icon={<Bell className="w-7 h-7" />}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-6">
          <Button
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
            className={cn(
              dialogButtonStyles.primary.notification,
              "shadow-lg hover:shadow-blue-500/25 px-8 py-2.5 text-base"
            )}
          >
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 成功 Dialog
interface SuccessDialogProps extends NotificationDialogProps {
  title?: string;
}

export function SuccessDialog({
  title = "操作成功",
  ...props
}: SuccessDialogProps) {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent type="notification" size="sm">
        <DialogHeader className="space-y-4">
          <DialogTitle type="notification" icon={<CheckCircle2 className="w-7 h-7" />}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {props.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-6">
          <Button
            onClick={() => {
              props.onConfirm?.();
              props.onOpenChange(false);
            }}
            className={cn(
              "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500",
              "shadow-lg hover:shadow-green-500/25 px-8 py-2.5 text-base"
            )}
          >
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 錯誤 Dialog
interface ErrorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDialog({
  isOpen,
  onOpenChange,
  title = "錯誤",
  message,
  errorCode,
  onRetry,
  onDismiss
}: ErrorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent type="error" size="sm">
        <DialogHeader className="space-y-4">
          <DialogTitle type="error" icon={<XCircle className="w-7 h-7" />}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        {errorCode && (
          <div className="bg-red-900/20 border border-red-700/30 p-4 rounded-xl my-4 text-sm text-red-300 font-mono">
            錯誤代碼: {errorCode}
          </div>
        )}
        
        <DialogFooter className="gap-3 pt-6">
          <Button
            onClick={() => {
              onDismiss?.();
              onOpenChange(false);
            }}
            variant="outline"
            className={cn(dialogButtonStyles.secondary, "px-6 py-2.5 text-base")}
          >
            關閉
          </Button>
          {onRetry && (
            <Button
              onClick={() => {
                onRetry();
                onOpenChange(false);
              }}
              className={cn(
                dialogButtonStyles.primary.error,
                "shadow-lg hover:shadow-red-500/25 px-6 py-2.5 text-base"
              )}
            >
              重試
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 警告/確認 Dialog
interface WarningDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
  icon?: React.ReactNode;
}

export function WarningDialog({
  isOpen,
  onOpenChange,
  title = "警告",
  message,
  confirmText = "確定",
  cancelText = "取消",
  onConfirm,
  onCancel,
  destructive = false,
  icon
}: WarningDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent type="warning" size="sm">
        <DialogHeader className="space-y-4">
          <DialogTitle 
            type="warning" 
            icon={icon || <AlertTriangle className="w-7 h-7" />}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 pt-6">
          <Button
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
            variant="outline"
            className={cn(dialogButtonStyles.secondary, "px-6 py-2.5 text-base")}
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={cn(
              destructive 
                ? dialogButtonStyles.primary.error 
                : dialogButtonStyles.primary.warning,
              "shadow-lg px-6 py-2.5 text-base",
              destructive 
                ? "hover:shadow-red-500/25" 
                : "hover:shadow-yellow-500/25"
            )}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 刪除確認 Dialog (特殊的警告類型)
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  itemName,
  onConfirm,
  onCancel
}: DeleteConfirmDialogProps) {
  return (
    <WarningDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="刪除確認"
      message={`此操作無法撤銷。這將永久刪除 "${itemName}" 並從我們的伺服器中移除相關數據。`}
      confirmText="刪除"
      cancelText="取消"
      onConfirm={onConfirm}
      onCancel={onCancel}
      destructive={true}
      icon={<Trash2 className="w-6 h-6" />}
    />
  );
}

// 信息 Dialog
interface InfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  details?: React.ReactNode;
  onConfirm?: () => void;
}

export function InfoDialog({
  isOpen,
  onOpenChange,
  title = "信息",
  message,
  details,
  onConfirm
}: InfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent type="information" size="md">
        <DialogHeader className="space-y-4">
          <DialogTitle type="information" icon={<Info className="w-7 h-7" />}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        {details && (
          <div className="bg-cyan-900/20 border border-cyan-700/30 p-5 rounded-xl my-6">
            {details}
          </div>
        )}
        
        <DialogFooter className="pt-6">
          <Button
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
            className={cn(
              dialogButtonStyles.primary.information,
              "shadow-lg hover:shadow-cyan-500/25 px-8 py-2.5 text-base"
            )}
          >
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}