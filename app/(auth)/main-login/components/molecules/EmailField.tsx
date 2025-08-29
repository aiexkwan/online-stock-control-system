import React from 'react';
import { Mail } from 'lucide-react';
import { FormField } from './FormField';

export interface EmailFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string | null;
  required?: boolean;
  containerClassName?: string;
}

/**
 * Molecule EmailField component
 * Specialized email input field with validation
 */
export const EmailField = React.forwardRef<HTMLInputElement, EmailFieldProps>(
  ({ label = 'Email', error, required = true, containerClassName, ...inputProps }, ref) => {
    return (
      <FormField
        ref={ref}
        label={label}
        type='email'
        error={error}
        required={required}
        containerClassName={containerClassName}
        icon={<Mail size={18} />}
        autoComplete='email'
        {...inputProps}
      />
    );
  }
);

EmailField.displayName = 'EmailField';
