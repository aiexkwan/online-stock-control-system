'use client';

import React from 'react';

export type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

interface PrintProgressBarProps {
  current: number;
  total: number;
  status: ProgressStatus[];
}

export const PrintProgressBar: React.FC<PrintProgressBarProps> = React.memo(
  ({ current, total, status }) => {
    if (total === 0) {
      return null;
    }

    const progressPercentage = (current / total) * 100;

    const getStatusIcon = (s: ProgressStatus, index: number): string | number => {
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

    const getStatusColor = (s: ProgressStatus): string => {
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
      <div className='mt-4 rounded-lg bg-gray-700 p-4'>
        <div className='mb-2 flex items-center justify-between text-sm text-gray-200'>
          <span>PDF Generation Progress</span>
          <span className='font-semibold'>
            {current} / {total}
          </span>
        </div>

        {/* Progress Bar */}
        <div className='mb-3 h-3 w-full overflow-hidden rounded-full bg-gray-600'>
          <div
            className='h-3 bg-blue-500 transition-all duration-300 ease-out'
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Status Indicators */}
        <div className='flex flex-wrap gap-2'>
          {status.map((s, i) => (
            <div
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${getStatusColor(s)} ${s === 'Processing' ? 'animate-pulse' : ''}`}
              title={`Pallet ${i + 1}: ${s}`}
            >
              {getStatusIcon(s, i)}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className='mt-3 flex justify-between text-xs text-gray-300'>
          <span>Success: {status.filter(s => s === 'Success').length}</span>
          <span>Failed: {status.filter(s => s === 'Failed').length}</span>
          <span>Processing: {status.filter(s => s === 'Processing').length}</span>
          <span>Pending: {status.filter(s => s === 'Pending').length}</span>
        </div>
      </div>
    );
  }
);

PrintProgressBar.displayName = 'PrintProgressBar';

export default PrintProgressBar;
