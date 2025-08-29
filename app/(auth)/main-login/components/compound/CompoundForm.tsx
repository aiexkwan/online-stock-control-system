/**
 * Compound Form Component
 *
 * A flexible, composable form component that can be used to build
 * different types of authentication forms using compound component pattern.
 */

'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { EyeIcon, EyeSlashIcon } from '../icons';
import {
  BaseCompoundProps,
  FormCompoundContext,
  InputCompoundProps,
  ButtonCompoundProps,
  LayoutCompoundProps,
  ErrorDisplayProps,
} from './types';

// Form Context with generic support using proper typing
const FormContext = createContext<FormCompoundContext<Record<string, unknown>> | null>(null);

function useFormContext<TFormData = Record<string, string>>(): FormCompoundContext<TFormData> {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form compound components must be used within a CompoundForm');
  }
  return context as FormCompoundContext<TFormData>;
}

// Main Form Component with generic support
interface CompoundFormProps<TFormData = Record<string, string>> extends BaseCompoundProps {
  formType: 'login' | 'register' | 'reset' | 'change';
  onSubmit: (data: TFormData) => Promise<void>;
  onFieldChange?: (field: string, value: string) => void;
  isSubmitting?: boolean;
  hasErrors?: boolean;
}

function CompoundFormBase<TFormData = Record<string, string>>({
  children,
  className = '',
  formType,
  onSubmit,
  onFieldChange,
  isSubmitting = false,
  hasErrors = false,
  ...props
}: CompoundFormProps<TFormData>) {
  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      onFieldChange?.(field, value);
    },
    [onFieldChange]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries()) as TFormData;
      await onSubmit(data);
    },
    [onSubmit]
  );

  const handleClear = useCallback(() => {
    // Implementation for clearing form
  }, []);

  const contextValue: FormCompoundContext<TFormData> = useMemo(
    () => ({
      formType,
      isSubmitting,
      hasErrors,
      onFieldChange: handleFieldChange,
      onSubmit,
      onClear: handleClear,
    }),
    [formType, isSubmitting, hasErrors, handleFieldChange, onSubmit, handleClear]
  );

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} className={`space-y-4 ${className}`} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Header Component
function Header({ children, className = '', ...props }: BaseCompoundProps) {
  return (
    <div className={`mb-6 text-center ${className}`} {...props}>
      {children}
    </div>
  );
}

// Title Component
function Title({ children, className = '', ...props }: BaseCompoundProps) {
  return (
    <h2 className={`mb-2 text-2xl font-bold text-white ${className}`} {...props}>
      {children}
    </h2>
  );
}

// Subtitle Component
function Subtitle({ children, className = '', ...props }: BaseCompoundProps) {
  return (
    <p className={`text-gray-400 ${className}`} {...props}>
      {children}
    </p>
  );
}

// Body Component
function Body({ children, className = '', ...props }: BaseCompoundProps) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Field Group Component
function FieldGroup({ children, className = '', ...props }: BaseCompoundProps) {
  return (
    <div className={`space-y-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Label Component
function Label({
  children,
  className = '',
  htmlFor,
  required,
  ...props
}: BaseCompoundProps & { htmlFor?: string; required?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-2 block text-sm font-medium text-gray-300 ${className}`}
      {...props}
    >
      {children}
      {required && <span className='ml-1 text-red-400'>*</span>}
    </label>
  );
}

// Input Component
function Input({
  name,
  type = 'text',
  placeholder,
  required,
  disabled,
  autoComplete,
  value,
  onChange,
  error,
  showPasswordToggle,
  onPasswordToggle,
  passwordVisible,
  className = '',
  ...props
}: InputCompoundProps) {
  const { isSubmitting } = useFormContext();

  const handlePasswordToggle = useCallback(() => {
    onPasswordToggle?.();
  }, [onPasswordToggle]);

  const inputType = showPasswordToggle && passwordVisible ? 'text' : type;

  return (
    <div className='relative'>
      <input
        name={name}
        type={inputType}
        placeholder={placeholder}
        required={required}
        disabled={disabled || isSubmitting}
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-slate-900/80 px-4 py-3 text-white placeholder-gray-400 transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${error ? 'border-red-500' : 'border-gray-600'} ${showPasswordToggle ? 'pr-12' : ''} ${disabled || isSubmitting ? 'cursor-not-allowed opacity-50' : ''} ${className} `}
        {...props}
      />

      {showPasswordToggle && (
        <button
          type='button'
          onClick={handlePasswordToggle}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none'
          tabIndex={-1}
          aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          disabled={disabled || isSubmitting}
        >
          {passwordVisible ? <EyeSlashIcon className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
        </button>
      )}
    </div>
  );
}

// Error Component
function ErrorDisplay({ error, className = '', ...props }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <p className={`mt-1 text-sm text-red-500 ${className}`} {...props}>
      {error}
    </p>
  );
}

// Button Component
function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  onClick,
  className = '',
  ...props
}: ButtonCompoundProps) {
  const { isSubmitting } = useFormContext();
  const isDisabled = disabled || loading || isSubmitting;

  const baseClasses =
    'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    link: 'text-purple-400 hover:text-purple-300 focus:underline bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={` ${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${variant === 'primary' ? 'w-full' : ''} ${className} `}
      {...props}
    >
      {loading || isSubmitting ? (
        <span className='flex items-center justify-center'>
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
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
          {loading === true ? 'Loading...' : children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Footer Component
function Footer({
  children,
  className = '',
  orientation = 'horizontal',
  justify = 'between',
  ...props
}: LayoutCompoundProps) {
  const orientationClass = orientation === 'horizontal' ? 'flex' : 'flex flex-col';
  const justifyClass = `justify-${justify}`;

  return (
    <div
      className={`mt-6 ${orientationClass} ${justifyClass} items-center text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Link Component
function Link({ children, href, onClick, className = '', ...props }: ButtonCompoundProps) {
  const linkClasses =
    'text-purple-400 hover:text-purple-300 focus:underline focus:outline-none transition-colors';

  if (href) {
    return (
      <a href={href} className={`${linkClasses} ${className}`} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      type='button'
      onClick={onClick}
      className={`${linkClasses} cursor-pointer border-none bg-transparent ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Main compound component with all sub-components attached
export const CompoundForm = Object.assign(CompoundFormBase, {
  Header,
  Title,
  Subtitle,
  Body,
  FieldGroup,
  Label,
  Input,
  Error: ErrorDisplay,
  Button,
  Footer,
  Link,
  displayName: 'CompoundForm',
});

export default CompoundForm;
