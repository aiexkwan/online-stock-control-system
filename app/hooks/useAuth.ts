'use client';

import { unifiedAuth } from '@/app/(auth)/main-login/utils/unified-auth';
import { createClient } from '@/app/utils/supabase/client';
import type { PostgrestError, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuthState, UserRole } from '@/lib/types/auth';
import { createSecureLogger } from '@/lib/security/enhanced-logger-sanitizer';

// 建立安全日誌記錄器
const secureLogger = createSecureLogger('useAuth');

// 遵循 YAGNI 原則 - 簡化角色映射，只保留實際使用的功能
export const getUserRoleByDepartmentAndPosition = (
  department: string,
  position: string
): UserRole => {
  return {
    type: position === 'Admin' ? 'admin' : 'user',
    department,
    position,
    allowedPaths: [],
    defaultPath: '/admin/analytics',
    navigationRestricted: false,
  };
};

// Simplified auth - use email-based role mapping directly

// 基於電郵的角色映射 - 遵循 YAGNI 原則簡化
export const getUserRole = (email: string): UserRole => {
  const department =
    email === 'production@pennineindustries.com'
      ? 'Pipeline'
      : email === 'warehouse@pennineindustries.com'
        ? 'Warehouse'
        : email === 'pipeline@pennineindustries.com'
          ? 'Pipeline'
          : 'System';

  const position =
    email.includes('@pennineindustries.com') &&
    (email.includes('production') || email.includes('warehouse'))
      ? 'User'
      : 'Admin';

  return {
    type: position === 'Admin' ? 'admin' : 'user',
    department,
    position,
    allowedPaths: [],
    defaultPath: '/admin/analytics',
    navigationRestricted: false,
  };
};

