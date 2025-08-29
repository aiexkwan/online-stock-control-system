'use client';

import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { unifiedAuth } from '@/app/(auth)/main-login/utils/unified-auth';

interface LoginFormData {
  email: string;
  password: string;
}

interface SubmissionState {
  loading: boolean;
  error: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: User | null;
}

export interface AuthSubmissionState {
  loading: boolean;
  error: string;
}

export interface AuthSubmissionActions {
  performLogin: (formData: LoginFormData) => Promise<LoginResult>;
  clearError: () => void;
}

export interface UseAuthSubmissionReturn extends AuthSubmissionState, AuthSubmissionActions {}

/**
 * Specialized hook for handling authentication form submission
 *
 * Responsibilities:
 * - Execute login via unifiedAuth
 * - Handle parallel session validation with timeout
 * - Manage loading and error states during submission
 * - Provide consistent login result interface
 */
export function useAuthSubmission(): UseAuthSubmissionReturn {
  const [state, setState] = useState<SubmissionState>({
    loading: false,
    error: '',
  });

  const performLogin = useCallback(async (formData: LoginFormData): Promise<LoginResult> => {
    // Set loading state
    setState({ loading: true, error: '' });

    try {
      // Perform login
      await unifiedAuth.signIn(formData.email, formData.password);

      // 🚀 優化後的並行會話驗證：並行檢查多個會話來源，提升響應速度
      const sessionResult = await Promise.race([
        // 並行會話檢查邏輯
        (async () => {
          // 並行執行多種會話檢查方法
          const { createClient } = await import('@/app/utils/supabase/client');
          const supabase = createClient();

          const sessionChecks = await Promise.allSettled([
            // 方法1：通過 unifiedAuth 獲取用戶
            unifiedAuth.getCurrentUser(),
            // 方法2：直接從 supabase 獲取 session
            supabase.auth
              .getSession()
              .then(({ data, error }) => (error ? null : data.session?.user)),
            // 方法3：獲取當前用戶（備用檢查）
            supabase.auth.getUser().then(({ data, error }) => (error ? null : data.user)),
          ]);

          // 找到第一個成功的會話檢查結果
          for (const result of sessionChecks) {
            if (result.status === 'fulfilled' && result.value) {
              return { success: true, user: result.value };
            }
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
          console.warn(
            '[useAuthSubmission] Session validation timed out after 1s, proceeding anyway'
          );
        } else {
          console.warn('[useAuthSubmission] Session validation failed, but proceeding with login');
        }
      }

      // Login successful
      setState({ loading: false, error: '' });

      return {
        success: true,
        user: 'user' in sessionResult ? sessionResult.user : null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      setState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: '' }));
  }, []);

  return {
    // State
    loading: state.loading,
    error: state.error,

    // Actions
    performLogin,
    clearError,
  };
}
