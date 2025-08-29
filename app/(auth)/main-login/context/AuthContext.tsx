'use client';

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/app/hooks/useAuth';
import type { AuthState, UserRole } from '@/lib/types/auth';

// Authentication service interface
export interface AuthService {
  // Core auth operations
  getCurrentUser: () => Promise<User | null>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;

  // Role and permission checks
  hasRole: (role: UserRole['type']) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessPath: (path: string) => boolean;

  // User information helpers
  getUserEmail: () => string | null;
  getUserRole: () => UserRole | null;
  getUserDepartment: () => string | null;
  getUserPosition: () => string | null;
}

// Extended auth state with additional computed properties
export interface ExtendedAuthState extends AuthState {
  // Computed properties
  isAdmin: boolean;
  isUser: boolean;
  department: string | null;
  position: string | null;
  email: string | null;

  // Navigation helpers
  defaultPath: string;
  allowedPaths: string[];
  navigationRestricted: boolean;
}

// Main AuthContext state interface
export interface AuthContextState extends ExtendedAuthState {
  // Auth service methods
  authService: AuthService;

  // State management
  refreshAuth: () => Promise<void>;
  clearAuthError: () => void;

  // Event handlers for auth state changes
  onAuthChange: (callback: (state: ExtendedAuthState) => void) => () => void;
}

// Context creation
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Hook to use the auth context
export function useAuthContext(): AuthContextState {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}

// Provider props interface
export interface AuthProviderProps {
  children: ReactNode;
  enableLogging?: boolean;
  refreshInterval?: number;
}

/**
 * AuthProvider component that provides centralized authentication state management
 * for the entire application
 *
 * Features:
 * - Integrates the existing useAuth hook
 * - Provides authentication services through dependency injection
 * - Manages extended auth state with computed properties
 * - Offers role-based permission checking
 * - Handles auth state change notifications
 * - Maintains backward compatibility with existing components
 */
