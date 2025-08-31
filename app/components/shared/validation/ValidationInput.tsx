'use client';

import React, { forwardRef } from 'react';
import { Input } from '../../../../components/ui/input';
import { cn } from '../../../../lib/utils';

export interface ValidationRule {
  validate: (value: unknown) => boolean | string;
  message?: string;
}

export interface ValidationInputProps {
  /** Validation rules */
  rules?: ValidationRule[];
  /** Error message to display */
  error?: string;
  /** Show validation state */
  showValidation?: boolean;
  /** Label for the input */
  label?: string;
  /** Required field */
  required?: boolean;
  /** Helper text */
  helperText?: string;
  /** Success message */
  success?: string;
  /** CSS class name */
  className?: string;
  /** onChange handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** onBlur handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** All other HTML input attributes */
  [key: string]: any;
}

/**
 * Input component with built-in validation
 * 具有內建驗證的輸入組件
 *
 * @example
 * ```tsx
 * <ValidationInput
 *   label="Product Code"
 *   required
 *   rules={[
 *     { validate: (v) => !!v?.trim(), message: 'Product code is required' },
 *     { validate: (v) => v?.length >= 3, message: 'Minimum 3 characters' }
 *   ]}
 *   error ={errors.productCode}
 * />
 * ```
 */
export const ValidationInput = forwardRef<HTMLInputElement, ValidationInputProps>(
  (
    {
      className,
      error,
      showValidation = true,
      label,
      required,
      helperText,
      success,
      rules,
      onChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [localError, setLocalError] = React.useState<string>('');
    const [touched, setTouched] = React.useState(false);

    const displayError = error || (touched && localError);
    const hasError = showValidation && !!displayError;
    const hasSuccess = showValidation && !hasError && success && touched;

    const handleValidation = (value: unknown) => {
      if (!rules || rules.length === 0) return '';

      for (const rule of rules) {
        const result = rule.validate(value);
        if (typeof result === 'string') {
          return result;
        } else if (!result) {
          return rule.message || 'Validation failed';
        }
      }

      return '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const error = handleValidation(value);
      setLocalError(error);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      const value = e.target.value;
      const error = handleValidation(value);
      setLocalError(error);
      onBlur?.(e);
    };

    return (
      <div className='space-y-1'>
        {label && (
          <label className='text-sm font-medium'>
            {label}
            {required && <span className='ml-1 text-red-500'>*</span>}
          </label>
        )}

        <Input
          ref={ref}
          className={cn(
            className,
            hasError && 'border-red-500 focus:ring-red-500',
            hasSuccess && 'border-green-500 focus:ring-green-500'
          )}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'error-message' : hasSuccess ? 'success-message' : undefined}
          {...props}
        />

        {helperText && !hasError && !hasSuccess && (
          <p className='text-sm text-gray-500'>{helperText}</p>
        )}

        {hasError && (
          <p id='error-message' className='text-sm text-red-600'>
            {displayError}
          </p>
        )}

        {hasSuccess && (
          <p id='success-message' className='text-sm text-green-600'>
            {success}
          </p>
        )}
      </div>
    );
  }
);

ValidationInput.displayName = 'ValidationInput';
