'use client';

import { useCallback } from 'react';
import { useAuthValidation } from './useAuthValidation';
import { useAuthSubmission } from './useAuthSubmission';
import { useAuthRedirect } from './useAuthRedirect';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  redirectPath?: string;
}

export interface UseLoginReturn {
  // State from validation hook
  fieldErrors: Partial<LoginFormData>;
  passwordRules: {
    minLength: number;
    description: string;
  };

  // State from submission hook
  loading: boolean;
  error: string;

  // Actions
  login: (email: string, password: string) => Promise<LoginResult>;
  validateEmail: (email: string) => string | undefined;
  validatePassword: (password: string) => string | undefined;
  clearFieldError: (field: keyof LoginFormData) => void;
  clearErrors: () => void;
}

/**
 * Composed authentication hook that combines specialized hooks
 *
 * This hook orchestrates three specialized hooks:
 * - useAuthValidation: Form validation logic
 * - useAuthSubmission: API calls and submission handling
 * - useAuthRedirect: Post-auth redirect logic
 *
 * Maintains backward compatibility with existing LoginForm component
 * while providing clear separation of concerns internally.
 */
export function useLogin(): UseLoginReturn {
  // Initialize specialized hooks
  const validation = useAuthValidation();
  const submission = useAuthSubmission();
  const redirect = useAuthRedirect();

  // Main login function that orchestrates all three concerns
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      // Clear previous errors
      validation.clearErrors();
      submission.clearError();

      // Validate form data
      if (!validation.validateForm({ email, password })) {
        return { success: false, error: 'Validation failed' };
      }

      // Perform authentication
      const authResult = await submission.performLogin({ email, password });

      if (!authResult.success) {
        return { success: false, error: authResult.error };
      }

      try {
        // Handle post-auth redirect
        const redirectPath = await redirect.redirectToUserPage(email);

        return { success: true, redirectPath };
      } catch (error) {
        // If redirect fails, still consider login successful
        const fallbackPath = await redirect.getUserRedirectPath(email);
        console.warn('[useLogin] Redirect failed, providing fallback path:', error);

        return { success: true, redirectPath: fallbackPath };
      }
    },
    [validation, submission, redirect]
  );

  // Unified error clearing that handles both validation and submission errors
  const clearErrors = useCallback(() => {
    validation.clearErrors();
    submission.clearError();
  }, [validation, submission]);

  return {
    // State from validation hook
    fieldErrors: validation.fieldErrors,
    passwordRules: validation.passwordRules,

    // State from submission hook
    loading: submission.loading,
    error: submission.error,

    // Actions - expose validation actions directly
    validateEmail: validation.validateEmail,
    validatePassword: validation.validatePassword,
    clearFieldError: validation.clearFieldError,

    // Composed actions
    login,
    clearErrors,
  };
}
