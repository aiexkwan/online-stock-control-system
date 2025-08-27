import React from 'react';
import { cn } from '@/lib/utils';

export interface ErrorMessageProps {
  message?: string | null;
  className?: string;
}

/**
 * Atomic ErrorMessage component
 * Displays error messages with consistent styling
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className }) => {
  if (!message) return null;
  
  return (
    <p className={cn('text-sm text-red-600 mt-1', className)}>
      {message}
    </p>
  );
};