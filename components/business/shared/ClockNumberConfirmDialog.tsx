'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/types/error-handling';
import { createClient } from '@/app/utils/supabase/client';
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

/**
 * Clock Number 確認對話框屬性介面
 *
 * @description 統一的時鐘號碼確認對話框屬性定義
 */
interface ClockNumberConfirmDialogProps {
  /** 對話框是否開啟 */
  isOpen: boolean;
  /** 對話框開啟狀態變更回調 */
  onOpenChange: (isOpen: boolean) => void;
  /** 確認回調，傳入驗證後的時鐘號碼 */
  onConfirm: (clockNumber: string) => void;
  /** 取消回調 */
  onCancel: () => void;
  /** 對話框標題 */
  title?: string;
  /** 對話框描述 */
  description?: string;
  /** 是否正在載入中 */
  isLoading?: boolean;
  /** 預設時鐘號碼（支援自動填充） */
  defaultClockNumber?: string;
}

/**
 * Clock Number 確認對話框組件
 *
 * @description 統一的時鐘號碼確認對話框，整合了兩個版本的功能：
 * - 支援自動填充預設時鐘號碼
 * - 雙重驗證機制：Supabase 直接查詢和 API 端點驗證
 * - 完整的錯誤處理和用戶反饋
 * - 自動焦點管理和鍵盤交互
 * - 數字輸入驗證和格式化
 *
 * @features
 * - 支援兩種驗證方式：直接資料庫查詢和 API 端點
 * - 自動重試機制和超時處理
 * - 完整的錯誤分類和用戶友好提示
 * - 響應式設計和無障礙支援
 * - 防抖輸入驗證
 *
 * @example
 * ```tsx
 * <ClockNumberConfirmDialog
 *   isOpen={showDialog}
 *   onOpenChange={setShowDialog}
 *   onConfirm={(clockNumber) => {
 *     console.log('Confirmed clock number:', clockNumber);
 *   }}
 *   onCancel={() => setShowDialog(false)}
 *   defaultClockNumber="123"
 * />
 * ```
 */
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
      process.env.NODE_ENV !== 'production' &&
        console.log(
          '[ClockNumberConfirmDialog] Auto-filling with defaultClockNumber:',
          defaultClockNumber
        );
      setClockNumber(defaultClockNumber);
      setError(null);
    }
  }, [defaultClockNumber]);

  /**
   * Supabase 直接驗證方法
   * @param clockNum 時鐘號碼
   * @returns 是否驗證成功
   */
  const validateWithSupabase = useCallback(async (clockNum: string): Promise<boolean> => {
    try {
      process.env.NODE_ENV !== 'production' &&
        console.log('[ClockNumberConfirmDialog] Validating with Supabase:', clockNum);

      // 使用標準 browser client
      const client = createClient();

      // 創建超時 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), 10000); // 10 秒超時
      });

      // 執行查詢
      const queryPromise = client
        .from('data_id')
        .select('id, name')
        .eq('id', parseInt(clockNum, 10))
        .single();

      // 使用 Promise.race 處理超時
      const { data, error: queryError } = await Promise.race([queryPromise, timeoutPromise]);

      if (queryError) {
        console.error('[ClockNumberConfirmDialog] Supabase error:', queryError);
        return false;
      }

      console.log('[ClockNumberConfirmDialog] Supabase validation result:', data);
      return !!data;
    } catch (validationError: unknown) {
      console.error('[ClockNumberConfirmDialog] Supabase validation exception:', validationError);
      if (getErrorMessage(validationError) === 'Validation timeout') {
        toast.error('Validation timeout. Please try again.');
      }
      return false;
    }
  }, []);

  /**
   * API 端點驗證方法
   * @param clockNum 時鐘號碼
   * @returns 是否驗證成功
   */
  const validateWithAPI = useCallback(async (clockNum: string): Promise<boolean> => {
    try {
      console.log('[ClockNumberConfirmDialog] Validating with API:', clockNum);

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

      console.log('[ClockNumberConfirmDialog] API validation result:', result.data);

      if (result.data?.valid && result.data?.user) {
        console.log('[ClockNumberConfirmDialog] User found:', result.data.user.name);
        return true;
      } else {
        console.log('[ClockNumberConfirmDialog] Clock number not found');
        return false;
      }
    } catch (error: unknown) {
      console.error('[ClockNumberConfirmDialog] API validation exception:', error);
      toast.error('Validation failed. Please try again.');
      return false;
    }
  }, []);

  /**
   * 智能驗證方法 - 嘗試 API 優先，Supabase 作為後備
   * @param clockNum 時鐘號碼
   * @returns 是否驗證成功
   */
  const validateClockNumber = useCallback(
    async (clockNum: string): Promise<boolean> => {
      try {
        console.log('[ClockNumberConfirmDialog] Starting smart validation for:', clockNum);

        // 先嘗試 API 驗證（更現代、更安全）
        const apiResult = await validateWithAPI(clockNum);
        if (apiResult) {
          console.log('[ClockNumberConfirmDialog] API validation successful');
          return true;
        }

        console.log('[ClockNumberConfirmDialog] API validation failed, trying Supabase fallback');

        // API 失敗，嘗試 Supabase 直接查詢作為後備
        const supabaseResult = await validateWithSupabase(clockNum);
        if (supabaseResult) {
          console.log('[ClockNumberConfirmDialog] Supabase fallback validation successful');
          return true;
        }

        console.log('[ClockNumberConfirmDialog] All validation methods failed');
        return false;
      } catch (error: unknown) {
        console.error('[ClockNumberConfirmDialog] Smart validation exception:', error);
        return false;
      }
    },
    [validateWithAPI, validateWithSupabase]
  );

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
    } catch (confirmError: unknown) {
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
