import { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
}

export interface UserRole {
  type: 'production' | 'warehouse' | 'admin';
  allowedPaths: string[];
  defaultPath: string;
}

export const getUserRole = (email: string): UserRole => {
  if (email === 'production@pennineindustries.com') {
    return {
      type: 'production',
      allowedPaths: ['/print-label', '/home'],
      defaultPath: '/print-label'
    };
  } else if (email === 'warehouse@pennineindustries.com') {
    return {
      type: 'warehouse', 
      allowedPaths: ['/stock-transfer', '/home'],
      defaultPath: '/stock-transfer'
    };
  } else {
    return {
      type: 'admin',
      allowedPaths: [], // No restrictions for admin
      defaultPath: '/admin'
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
          // Set user role based on email
          const role = getUserRole(user.email || '');
          setUserRole(role);
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
          const role = getUserRole(session.user.email || '');
          setUserRole(role);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

// 獲取當前用戶的 clock number
export function getCurrentUserClockNumber(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 從 localStorage 獲取 clock number
  const clockNumber = localStorage.getItem('loggedInUserClockNumber');
  return clockNumber;
}

export const useAskDatabasePermission = () => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.email) {
        setHasPermission(false);
        return;
      }

      // 檢查是否為允許的用戶
      const allowedUsers = [
        'gtatlock@pennineindustries.com',
        'akwan@pennineindustries.com'
      ];

      setHasPermission(allowedUsers.includes(user.email));
    };

    checkPermission();
  }, [user]);

  return hasPermission;
}; 