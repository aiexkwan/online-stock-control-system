'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '../../lib/types/auth';

// 基於電郵的角色映射 - 遵循 YAGNI 原則簡化
const getUserRole = (email: string): UserRole => {
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
