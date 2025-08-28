'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
import { createClient } from '@/app/utils/supabase/client';

interface UserIdVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVerified: (userId: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export const UserIdVerificationDialog: React.FC<UserIdVerificationDialogProps> = ({
  isOpen,
  onOpenChange,
  onVerified,
  onCancel,
  title = 'User ID Verification Required',
  description = 'Your account does not have a User ID in metadata. Please enter your User ID to continue.',
  isLoading = false,
}) => {
  const [userId, setUserId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userIdInputRef = useRef<HTMLInputElement>(null);

  const validateAndSaveUserId = useCallback(async (userIdValue: string): Promise<boolean> => {
    try {
      console.log('[UserIdVerificationDialog] Validating and saving user ID:', userIdValue);

      // 使用 API 端點來驗證用戶 ID
      const response = await fetch('/api/validate-user-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userIdValue }),
      });

      if (!response.ok) {
        console.error('[UserIdVerificationDialog] API request failed:', response.status);
        toast.error('Validation service unavailable. Please try again.');
        return false;
      }

      const result = await response.json();

      if (!result.success) {
        console.error('[UserIdVerificationDialog] API error:', result.error);
        toast.error('Validation failed. Please try again.');
        return false;
      }

      if (!result.data?.valid || !result.data?.user) {
        console.log('[UserIdVerificationDialog] User ID not found');
        return false;
      }

      // 驗證成功後，更新 user metadata
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          user_id: userIdValue,
        },
      });

      if (updateError) {
        console.error('[UserIdVerificationDialog] Failed to update user metadata:', updateError);
        toast.error('Failed to save User ID. Please try again.');
        return false;
      }

      console.log('[UserIdVerificationDialog] User ID validated and saved successfully');
      toast.success('User ID verified and saved successfully');
      return true;
    } catch (error: unknown) {
      console.error('[UserIdVerificationDialog] Exception during validation:', error);
      toast.error('Validation failed. Please try again.');
      return false;
    }
  }, []);

  const handleCancel = useCallback(() => {
    onCancel();
    setUserId('');
    setError(null);
  }, [onCancel]);

  const handleVerify = useCallback(async () => {
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }

    // 驗證 User ID 格式（應該是數字）
    const userIdValue = userId.trim();
    if (!/^\d+$/.test(userIdValue)) {
      setError('User ID must be numeric');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await validateAndSaveUserId(userIdValue);

      if (isValid) {
        onVerified(userIdValue);
        setUserId('');
        setError(null);
      } else {
        setError('User ID not found. Please check and try again.');
        toast.error('Invalid User ID');
      }
    } catch (error) {
      console.error('[UserIdVerificationDialog] Error during verification:', error);
      setError('An error occurred while validating User ID');
      toast.error('Validation error occurred');
    } finally {
      setIsVerifying(false);
    }
  }, [userId, onVerified, validateAndSaveUserId]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // 只允許數字輸入
      if (/^\d*$/.test(value)) {
        setUserId(value);
        if (error) {
          setError(null);
        }
      }
    },
    [error]
  );

  // 對話框開啟時聚焦輸入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        userIdInputRef.current?.focus();
      }, 100);
      setUserId('');
      setError(null);
    }
  }, [isOpen]);

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
              value={userId}
              onChange={handleInputChange}
              placeholder='Enter your User ID'
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
            onClick={handleVerify}
            disabled={isVerifying || isLoading || !userId.trim()}
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
              'Verify & Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserIdVerificationDialog;
