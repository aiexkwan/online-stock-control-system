'use client';

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useAuthValidation, UseAuthValidationReturn } from '@/app/hooks/useAuthValidation';
import { useAuthSubmission, UseAuthSubmissionReturn } from '@/app/hooks/useAuthSubmission';
import { useAuthRedirect, UseAuthRedirectReturn } from '@/app/hooks/useAuthRedirect';
import { useAuth } from '@/app/hooks/useAuth';
import { AuthState } from '@/lib/types/auth';
import { useLoginPersistence, LoginPersistenceState } from './useLoginPersistence';

// Form data interfaces
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// UI state interface
export interface LoginUIState {
  showConfirmation: boolean;
  confirmationMessage: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  currentView: 'login' | 'register' | 'reset' | 'change';
}

// Combined login result interface
export interface LoginResult {
  success: boolean;
  error?: string;
  redirectPath?: string;
  user?: import('@supabase/supabase-js').User | null;
}

// Main LoginContext state interface
export interface LoginContextState
  extends UseAuthValidationReturn,
    UseAuthSubmissionReturn,
    UseAuthRedirectReturn,
    AuthState,
    LoginPersistenceState {
  // UI State
  uiState: LoginUIState;

  // Form Data
  loginFormData: LoginFormData;
  registerFormData: RegisterFormData;

  // Combined actions
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (formData: RegisterFormData) => Promise<LoginResult>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;

  // UI Actions
  setShowPassword: (show: boolean) => void;
  setShowConfirmPassword: (show: boolean) => void;
  setConfirmation: (show: boolean, message?: string) => void;
  setCurrentView: (view: LoginUIState['currentView']) => void;

  // Form Actions
  updateLoginForm: (field: keyof LoginFormData, value: string) => void;
  updateRegisterForm: (field: keyof RegisterFormData, value: string) => void;
  clearForms: () => void;

  // Combined clear actions
  clearAllErrors: () => void;
  clearAllState: () => void;
}

// Context creation
const LoginContext = createContext<LoginContextState | undefined>(undefined);

// Hook to use the context
export function useLoginContext(): LoginContextState {
  const context = useContext(LoginContext);

  if (context === undefined) {
    throw new Error('useLoginContext must be used within a LoginProvider');
  }

  return context;
}

// Provider props interface
export interface LoginProviderProps {
  children: ReactNode;
  initialView?: LoginUIState['currentView'];
  enablePersistence?: boolean;
}

/**
 * LoginProvider component that provides centralized state management
 * for all login-related functionality
 *
 * Features:
 * - Integrates all specialized hooks (validation, submission, redirect, auth)
 * - Manages form state and UI state centrally
 * - Provides state persistence across page reloads
 * - Handles combined actions like login, register, and password reset
 * - Maintains backward compatibility with existing components
 */
