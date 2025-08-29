'use client';

import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FormValidation } from './types';
import { getValidationSummary } from './hooks/useFormValidation';

interface ValidationSummaryProps {
  validation: FormValidation;
  showDetails?: boolean;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = React.memo(
  ({ validation, showDetails = false, className = '' }) => {
    const summary = getValidationSummary(validation);

    if (summary.type === 'success') {
      return (
        <div
          className={`flex items-center rounded-md border border-green-200 bg-green-50 p-3 ${className}`}
        >
          <CheckCircleIcon className='mr-2 h-5 w-5 flex-shrink-0 text-green-500' />
          <span className='text-sm font-medium text-green-800'>{summary.message}</span>
        </div>
      );
    }

    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-3 ${className}`}>
        <div className='mb-2 flex items-center'>
          <ExclamationTriangleIcon className='mr-2 h-5 w-5 flex-shrink-0 text-red-500' />
          <span className='text-sm font-medium text-red-800'>{summary.message}</span>
        </div>

        {showDetails && summary.details && summary.details.length > 0 && (
          <div className='mt-2'>
            <ul className='space-y-1 text-sm text-red-700'>
              {summary.details.map((error, index) => (
                <li key={index} className='flex items-start'>
                  <span className='mr-2 mt-2 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-red-500'></span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

ValidationSummary.displayName = 'ValidationSummary';

export default ValidationSummary;
