'use client';

import { useState, useCallback, useMemo } from 'react';
import EmailValidator from '@/app/(auth)/main-login/components/EmailValidator';

interface LoginFormData {
  email: string;
  password: string;
}

interface ValidationFieldErrors {
  email?: string;
  password?: string;
}

interface PasswordValidationRules {
  minLength: number;
  description: string;
}

// Frozen for better performance
const PASSWORD_RULES = Object.freeze({
  minLength: 6,
} as const);

export interface AuthValidationState {
  fieldErrors: ValidationFieldErrors;
  passwordRules: PasswordValidationRules;
}

export interface AuthValidationActions {
  validateEmail: (email: string) => string | undefined;
  validatePassword: (password: string) => string | undefined;
  validateForm: (formData: LoginFormData) => boolean;
  clearFieldError: (field: keyof LoginFormData) => void;
  clearErrors: () => void;
}

export interface UseAuthValidationReturn extends AuthValidationState, AuthValidationActions {}

/**
 * Specialized hook for handling authentication form validation
 *
 * Responsibilities:
 * - Email format validation using EmailValidator
 * - Password strength validation
 * - Form-level validation with error aggregation
 * - Field-specific and global error management
 */
export function useAuthValidation(): UseAuthValidationReturn {
  const [fieldErrors, setFieldErrors] = useState<ValidationFieldErrors>({});

  // Email validation
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) {
      return 'Email is required';
    }

    if (!EmailValidator.validate(email)) {
      return EmailValidator.getErrorMessage(email);
    }

    return undefined;
  }, []);

  // Password validation - simplified to minimum length only
  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }

    if (password.length < PASSWORD_RULES.minLength) {
      return `Password must be at least ${PASSWORD_RULES.minLength} characters`;
    }

    // Complex validations removed - handled by Supabase Auth policies
    return undefined;
  }, []);

  // Form validation
  const validateForm = useCallback(
    (formData: LoginFormData): boolean => {
      const errors: ValidationFieldErrors = {};

      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;

      const passwordError = validatePassword(formData.password);
      if (passwordError) errors.password = passwordError;

      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [validateEmail, validatePassword]
  );

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof LoginFormData) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: undefined,
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  // Memoized password rules
  const passwordRules = useMemo(
    (): PasswordValidationRules => ({
      minLength: PASSWORD_RULES.minLength,
      description: `At least ${PASSWORD_RULES.minLength} characters`,
    }),
    []
  );

  return {
    // State
    fieldErrors,
    passwordRules,

    // Actions
    validateEmail,
    validatePassword,
    validateForm,
    clearFieldError,
    clearErrors,
  };
}
