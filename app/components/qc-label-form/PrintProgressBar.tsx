'use client';

import React from 'react';

export type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

interface PrintProgressBarProps {
  current: number;
  total: number;
  status: ProgressStatus[];
}

export const PrintProgressBar: React.FC<PrintProgressBarProps> = React.memo(({
  current,
  total,
  status
}) => {
  if (total === 0) {
    return null;
  }

  const progressPercentage = (current / total) * 100;

  const getStatusIcon = (s: ProgressStatus, index: number) => {
    switch (s) {
      case 'Success':
        return '✓';
      case 'Failed':
        return '✗';
      case 'Processing':
        return '⟳';
      default:
        return index + 1;
    }
  };

  const getStatusColor = (s: ProgressStatus) => {
    switch (s) {
      case 'Success':
        return 'bg-green-500 text-white';
      case 'Failed':
        return 'bg-red-500 text-white';
      case 'Processing':
        return 'bg-yellow-500 text-gray-900';
      default:
        return 'bg-gray-400 text-gray-900';
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-700 rounded-lg">
      <div className="mb-2 text-sm text-gray-200 flex justify-between items-center">
        <span>PDF Generation Progress</span>
        <span className="font-semibold">{current} / {total}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden mb-3">
        <div
          className="bg-blue-500 h-3 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Status Indicators */}
      <div className="flex flex-wrap gap-2">
        {status.map((s, i) => (
          <div
            key={i}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              transition-all duration-200 ${getStatusColor(s)}
              ${s === 'Processing' ? 'animate-pulse' : ''}
            `}
            title={`Pallet ${i + 1}: ${s}`}
          >
            {getStatusIcon(s, i)}
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-3 text-xs text-gray-300 flex justify-between">
        <span>
          Success: {status.filter(s => s === 'Success').length}
        </span>
        <span>
          Failed: {status.filter(s => s === 'Failed').length}
        </span>
        <span>
          Processing: {status.filter(s => s === 'Processing').length}
        </span>
        <span>
          Pending: {status.filter(s => s === 'Pending').length}
        </span>
      </div>
    </div>
  );
});

PrintProgressBar.displayName = 'PrintProgressBar';

export default PrintProgressBar; 