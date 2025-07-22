'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getErrorMessage } from '@/types/core/error';
import { createClient } from '@/app/utils/supabase/client';
import { unifiedAuth } from '@/app/main-login/utils/unified-auth';
import type { User, PostgrestError } from '@supabase/supabase-js';

import { AuthState, UserRole } from '@/types/hooks/auth';

// 基於 department 和 position 的用戶角色映射
const USER_ROUTING_MAP: Record<
  string,
  { defaultPath: string; allowedPaths: string[]; navigationRestricted: boolean }
> = {
  // Admin 用戶 (無限制)
  Injection_Admin: {
    defaultPath: '/admin/injection',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Office_Admin: {
    defaultPath: '/admin/upload',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Pipeline_Admin: {
    defaultPath: '/admin/pipeline',
    allowedPaths: [],
    navigationRestricted: false,
  },
  System_Admin: {
    defaultPath: '/admin/analytics',
    allowedPaths: [],
    navigationRestricted: false,
  },
  Warehouse_Admin: {
    defaultPath: '/stock-transfer',
    allowedPaths: [],
    navigationRestricted: false,
  },

  // User 用戶 (有限制)
  Injection_User: {
    defaultPath: '/print-label',
    allowedPaths: ['/print-label'],
    navigationRestricted: true,
  },
  Office_User: {
    defaultPath: '/admin/upload',
    allowedPaths: ['/admin/upload', '/admin/system'],
    navigationRestricted: true,
  },
  Pipeline_User: {
    defaultPath: '/print-label',
    allowedPaths: ['/print-label'],
    navigationRestricted: true,
  },
  Warehouse_User: {
    defaultPath: '/stock-transfer',
    allowedPaths: ['/stock-transfer'],
    navigationRestricted: true,
  },
};

export const getUserRoleByDepartmentAndPosition = (
  department: string,
  position: string
): UserRole => {
  const key = `${department}_${position}`;
  const config = USER_ROUTING_MAP[key];

  if (!config) {
    // 降級處理：未知組合預設為受限用戶
    console.warn(
      `[getUserRoleByDepartmentAndPosition] Unknown combination: ${department}_${position}`
    );
    return {
      type: 'user',
      department,
      position,
      allowedPaths: ['/admin/analytics'],
      defaultPath: '/admin/analytics',
      navigationRestricted: true,
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

// 添加重試計數器以防止無限循環
const retryCounters = new Map<string, number>();
const MAX_RETRIES = 2;

export const getUserRoleFromDatabase = async (email: string): Promise<UserRole | null> => {
  try {
    const supabase = createClient();

    // 快速測試資料庫連接
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('data_id')
      .select('department, position')
      .eq('email', email)
      .single();

    const queryTime = Date.now() - startTime;

    if (error) {
      if ((error as PostgrestError).code === 'PGRST116') {
        // 用戶不存在，這是正常情況
        return null;
      }

      // 如果查詢時間過長，記錄警告
      if (queryTime > 3000) {
        console.warn(`[getUserRoleFromDatabase] Slow database query (${queryTime}ms) for ${email}`);
      }

      console.error(`[getUserRoleFromDatabase] Database error for ${email}:`, error);
      throw error;
    }

    if (!data?.department || !data?.position) {
      console.warn(`[getUserRoleFromDatabase] Missing department or position for ${email}:`, data);
      return null;
    }

    // 成功查詢後清除重試計數器
    retryCounters.delete(email);

    return getUserRoleByDepartmentAndPosition(data.department, data.position);
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'Database query timeout') {
      console.warn(
        `[getUserRoleFromDatabase] Database query timeout for ${email}, falling back to legacy auth`
      );
    } else {
      console.error('[getUserRoleFromDatabase] Error:', error);
    }

    // 清除重試計數器
    retryCounters.delete(email);
    return null;
  }
};

// 向後兼容的舊版本函數（降級使用）
export const getUserRole = (email: string): UserRole => {
  if (email === 'production@pennineindustries.com') {
    return {
      type: 'user',
      department: 'Pipeline',
      position: 'User',
      allowedPaths: ['/print-label'],
      defaultPath: '/print-label',
      navigationRestricted: true,
    };
  } else if (email === 'warehouse@pennineindustries.com') {
    return {
      type: 'user',
      department: 'Warehouse',
      position: 'User',
      allowedPaths: ['/stock-transfer'],
      defaultPath: '/stock-transfer',
      navigationRestricted: true,
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

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [hasError, setHasError] = useState(false);
  const lastAuthCheckRef = useRef<number>(0);
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

  // 統一的用戶認證和角色設置函數 - 優化版
  const setAuthenticatedUser = useCallback((user: User) => {
    console.log('[useAuth] Setting authenticated user:', user.email);

    // 立即設置認證狀態 - 不等待任何異步操作
    setIsAuthenticated(true);
    setUser(user);
    setLoading(false);

    // 完全異步的角色查詢（使用 setTimeout 確保不阻塞主流程）
    setTimeout(() => {
      const loadUserRole = async () => {
        try {
          console.log('[useAuth] Starting role query for:', user.email);
          const role = (await Promise.race([
            getUserRoleFromDatabase(user.email || ''),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Role fetch timeout')), 2000)
            ), // 進一步減少到 2 秒
          ])) as UserRole | null;

          if (role) {
            console.log('[useAuth] Role loaded from database:', role);
            setUserRole(role);
          } else {
            throw new Error('No role found in database');
          }
        } catch (error) {
          // 降級到舊版本邏輯
          console.log('[useAuth] Using legacy role mapping for:', user.email);
          const legacyRole = getUserRole(user.email || '');
          setUserRole(legacyRole);
        }
      };

      loadUserRole();
    }, 0); // 在下一個事件循環中執行，確保主流程不被阻塞
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

    // 防止多次同時檢查認證
    if (isCheckingAuthRef.current) {
      return;
    }

    // 防止過於頻繁的認證檢查（最少間隔 5 秒）
    const now = Date.now();
    if (now - lastAuthCheckRef.current < 5000) {
      return;
    }

    const checkAuth = async () => {
      isCheckingAuthRef.current = true;
      lastAuthCheckRef.current = now;
      try {
        console.log('[useAuth] Initial auth check');

        // 使用統一認證系統進行檢查
        const user = await unifiedAuth.getCurrentUser();

        if (user) {
          setAuthenticatedUser(user);
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
  }, [hasError, supabase]);

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
      return { allowed: false, type: 'deny' };
    }

    // Admin 用戶無限制
    if (userRole.type === 'admin') {
      return { allowed: true, type: 'full' };
    }

    // User 用戶檢查允許的頁面
    if (userRole.allowedPaths.length === 0) {
      return { allowed: false, type: 'deny' };
    }

    // 檢查精確匹配
    if (userRole.allowedPaths.includes(pagePath)) {
      return { allowed: true, type: 'full' };
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
    };
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
