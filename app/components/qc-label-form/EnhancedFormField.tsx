'use client';

import React, { ReactNode, forwardRef } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface EnhancedFormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'floating' | 'inline';
}

interface EnhancedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  success?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
}

interface EnhancedSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  error?: string;
  success?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> = React.memo(({
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
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const fieldSpacing = {
    sm: 'space-y-1',
    md: 'space-y-2',
    lg: 'space-y-3'
  };

  return (
    <div className={`${fieldSpacing[size]} ${className}`}>
      {variant !== 'floating' && (
        <label className={`
          block font-medium text-gray-300
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50' : ''}
          ${labelClassName}
        `}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {/* Status Icons */}
        {(error || success) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {error && <ExclamationCircleIcon className="h-5 w-5 text-red-500" />}
            {success && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="min-h-[1.25rem]">
        {error && (
          <div className="flex items-center text-red-500 text-sm">
            <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && !error && (
          <div className="flex items-center text-green-500 text-sm">
            <CheckCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {hint && !error && !success && (
          <div className="flex items-center text-gray-400 text-sm">
            <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(({
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
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantClasses = {
    default: 'bg-gray-900 border-gray-700 focus:border-blue-500',
    filled: 'bg-gray-800 border-gray-600 focus:border-blue-400',
    outlined: 'bg-transparent border-gray-600 focus:border-blue-400'
  };

  const statusClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
    : success 
    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
    : '';

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {leftIcon}
        </div>
      )}
      
      <input
        ref={ref}
        className={`
          w-full rounded-lg border text-white transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-opacity-50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${statusClasses}
          ${leftIcon ? 'pl-10' : ''}
          ${rightIcon || loading ? 'pr-10' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      />
      
      {(rightIcon || loading) && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          ) : (
            rightIcon
          )}
        </div>
      )}
    </div>
  );
});

export const EnhancedSelect = forwardRef<HTMLSelectElement, EnhancedSelectProps>(({
  error,
  success,
  size = 'md',
  variant = 'default',
  placeholder,
  options,
  className = '',
  disabled,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantClasses = {
    default: 'bg-gray-900 border-gray-700 focus:border-blue-500',
    filled: 'bg-gray-800 border-gray-600 focus:border-blue-400',
    outlined: 'bg-transparent border-gray-600 focus:border-blue-400'
  };

  const statusClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
    : success 
    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
    : '';

  return (
    <select
      ref={ref}
      className={`
        w-full rounded-lg border text-white transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${statusClasses}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
});

EnhancedFormField.displayName = 'EnhancedFormField';
EnhancedInput.displayName = 'EnhancedInput';
EnhancedSelect.displayName = 'EnhancedSelect';

export default EnhancedFormField; 