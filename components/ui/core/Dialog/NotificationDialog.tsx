/**
 * NotificationDialog - 通知類型對話框
 * 快捷組件，簡化通知類 Dialog 嘅使用
 */

'use client';

import * as React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info,
  Bell
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  type DialogProps,
} from './Dialog';
import { dialogPresets } from './DialogPresets';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NotificationDialogProps extends Omit<DialogProps, 'children'> {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  showIcon?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

/**
 * 通用通知對話框
 * 
 * @example
 * <NotificationDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   severity="success"
 *   title="操作成功"
 *   message="您的更改已保存"
 * />
 */
export const NotificationDialog = React.forwardRef<
  HTMLDivElement,
  NotificationDialogProps
>(
  (
    {
      open,
      onOpenChange,
      title = '通知',
      message,
      icon,
      severity = 'info',
      confirmText = '確定',
      onConfirm,
      showIcon = true,
      autoClose = false,
      autoCloseDelay = 3000,
      ...props
    },
    ref
  ) => {
    // 自動關閉邏輯
    React.useEffect(() => {
      if (open && autoClose && autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          onOpenChange?.(false);
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    }, [open, autoClose, autoCloseDelay, onOpenChange]);
    
    // 默認圖標
    const defaultIcons = {
      info: <Info className="w-6 h-6" />,
      success: <CheckCircle2 className="w-6 h-6" />,
      warning: <AlertTriangle className="w-6 h-6" />,
      error: <XCircle className="w-6 h-6" />,
    };
    
    const displayIcon = icon || (showIcon && defaultIcons[severity]);
    
    // 按鈕樣式
    const buttonStyles = {
      info: 'bg-blue-500 hover:bg-blue-600 text-white',
      success: 'bg-green-500 hover:bg-green-600 text-white',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      error: 'bg-red-500 hover:bg-red-600 text-white',
    };
    
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        severity={severity}
        {...dialogPresets.notification}
        {...props}
      >
        <DialogContent ref={ref}>
          <DialogHeader>
            <DialogTitle icon={displayIcon}>
              {title}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                onConfirm?.();
                onOpenChange?.(false);
              }}
              className={cn(
                'min-w-[100px]',
                buttonStyles[severity]
              )}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

NotificationDialog.displayName = 'NotificationDialog';

// 快捷組件 - 成功通知
export interface SuccessDialogProps extends Omit<NotificationDialogProps, 'severity'> {
  title?: string;
}

export const SuccessDialog = React.forwardRef<HTMLDivElement, SuccessDialogProps>(
  ({ title = '操作成功', ...props }, ref) => (
    <NotificationDialog
      ref={ref}
      severity="success"
      title={title}
      {...props}
    />
  )
);

SuccessDialog.displayName = 'SuccessDialog';

// 快捷組件 - 錯誤通知
export interface ErrorDialogProps extends Omit<NotificationDialogProps, 'severity'> {
  title?: string;
}

export const ErrorDialog = React.forwardRef<HTMLDivElement, ErrorDialogProps>(
  ({ title = '操作失敗', ...props }, ref) => (
    <NotificationDialog
      ref={ref}
      severity="error"
      title={title}
      {...props}
    />
  )
);

ErrorDialog.displayName = 'ErrorDialog';

// 快捷組件 - 警告通知
export interface WarningDialogProps extends Omit<NotificationDialogProps, 'severity'> {
  title?: string;
}

export const WarningDialog = React.forwardRef<HTMLDivElement, WarningDialogProps>(
  ({ title = '警告', ...props }, ref) => (
    <NotificationDialog
      ref={ref}
      severity="warning"
      title={title}
      {...props}
    />
  )
);

WarningDialog.displayName = 'WarningDialog';

// 快捷組件 - 信息通知
export interface InfoDialogProps extends Omit<NotificationDialogProps, 'severity'> {
  title?: string;
}

export const InfoDialog = React.forwardRef<HTMLDivElement, InfoDialogProps>(
  ({ title = '提示', ...props }, ref) => (
    <NotificationDialog
      ref={ref}
      severity="info"
      title={title}
      {...props}
    />
  )
);

InfoDialog.displayName = 'InfoDialog';