'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationFormContextType {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setFieldError: (field: string, error: string) => void;
  setFieldTouched: (field: string, touched: boolean) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  validateField: (field: string, value: unknown, rules: ValidationRule[]) => string;
  isValid: boolean;
}

interface ValidationRule {
  validate: (
    value: unknown,
    formData?: Record<string, unknown>
  ) => boolean | string | Promise<boolean | string>;
  message?: string;
}

interface ValidationFormProps {
  children:
    | React.ReactNode
    | ((props: {
        errors: Record<string, string>;
        touched: Record<string, boolean>;
        isValid: boolean;
        handleFieldChange: (name: string, value: unknown) => void;
      }) => React.ReactNode);
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  validationRules?: Record<string, ValidationRule[]>;
  initialValues?: Record<string, unknown>;
  validateOnSubmit?: boolean;
  validateOnChange?: boolean;
  showToastOnError?: boolean;
}

const ValidationFormContext = createContext<ValidationFormContextType | null>(null);

export const useValidationForm = () => {
  const context = useContext(ValidationFormContext);
  if (!context) {
    throw new Error('useValidationForm must be used within ValidationForm');
  }
  return context;
};

/**
 * Form component with validation context
 * 具有驗證上下文的表單組件
 *
 * @example
 * ```tsx
 * <ValidationForm
 *   validationRules={{
 *     email: [
 *       { validate: (v) => !!v, message: 'Email is required' },
 *       { validate: (v) => /\S+@\S+\.\S+/.test(v), message: 'Invalid email' }
 *     ],
 *     password: [
 *       { validate: (v) => v?.length >= 6, message: 'Min 6 characters' }
 *     ]
 *   }}
 *   onSubmit={handleSubmit}
 * >
 *   <ValidationInput name="email" />
 *   <ValidationInput name="password" type="password" />
 *   <button type="submit">Submit</button>
 * </ValidationForm>
 * ```
 */
export function ValidationForm({
  children,
  onSubmit,
  validationRules = {},
  initialValues = {},
  validateOnSubmit = true,
  validateOnChange = false,
  showToastOnError = true,
}: ValidationFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState(initialValues);

  const validateField = useCallback(
    async (field: string, value: unknown, rules: ValidationRule[]): Promise<string> => {
      for (const rule of rules) {
        const result = await rule.validate(value, formData);
        if (typeof result === 'string') {
          return result;
        } else if (!result) {
          return rule.message || `Validation failed for ${field}`;
        }
      }
      return '';
    },
    [formData]
  );

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setFieldTouched = useCallback((field: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [field]: touched }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    for (const [field, rules] of Object.entries(validationRules)) {
      const value = formData[field];
      const error = await validateField(field, value, rules);
      if (error) {
        newErrors[field] = error;
      }
    }

    setErrors(newErrors);

    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce(
      (acc, field) => {
        acc[field] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setTouched(allTouched);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateOnSubmit) {
      const isValid = await validateForm();
      if (!isValid) {
        if (showToastOnError) {
          const errorCount = Object.keys(errors).length;
          toast.error(`Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''}`);
        }
        return;
      }
    }

    // Get form data
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      await onSubmit(data);
    } catch (error) {
      if (showToastOnError) {
        toast.error(error instanceof Error ? error.message : 'Form submission failed');
      }
    }
  };

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      setFormData(prev => ({ ...prev, [field]: value }));

      if (validateOnChange && validationRules[field]) {
        validateField(field, value, validationRules[field]).then(error => {
          if (error) {
            setFieldError(field, error);
          } else {
            clearFieldError(field);
          }
        });
      }
    },
    [validateOnChange, validationRules, validateField, setFieldError, clearFieldError]
  );

  const isValid = Object.keys(errors).length === 0;

  const contextValue: ValidationFormContextType = {
    errors,
    touched,
    setFieldError,
    setFieldTouched,
    clearFieldError,
    clearAllErrors,
    validateField: (field, value, rules) => {
      // Sync version for immediate validation
      for (const rule of rules) {
        const result = rule.validate(value, formData);
        if (result instanceof Promise) {
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.warn('Async validation rule used in sync context');
          continue;
        }
        if (typeof result === 'string') {
          return result;
        } else if (!result) {
          return rule.message || `Validation failed for ${field}`;
        }
      }
      return '';
    },
    isValid,
  };

  return (
    <ValidationFormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} noValidate>
        {typeof children === 'function'
          ? children({ errors, touched, isValid, handleFieldChange })
          : children}
      </form>
    </ValidationFormContext.Provider>
  );
}
