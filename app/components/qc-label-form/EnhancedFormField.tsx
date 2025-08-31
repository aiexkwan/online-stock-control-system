'use client';

import React, { ReactNode, forwardRef } from 'react';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// 定義共同的尺寸和變體類型
type FormFieldSize = 'sm' | 'md' | 'lg';
type FormFieldVariant = 'default' | 'floating' | 'inline';
type InputVariant = 'default' | 'filled' | 'outlined';

// 定義樣式映射類型，確保類型安全
type SizeStyleMap = Record<FormFieldSize, string>;
type VariantStyleMap = Record<InputVariant, string>;

interface EnhancedFormFieldProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly error?: string;
  readonly success?: string;
  readonly hint?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly labelClassName?: string;
  readonly size?: FormFieldSize;
  readonly variant?: FormFieldVariant;
}

interface EnhancedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly error?: string;
  readonly success?: string;
  readonly size?: FormFieldSize;
  readonly variant?: InputVariant;
  readonly leftIcon?: ReactNode;
  readonly rightIcon?: ReactNode;
  readonly loading?: boolean;
}

interface EnhancedSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  readonly error?: string;
  readonly success?: string;
  readonly size?: FormFieldSize;
  readonly variant?: InputVariant;
  readonly placeholder?: string;
  readonly options: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
    readonly disabled?: boolean;
  }>;
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> =
  React.memo<EnhancedFormFieldProps>(
    ({
      label,
      children,
      error,
      success,
      hint,
      required = false,
      disabled = false,
      className = '',
      labelClassName = '',
      size = 'md',
      variant = 'default',
    }) => {
      // 使用類型安全的樣式映射
      const sizeClasses: SizeStyleMap = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      } as const;

      const fieldSpacing: SizeStyleMap = {
        sm: 'space-y-1',
        md: 'space-y-2',
        lg: 'space-y-3',
      } as const;

      return (
        <div className={`${fieldSpacing[size]} ${className}`}>
          {variant !== 'floating' && (
            <label
              className={`block font-medium text-gray-300 ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} ${labelClassName}`}
            >
              {label}
              {required && <span className='ml-1 text-red-400'>*</span>}
            </label>
          )}

          <div className='relative'>
            {children}

            {/* Status Icons */}
            {(error || success) && (
              <div className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transform'>
                {error && <ExclamationCircleIcon className='h-5 w-5 text-red-500' />}
                {success && <CheckCircleIcon className='h-5 w-5 text-green-500' />}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className='min-h-[1.25rem]'>
            {error && (
              <div className='flex items-center text-sm text-red-500'>
                <ExclamationCircleIcon className='mr-1 h-4 w-4 flex-shrink-0' />
                <span>{error}</span>
              </div>
            )}
            {success && !error && (
              <div className='flex items-center text-sm text-green-500'>
                <CheckCircleIcon className='mr-1 h-4 w-4 flex-shrink-0' />
                <span>{success}</span>
              </div>
            )}
            {hint && !error && !success && (
              <div className='flex items-center text-sm text-gray-400'>
                <InformationCircleIcon className='mr-1 h-4 w-4 flex-shrink-0' />
                <span>{hint}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
  );

EnhancedFormField.displayName = 'EnhancedFormField';

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    {
      error,
      success,
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      loading = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // 使用類型安全的樣式映射
    const sizeClasses: SizeStyleMap = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    } as const;

    const variantClasses: VariantStyleMap = {
      default: 'bg-slate-800/50 border-slate-600/50 focus:border-blue-400/70 focus:bg-slate-800/70',
      filled: 'bg-slate-700/60 border-slate-500/50 focus:border-blue-400/70 focus:bg-slate-700/80',
      outlined:
        'bg-slate-900/30 border-slate-600/40 focus:border-blue-400/70 focus:bg-slate-800/40',
    } as const;

    // 根據狀態決定樣式，使用明確的條件邏輯
    const statusClasses: string = error
      ? 'border-red-400/70 focus:border-red-400/90 focus:ring-red-400/20 bg-red-900/10'
      : success
        ? 'border-green-400/70 focus:border-green-400/90 focus:ring-green-400/20 bg-green-900/10'
        : '';

    return (
      <div className='group relative'>
        {leftIcon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 transform text-slate-400 transition-colors duration-200 group-focus-within:text-blue-400'>
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          className={`w-full rounded-xl border text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300 ease-out hover:border-blue-500/50 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]} ${statusClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon || loading ? 'pr-10' : ''} ${className}`}
          disabled={disabled || loading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />

        {/* 輸入框內部光效 */}
        <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100'></div>

        {(rightIcon || loading) && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2 transform text-slate-400 transition-colors duration-200 group-focus-within:text-blue-400'>
            {loading ? (
              <div className='h-5 w-5 animate-spin rounded-full border-b-2 border-blue-400' />
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export const EnhancedSelect = forwardRef<HTMLSelectElement, EnhancedSelectProps>(
  (
    {
      error,
      success,
      size = 'md',
      variant = 'default',
      placeholder,
      options,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // 使用類型安全的樣式映射
    const sizeClasses: SizeStyleMap = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    } as const;

    const variantClasses: VariantStyleMap = {
      default: 'bg-slate-800/50 border-slate-600/50 focus:border-blue-400/70 focus:bg-slate-800/70',
      filled: 'bg-slate-700/60 border-slate-500/50 focus:border-blue-400/70 focus:bg-slate-700/80',
      outlined:
        'bg-slate-900/30 border-slate-600/40 focus:border-blue-400/70 focus:bg-slate-800/40',
    } as const;

    // 根據狀態決定樣式，使用明確的條件邏輯
    const statusClasses: string = error
      ? 'border-red-400/70 focus:border-red-400/90 focus:ring-red-400/20 bg-red-900/10'
      : success
        ? 'border-green-400/70 focus:border-green-400/90 focus:ring-green-400/20 bg-green-900/10'
        : '';

    return (
      <div className='group relative'>
        <select
          ref={ref}
          className={`w-full rounded-xl border text-white backdrop-blur-sm transition-all duration-300 ease-out hover:border-blue-500/50 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]} ${statusClasses} ${className}`}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value='' disabled className='bg-slate-800 text-slate-400'>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className='bg-slate-800 text-white'
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* 下拉框內部光效 */}
        <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100'></div>
      </div>
    );
  }
);

EnhancedSelect.displayName = 'EnhancedSelect';

export default EnhancedFormField;
