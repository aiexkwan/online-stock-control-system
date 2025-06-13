'use client';

import React, { forwardRef } from 'react';
import { getMobileInputClass, cn } from '@/lib/mobile-config';

interface MobileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, icon, size = 'md', className, ...props }, ref) => {
    const inputClass = getMobileInputClass(error ? 'error' : 'normal', size);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              inputClass,
              icon ? 'pl-10' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';