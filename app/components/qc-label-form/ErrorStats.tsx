'use client';

import React, { useState, useEffect } from 'react';
import { errorHandler } from './services/ErrorHandler';
import { ChartBarIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ErrorStatsProps {
  showInProduction?: boolean;
  refreshInterval?: number;
}

export const ErrorStats: React.FC<ErrorStatsProps> = React.memo(({
  showInProduction = false,
  refreshInterval = 5000
}) => {
  const [stats, setStats] = useState(errorHandler.getErrorStats());
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(errorHandler.getErrorStats());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleClearErrors = () => {
    errorHandler.clearErrorReports();
    setStats(errorHandler.getErrorStats());
  };

  if (stats.total === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg">
        <div className="flex items-center text-sm text-green-700">
          <InformationCircleIcon className="h-4 w-4 mr-2" />
          No errors detected
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            Error Stats ({stats.total})
          </span>
        </div>
        <ChartBarIcon className="h-4 w-4 text-gray-400" />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-3">
          {/* Severity Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">By Severity</h4>
            <div className="space-y-1">
              {Object.entries(stats.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(severity)}`}>
                    {severity}
                  </span>
                  <span className="text-xs text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Component Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">By Component</h4>
            <div className="space-y-1">
              {Object.entries(stats.byComponent).map(([component, count]) => (
                <div key={component} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 truncate">{component}</span>
                  <span className="text-xs text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClearErrors}
              className="flex-1 text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => console.log('Error Reports:', errorHandler.getErrorReports())}
              className="flex-1 text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Log Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ErrorStats.displayName = 'ErrorStats';

export default ErrorStats; 