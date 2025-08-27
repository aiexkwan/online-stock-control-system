import React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
}

/**
 * Atomic Label component
 * Base label component with required indicator and error states
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, error = false, className, children, ...props }, ref) => {
    const baseStyles = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
    
    const errorStyles = error ? 'text-red-600' : '';
    
    return (
      <label
        ref={ref}
        className={cn(baseStyles, errorStyles, className)}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';