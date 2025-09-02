/**
 * Compatibility layer for shared components
 * Provides exports for components that are being imported but don't exist as shared modules
 * This file helps maintain backward compatibility while the component architecture is being refactored
 */

import React from 'react';

// Re-export StatusMessage from universal-stock-movement-layout
export { StatusMessage } from '@/components/ui/universal-stock-movement-layout';

// Re-export ValidationInput with SearchInput alias for compatibility
export { ValidationInput as SearchInput } from '@/app/components/shared/validation/ValidationInput';

// Export SearchInputRef type - compatible with HTMLInputElement ref
export type SearchInputRef = HTMLInputElement;

// Basic FormOption interface
export interface FormOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

// Basic Step interface
export interface Step {
  id: string;
  label: string;
  number: number;
  status?: 'pending' | 'active' | 'completed';
}

// Minimal FormInputGroup component - placeholder implementation
export const FormInputGroup: React.FC<{
  type?: 'radio' | 'checkbox' | 'select';
  label?: string;
  description?: string;
  options?: FormOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  layout?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  showValidationIcons?: boolean;
  className?: string;
}> = ({
  type = 'radio',
  label,
  description,
  options = [],
  value,
  onChange,
  disabled = false,
  loading = false,
  layout = 'vertical',
  size = 'md',
  className = '',
}) => {
  const handleChange = (optionValue: string) => {
    if (type === 'checkbox') {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(optionValue)
        ? currentValue.filter(v => v !== optionValue)
        : [...currentValue, optionValue];
      onChange?.(newValue);
    } else {
      onChange?.(optionValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className='block text-sm font-medium text-white'>{label}</label>}
      {description && <p className='text-sm text-gray-400'>{description}</p>}

      <div
        className={`flex ${layout === 'horizontal' ? 'flex-row space-x-3' : 'flex-col space-y-2'} ${layout === 'horizontal' ? 'flex-wrap' : ''}`}
      >
        {options.map(option => {
          const isSelected = Array.isArray(value)
            ? value.includes(option.value)
            : value === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center rounded-lg border p-2 transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${size === 'sm' ? 'p-1.5 text-xs' : size === 'lg' ? 'p-3 text-base' : 'p-2 text-sm'} `}
            >
              <input
                type={type}
                name={label}
                value={option.value}
                checked={isSelected}
                onChange={() => !disabled && !loading && handleChange(option.value)}
                disabled={disabled || loading}
                className='sr-only'
              />

              {/* Custom radio/checkbox indicator */}
              <div
                className={`mr-2 h-4 w-4 flex-shrink-0 rounded border-2 ${type === 'checkbox' ? 'rounded-sm' : 'rounded-full'} ${
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                } `}
              >
                {isSelected && (
                  <div
                    className={`flex h-full w-full items-center justify-center text-xs text-white`}
                  >
                    {type === 'checkbox' ? '✓' : '●'}
                  </div>
                )}
              </div>

              <span className='flex-1'>{option.label}</span>

              {option.description && (
                <span className='ml-2 text-xs text-gray-500'>{option.description}</span>
              )}
            </label>
          );
        })}
      </div>

      {loading && <p className='text-sm text-gray-400'>Loading options...</p>}
    </div>
  );
};

// Minimal StepIndicator component - placeholder implementation
export const StepIndicator: React.FC<{
  steps: Step[];
  currentStepId: string;
  className?: string;
  completedColor?: string;
  activeColor?: string;
  pendingColor?: string;
}> = ({
  steps,
  currentStepId,
  className = '',
  completedColor = 'green-500',
  activeColor = 'blue-500',
  pendingColor = 'gray-400',
}) => {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = index > currentIndex;

        let statusColor = pendingColor;
        if (isCompleted) statusColor = completedColor;
        else if (isActive) statusColor = activeColor;

        return (
          <React.Fragment key={step.id}>
            <div className='flex flex-col items-center'>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isCompleted ? `bg-${completedColor} text-white` : ''} ${isActive ? `bg-${activeColor} text-white` : ''} ${isPending ? `bg-gray-600 text-${pendingColor}` : ''} `}
              >
                {isCompleted ? '✓' : step.number}
              </div>
              <span
                className={`mt-1 text-center text-xs ${isActive ? 'text-white' : 'text-gray-400'} `}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${index < currentIndex ? `bg-${completedColor}` : 'bg-gray-600'} `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Minimal StatusOverlay component - placeholder implementation
export const StatusOverlay: React.FC<{
  open: boolean;
  status: 'success' | 'error' | 'progress' | 'warning';
  mode?: 'modal' | 'fullscreen';
  title: string;
  message?: string;
  details?: string;
  progress?: number;
  progressLabel?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  onClickOutside?: () => void;
}> = ({
  open,
  status,
  mode = 'modal',
  title,
  message,
  details,
  progress,
  progressLabel,
  showCloseButton = false,
  onClose,
  onClickOutside,
}) => {
  if (!open) return null;

  const statusStyles = {
    success: 'border-green-500 bg-green-900/20 text-green-400',
    error: 'border-red-500 bg-red-900/20 text-red-400',
    progress: 'border-blue-500 bg-blue-900/20 text-blue-400',
    warning: 'border-yellow-500 bg-yellow-900/20 text-yellow-400',
  };

  const statusIcons = {
    success: '✓',
    error: '✕',
    progress: '⟳',
    warning: '⚠',
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${mode === 'fullscreen' ? 'bg-black' : 'bg-black/80 backdrop-blur-sm'} `}
      onClick={onClickOutside}
    >
      <div
        className={`relative mx-4 w-full max-w-md rounded-lg border p-6 shadow-2xl ${statusStyles[status]} ${mode === 'fullscreen' ? 'max-w-lg' : ''} `}
        onClick={e => e.stopPropagation()}
      >
        <div className='mb-4 flex items-center'>
          <span className='mr-3 text-2xl'>{statusIcons[status]}</span>
          <h2 className='text-xl font-bold'>{title}</h2>
        </div>

        {message && <p className='mb-3'>{message}</p>}

        {details && <p className='mb-3 text-sm opacity-80'>{details}</p>}

        {status === 'progress' && typeof progress === 'number' && (
          <div className='mb-4'>
            <div className='mb-1 flex justify-between text-sm'>
              <span>{progressLabel || 'Progress'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className='h-2 w-full rounded-full bg-gray-700'>
              <div
                className='h-2 rounded-full bg-blue-500 transition-all duration-300'
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className='mt-4 w-full rounded-lg bg-gray-700 px-4 py-2 transition-colors hover:bg-gray-600'
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};
