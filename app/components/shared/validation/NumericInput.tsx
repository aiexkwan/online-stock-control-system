'use client';

import React, { forwardRef } from 'react';
import { ValidationInput, type ValidationInputProps, type ValidationRule } from './ValidationInput';

export interface NumericInputProps
  extends Omit<ValidationInputProps, 'type' | 'pattern' | 'inputMode'> {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Allow decimals */
  allowDecimals?: boolean;
  /** Number of decimal places */
  decimalPlaces?: number;
  /** Format display value */
  formatDisplay?: boolean;
  /** Prefix (e.g., '$') */
  prefix?: string;
  /** Suffix (e.g., 'kg') */
  suffix?: string;
}

/**
 * Numeric input component with validation
 * 具有驗證的數字輸入組件
 *
 * @example
 * ```tsx
 * <NumericInput
 *   label="Quantity"
 *   required
 *   min={1}
 *   max={999}
 *   suffix="pcs"
 *   _error ={errors.quantity}
 * />
 * ```
 */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      min,
      max,
      allowDecimals = false,
      decimalPlaces = 2,
      formatDisplay = false,
      prefix,
      suffix,
      onChange,
      value,
      rules = [],
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(String(value || ''));

    // Add numeric validation rules - 策略4: unknown + type narrowing
    const numericRules: ValidationRule[] = [
      {
        validate: (v: unknown) => {
          const stringValue = typeof v === 'string' ? v : String(v || '');
          if (!stringValue) return !props.required;
          const num = parseFloat(stringValue);
          return !isNaN(num);
        },
        message: 'Must be a valid number',
      },
      ...(min !== undefined
        ? [
            {
              validate: (v: unknown) => {
                const stringValue = typeof v === 'string' ? v : String(v || '');
                if (!stringValue) return true;
                const num = parseFloat(stringValue);
                return num >= min;
              },
              message: `Minimum value is ${min}`,
            },
          ]
        : []),
      ...(max !== undefined
        ? [
            {
              validate: (v: unknown) => {
                const stringValue = typeof v === 'string' ? v : String(v || '');
                if (!stringValue) return true;
                const num = parseFloat(stringValue);
                return num <= max;
              },
              message: `Maximum value is ${max}`,
            },
          ]
        : []),
      ...(!allowDecimals
        ? [
            {
              validate: (v: unknown) => {
                const stringValue = typeof v === 'string' ? v : String(v || '');
                if (!stringValue) return true;
                return Number.isInteger(parseFloat(stringValue));
              },
              message: 'Decimals not allowed',
            },
          ]
        : []),
      ...rules,
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Remove prefix/suffix for processing
      if (prefix) value = value.replace(prefix, '');
      if (suffix) value = value.replace(suffix, '');

      // Remove non-numeric characters (except decimal point if allowed)
      if (allowDecimals) {
        value = value.replace(/[^0-9.-]/g, '');
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
          value = parts[0] + '.' + parts.slice(1).join('');
        }
        // Limit decimal places
        if (parts.length === 2 && parts[1].length > decimalPlaces) {
          value = parts[0] + '.' + parts[1].slice(0, decimalPlaces);
        }
      } else {
        value = value.replace(/[^0-9-]/g, '');
      }

      // Ensure only one minus sign at the beginning
      if (value.includes('-')) {
        const isNegative = value[0] === '-';
        value = value.replace(/-/g, '');
        if (isNegative) value = '-' + value;
      }

      setDisplayValue(value);

      // Create synthetic event with numeric value
      const numericValue = value ? parseFloat(value) : '';
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: String(numericValue),
        },
      };

      onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let value = displayValue;

      // Format on blur if needed
      if (formatDisplay && value) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          if (allowDecimals) {
            value = num.toFixed(decimalPlaces);
          } else {
            value = Math.round(num).toString();
          }
        }
      }

      // Add prefix/suffix for display
      if (prefix && value) value = prefix + value;
      if (suffix && value) value = value + suffix;

      setDisplayValue(value);
      props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Remove prefix/suffix on focus
      let value = displayValue;
      if (prefix) value = value.replace(prefix, '');
      if (suffix) value = value.replace(suffix, '');
      setDisplayValue(value);
      props.onFocus?.(e);
    };

    React.useEffect(() => {
      setDisplayValue(String(value || ''));
    }, [value]);

    return (
      <ValidationInput
        ref={ref}
        type='text'
        inputMode='decimal'
        pattern={allowDecimals ? '[0-9]*\\.?[0-9]*' : '[0-9]*'}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        rules={numericRules}
        {...props}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';