export function LoginProvider({
  children,
  initialView = 'login',
  enablePersistence = true,
}: LoginProviderProps) {
  // Initialize all specialized hooks
  const validation = useAuthValidation();
  const submission = useAuthSubmission();
  const redirect = useAuthRedirect();
  const auth = useAuth();
  const persistence = useLoginPersistence({ enabled: enablePersistence });

  // Get form data from persistence
  const { loginFormData, registerFormData, uiState: persistedUIState } = persistence;

  // Initialize UI state with persistence and defaults
  const uiState: LoginUIState = useMemo(
    () => ({
      showConfirmation: persistedUIState.showConfirmation || false,
      confirmationMessage: persistedUIState.confirmationMessage || '',
      showPassword: persistedUIState.showPassword || false,
      showConfirmPassword: persistedUIState.showConfirmPassword || false,
      currentView: persistedUIState.currentView || initialView,
    }),
    [persistedUIState, initialView]
  );

  // Combined login action
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
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

        // Handle post-auth redirect
        const redirectPath = await redirect.redirectToUserPage(email);

        // Update persistence
        persistence.updateFormData('login', { email, password });
        persistence.clearSensitiveData();

        return {
          success: true,
          redirectPath,
          user: authResult.user,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        return { success: false, error: errorMessage };
      }
    },
    [validation, submission, redirect, persistence]
  );

  // Combined register action
  const register = useCallback(
    async (formData: RegisterFormData): Promise<LoginResult> => {
      try {
        // Validation logic for registration
        if (formData.password !== formData.confirmPassword) {
          return { success: false, error: 'Passwords do not match' };
        }

        if (!formData.email.endsWith('@pennineindustries.com')) {
          return {
            success: false,
            error: 'Only @pennineindustries.com email addresses are allowed',
          };
        }

        // Import unifiedAuth dynamically to avoid circular dependencies
        const { unifiedAuth } = await import('../utils/unified-auth');

        // Perform registration
        await unifiedAuth.signUp(formData.email, formData.password);

        // Update persistence
        persistence.updateFormData('register', formData);
        persistence.clearSensitiveData();

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        return { success: false, error: errorMessage };
      }
    },
    [persistence]
  );

  // Combined reset password action
  const resetPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { unifiedAuth } = await import('../utils/unified-auth');
        await unifiedAuth.resetPassword(email);
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // UI Actions
  const setShowPassword = useCallback(
    (show: boolean) => {
      persistence.updateUIState({ showPassword: show });
    },
    [persistence]
  );

  const setShowConfirmPassword = useCallback(
    (show: boolean) => {
      persistence.updateUIState({ showConfirmPassword: show });
    },
    [persistence]
  );

  const setConfirmation = useCallback(
    (show: boolean, message = '') => {
      persistence.updateUIState({
        showConfirmation: show,
        confirmationMessage: message,
      });
    },
    [persistence]
  );

  const setCurrentView = useCallback(
    (view: LoginUIState['currentView']) => {
      persistence.updateUIState({ currentView: view });
    },
    [persistence]
  );

  // Form Actions
  const updateLoginForm = useCallback(
    (field: keyof LoginFormData, value: string) => {
      const updatedData = { ...loginFormData, [field]: value };
      persistence.updateFormData('login', updatedData);

      // Clear field error when user starts typing
      if (validation.fieldErrors[field]) {
        validation.clearFieldError(field);
      }
    },
    [loginFormData, persistence, validation]
  );

  const updateRegisterForm = useCallback(
    (field: keyof RegisterFormData, value: string) => {
      const updatedData = { ...registerFormData, [field]: value };
      persistence.updateFormData('register', updatedData);
    },
    [registerFormData, persistence]
  );

  const clearForms = useCallback(() => {
    persistence.clearFormData();
  }, [persistence]);

  // Combined clear actions
  const clearAllErrors = useCallback(() => {
    validation.clearErrors();
    submission.clearError();
  }, [validation, submission]);

  const clearAllState = useCallback(() => {
    validation.clearErrors();
    submission.clearError();
    persistence.clearAll();
  }, [validation, submission, persistence]);

  // Memoize context value for performance
  const contextValue: LoginContextState = useMemo(
    () => ({
      // From validation hook
      fieldErrors: validation.fieldErrors,
      passwordRules: validation.passwordRules,
      validateEmail: validation.validateEmail,
      validatePassword: validation.validatePassword,
      validateForm: validation.validateForm,
      clearFieldError: validation.clearFieldError,
      clearErrors: validation.clearErrors,

      // From submission hook
      loading: submission.loading,
      error: submission.error,
      performLogin: submission.performLogin,
      clearError: submission.clearError,

      // From redirect hook
      redirectToUserPage: redirect.redirectToUserPage,
      getUserRedirectPath: redirect.getUserRedirectPath,

      // From auth hook
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      userRole: auth.userRole,

      // From persistence hook
      persistenceEnabled: persistence.persistenceEnabled,
      clearSensitiveData: persistence.clearSensitiveData,
      clearAll: persistence.clearAll,
      updateFormData: persistence.updateFormData,
      updateUIState: persistence.updateUIState,
      clearFormData: persistence.clearFormData,

      // UI State
      uiState,

      // Form Data
      loginFormData,
      registerFormData,

      // Combined Actions
      login,
      register,
      resetPassword,

      // UI Actions
      setShowPassword,
      setShowConfirmPassword,
      setConfirmation,
      setCurrentView,

      // Form Actions
      updateLoginForm,
      updateRegisterForm,
      clearForms,

      // Combined Clear Actions
      clearAllErrors,
      clearAllState,
    }),
    [
      validation,
      submission,
      redirect,
      auth,
      persistence,
      uiState,
      loginFormData,
      registerFormData,
      login,
      register,
      resetPassword,
      setShowPassword,
      setShowConfirmPassword,
      setConfirmation,
      setCurrentView,
      updateLoginForm,
      updateRegisterForm,
      clearForms,
      clearAllErrors,
      clearAllState,
    ]
  );

  return <LoginContext.Provider value={contextValue}>{children}</LoginContext.Provider>;
}
