'use client';

import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useMediaQuery } from './hooks/useMediaQuery';

export type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

interface ProgressItem {
  id: string;
  label: string;
  status: ProgressStatus;
  details?: string;
  timestamp?: string;
}

interface EnhancedProgressBarProps {
  current: number;
  total: number;
  status: ProgressStatus[];
  items?: ProgressItem[];
  title?: string;
  showPercentage?: boolean;
  showItemDetails?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

interface ProgressStepProps {
  status: ProgressStatus;
  label: string;
  details?: string;
  index: number;
  isCompact?: boolean;
}

const ProgressStep: React.FC<ProgressStepProps> = React.memo(
  ({ status, label, details, index, isCompact = false }) => {
    const getStatusIcon = () => {
      switch (status) {
        case 'Success':
          return <CheckCircleIcon className='h-5 w-5 text-green-500' />;
        case 'Failed':
          return <XCircleIcon className='h-5 w-5 text-red-500' />;
        case 'Processing':
          return (
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
          );
        default:
          return <ClockIcon className='h-5 w-5 text-gray-400' />;
      }
    };

    const getStatusColor = () => {
      switch (status) {
        case 'Success':
          return 'bg-green-500 border-green-500';
        case 'Failed':
          return 'bg-red-500 border-red-500';
        case 'Processing':
          return 'bg-blue-500 border-blue-500 animate-pulse';
        default:
          return 'bg-gray-400 border-gray-400';
      }
    };

    const getTextColor = () => {
      switch (status) {
        case 'Success':
          return 'text-green-400';
        case 'Failed':
          return 'text-red-400';
        case 'Processing':
          return 'text-blue-400';
        default:
          return 'text-gray-400';
      }
    };

    if (isCompact) {
      return (
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${getStatusColor()} `}
          title={`${label}: ${status}${details ? ` - ${details}` : ''}`}
        >
          <span className='text-xs font-bold text-white'>
            {status === 'Success' ? '✓' : status === 'Failed' ? '✗' : index + 1}
          </span>
        </div>
      );
    }

    return (
      <div className='flex items-center space-x-3 rounded-xl border border-slate-600/30 bg-gradient-to-r from-slate-800/60 to-slate-700/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-slate-500/50'>
        <div className='flex-shrink-0'>{getStatusIcon()}</div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center space-x-2'>
            <span className={`text-sm font-medium ${getTextColor()}`}>{label}</span>
            <span className='rounded-full bg-slate-700/50 px-2 py-1 text-xs text-slate-500'>
              #{index + 1}
            </span>
          </div>
          {details && <p className='mt-1 truncate text-xs text-slate-400'>{details}</p>}
        </div>
        <div className='flex-shrink-0'>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${
              status === 'Success'
                ? 'border border-green-500/30 bg-green-500/20 text-green-300'
                : status === 'Failed'
                  ? 'border border-red-500/30 bg-red-500/20 text-red-300'
                  : status === 'Processing'
                    ? 'border border-blue-500/30 bg-blue-500/20 text-blue-300'
                    : 'border border-slate-500/30 bg-slate-500/20 text-slate-300'
            }`}
          >
            {status}
          </span>
        </div>
      </div>
    );
  }
);

export const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = React.memo(
  ({
    current,
    total,
    status,
    items,
    title = 'Progress',
    showPercentage = true,
    showItemDetails = true,
    variant = 'default',
    className = '',
  }) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    const successCount = status.filter(s => s === 'Success').length;
    const failedCount = status.filter(s => s === 'Failed').length;
    const processingCount = status.filter(s => s === 'Processing').length;
    const pendingCount = status.filter(s => s === 'Pending').length;

    const getProgressColor = () => {
      if (failedCount > 0) return 'bg-red-500';
      if (processingCount > 0) return 'bg-blue-500';
      if (current === total && total > 0) return 'bg-green-500';
      return 'bg-blue-500';
    };

    if (total === 0) {
      return null;
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h3 className='bg-gradient-to-r from-white to-blue-200 bg-clip-text text-lg font-semibold text-transparent'>
            {title}
          </h3>
          {showPercentage && (
            <div className='flex items-center space-x-3'>
              <span className='rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-400'>
                {current} / {total}
              </span>
              <span className='bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-xl font-bold text-transparent'>
                {percentage}%
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className='space-y-3'>
          <div className='relative h-4 w-full overflow-hidden rounded-full border border-slate-600/30 bg-slate-700/50 backdrop-blur-sm'>
            {/* 背景光效 */}
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-blue-500/10'></div>

            {/* 進度條 */}
            <div
              className={`relative h-full overflow-hidden transition-all duration-700 ease-out ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            >
              {/* 進度條內部光效 */}
              <div className='absolute inset-0 animate-pulse bg-gradient-to-r from-white/20 via-white/10 to-white/20'></div>

              {/* 移動光效 */}
              {processingCount > 0 && (
                <div className='absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent'></div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className='flex items-center justify-between text-xs'>
            <div className='flex items-center space-x-4'>
              {successCount > 0 && (
                <div className='flex items-center space-x-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1'>
                  <CheckCircleIcon className='h-4 w-4 text-green-400' />
                  <span className='text-green-300'>{successCount} completed</span>
                </div>
              )}
              {failedCount > 0 && (
                <div className='flex items-center space-x-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1'>
                  <XCircleIcon className='h-4 w-4 text-red-400' />
                  <span className='text-red-300'>{failedCount} failed</span>
                </div>
              )}
              {processingCount > 0 && (
                <div className='flex items-center space-x-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1'>
                  <div className='h-3 w-3 animate-spin rounded-full border border-blue-400 border-t-transparent' />
                  <span className='text-blue-300'>{processingCount} processing</span>
                </div>
              )}
            </div>
            {pendingCount > 0 && (
              <span className='rounded-full bg-slate-700/30 px-3 py-1 text-slate-400'>
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>

        {/* Items Display */}
        {showItemDetails && (
          <div className='space-y-3'>
            {variant === 'compact' || isMobile ? (
              // Compact view for mobile or when specified
              <div className='flex flex-wrap gap-3'>
                {status.map((itemStatus, index) => (
                  <ProgressStep
                    key={index}
                    status={itemStatus}
                    label={items?.[index]?.label || `Item ${index + 1}`}
                    details={items?.[index]?.details}
                    index={index}
                    isCompact
                  />
                ))}
              </div>
            ) : (
              // Detailed view
              <div className='scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 max-h-64 space-y-3 overflow-y-auto'>
                {status.map((itemStatus, index) => (
                  <ProgressStep
                    key={index}
                    status={itemStatus}
                    label={items?.[index]?.label || `Pallet ${index + 1}`}
                    details={items?.[index]?.details}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overall Status */}
        {current === total && total > 0 && (
          <div
            className={`flex items-center justify-center rounded-2xl border p-4 backdrop-blur-sm ${
              failedCount > 0
                ? 'border-red-500/30 bg-gradient-to-r from-red-900/40 to-rose-900/30 text-red-200'
                : 'border-green-500/30 bg-gradient-to-r from-green-900/40 to-emerald-900/30 text-green-200'
            } `}
          >
            {failedCount > 0 ? (
              <>
                <ExclamationTriangleIcon className='mr-3 h-6 w-6 text-red-400' />
                <span className='font-semibold'>
                  Completed with {failedCount} error{failedCount > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <>
                <CheckCircleIcon className='mr-3 h-6 w-6 text-green-400' />
                <span className='font-semibold'>All items completed successfully!</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

// Set display names for debugging
ProgressStep.displayName = 'ProgressStep';
EnhancedProgressBar.displayName = 'EnhancedProgressBar';

export default EnhancedProgressBar;
