'use client';

import React, { useState, useEffect } from 'react';
import { errorHandler } from './services/ErrorHandler';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { isProduction } from '@/lib/utils/env';

interface ErrorStatsProps {
  showInProduction?: boolean;
  refreshInterval?: number;
}

export const ErrorStats: React.FC<ErrorStatsProps> = React.memo(
  ({ showInProduction = false, refreshInterval = 5000 }) => {
    const [stats, setStats] = useState(errorHandler.getErrorStats());
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
      const interval = setInterval(() => {
        setStats(errorHandler.getErrorStats());
      }, refreshInterval);

      return () => clearInterval(interval);
    }, [refreshInterval]);

    // Don't show in production unless explicitly enabled
    if (isProduction() && !showInProduction) {
      return null;
    }

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'critical':
          return 'text-red-600 bg-red-100';
        case 'high':
          return 'text-orange-600 bg-orange-100';
        case 'medium':
          return 'text-yellow-600 bg-yellow-100';
        case 'low':
          return 'text-blue-600 bg-blue-100';
        default:
          return 'text-gray-600 bg-gray-100';
      }
    };

    const handleClearErrors = () => {
      errorHandler.clearErrorReports();
      setStats(errorHandler.getErrorStats());
    };

    if (stats.total === 0) {
      return (
        <div className='fixed bottom-4 right-4 rounded-lg border border-green-200 bg-green-50 p-3 shadow-lg'>
          <div className='flex items-center text-sm text-green-700'>
            <InformationCircleIcon className='mr-2 h-4 w-4' />
            No errors detected
          </div>
        </div>
      );
    }

    return (
      <div className='fixed bottom-4 right-4 max-w-sm rounded-lg border border-gray-200 bg-white shadow-lg'>
        {/* Header */}
        <div
          className='flex cursor-pointer items-center justify-between p-3 hover:bg-gray-50'
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className='flex items-center'>
            <ExclamationTriangleIcon className='mr-2 h-5 w-5 text-red-500' />
            <span className='text-sm font-medium text-gray-900'>Error Stats ({stats.total})</span>
          </div>
          <ChartBarIcon className='h-4 w-4 text-gray-400' />
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className='space-y-3 border-t border-gray-200 p-3'>
            {/* Severity Breakdown */}
            <div>
              <h4 className='mb-2 text-xs font-medium text-gray-700'>By Severity</h4>
              <div className='space-y-1'>
                {Object.entries(stats.bySeverity).map(([severity, count]) => (
                  <div key={severity} className='flex items-center justify-between'>
                    <span className={`rounded px-2 py-1 text-xs ${getSeverityColor(severity)}`}>
                      {severity}
                    </span>
                    <span className='text-xs text-gray-600'>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Component Breakdown */}
            <div>
              <h4 className='mb-2 text-xs font-medium text-gray-700'>By Component</h4>
              <div className='space-y-1'>
                {Object.entries(stats.byComponent).map(([component, count]) => (
                  <div key={component} className='flex items-center justify-between'>
                    <span className='truncate text-xs text-gray-600'>{component}</span>
                    <span className='text-xs text-gray-600'>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className='flex gap-2 border-t border-gray-100 pt-2'>
              <button
                type='button'
                onClick={handleClearErrors}
                className='flex-1 rounded bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700'
              >
                Clear
              </button>
              <button
                type='button'
                onClick={() =>
                  (process.env.NODE_ENV as string) !== 'production' &&
                  (process.env.NODE_ENV as string) !== 'production' &&
                  console.log('Error Reports:', errorHandler.getErrorReports())
                }
                className='flex-1 rounded bg-gray-600 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-700'
              >
                Log Details
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ErrorStats.displayName = 'ErrorStats';

export default ErrorStats;
