'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getErrorMessage } from '@/lib/types/error-handling';
import { createClient } from '@/app/utils/supabase/client';
import { unifiedAuth } from '@/app/(auth)/main-login/utils/unified-auth';
import type { User, PostgrestError } from '@supabase/supabase-js';

import { AuthState, UserRole } from '@/lib/types/auth';

// 基於 department 和 position 的用戶角色映射
// 所有用戶統一導向 /admin/analytics，並且可以訪問所有頁面
const USER_ROUTING_MAP: Record<
  string,
  { defaultPath: string; allowedPaths: string[]; navigationRestricted: boolean }
> = {
  // Admin 用戶 (無限制)
  Injection_Admin: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Office_Admin: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Pipeline_Admin: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
  System_Admin: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Warehouse_Admin: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },

  // User 用戶 (現在也無限制)
  Injection_User: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Office_User: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Pipeline_User: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Warehouse_User: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
};

export const getUserRoleByDepartmentAndPosition = (
  department: string,
  position: string
): UserRole => {
  const key = `${department}_${position}`;
  const config = USER_ROUTING_MAP[key];

  if (!config) {
    // 降級處理：未知組合也統一導向 /admin/analytics 且無限制
    console.warn(
      `[getUserRoleByDepartmentAndPosition] Unknown combination: ${department}_${position}`
    );
    return {
      type: 'user',
      department,
      position,
      allowedPaths: [],
      defaultPath: '/admin/analytics',
      navigationRestricted: false,
    };
  }

  return {
    type: position === 'Admin' ? 'admin' : 'user',
    department,
    position,
    allowedPaths: config.allowedPaths,
    defaultPath: config.defaultPath,
    navigationRestricted: config.navigationRestricted,
  };
};

// Simplified auth - removed retry counters

export const getUserRoleFromDatabase = async (email: string): Promise<UserRole | null> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('data_id')
      .select('department, position')
      .eq('email', email)
      .single();

    if (error) {
      if ((error as PostgrestError).code === 'PGRST116') {
        // 用戶不存在，這是正常情況
        return null;
      }
      console.error(`[getUserRoleFromDatabase] Database error for ${email}:`, error);
      return null;
    }

    if (!data?.department || !data?.position) {
      console.warn(`[getUserRoleFromDatabase] Missing department or position for ${email}:`, data);
      return null;
    }

    return getUserRoleByDepartmentAndPosition(data.department, data.position);
  } catch (error: unknown) {
    console.error('[getUserRoleFromDatabase] Error:', error);
    return null;
  }
};

