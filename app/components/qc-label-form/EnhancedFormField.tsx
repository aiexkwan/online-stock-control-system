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
    default: 'bg-slate-800/50 border-slate-600/50 focus:border-blue-400/70 focus:bg-slate-800/70',
    filled: 'bg-slate-700/60 border-slate-500/50 focus:border-blue-400/70 focus:bg-slate-700/80',
    outlined: 'bg-slate-900/30 border-slate-600/40 focus:border-blue-400/70 focus:bg-slate-800/40'
  };

  const statusClasses = error 
    ? 'border-red-400/70 focus:border-red-400/90 focus:ring-red-400/20 bg-red-900/10' 
    : success 
    ? 'border-green-400/70 focus:border-green-400/90 focus:ring-green-400/20 bg-green-900/10'
    : '';

  return (
    <div className="relative group">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200">
          {leftIcon}
        </div>
      )}
      
      <input
        ref={ref}
        className={`
          w-full rounded-xl border backdrop-blur-sm text-white placeholder-slate-400
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:border-blue-500/50 hover:bg-slate-800/60
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
      
      {/* 輸入框內部光效 */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      {(rightIcon || loading) && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
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
    default: 'bg-slate-800/50 border-slate-600/50 focus:border-blue-400/70 focus:bg-slate-800/70',
    filled: 'bg-slate-700/60 border-slate-500/50 focus:border-blue-400/70 focus:bg-slate-700/80',
    outlined: 'bg-slate-900/30 border-slate-600/40 focus:border-blue-400/70 focus:bg-slate-800/40'
  };

  const statusClasses = error 
    ? 'border-red-400/70 focus:border-red-400/90 focus:ring-red-400/20 bg-red-900/10' 
    : success 
    ? 'border-green-400/70 focus:border-green-400/90 focus:ring-green-400/20 bg-green-900/10'
    : '';

  return (
    <div className="relative group">
      <select
        ref={ref}
        className={`
          w-full rounded-xl border backdrop-blur-sm text-white
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:border-blue-500/50 hover:bg-slate-800/60
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${statusClasses}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="bg-slate-800 text-slate-400">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
            className="bg-slate-800 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {/* 下拉框內部光效 */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
});

EnhancedFormField.displayName = 'EnhancedFormField';
EnhancedInput.displayName = 'EnhancedInput';
EnhancedSelect.displayName = 'EnhancedSelect';

export default EnhancedFormField; 