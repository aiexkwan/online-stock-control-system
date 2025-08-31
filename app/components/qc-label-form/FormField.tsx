'use client';

import { type FC, type ReactNode, memo } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * 表單欄位組件的屬性介面
 * 提供統一的表單欄位外觀和行為
 */
interface FormFieldProps {
  /** 欄位標籤文字 */
  label: string;
  /** 是否為必填欄位，預設為 false */
  required?: boolean;
  /** 錯誤訊息，當有錯誤時顯示 */
  error?: string;
  /** 提示文字，顯示在標籤旁邊 */
  hint?: string;
  /** 子組件，通常是輸入控制項 */
  children: ReactNode;
  /** 額外的 CSS 類別名稱 */
  className?: string;
}

/**
 * 統一的表單欄位組件
 *
 * @description 提供一致的表單欄位外觀，包含標籤、必填標示、提示文字和錯誤顯示
 * @param props - 組件屬性
 * @returns 表單欄位 JSX 元素
 *
 * @example
 * ```tsx
 * <FormField label="用戶名稱" required error="此欄位必填">
 *   <input type="text" className="..." />
 * </FormField>
 * ```
 */
export const FormField: FC<FormFieldProps> = memo<FormFieldProps>(
  ({ label, required = false, error, hint, children, className = '' }) => {
    return (
      <div className={`space-y-1 ${className}`}>
        <label className='block text-sm font-medium text-gray-300'>
          {label}
          {required && <span className='ml-1 text-red-400'>*</span>}
          {hint && <span className='ml-2 text-xs text-gray-500'>({hint})</span>}
        </label>

        <div className='relative'>
          {children}
          {error && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
              <ExclamationCircleIcon className='h-4 w-4 text-red-500' />
            </div>
          )}
        </div>

        {error && (
          <div className='mt-1 flex items-center'>
            <ExclamationCircleIcon className='mr-1 h-4 w-4 flex-shrink-0 text-red-500' />
            <span className='text-sm text-red-500'>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

// Set display name for debugging
FormField.displayName = 'FormField';

export default FormField;
