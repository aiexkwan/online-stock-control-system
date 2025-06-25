/**
 * 簡化版動畫 Dialog - 用於測試
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './unified-dialog';
import { Button } from './button';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleAnimatedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  onConfirm?: () => void;
}

export function SimpleAnimatedDialog({
  isOpen,
  onOpenChange,
  title = "通知",
  message,
  onConfirm
}: SimpleAnimatedDialogProps) {
  console.log('SimpleAnimatedDialog render:', { isOpen });
  
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
            className="shadow-lg hover:shadow-blue-500/25 px-8 py-2.5 text-base bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}