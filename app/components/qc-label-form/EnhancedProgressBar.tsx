'use client';

import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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

const ProgressStep: React.FC<ProgressStepProps> = React.memo(({
  status,
  label,
  details,
  index,
  isCompact = false
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'Success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'Processing':
        return (
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
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
        className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center
          transition-all duration-300 ${getStatusColor()}
        `}
        title={`${label}: ${status}${details ? ` - ${details}` : ''}`}
      >
        <span className="text-xs font-bold text-white">
          {status === 'Success' ? '✓' : status === 'Failed' ? '✗' : index + 1}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {label}
          </span>
          <span className="text-xs text-gray-500">
            #{index + 1}
          </span>
        </div>
        {details && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            {details}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          status === 'Success' ? 'bg-green-100 text-green-800' :
          status === 'Failed' ? 'bg-red-100 text-red-800' :
          status === 'Processing' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
});

export const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = React.memo(({
  current,
  total,
  status,
  items,
  title = 'Progress',
  showPercentage = true,
  showItemDetails = true,
  variant = 'default',
  className = ''
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
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          {title}
        </h3>
        {showPercentage && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {current} / {total}
            </span>
            <span className="text-lg font-semibold text-white">
              {percentage}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Status Summary */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            {successCount > 0 && (
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span>{successCount} completed</span>
              </div>
            )}
            {failedCount > 0 && (
              <div className="flex items-center space-x-1">
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span>{failedCount} failed</span>
              </div>
            )}
            {processingCount > 0 && (
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>{processingCount} processing</span>
              </div>
            )}
          </div>
          {pendingCount > 0 && (
            <span>{pendingCount} pending</span>
          )}
        </div>
      </div>

      {/* Items Display */}
      {showItemDetails && (
        <div className="space-y-2">
          {variant === 'compact' || isMobile ? (
            // Compact view for mobile or when specified
            <div className="flex flex-wrap gap-2">
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
            <div className="space-y-2 max-h-60 overflow-y-auto">
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
        <div className={`
          flex items-center justify-center p-3 rounded-lg border
          ${failedCount > 0 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-green-50 border-green-200 text-green-800'
          }
        `}>
          {failedCount > 0 ? (
            <>
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">
                Completed with {failedCount} error{failedCount > 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">All items completed successfully!</span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

ProgressStep.displayName = 'ProgressStep';
EnhancedProgressBar.displayName = 'EnhancedProgressBar';

export default EnhancedProgressBar; 