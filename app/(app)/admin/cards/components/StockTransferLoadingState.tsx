'use client';

import React from 'react';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { OperationCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cn } from '@/lib/utils';
import { cardTextStyles } from '@/lib/card-system/theme';

interface StockTransferLoadingStateProps {
  loadingMessage?: string;
  showProgress?: boolean;
  progressSteps?: string[];
  currentStep?: number;
  className?: string;
}

export const StockTransferLoadingState: React.FC<StockTransferLoadingStateProps> = ({
  loadingMessage = 'Loading stock transfer...',
  showProgress = false,
  progressSteps = [],
  currentStep = 0,
  className,
}) => {
  return (
    <div className={`h-full ${className || ''}`}>
      <OperationCard
        variant='glass'
        isHoverable={false}
        borderGlow={false}
        className='h-full border-slate-700/50'
        padding='small'
      >
        <div className='flex h-full animate-pulse flex-col'>
          {/* Header Skeleton */}
          <div className='border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700 p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <ArrowLeftRight className='h-6 w-6 text-blue-400' />
                <div className='h-6 w-32 animate-shimmer rounded bg-slate-600/50'></div>
              </div>
              <div className='h-8 w-12 animate-shimmer rounded bg-slate-600/50'></div>
            </div>
            <div className='mt-2 h-4 w-48 animate-shimmer rounded bg-slate-600/50'></div>
          </div>

          {/* Loading Content */}
          <div className='flex-1 p-4'>
            {/* Loading Message with Spinner */}
            <div className='flex min-h-[200px] items-center justify-center'>
              <div className='space-y-4 text-center'>
                <div className='flex justify-center'>
                  <div className='relative'>
                    <div className='h-12 w-12 rounded-full border-4 border-blue-500/30'></div>
                    <div className='absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent'></div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <h3 className={cn('text-lg font-medium', cardTextStyles.title)}>Please wait</h3>
                  <p className='text-sm text-slate-400'>{loadingMessage}</p>
                </div>

                {/* Progress Steps */}
                {showProgress && progressSteps.length > 0 && (
                  <div className='mt-6 space-y-2'>
                    <div className='mb-3 text-xs text-slate-500'>Loading progress</div>
                    {progressSteps.map((step, index) => (
                      <div key={index} className='flex items-center gap-3 text-sm'>
                        <div
                          className={cn(
                            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full',
                            index < currentStep
                              ? 'bg-green-500 text-white'
                              : index === currentStep
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-700 text-slate-400'
                          )}
                        >
                          {index < currentStep ? (
                            <div className='h-2 w-2 rounded-full bg-white'></div>
                          ) : index === currentStep ? (
                            <Loader2 className='h-3 w-3 animate-spin' />
                          ) : (
                            <div className='h-2 w-2 rounded-full border border-slate-500'></div>
                          )}
                        </div>
                        <span
                          className={cn(index <= currentStep ? 'text-white' : 'text-slate-500')}
                        >
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Skeleton Content Areas */}
            <div className='mt-6 space-y-4'>
              {/* Form Skeletons */}
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className='space-y-3'>
                  <div className='h-4 w-24 animate-shimmer rounded bg-slate-600/50'></div>
                  <div className='space-y-2'>
                    <div className='h-8 w-full animate-shimmer rounded bg-slate-700/50'></div>
                    <div className='h-8 w-3/4 animate-shimmer rounded bg-slate-700/50'></div>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='h-4 w-32 animate-shimmer rounded bg-slate-600/50'></div>
                  <div className='h-10 w-full animate-shimmer rounded bg-slate-700/50'></div>
                </div>
              </div>

              {/* Search Area Skeleton */}
              <div className='space-y-3'>
                <div className='h-4 w-36 animate-shimmer rounded bg-slate-600/50'></div>
                <div className='h-12 w-full animate-shimmer rounded bg-slate-700/50'></div>
              </div>

              {/* Log Area Skeleton */}
              <div className='space-y-2'>
                <div className='h-4 w-28 animate-shimmer rounded bg-slate-600/50'></div>
                <div className='h-40 w-full rounded border border-slate-700/50 bg-slate-900/50 p-3'>
                  <div className='space-y-2'>
                    {[1, 2, 3].map(i => (
                      <div key={i} className='flex items-start gap-2'>
                        <div className='mt-2 h-2 w-2 animate-shimmer rounded-full bg-slate-600/50'></div>
                        <div className='flex-1 space-y-1'>
                          <div className='h-3 w-32 animate-shimmer rounded bg-slate-600/50'></div>
                          <div className='h-4 w-48 animate-shimmer rounded bg-slate-600/50'></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </OperationCard>
    </div>
  );
};

// Compact loading state for smaller areas
export const CompactLoadingState: React.FC<{
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className='flex items-center justify-center gap-2 p-4'>
      <Loader2 className={cn('animate-spin text-blue-400', sizeClasses[size])} />
      <span
        className={cn(
          'text-slate-400',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        )}
      >
        {message}
      </span>
    </div>
  );
};

export default StockTransferLoadingState;
