'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRoleFromDatabase, getUserRole } from './useAuth';

export interface AuthRedirectActions {
  getUserRedirectPath: (email: string) => Promise<string>;
  redirectToUserPage: (email: string) => Promise<string>;
}

export interface UseAuthRedirectReturn extends AuthRedirectActions {}

/**
 * Specialized hook for handling post-authentication redirects
 *
 * Responsibilities:
 * - Determine user redirect path based on role from database
 * - Fallback to legacy role mapping when database lookup fails
 * - Execute navigation to appropriate user dashboard
 * - Provide consistent redirect path resolution
 */
export function useAuthRedirect(): UseAuthRedirectReturn {
  const router = useRouter();

  // Get user redirect path based on role
  const getUserRedirectPath = useCallback(async (email: string): Promise<string> => {
    try {
      // Try to get role from database first
      const dbRole = await getUserRoleFromDatabase(email);
      if (dbRole) {
        return dbRole.defaultPath;
      }
    } catch (error) {
      console.warn('[useAuthRedirect] Failed to get role from database, using fallback', error);
    }

    // Fallback to legacy role mapping
    const legacyRole = getUserRole(email);
    return legacyRole.defaultPath;
  }, []);

  // Redirect to user-specific page after authentication
  const redirectToUserPage = useCallback(
    async (email: string): Promise<string> => {
      const redirectPath = await getUserRedirectPath(email);

      // Execute the redirect
      router.push(redirectPath);

      return redirectPath;
    },
    [router, getUserRedirectPath]
  );

  return {
    getUserRedirectPath,
    redirectToUserPage,
  };
}
