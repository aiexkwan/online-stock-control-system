'use client';

import React from 'react';
import { FormValidation } from './types';
import { getValidationSummary } from './hooks/useFormValidation';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ValidationSummaryProps {
  validation: FormValidation;
  showDetails?: boolean;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = React.memo(({
  validation,
  showDetails = false,
  className = ''
}) => {
  const summary = getValidationSummary(validation);

  if (summary.type === 'success') {
    return (
      <div className={`flex items-center p-3 bg-green-50 border border-green-200 rounded-md ${className}`}>
        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
        <span className="text-sm font-medium text-green-800">{summary.message}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-red-50 border border-red-200 rounded-md ${className}`}>
      <div className="flex items-center mb-2">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
        <span className="text-sm font-medium text-red-800">{summary.message}</span>
      </div>
      
      {showDetails && summary.details && summary.details.length > 0 && (
        <div className="mt-2">
          <ul className="text-sm text-red-700 space-y-1">
            {summary.details.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

ValidationSummary.displayName = 'ValidationSummary';

export default ValidationSummary; 