'use client';

import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = React.memo(({
  label,
  required = false,
  error,
  hint,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {hint && <span className="text-gray-500 ml-2 text-xs">({hint})</span>}
      </label>
      
      <div className="relative">
        {children}
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center mt-1">
          <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-1 flex-shrink-0" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField; 