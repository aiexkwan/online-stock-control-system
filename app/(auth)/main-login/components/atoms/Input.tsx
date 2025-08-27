import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Atomic Input component
 * Base input component with error states and icon support
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, icon, fullWidth = false, className, ...props }, ref) => {
    const baseStyles = 'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    const errorStyles = error 
      ? 'border-red-500 focus-visible:ring-red-500' 
      : 'border-input';
    
    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            baseStyles,
            errorStyles,
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';