// 向後兼容的舊版本函數（降級使用）
// 所有用戶統一導向 /admin/analytics 且無限制
export const getUserRole = (email: string): UserRole => {
  if (email === 'production@pennineindustries.com') {
    return {
      type: 'user',
      department: 'Pipeline',
      position: 'User',
      allowedPaths: [],
      defaultPath: '/admin/analytics',
      navigationRestricted: false,
    };
  } else if (email === 'warehouse@pennineindustries.com') {
    return {
      type: 'user',
      department: 'Warehouse',
      position: 'User',
      allowedPaths: [],
      defaultPath: '/admin/analytics',
      navigationRestricted: false,
    };
  } else {
    return {
      type: 'admin',
      department: 'System',
      position: 'Admin',
      allowedPaths: [],
      defaultPath: '/admin/analytics',
      navigationRestricted: false,
    };
  }
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
      console.error('[useAuth] Failed to create Supabase client:', error);
      setHasError(true);
      return null;
    }
  }, []);

  // Simplified user authentication and role setting function
  const setAuthenticatedUser = useCallback(async (user: User) => {
    console.log('[useAuth] Setting authenticated user:', user.email);

    // Set authenticated state immediately
    setIsAuthenticated(true);
    setUser(user);
    setLoading(false);

    // Load user role directly without complex timeout/retry logic
    try {
      const role = await getUserRoleFromDatabase(user.email || '');
      if (role) {
        console.log('[useAuth] Role loaded from database:', role);
        setUserRole(role);
      } else {
        // Fallback to legacy role mapping
        console.log('[useAuth] Using legacy role mapping for:', user.email);
        const legacyRole = getUserRole(user.email || '');
        setUserRole(legacyRole);
      }
    } catch (error) {
      console.error('[useAuth] Error loading user role:', error);
      // Fallback to legacy role mapping
      const legacyRole = getUserRole(user.email || '');
      setUserRole(legacyRole);
    }
  }, []);

  // 統一的登出處理函數
  const clearAuthState = useCallback(() => {
    console.log('[useAuth] Clearing auth state');
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
      console.log('[useAuth] Skipping auth check for public route:', window.location.pathname);
      setLoading(false);
      return;
    }

    // Simplified auth check - trust Supabase's built-in session management
    if (isCheckingAuthRef.current) {
      return;
    }

    const checkAuth = async () => {
      isCheckingAuthRef.current = true;
      try {
        console.log('[useAuth] Initial auth check with parallel verification');

        // 並行會話檢查：同時使用多種方法驗證用戶身份，提升響應速度
        const authChecks = await Promise.allSettled([
          // 方法1：統一認證系統檢查
          unifiedAuth.getCurrentUser(),
          // 方法2：直接從 Supabase 客戶端獲取會話
          supabase
            ? supabase.auth
                .getSession()
                .then(({ data, error }) => (error ? null : data.session?.user))
            : Promise.resolve(null),
          // 方法3：獲取當前用戶狀態
          supabase
            ? supabase.auth.getUser().then(({ data, error }) => (error ? null : data.user))
            : Promise.resolve(null),
        ]);

        // 找到第一個成功的認證結果
        let authenticatedUser = null;
        for (const result of authChecks) {
          if (result.status === 'fulfilled' && result.value) {
            authenticatedUser = result.value;
            break;
          }
        }

        if (authenticatedUser) {
          await setAuthenticatedUser(authenticatedUser);
        } else {
          clearAuthState();
        }
      } catch (error) {
        console.error('[useAuth] Error checking authentication:', error);
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
        console.log('[useAuth] Auth state change:', event, !!session?.user);

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

export function useCurrentUserId(): string | null {
  const { user } = useAuth();

  // Try to get clock_number from user metadata first
  if (user?.user_metadata?.clock_number) {
    return user.user_metadata.clock_number.toString();
  }

  // Fallback to user ID
  if (user?.id) {
    return user.id;
  }

  return null;
}

// 獲取當前用戶的 clock number（同步版本，僅用於向後兼容）
export function getCurrentUserClockNumber(): string | null {
  // 不再使用 localStorage，返回 null 讓調用者使用異步版本
  return null;
}

// 異步獲取當前用戶的 clock number（通過 email 查詢 data_id 表）
export async function getCurrentUserClockNumberAsync(): Promise<string | null> {
  try {
    const supabase = createClient();

    // 1. 獲取當前用戶
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      process.env.NODE_ENV !== 'production' &&
        console.warn('[getCurrentUserClockNumberAsync] No authenticated user or email found');
      return null;
    }

    // 2. 通過 email 查詢 data_id 表獲取 clock number (id)
    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, email')
      .eq('email', user.email)
      .single();

    if (error) {
      if ((error as PostgrestError).code === 'PGRST116') {
        process.env.NODE_ENV !== 'production' &&
          console.warn(`[getCurrentUserClockNumberAsync] No user found for email: ${user.email}`);
        return null;
      }
      throw error;
    }

    if (data?.id) {
      const clockNumber = data.id.toString();
      process.env.NODE_ENV !== 'production' &&
        console.log(
          `[getCurrentUserClockNumberAsync] Found clock number: ${clockNumber} for email: ${user.email}`
        );
      return clockNumber;
    }

    return null;
  } catch (error: unknown) {
    console.error('[getCurrentUserClockNumberAsync] Error getting clock number:', error);
    return null;
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
