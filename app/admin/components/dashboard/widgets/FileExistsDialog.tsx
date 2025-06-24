/**
 * File Exists Confirmation Dialog
 * 當文件已存在時顯示確認對話框
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FileExistsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
}

export const FileExistsDialog: React.FC<FileExistsDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  fileName 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-xl border border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
            文件已存在
          </DialogTitle>
          <DialogDescription className="text-slate-400 pt-2">
            <span className="font-mono text-sm">{fileName}</span> 已經上傳過。
            <br />
            是否要重新上傳並分析？
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/10"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
          >
            重新上傳
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};