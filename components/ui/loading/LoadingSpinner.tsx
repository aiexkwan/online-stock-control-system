/**
 * Unified Loading Spinner Component
 * 統一嘅 inline loading spinner
 */

'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'md',
  text,
  fullScreen = false,
}) => {
  const spinner = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('bg-slate-400 rounded-full opacity-75', 
        size === 'sm' ? 'h-1 w-4' : size === 'lg' ? 'h-2 w-8' : size === 'xl' ? 'h-3 w-10' : 'h-1.5 w-6'
      )} />
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
> = ({ containerHeight = 'h-64', ...props }) => {
  return (
    <div className={cn('flex items-center justify-center', containerHeight)}>
      <LoadingSpinner {...props} />
    </div>
  );
};
