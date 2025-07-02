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
import { TransferDestinationSelector } from './TransferDestinationSelector';

interface TransferConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (targetLocation: string, clockNumber: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  currentLocation?: string;
}

// 根據當前位置獲取默認目標
const getDefaultDestination = (currentLocation: string): string => {
  switch (currentLocation) {
    case 'Await':
    case 'Await_grn':
      return 'Fold Mill'; // 默認選擇 Fold Mill
    case 'Fold Mill':
    case 'PipeLine':
      return 'Production';
    default:
      return 'Fold Mill';
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
  const [selectedDestination, setSelectedDestination] = useState('');
  const [clockNumber, setClockNumber] = useState('');
  const [clockError, setClockError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const clockNumberRef = useRef<HTMLInputElement>(null);

  // 當對話框打開時，設置默認目標同重置狀態
  useEffect(() => {
    if (isOpen) {
      // 設置默認目標位置
      setSelectedDestination(getDefaultDestination(currentLocation));
      
      // 重置其他狀態
      setClockNumber('');
      setClockError('');
      
      // 延遲聚焦到員工號碼輸入框
      setTimeout(() => {
        clockNumberRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentLocation]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證是否選擇了目標位置
    if (!selectedDestination) {
      toast.error('Please select a destination');
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
    onConfirm(selectedDestination, clockNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
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
        className="sm:max-w-[500px] bg-gray-800 border-gray-700 text-white"
        onKeyDown={handleKeyDown}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-blue-400 text-xl">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-gray-300">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="grid gap-6 py-6">
            {/* 目標位置選擇器 */}
            <TransferDestinationSelector
              currentLocation={currentLocation}
              selectedDestination={selectedDestination}
              onDestinationChange={setSelectedDestination}
              disabled={isLoading || isVerifying}
            />

            {/* Clock Number 輸入 */}
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
              disabled={isLoading || isVerifying || !selectedDestination || !clockNumber.trim()}
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
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}