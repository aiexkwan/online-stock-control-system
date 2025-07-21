/**
 * 統一的 Dialog 組件
 * 提供一致的淡入淡出動畫和 admin 風格
 */

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  dialogAnimationClasses,
  dialogVariants,
  dialogIconColors,
  dialogTitleStyles,
  dialogButtonStyles,
  type DialogType,
} from '@/lib/dialog-animation';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

// 統一的背景遮罩
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      dialogAnimationClasses.overlay.base,
      dialogAnimationClasses.overlay.animation,
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// 統一的內容容器
interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  type?: DialogType;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, type = 'form', size = 'md', ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        dialogAnimationClasses.content.base,
        dialogAnimationClasses.content.animation,
        dialogVariants({ type, size }),
        'max-h-[90vh] overflow-y-auto p-8',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className='absolute right-6 top-6 rounded-full p-1.5 opacity-70 ring-offset-background transition-all hover:bg-slate-800 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none'>
        <X className='h-5 w-5' />
        <span className='sr-only'>Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// 統一的標題
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: DialogType;
}

const DialogHeader = ({ className, type = 'form', ...props }: DialogHeaderProps) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

// 統一的標題文字
interface DialogTitleProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  type?: DialogType;
  icon?: React.ReactNode;
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ className, children, type = 'form', icon, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'flex items-center gap-4 bg-clip-text text-2xl font-bold text-transparent',
      dialogTitleStyles[type],
      className
    )}
    {...props}
  >
    {icon && <span className={dialogIconColors[type]}>{icon}</span>}
    {children}
  </DialogPrimitive.Title>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// 統一的描述
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-lg leading-relaxed text-slate-400', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// 統一的底部
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse pt-6 sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

// 導出所有組件
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  dialogButtonStyles,
  dialogIconColors,
  type DialogType,
};
