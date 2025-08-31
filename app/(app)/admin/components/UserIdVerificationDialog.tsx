'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getUserId } from '@/app/hooks/getUserId';
import { createSecureLogger } from '@/lib/security/enhanced-logger-sanitizer';

interface UserIdVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVerified: (_userId: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

// 建立安全日誌記錄器
const secureLogger = createSecureLogger('UserIdVerificationDialog');

export const UserIdVerificationDialog: React.FC<UserIdVerificationDialogProps> = ({
  isOpen,
  onOpenChange,
  onVerified,
  onCancel,
  title = 'User ID Verification Required',
  description = 'Please enter your User ID to continue.',
  isLoading = false,
}) => {
  const [_userId, setUserId] = useState('');
  const [_error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const userIdInputRef = useRef<HTMLInputElement>(null);

  const { _userId: currentUserId, verifyUserId, isLoading: userIdLoading } = getUserId();

  const handleCancel = useCallback(() => {
    onCancel();
    setUserId('');
    setError(null);
  }, [onCancel]);

  const handleVerify = useCallback(async () => {
    // 如果metadata中已有user_id，直接信任並使用（metadata權限最高）
    if (currentUserId) {
      onVerified(currentUserId);
      return;
    }

    // 否則驗證手動輸入的user_id
    if (!_userId.trim()) {
      setError('User ID is required');
      return;
    }

    const userIdValue = _userId.trim();
    if (!/^\d+$/.test(userIdValue)) {
      setError('User ID must be numeric');
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      const isValid = await verifyUserId(userIdValue);

      if (isValid) {
        onVerified(userIdValue);
        setUserId('');
        setError(null);
      } else {
        setError('User ID not found. Please check and try again.');
        toast.error('Invalid User ID');
      }
    } catch (error) {
      secureLogger.error(error, '[UserIdVerificationDialog] Error during verification');
      setError('An error occurred while validating User ID');
      toast.error('Validation error occurred');
    } finally {
      setIsValidating(false);
    }
  }, [currentUserId, onVerified, verifyUserId, _userId]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // 只允許數字輸入
      if (/^\d*$/.test(value)) {
        setUserId(value);
        if (_error) {
          setError(null);
        }
      }
    },
    [_error]
  );

  // 對話框開啟時聚焦輸入框並顯示當前user_id（如果有的話）
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        userIdInputRef.current?.focus();
      }, 100);
      // 如果有currentUserId，預填入輸入框但仍需驗證
      setUserId(currentUserId || '');
      setError(null);
    }
  }, [isOpen, currentUserId]);

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
            <label htmlFor='user-id' className='text-sm font-medium text-gray-300'>
              User ID
            </label>
            <Input
              id='user-id'
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              ref={userIdInputRef}
              value={_userId}
              onChange={handleInputChange}
              placeholder='Enter your User ID'
              className={`border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 ${
                _error ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              disabled={isValidating || isLoading || userIdLoading}
            />
            {_error && <p className='text-sm text-red-400'>{_error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isValidating || isLoading || userIdLoading}
            className='border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isValidating || isLoading || userIdLoading || !_userId.trim()}
            className='bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-500'
          >
            {isValidating ? (
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
              'Verify'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserIdVerificationDialog;
