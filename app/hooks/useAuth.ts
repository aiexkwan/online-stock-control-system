import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
}

export interface UserRole {
  type: 'admin' | 'user';
  department: string;
  position: string;
  allowedPaths: string[];
  defaultPath: string;
  navigationRestricted: boolean;
}

// 基於 department 和 position 的用戶角色映射
const USER_ROUTING_MAP: Record<string, { defaultPath: string; allowedPaths: string[]; navigationRestricted: boolean }> = {
  // Admin 用戶 (無限制)
  'Injection_Admin': {
    defaultPath: '/admin/injection',
    allowedPaths: [],
    navigationRestricted: false
  },
  'Office_Admin': {
    defaultPath: '/admin/upload',
    allowedPaths: [],
    navigationRestricted: false
  },
  'Pipeline_Admin': {
    defaultPath: '/admin/pipeline',
    allowedPaths: [],
    navigationRestricted: false
  },
  'System_Admin': {
    defaultPath: '/admin/analysis',
    allowedPaths: [],
    navigationRestricted: false
  },
  'Warehouse_Admin': {
    defaultPath: '/stock-transfer',
    allowedPaths: [],
    navigationRestricted: false
  },
  
  // User 用戶 (有限制)
  'Injection_User': {
    defaultPath: '/print-label',
    allowedPaths: ['/print-label'],
    navigationRestricted: true
  },
  'Office_User': {
    defaultPath: '/admin/upload',
    allowedPaths: ['/admin/upload', '/admin/system'],
    navigationRestricted: true
  },
  'Pipeline_User': {
    defaultPath: '/print-label',
    allowedPaths: ['/print-label'],
    navigationRestricted: true
  },
  'Warehouse_User': {
    defaultPath: '/stock-transfer',
    allowedPaths: ['/stock-transfer'],
    navigationRestricted: true
  }
};

export const getUserRoleByDepartmentAndPosition = (department: string, position: string): UserRole => {
  const key = `${department}_${position}`;
  const config = USER_ROUTING_MAP[key];
  
  if (!config) {
    // 降級處理：未知組合預設為受限用戶
    console.warn(`[getUserRoleByDepartmentAndPosition] Unknown combination: ${department}_${position}`);
    return {
      type: 'user',
      department,
      position,
      allowedPaths: ['/admin/upload'],
      defaultPath: '/admin/upload',
      navigationRestricted: true
    };
  }
  
  return {
    type: position === 'Admin' ? 'admin' : 'user',
    department,
    position,
    allowedPaths: config.allowedPaths,
    defaultPath: config.defaultPath,
    navigationRestricted: config.navigationRestricted
  };
};

// 從資料庫獲取用戶角色
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
      if (error.code === 'PGRST116') {
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
    
    return getUserRoleByDepartmentAndPosition(data.department, data.position);
  } catch (error: any) {
    if (error.message === 'Database query timeout') {
      console.warn(`[getUserRoleFromDatabase] Database query timeout for ${email}, falling back to legacy auth`);
    } else {
      console.error('[getUserRoleFromDatabase] Error:', error);
    }
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
      navigationRestricted: true
    };
  } else if (email === 'warehouse@pennineindustries.com') {
    return {
      type: 'user',
      department: 'Warehouse',
      position: 'User',
      allowedPaths: ['/stock-transfer'],
      defaultPath: '/stock-transfer',
      navigationRestricted: true
    };
  } else {
    return {
      type: 'admin',
      department: 'System',
      position: 'Admin',
      allowedPaths: [],
      defaultPath: '/admin/analysis',
      navigationRestricted: false
    };
  }
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setIsAuthenticated(true);
          setUser(user);
          
          // 嘗試從資料庫獲取用戶角色
          try {
            const role = await Promise.race([
              getUserRoleFromDatabase(user.email || ''),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Role fetch timeout')), 10000)) // 增加到 10 秒
            ]) as UserRole | null;
            
            if (role) {
              setUserRole(role);
            } else {
              throw new Error('No role found in database');
            }
          } catch (error) {
            // 降級到舊版本邏輯，但不顯示警告（這是正常的降級行為）
            const legacyRole = getUserRole(user.email || '');
            setUserRole(legacyRole);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('[useAuth] Error checking authentication:', error);
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);
          
          // 嘗試從資料庫獲取用戶角色
          try {
            const role = await Promise.race([
              getUserRoleFromDatabase(session.user.email || ''),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Role fetch timeout')), 10000)) // 增加到 10 秒
            ]) as UserRole | null;
            
            if (role) {
              setUserRole(role);
            } else {
              throw new Error('No role found in database');
            }
          } catch (error) {
            // 降級到舊版本邏輯，但不顯示警告（這是正常的降級行為）
            const legacyRole = getUserRole(session.user.email || '');
            setUserRole(legacyRole);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.email) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[getCurrentUserClockNumberAsync] No authenticated user or email found');
      return null;
    }
    
    // 2. 通過 email 查詢 data_id 表獲取 clock number (id)
    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, email')
      .eq('email', user.email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`[getCurrentUserClockNumberAsync] No user found for email: ${user.email}`);
        return null;
      }
      throw error;
    }
    
    if (data?.id) {
      const clockNumber = data.id.toString();
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[getCurrentUserClockNumberAsync] Found clock number: ${clockNumber} for email: ${user.email}`);
      return clockNumber;
    }
    
    return null;
  } catch (error: any) {
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
      type: isAllowed ? 'full' : 'deny' 
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