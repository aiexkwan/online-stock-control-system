import React, { useState } from 'react';
import { Label, Input, ErrorMessage } from '../atoms';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string | null;
  required?: boolean;
  showStrength?: boolean;
  containerClassName?: string;
}

/**
 * Molecule PasswordField component
 * Password input with visibility toggle
 */
export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      label,
      error,
      required = false,
      showStrength = false,
      containerClassName,
      id,
      value,
      ...inputProps
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const fieldId = id || `password-${label.toLowerCase().replace(/\s+/g, '-')}`;

    const getPasswordStrength = (password: string): { strength: number; label: string } => {
      if (!password) return { strength: 0, label: '' };

      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;

      const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
      return { strength, label: labels[strength] };
    };

    const passwordStrength = showStrength && value ? getPasswordStrength(String(value)) : null;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={fieldId} required={required} error={!!error}>
          {label}
        </Label>
        <div className='relative'>
          <Input
            ref={ref}
            id={fieldId}
            type={showPassword ? 'text' : 'password'}
            error={!!error}
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className='pr-10'
            {...inputProps}
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {showStrength && passwordStrength && passwordStrength.strength > 0 && (
          <div className='space-y-1'>
            <div className='flex gap-1'>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded',
                    i < passwordStrength.strength
                      ? passwordStrength.strength <= 2
                        ? 'bg-red-500'
                        : passwordStrength.strength <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
            <p className='text-xs text-gray-600'>Strength: {passwordStrength.label}</p>
          </div>
        )}
        {error && <ErrorMessage message={error} />}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
