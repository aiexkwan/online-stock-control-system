'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransferConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (transferCode: string, clockNumber: string) => void;
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
    '131415': 'Production',
    '232425': 'PipeLine'
  },
  'Fold Mill': {
    '131415': 'Production',
    '232425': 'PipeLine'
  },
  'PipeLine': {
    '131415': 'Production',
    '232425': 'Fold Mill'
  }
};

export function TransferConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title = 'Stock Transfer',
  description,
  isLoading = false,
  currentLocation = 'Await'
}: TransferConfirmDialogProps) {
  const [transferCode, setTransferCode] = useState('');
  const [clockNumber, setClockNumber] = useState('');
  const [transferError, setTransferError] = useState('');
  const [clockError, setClockError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [transferCodeConfirmed, setTransferCodeConfirmed] = useState(false);
  const transferCodeRef = useRef<HTMLInputElement>(null);
  const clockNumberRef = useRef<HTMLInputElement>(null);

  // 自動聚焦到第一個輸入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        transferCodeRef.current?.focus();
      }, 100);
      // 重置狀態
      setTransferCode('');
      setClockNumber('');
      setTransferError('');
      setClockError('');
      setTransferCodeConfirmed(false);
    }
  }, [isOpen]);

  // 當轉移代號確認後，自動聚焦到員工號碼輸入框
  useEffect(() => {
    if (transferCodeConfirmed && clockNumberRef.current) {
      setTimeout(() => {
        clockNumberRef.current?.focus();
      }, 100);
    }
  }, [transferCodeConfirmed]);

  const validateTransferCode = (code: string): boolean => {
    const locationMappings = TRANSFER_CODE_MAPPING[currentLocation];
    if (!locationMappings || !locationMappings[code]) {
      setTransferError('Invalid transfer code');
      return false;
    }
    setTransferError('');
    return true;
  };

  const validateClockNumber = async (clockNum: string): Promise<boolean> => {
    try {
      const client = createClient();
      
      const { data, error } = await client
        .from('data_id')
        .select('id, name')
        .eq('id', parseInt(clockNum, 10))
        .single();

      if (error || !data) {
        setClockError('Clock number not found');
        return false;
      }

      setClockError('');
      return true;
    } catch (error) {
      console.error('[TransferConfirmDialog] Error validating clock number:', error);
      setClockError('Validation error occurred');
      return false;
    }
  };

  const handleTransferCodeConfirm = () => {
    if (!transferCode.trim()) {
      setTransferError('Please enter transfer code');
      transferCodeRef.current?.focus();
      return;
    }

    if (!validateTransferCode(transferCode)) {
      transferCodeRef.current?.focus();
      return;
    }

    // 轉移代號驗證通過
    setTransferCodeConfirmed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 如果轉移代號還未確認，先確認轉移代號
    if (!transferCodeConfirmed) {
      handleTransferCodeConfirm();
      return;
    }

    // 驗證員工號碼
    if (!clockNumber.trim()) {
      setClockError('Please enter clock number');
      clockNumberRef.current?.focus();
      return;
    }

    // 非同步驗證員工號碼
    setIsVerifying(true);
    const isValidClock = await validateClockNumber(clockNumber);
    setIsVerifying(false);

    if (!isValidClock) {
      clockNumberRef.current?.focus();
      return;
    }

    // 都驗證通過，執行確認
    onConfirm(transferCode, clockNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleTransferCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setTransferCode(value);
      if (transferError) {
        setTransferError('');
      }
    }
  };

  const handleClockNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setClockNumber(value);
      if (clockError) {
        setClockError('');
      }
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
            {/* Transfer Code 輸入 */}
            <div className="space-y-2">
              <label htmlFor="transferCode" className="text-sm font-medium text-gray-300">
                Transfer Code
              </label>
              <Input
                ref={transferCodeRef}
                id="transferCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={transferCode}
                onChange={handleTransferCodeChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && transferCode.trim()) {
                    e.preventDefault();
                    if (!transferCodeConfirmed) {
                      handleTransferCodeConfirm();
                    }
                  }
                }}
                placeholder="Enter transfer code"
                className={`bg-gray-700 border-gray-600 placeholder-gray-500 text-white focus:ring-blue-500 focus:border-blue-500 ${
                  transferError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                disabled={isLoading || isVerifying || transferCodeConfirmed}
                autoComplete="off"
              />
              {transferError && (
                <p className="text-red-400 text-sm">{transferError}</p>
              )}
            </div>

            {/* Clock Number 輸入 - 只在轉移代號確認後顯示 */}
            {transferCodeConfirmed && (
              <div className="space-y-2">
                <label htmlFor="clockNumber" className="text-sm font-medium text-gray-300">
                  Clock Number
                </label>
                <Input
                  ref={clockNumberRef}
                  id="clockNumber"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={clockNumber}
                  onChange={handleClockNumberChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading && !isVerifying) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Enter your clock number"
                  className={`bg-gray-700 border-gray-600 placeholder-gray-500 text-white focus:ring-blue-500 focus:border-blue-500 ${
                    clockError ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={isLoading || isVerifying}
                  autoComplete="off"
                />
                {clockError && (
                  <p className="text-red-400 text-sm">{clockError}</p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isVerifying}
              className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || isVerifying || !transferCode.trim() || (transferCodeConfirmed && !clockNumber.trim())}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-500"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : !transferCodeConfirmed ? (
                'Next'
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 導出轉移代號映射供其他組件使用
export { TRANSFER_CODE_MAPPING };