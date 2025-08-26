/**
 * ProgressIndicator Component
 * Generic progress indicator with multiple display modes
 * Extracted from UploadCenterCard progress logic
 *
 * Features:
 * - Linear progress bar with percentage
 * - Circular progress indicator
 * - Status-based styling
 * - Configurable colors and sizes
 * - Optional label and description
 * - Animation support
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ProgressStatus = 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info';

export interface ProgressIndicatorProps {
  /** Current progress value (0-100) */
  value: number;
  /** Status of the progress */
  status?: ProgressStatus;
  /** Display variant */
  variant?: 'linear' | 'circular' | 'minimal';
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Show percentage text */
  showPercent?: boolean;
  /** Progress label */
  label?: string;
  /** Description text */
  description?: string;
  /** Custom className */
  className?: string;
  /** Animation enabled */
  animated?: boolean;
  /** Color theme */
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** Show status icon */
  showIcon?: boolean;
}

const statusIcons = {
  idle: Info,
  loading: Loader2,
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const statusColors = {
  idle: 'text-gray-500',
  loading: 'text-blue-500',
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-400',
};

const progressColors = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-400',
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  status = 'idle',
  variant = 'linear',
  size = 'md',
  showPercent = true,
  label,
  description,
  className,
  animated = true,
  color = 'primary',
  showIcon = true,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const StatusIcon = statusIcons[status];

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'text-xs',
          height: 'h-1',
          circular: 'h-8 w-8',
          icon: 'h-3 w-3',
          text: 'text-xs',
        };
      case 'lg':
        return {
          container: 'text-base',
          height: 'h-3',
          circular: 'h-16 w-16',
          icon: 'h-5 w-5',
          text: 'text-base',
        };
      default:
        return {
          container: 'text-sm',
          height: 'h-2',
          circular: 'h-12 w-12',
          icon: 'h-4 w-4',
          text: 'text-sm',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className={cn('relative', sizeClasses.circular)}>
          <svg className='h-full w-full -rotate-90 transform' viewBox='0 0 36 36'>
            {/* Background circle */}
            <circle
              cx='18'
              cy='18'
              r='16'
              fill='transparent'
              stroke='currentColor'
              strokeWidth='2'
              className='text-gray-300 dark:text-gray-600'
            />
            {/* Progress circle */}
            <circle
              cx='18'
              cy='18'
              r='16'
              fill='transparent'
              stroke='currentColor'
              strokeWidth='2'
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={cn(
                progressColors[color],
                animated && 'transition-all duration-300 ease-out'
              )}
              strokeLinecap='round'
            />
          </svg>

          {/* Center content */}
          <div className='absolute inset-0 flex items-center justify-center'>
            {showIcon && status !== 'idle' ? (
              <StatusIcon
                className={cn(
                  sizeClasses.icon,
                  statusColors[status],
                  status === 'loading' && animated && 'animate-spin'
                )}
              />
            ) : showPercent ? (
              <span className={cn('font-medium', sizeClasses.text)}>
                {Math.round(clampedValue)}%
              </span>
            ) : null}
          </div>
        </div>

        {label && (
          <div className='text-center'>
            <div className={cn('font-medium', sizeClasses.text)}>{label}</div>
            {description && (
              <div className={cn('text-gray-500 dark:text-gray-400', sizeClasses.text)}>
                {description}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showIcon && (
          <StatusIcon
            className={cn(
              sizeClasses.icon,
              statusColors[status],
              status === 'loading' && animated && 'animate-spin'
            )}
          />
        )}
        {showPercent && (
          <span className={cn('font-medium', sizeClasses.text)}>{Math.round(clampedValue)}%</span>
        )}
        {label && (
          <span className={cn('text-gray-600 dark:text-gray-300', sizeClasses.text)}>{label}</span>
        )}
      </div>
    );
  }

  // Linear progress bar (default)
  return (
    <div className={cn('w-full space-y-2', sizeClasses.container, className)}>
      {/* Header */}
      {(label || description || showPercent) && (
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {showIcon && (
              <StatusIcon
                className={cn(
                  sizeClasses.icon,
                  statusColors[status],
                  status === 'loading' && animated && 'animate-spin'
                )}
              />
            )}
            {label && <span className={cn('font-medium', sizeClasses.text)}>{label}</span>}
          </div>
          {showPercent && (
            <span className={cn('font-medium tabular-nums', sizeClasses.text)}>
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
          sizeClasses.height
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            progressColors[color],
            animated && 'transition-all duration-300'
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>

      {/* Description */}
      {description && (
        <p className={cn('text-gray-500 dark:text-gray-400', sizeClasses.text)}>{description}</p>
      )}
    </div>
  );
};

export default ProgressIndicator;
