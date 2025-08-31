'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
// Removed unused import: getErrorMessage
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ClockNumberConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (clockNumber: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  defaultClockNumber?: string; // 新增：支持自動填充時鐘號
}

export const ClockNumberConfirmDialog: React.FC<ClockNumberConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title = 'Confirm Print Action',
  description = 'Please enter your clock number to proceed with printing.',
  isLoading = false,
  defaultClockNumber,
}) => {
  const [clockNumber, setClockNumber] = useState(defaultClockNumber || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clockNumberInputRef = useRef<HTMLInputElement>(null);

  // 當 defaultClockNumber 改變時，更新 clockNumber 狀態
  useEffect(() => {
    if (defaultClockNumber) {
      console.log(
        '[ClockNumberConfirmDialog] Auto-filling with defaultClockNumber:',
        defaultClockNumber
      );
      setClockNumber(defaultClockNumber);
      setError(null);
    }
  }, [defaultClockNumber]);

  const validateClockNumber = useCallback(async (clockNum: string): Promise<boolean> => {
    try {
      console.log('[ClockNumberConfirmDialog] Validating clock number:', clockNum);

      // 使用新的 API 端點來驗證用戶 ID
      const response = await fetch('/api/validate-user-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: clockNum }),
      });

      if (!response.ok) {
        console.error('[ClockNumberConfirmDialog] API request failed:', response.status);
        toast.error('Validation service unavailable. Please try again.');
        return false;
      }

      const result = await response.json();

      if (!result.success) {
        console.error('[ClockNumberConfirmDialog] API error:', result.error);
        toast.error('Validation failed. Please try again.');
        return false;
      }

      console.log('[ClockNumberConfirmDialog] Validation result:', result.data);

      if (result.data?.valid && result.data?.user) {
        console.log('[ClockNumberConfirmDialog] User found:', result.data.user.name);
        return true;
      } else {
        console.log('[ClockNumberConfirmDialog] Clock number not found');
        return false;
      }
    } catch (error: unknown) {
      console.error('[ClockNumberConfirmDialog] Exception during validation:', error);
      toast.error('Validation failed. Please try again.');
      return false;
    }
  }, []);

  const handleCancel = useCallback(() => {
    onCancel();
    setClockNumber('');
    setError(null);
  }, [onCancel]);

  const handleConfirm = useCallback(async () => {
    if (!clockNumber.trim()) {
      setError('Clock number is required');
      return;
    }

    // Validate clock number format (should be numeric)
    const clockNum = clockNumber.trim();
    if (!/^\d+$/.test(clockNum)) {
      setError('Clock number must be numeric');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await validateClockNumber(clockNum);

      if (isValid) {
        onConfirm(clockNum);
        setClockNumber('');
        setError(null);
      } else {
        setError('Clock number not found. Please check and try again.');
        toast.error('Invalid clock number');
      }
    } catch (confirmError) {
      console.error('[ClockNumberConfirmDialog] Error during confirmation:', confirmError);
      setError('An error occurred while validating clock number');
      toast.error('Validation error occurred');
    } finally {
      setIsVerifying(false);
    }
  }, [clockNumber, onConfirm, validateClockNumber]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Only allow numeric input
      if (/^\d*$/.test(value)) {
        setClockNumber(value);
        if (error) {
          setError(null);
        }
      }
    },
    [error]
  );

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        clockNumberInputRef.current?.focus();
      }, 100);
      // 只有在沒有 defaultClockNumber 時才清空輸入框
      if (!defaultClockNumber) {
        setClockNumber('');
      }
      setError(null);
    }
  }, [isOpen, defaultClockNumber]);

  // Keyboard event handling removed as per system requirements

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          handleCancel();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className='border-gray-700 bg-gray-800 text-white sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-blue-400'>{title}</DialogTitle>
          <DialogDescription className='text-gray-300'>{description}</DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div className='space-y-2'>
            <label htmlFor='clock-number' className='text-sm font-medium text-gray-300'>
              Clock Number
            </label>
            <Input
              id='clock-number'
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              ref={clockNumberInputRef}
              value={clockNumber}
              onChange={handleInputChange}
              placeholder='Enter your clock number'
              className={`border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 ${
                error ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              disabled={isVerifying || isLoading}
            />
            {error && <p className='text-sm text-red-400'>{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isVerifying || isLoading}
            className='border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isVerifying || isLoading || !clockNumber.trim()}
            className='bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-500'
          >
            {isVerifying ? (
              <>
                <svg
                  className='-ml-1 mr-3 h-5 w-5 animate-spin text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Verifying...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClockNumberConfirmDialog;
