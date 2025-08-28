import React from 'react';
import { Label, Input, ErrorMessage } from '../atoms';
import type { InputProps } from '../atoms';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends Omit<InputProps, 'error'> {
  label: string;
  error?: string | null;
  required?: boolean;
  helpText?: string;
  containerClassName?: string;
}

/**
 * Molecule FormField component
 * Combines Label, Input, and ErrorMessage atoms
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, required = false, helpText, containerClassName, id, ...inputProps }, ref) => {
    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={fieldId} required={required} error={!!error}>
          {label}
        </Label>
        <Input
          ref={ref}
          id={fieldId}
          error={!!error}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...inputProps}
        />
        {helpText && !error && <p className='text-sm text-gray-500'>{helpText}</p>}
        {error && <ErrorMessage message={error} />}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