// 定義公開路由（不需要認證檢查） - Memoized for performance
const PUBLIC_ROUTES = Object.freeze([
  '/main-login',
  '/main-login/register',
  '/main-login/reset',
  '/main-login/simple',
  '/main-login/change',
] as const);

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [hasError, setHasError] = useState(false);
  const isCheckingAuthRef = useRef<boolean>(false);

  const supabase = useMemo(() => {
    // 只在客戶端創建 Supabase client
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return createClient();
    } catch (error) {
      secureLogger.error(error, '[useAuth] Failed to create Supabase client');
      setHasError(true);
      return null;
    }
  }, []);

  // Simplified user authentication and role setting function
  const setAuthenticatedUser = useCallback(async (user: User) => {
    secureLogger.info({ userEmail: user.email }, '[useAuth] Setting authenticated user');

    // Set authenticated state immediately
    setIsAuthenticated(true);
    setUser(user);
    setLoading(false);

    // Use email-based role mapping directly
    const role = getUserRole(user.email || '');
    setUserRole(role);
  }, []);

  // 統一的登出處理函數
  const clearAuthState = useCallback(() => {
    secureLogger.info({}, '[useAuth] Clearing auth state');
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
    setLoading(false);
    isCheckingAuthRef.current = false;
  }, []);

  useEffect(() => {
    // Skip auth operations if supabase client failed to initialize
    if (hasError || !supabase) {
      setLoading(false);
      return;
    }

    // 檢查是否在公開路由 - 如果是，跳過認證檢查
    if (
      typeof window !== 'undefined' &&
      PUBLIC_ROUTES.includes(window.location.pathname as (typeof PUBLIC_ROUTES)[number])
    ) {
      secureLogger.info(
        { pathname: window.location.pathname },
        '[useAuth] Skipping auth check for public route'
      );
      // Clear auth state for public routes to prevent stale data
      clearAuthState();
      return;
    }

    // Simplified auth check - trust Supabase's built-in session management
    if (isCheckingAuthRef.current) {
      return;
    }

    const checkAuth = async () => {
      isCheckingAuthRef.current = true;
      try {
        secureLogger.info({}, '[useAuth] Initial auth check with parallel verification');

        // Simplified single auth check to reduce API calls
        let authenticatedUser = null;

        try {
          // Try unifiedAuth first as it's most reliable
          authenticatedUser = await unifiedAuth.getCurrentUser();
        } catch (error) {
          secureLogger.warn(error, '[useAuth] UnifiedAuth failed, trying Supabase session');

          // Fallback to Supabase session check only if needed
          if (supabase) {
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (!sessionError && data.session?.user) {
              authenticatedUser = data.session.user;
            }
          }
        }

        if (authenticatedUser) {
          await setAuthenticatedUser(authenticatedUser);
        } else {
          clearAuthState();
        }
      } catch (error) {
        secureLogger.error(error, '[useAuth] Error checking authentication');
        clearAuthState();
      } finally {
        isCheckingAuthRef.current = false;
      }
    };

    checkAuth();

    // 只在客戶端設置認證狀態監聽
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        secureLogger.info({ event, hasUser: !!session?.user }, '[useAuth] Auth state change');

        if (event === 'SIGNED_IN' && session?.user) {
          setAuthenticatedUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          clearAuthState();
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [hasError, supabase, setAuthenticatedUser, clearAuthState]);

  return {
    user,
    loading,
    isAuthenticated,
    userRole,
  };
}

/**
 * @deprecated 請使用 getUserId().userId 替代
 */
export function useCurrentUserId(): string | null {
  const { user } = useAuth();

  if (!user) return null;

  // 直接從 raw_user_meta_data 取得 user_id（這是 Supabase 的標準存儲位置）
  const userWithRawMeta = user as User & { raw_user_meta_data?: Record<string, unknown> };
  const userId = userWithRawMeta?.raw_user_meta_data?.user_id;

  return userId ? String(userId) : null;
}

/**
 * 驗證用戶ID是否存在於data_id表中
 * @deprecated 請使用 getUserId().verifyUserId 替代
 */
export async function validateUserIdInDatabase(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('data_id')
      .select('id')
      .eq('id', parseInt(userId))
      .single();

    if (error && (error as PostgrestError).code === 'PGRST116') {
      // 用戶不存在
      return false;
    }

    if (error) {
      secureLogger.error(error, '[validateUserIdInDatabase] Database error');
      return false;
    }

    return !!data?.id;
  } catch (error: unknown) {
    secureLogger.error(error, '[validateUserIdInDatabase] Error');
    return false;
  }
}

// 頁面權限檢查 hook
export const usePagePermission = (pagePath: string) => {
  const { userRole } = useAuth();

  return useMemo(() => {
    if (!userRole) {
      return { allowed: false, type: 'deny' } as const;
    }

    // Admin 用戶無限制
    if (userRole.type === 'admin') {
      return { allowed: true, type: 'full' } as const;
    }

    // User 用戶檢查允許的頁面
    if (userRole.allowedPaths.length === 0) {
      return { allowed: false, type: 'deny' } as const;
    }

    // 檢查精確匹配
    if (userRole.allowedPaths.includes(pagePath)) {
      return { allowed: true, type: 'full' } as const;
    }

    // 檢查通配符匹配 (例如 /admin/* 匹配 /admin/anything)
    const isAllowed = userRole.allowedPaths.some(allowedPath => {
      if (allowedPath.endsWith('/*')) {
        const basePath = allowedPath.slice(0, -2);
        return pagePath.startsWith(basePath);
      }
      return false;
    });

    return {
      allowed: isAllowed,
      type: isAllowed ? 'full' : 'deny',
    } as const;
  }, [userRole, pagePath]);
};

export const useAskDatabasePermission = () => {
  const { userRole } = useAuth();

  // 基於新的權限系統
  return useMemo(() => {
    if (!userRole) return false;

    // User 角色的特定限制
    if (userRole.position === 'User') {
      const restrictedDepartments = ['Warehouse', 'Pipeline', 'Injection'];
      return !restrictedDepartments.includes(userRole.department);
    }

    // Admin 角色通常有權限
    return userRole.type === 'admin';
  }, [userRole]);
};
