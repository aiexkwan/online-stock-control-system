/**
 * Unified Loading Spinner Component
 * 統一嘅 inline loading spinner
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

const SIZE_CLASSES = {
  sm: 'h-1 w-4',
  md: 'h-1.5 w-6',
  lg: 'h-2 w-8',
  xl: 'h-3 w-10',
} as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'md',
  text,
  fullScreen = false,
}): JSX.Element => {
  const spinner: JSX.Element = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('rounded-full bg-slate-400 opacity-75', SIZE_CLASSES[size])} />
      {text && <span className='text-sm'>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return <div className='flex min-h-screen items-center justify-center'>{spinner}</div>;
  }

  return spinner;
};

// Centered Loading Spinner for containers
export const CenteredLoadingSpinner: React.FC<
  LoadingSpinnerProps & { containerHeight?: string }
> = ({ containerHeight = 'h-64', ...props }): JSX.Element => {
  return (
    <div className={cn('flex items-center justify-center', containerHeight)}>
      <LoadingSpinner {...props} />
    </div>
  );
};
