'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { unifiedAuth } from '@/app/(auth)/main-login/utils/unified-auth';
import EmailValidator from '@/app/(auth)/main-login/components/EmailValidator';
import { getUserRoleFromDatabase, getUserRole } from './useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginState {
  loading: boolean;
  error: string;
  fieldErrors: Partial<LoginFormData>;
}

interface PasswordValidationRules {
  minLength: number;
  pattern: RegExp;
  errorMessage: string;
}

const PASSWORD_RULES: PasswordValidationRules = {
  minLength: 6,
  pattern: /^[a-zA-Z0-9]+$/,
  errorMessage: 'Password must contain only letters and numbers',
};

export function useLogin() {
  const router = useRouter();
  const [state, setState] = useState<LoginState>({
    loading: false,
    error: '',
    fieldErrors: {},
  });

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

  // Password validation
  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }

    if (password.length < PASSWORD_RULES.minLength) {
      return `Password must be at least ${PASSWORD_RULES.minLength} characters`;
    }

    if (!PASSWORD_RULES.pattern.test(password)) {
      return PASSWORD_RULES.errorMessage;
    }

    return undefined;
  }, []);

  // Form validation
  const validateForm = useCallback(
    (formData: LoginFormData): boolean => {
      const errors: Partial<LoginFormData> = {};

      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;

      const passwordError = validatePassword(formData.password);
      if (passwordError) errors.password = passwordError;

      setState(prev => ({ ...prev, fieldErrors: errors }));
      return Object.keys(errors).length === 0;
    },
    [validateEmail, validatePassword]
  );

  // Get user redirect path based on role
  const getUserRedirectPath = useCallback(async (email: string): Promise<string> => {
    try {
      // Try to get role from database first
      const dbRole = await getUserRoleFromDatabase(email);
      if (dbRole) {
        return dbRole.defaultPath;
      }
    } catch (error) {
      console.warn('[useLogin] Failed to get role from database, using fallback', error);
    }

    // Fallback to legacy role mapping
    const legacyRole = getUserRole(email);
    return legacyRole.defaultPath;
  }, []);

  // Main login function
  const login = useCallback(
    async (email: string, password: string) => {
      // Reset state
      setState({ loading: true, error: '', fieldErrors: {} });

      // Validate form
      if (!validateForm({ email, password })) {
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Validation failed' };
      }

      try {
        // Perform login
        await unifiedAuth.signIn(email, password);

        // 🚀 優化後的異步會話驗證：減少等待時間並提升準確性
        const sessionResult = await Promise.race([
          // 主要邏輯：快速檢查 session
          (async () => {
            const currentUser = await unifiedAuth.getCurrentUser();
            if (currentUser) {
              return { success: true, user: currentUser };
            }

            // 如果 getCurrentUser 沒有立即返回，進行一次 session 檢查
            const { createClient } = await import('@/app/utils/supabase/client');
            const supabase = createClient();
            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();

            if (!error && session) {
              return { success: true, user: session.user };
            }

            return { success: false };
          })(),
          // 超時邏輯：最多等待 1 秒
          new Promise<{ success: false; timeout: true }>(resolve =>
            setTimeout(() => resolve({ success: false, timeout: true }), 1000)
          ),
        ]);

        if (!sessionResult.success) {
          if ('timeout' in sessionResult) {
            console.warn('[useLogin] Session validation timed out after 1s, proceeding anyway');
          } else {
            console.warn('[useLogin] Session validation failed, but proceeding with login');
          }
        }

        // Get redirect path based on user role
        const redirectPath = await getUserRedirectPath(email);

        // Login successful
        setState({ loading: false, error: '', fieldErrors: {} });

        // Redirect to appropriate page
        router.push(redirectPath);

        return { success: true, redirectPath };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed. Please try again.';
        setState({ loading: false, error: errorMessage, fieldErrors: {} });
        return { success: false, error: errorMessage };
      }
    },
    [validateForm, getUserRedirectPath, router]
  );

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof LoginFormData) => {
    setState(prev => ({
      ...prev,
      fieldErrors: { ...prev.fieldErrors, [field]: undefined },
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: '', fieldErrors: {} }));
  }, []);

  return {
    // State
    loading: state.loading,
    error: state.error,
    fieldErrors: state.fieldErrors,

    // Actions
    login,
    validateEmail,
    validatePassword,
    clearFieldError,
    clearErrors,

    // Constants
    emailDomain: EmailValidator.getAllowedDomain(),
    passwordRules: {
      minLength: PASSWORD_RULES.minLength,
      pattern: PASSWORD_RULES.pattern.source,
      description: `At least ${PASSWORD_RULES.minLength} characters, letters and numbers only`,
    },
  };
}
