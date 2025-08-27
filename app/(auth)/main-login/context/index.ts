/**
 * Centralized export file for all authentication contexts and hooks
 * 
 * This file provides a single entry point for importing authentication-related
 * functionality, implementing the dependency injection pattern throughout the
 * application.
 */

// Main AuthContext exports
export {
  AuthProvider,
  useAuthContext,
  useAuthService,
  useAuthState,
  useAuthPermissions,
  type AuthService,
  type ExtendedAuthState,
  type AuthContextState,
  type AuthProviderProps,
} from './AuthContext';

// LoginContext exports (for backward compatibility)
export {
  LoginProvider,
  useLoginContext,
  type LoginContextState,
  type LoginProviderProps,
  type LoginFormData,
  type RegisterFormData,
  type LoginUIState,
  type LoginResult,
} from './LoginContext';

// Persistence hook
export { useLoginPersistence, type LoginPersistenceState } from './useLoginPersistence';

// Re-export commonly used types for convenience
export type { AuthState, UserRole } from '@/lib/types/auth';
export type { User } from '@supabase/supabase-js';

/**
 * Unified authentication hook that replaces direct useAuth imports
 * 
 * This hook provides a clean interface that abstracts away the underlying
 * implementation details, making it easier to swap out auth providers
 * or modify authentication logic without changing component code.
 * 
 * @deprecated Use useAuthState() instead for new code
 */
export function useAuth() {
  const { useAuthState } = require('./AuthContext');
  return useAuthState();
}

/**
 * Hook for accessing authentication service methods
 * 
 * Use this when you need to perform auth operations like signOut,
 * check permissions, or access user details.
 */
export function useAuthActions() {
  const { useAuthService } = require('./AuthContext');
  return useAuthService();
}

/**
 * Hook for permission-based access control
 * 
 * Use this when you need to check user permissions or roles
 * for conditional rendering or access control.
 */
export function usePermissions() {
  const { useAuthPermissions } = require('./AuthContext');
  return useAuthPermissions();
}