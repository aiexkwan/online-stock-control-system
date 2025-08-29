'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from './useAuth';

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
    // Use email-based role mapping directly
    const role = getUserRole(email);
    return role.defaultPath;
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
