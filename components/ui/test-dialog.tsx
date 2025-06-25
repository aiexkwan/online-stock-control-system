/**
 * 簡單測試 Dialog - 用於診斷問題
 */

'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

interface TestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
}

export function TestDialog({
  isOpen,
  onOpenChange,
  title,
  message
}: TestDialogProps) {
  console.log('TestDialog render:', { isOpen, title, message });
  
  // 添加調試 - 如果 isOpen 為 true 但 dialog 沒顯示
  React.useEffect(() => {
    if (isOpen) {
      console.log('TestDialog is supposed to be open!');
      // 檢查 DOM 中是否有 dialog
      setTimeout(() => {
        const dialogElement = document.querySelector('[role="dialog"]');
        console.log('Dialog element found:', !!dialogElement);
      }, 100);
    }
  }, [isOpen]);
  
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={() => console.log('Overlay clicked')}
        />
        <DialogPrimitive.Content 
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg duration-200 sm:rounded-lg"
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-slate-500">
              {message}
            </DialogPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <DialogPrimitive.Close className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2">
              關閉
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}