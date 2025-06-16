'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface TransferCodeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (transferCode: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  currentLocation?: string;
}

// 轉移代號對應的目標位置
const TRANSFER_CODE_MAPPING: Record<string, Record<string, string>> = {
  'Await': {
    '131415': 'Fold Mill',
    '232425': 'PipeLine'
  },
  'Await_grn': {
    '131415': 'Production', // injection
    '232425': 'PipeLine'
  },
  'Fold Mill': {
    '131415': 'Production', // injection
    '232425': 'PipeLine'
  },
  'PipeLine': {
    '131415': 'Production', // injection
    '232425': 'Fold Mill'
  }
};

export function TransferCodeDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title = 'Enter Transfer Code',
  description,
  isLoading = false,
  currentLocation = 'Await'
}: TransferCodeDialogProps) {
  const [transferCode, setTransferCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 自動聚焦到輸入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      // 重置狀態
      setTransferCode('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferCode.trim()) {
      setError('Please enter transfer code');
      return;
    }

    // 驗證轉移代號
    const locationMappings = TRANSFER_CODE_MAPPING[currentLocation];
    if (!locationMappings || !locationMappings[transferCode]) {
      setError(`Invalid transfer code`);
      return;
    }

    onConfirm(transferCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white"
        onKeyDown={handleKeyDown}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-blue-400">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-gray-300">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="transferCode" className="text-sm font-medium text-gray-300">
                Transfer Code
              </label>
              <Input
                ref={inputRef}
                id="transferCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={transferCode}
                onChange={(e) => {
                  setTransferCode(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Enter transfer code"
                className={`bg-gray-700 border-gray-600 placeholder-gray-500 text-white focus:ring-blue-500 focus:border-blue-500 ${
                  error ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                disabled={isLoading}
                autoComplete="off"
              />
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !transferCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-500"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 導出轉移代號映射供其他組件使用
export { TRANSFER_CODE_MAPPING };