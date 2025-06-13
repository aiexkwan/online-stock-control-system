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
    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 backdrop-blur-sm rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {label}
          </span>
          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">
            #{index + 1}
          </span>
        </div>
        {details && (
          <p className="text-xs text-slate-400 mt-1 truncate">
            {details}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <span className={`text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm ${
          status === 'Success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
          status === 'Failed' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
          status === 'Processing' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
          'bg-slate-500/20 text-slate-300 border border-slate-500/30'
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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
          {title}
        </h3>
        {showPercentage && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">
              {current} / {total}
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {percentage}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="relative w-full bg-slate-700/50 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-slate-600/30">
          {/* 背景光效 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-blue-500/10"></div>
          
          {/* 進度條 */}
          <div
            className={`h-full transition-all duration-700 ease-out relative overflow-hidden ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          >
            {/* 進度條內部光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 animate-pulse"></div>
            
            {/* 移動光效 */}
            {processingCount > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            )}
          </div>
        </div>
        
        {/* Status Summary */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            {successCount > 0 && (
              <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <CheckCircleIcon className="h-4 w-4 text-green-400" />
                <span className="text-green-300">{successCount} completed</span>
              </div>
            )}
            {failedCount > 0 && (
              <div className="flex items-center space-x-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <XCircleIcon className="h-4 w-4 text-red-400" />
                <span className="text-red-300">{failedCount} failed</span>
              </div>
            )}
            {processingCount > 0 && (
              <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <div className="h-3 w-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-300">{processingCount} processing</span>
              </div>
            )}
          </div>
          {pendingCount > 0 && (
            <span className="text-slate-400 bg-slate-700/30 px-3 py-1 rounded-full">{pendingCount} pending</span>
          )}
        </div>
      </div>

      {/* Items Display */}
      {showItemDetails && (
        <div className="space-y-3">
          {variant === 'compact' || isMobile ? (
            // Compact view for mobile or when specified
            <div className="flex flex-wrap gap-3">
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
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
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
          flex items-center justify-center p-4 rounded-2xl border backdrop-blur-sm
          ${failedCount > 0 
            ? 'bg-gradient-to-r from-red-900/40 to-rose-900/30 border-red-500/30 text-red-200' 
            : 'bg-gradient-to-r from-green-900/40 to-emerald-900/30 border-green-500/30 text-green-200'
          }
        `}>
          {failedCount > 0 ? (
            <>
              <ExclamationTriangleIcon className="h-6 w-6 mr-3 text-red-400" />
              <span className="font-semibold">
                Completed with {failedCount} error{failedCount > 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-6 w-6 mr-3 text-green-400" />
              <span className="font-semibold">All items completed successfully!</span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

// Set display names for debugging
ProgressStep.displayName = 'ProgressStep';
EnhancedProgressBar.displayName = 'EnhancedProgressBar';

export default EnhancedProgressBar; 