export function AuthProvider({
  children,
  enableLogging = false,
  refreshInterval,
}: AuthProviderProps) {
  // Use the existing auth hook as the foundation
  const auth = useAuth();

  // Compute extended auth properties
  const extendedAuthState: ExtendedAuthState = useMemo(() => {
    const isAdmin = auth.userRole?.type === 'admin' || false;
    const isUser = auth.userRole?.type === 'user' || false;
    const department = auth.userRole?.department || null;
    const position = auth.userRole?.position || null;
    const email = auth.user?.email || null;

    // Navigation properties from user role
    const defaultPath = auth.userRole?.defaultPath || '/admin/analytics';
    const allowedPaths = auth.userRole?.allowedPaths || [];
    const navigationRestricted = auth.userRole?.navigationRestricted || false;

    return {
      ...auth,
      isAdmin,
      isUser,
      department,
      position,
      email,
      defaultPath,
      allowedPaths,
      navigationRestricted,
    };
  }, [auth]);

  // Authentication service implementation
  const authService: AuthService = useMemo(
    () => ({
      getCurrentUser: async () => {
        try {
          const { unifiedAuth } = await import('../utils/unified-auth');
          return await unifiedAuth.getCurrentUser();
        } catch (error) {
          if (enableLogging) {
            console.error('[AuthService] Failed to get current user:', error);
          }
          return null;
        }
      },

      signOut: async () => {
        try {
          const { unifiedAuth } = await import('../utils/unified-auth');
          await unifiedAuth.signOut();
        } catch (error) {
          if (enableLogging) {
            console.error('[AuthService] Failed to sign out:', error);
          }
          throw error;
        }
      },

      refreshSession: async () => {
        try {
          // Supabase handles session refresh automatically
          // We can force a session check to ensure it's valid
          const { createClient } = await import('@/app/utils/supabase/client');
          const supabase = createClient();
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        } catch (error) {
          if (enableLogging) {
            console.error('[AuthService] Failed to refresh session:', error);
          }
          throw error;
        }
      },

      hasRole: (role: UserRole['type']) => {
        return extendedAuthState.userRole?.type === role;
      },

      hasPermission: (permission: string) => {
        // Implement permission checking logic based on user role
        if (extendedAuthState.isAdmin) {
          return true; // Admins have all permissions
        }

        // Add specific permission logic here based on requirements
        switch (permission) {
          case 'ask_database':
            // Use existing permission logic
            if (!extendedAuthState.userRole) return false;
            if (extendedAuthState.position === 'User') {
              const restrictedDepartments = ['Warehouse', 'Pipeline', 'Injection'];
              return !restrictedDepartments.includes(extendedAuthState.department || '');
            }
            return extendedAuthState.userRole.type === 'admin';

          default:
            return false;
        }
      },

      canAccessPath: (path: string) => {
        if (extendedAuthState.isAdmin) {
          return true; // Admins can access all paths
        }

        if (!extendedAuthState.navigationRestricted) {
          return true; // No navigation restrictions
        }

        // Check allowed paths
        return extendedAuthState.allowedPaths.some(allowedPath => {
          if (allowedPath === path) {
            return true; // Exact match
          }

          if (allowedPath.endsWith('/*')) {
            const basePath = allowedPath.slice(0, -2);
            return path.startsWith(basePath);
          }

          return false;
        });
      },

      getUserEmail: () => extendedAuthState.email,
      getUserRole: () => extendedAuthState.userRole,
      getUserDepartment: () => extendedAuthState.department,
      getUserPosition: () => extendedAuthState.position,
    }),
    [extendedAuthState, enableLogging]
  );

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    try {
      await authService.refreshSession();
    } catch (error) {
      if (enableLogging) {
        console.error('[AuthContext] Failed to refresh auth:', error);
      }
    }
  }, [authService, enableLogging]);

  // Clear auth errors (placeholder for future error state management)
  const clearAuthError = useCallback(() => {
    if (enableLogging) {
      console.log('[AuthContext] Clearing auth errors');
    }
    // Future implementation: clear error state
  }, [enableLogging]);

  // Auth change event handler
  const onAuthChange = useCallback(
    (callback: (state: ExtendedAuthState) => void) => {
      // Call immediately with current state
      callback(extendedAuthState);

      // Return cleanup function (placeholder for future event subscription)
      return () => {
        if (enableLogging) {
          console.log('[AuthContext] Cleaning up auth change listener');
        }
      };
    },
    [extendedAuthState, enableLogging]
  );

  // Optional periodic refresh
  React.useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (extendedAuthState.isAuthenticated && !extendedAuthState.loading) {
        refreshAuth();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, extendedAuthState.isAuthenticated, extendedAuthState.loading, refreshAuth]);

  // Memoize context value for performance
  const contextValue: AuthContextState = useMemo(
    () => ({
      ...extendedAuthState,
      authService,
      refreshAuth,
      clearAuthError,
      onAuthChange,
    }),
    [extendedAuthState, authService, refreshAuth, clearAuthError, onAuthChange]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Convenience hooks for specific auth aspects
export function useAuthService(): AuthService {
  const { authService } = useAuthContext();
  return authService;
}

export function useAuthState(): ExtendedAuthState {
  const context = useAuthContext();
  return useMemo(
    () => ({
      user: context.user,
      loading: context.loading,
      isAuthenticated: context.isAuthenticated,
      userRole: context.userRole,
      isAdmin: context.isAdmin,
      isUser: context.isUser,
      department: context.department,
      position: context.position,
      email: context.email,
      defaultPath: context.defaultPath,
      allowedPaths: context.allowedPaths,
      navigationRestricted: context.navigationRestricted,
    }),
    [context]
  );
}

export function useAuthPermissions() {
  const { authService } = useAuthContext();

  return useMemo(
    () => ({
      hasRole: authService.hasRole,
      hasPermission: authService.hasPermission,
      canAccessPath: authService.canAccessPath,
    }),
    [authService]
  );
}

// Types are already exported above with their definitions
