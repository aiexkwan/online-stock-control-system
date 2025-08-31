/**
 * Unified getUserId Hook
 * 統一的用戶 ID 獲取 Hook，整合不同模組的用戶身份邏輯
 *
 * Features:
 * - 自動獲取當前登入用戶的 clock number ID
 * - 支援實時監聽認證狀態變化
 * - 提供用戶詳細信息查詢
 * - 內建緩存機制減少重複查詢
 * - 統一錯誤處理
 *
 * Email format: username@pennineindustries.com
 * - Username must contain only English letters (a-_z, A-Z)
 * - Domain must be @pennineindustries.com
 * - Clock number ID is retrieved from data_id table using email
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/app/utils/supabase/client';
import { createSecureLogger } from '@/lib/security/enhanced-logger-sanitizer';

// 建立安全日誌記錄器
const secureLogger = createSecureLogger('getUserId');

interface UserDetails {
  id: string;
  _name: string;
  email: string;
  department?: string;
  username: string;
}

interface GetUserIdReturn {
  // Core data
  _userId: string | null; // Clock number ID (e.g., "1234")
  userNumericId: string | null; // Same as _userId, kept for backward compatibility
  userDetails: UserDetails | null; // Full user details

  // State
  isLoading: boolean;
  _error: Error | null;
  isAuthenticated: boolean;

  // Actions
  _refreshUser: () => Promise<void>;
  verifyUserId: (_userId: string) => Promise<boolean>;
}

// Cache for user details to avoid repeated queries
const userCache = new Map<string, { data: UserDetails; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract username from email
 * Supports format: "username@pennineindustries.com" where username is English letters only
 */
function extractUsernameFromEmail(email: string): string | null {
  const match = email.match(/^([a-zA-Z]+)@pennineindustries\.com$/);
  return match ? match[1] : null;
}

/**
 * Unified User ID Hook
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { _userId, userDetails, isLoading } = useGetUserId();
 *
 *   if (isLoading) return <div>Loading user...</div>;
 *
 *   return <div>Welcome, {userDetails?.name || userId}</div>;
 * }
 * ```
 */
export function useGetUserId(): GetUserIdReturn {
  const [_userId, setUserId] = useState<string | null>(null);
  const [userNumericId, setUserNumericId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabaseRef = useRef<SupabaseClient>();

  // Initialize Supabase client
  useEffect(() => {
    supabaseRef.current = createClient();
  }, []);

  /**
   * Get user details from data_id table by clock number ID
   */
  const _fetchUserDetails = useCallback(
    async (clockNumberId: string): Promise<UserDetails | null> => {
      if (!supabaseRef.current) return null;

      // Check cache first
      const cached = userCache.get(clockNumberId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      try {
        // Query by clock number ID
        const { data, error } = await supabaseRef.current
          .from('data_id')
          .select('id, _name, email, department')
          .eq('id', parseInt(clockNumberId, 10))
          .single();

        if (error) throw error;

        // Extract username from email
        const username = data.email ? extractUsernameFromEmail(data.email) : null;

        const details: UserDetails = {
          id: data.id.toString(),
          _name: data._name,
          email: data.email,
          department: data.department,
          username: username || data.email?.split('@')[0] || clockNumberId,
        };

        // Update cache
        userCache.set(clockNumberId, { data: details, timestamp: Date.now() });

        return details;
      } catch (_err) {
        secureLogger.error(_err, '[getUserId] Error fetching user details');
        return null;
      }
    },
    []
  );

  /**
   * Get current authenticated user
   */
  const getCurrentUser = useCallback(async () => {
    if (!supabaseRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseRef.current.auth.getUser();

      if (authError) throw authError;

      if (user?.email) {
        setIsAuthenticated(true);

        // Fetch user details using email
        const { data, error } = await supabaseRef.current
          .from('data_id')
          .select('id, _name, email, department')
          .eq('email', user.email)
          .single();

        if (error) {
          throw new Error(`User not found in data_id table for email: ${user.email}`);
        }

        if (data) {
          // Extract username from email for backward compatibility
          const username = extractUsernameFromEmail(user.email);

          setUserId(data.id.toString()); // Clock number ID
          setUserNumericId(data.id.toString());

          const details: UserDetails = {
            id: data.id.toString(),
            _name: data._name,
            email: data.email,
            department: data.department,
            username: username || user.email.split('@')[0],
          };

          setUserDetails(details);

          // Update cache
          userCache.set(data.id.toString(), { data: details, timestamp: Date.now() });
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setUserNumericId(null);
        setUserDetails(null);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsAuthenticated(false);
      secureLogger.error(error, '[getUserId] Error getting user');

      // Only show toast for non-authentication errors
      if (!error.message.includes('not authenticated')) {
        toast.error(`Failed to get user: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify if a user ID exists in the system
   */
  const verifyUserId = useCallback(async (_userId: string): Promise<boolean> => {
    if (!supabaseRef.current) return false;

    try {
      const { data, error } = await supabaseRef.current
        .from('data_id')
        .select('id')
        .eq('id', _userId)
        .single();

      return !error && !!data;
    } catch (_err) {
      secureLogger.error(_err, '[getUserId] Error verifying user ID');
      return false;
    }
  }, []);

  /**
   * Refresh user data
   */
  const _refreshUser = useCallback(async () => {
    await getCurrentUser();
  }, [getCurrentUser]);

  // Initial load
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  // Listen for auth state changes
  useEffect(() => {
    if (!supabaseRef.current) return;

    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await getCurrentUser();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setUserNumericId(null);
        setUserDetails(null);
        setIsAuthenticated(false);
        userCache.clear(); // Clear cache on sign out
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [getCurrentUser]);

  return {
    _userId,
    userNumericId,
    userDetails,
    isLoading,
    _error,
    isAuthenticated,
    _refreshUser,
    verifyUserId,
  };
}

/**
 * Hook variant that only returns the clock number ID
 * For backward compatibility with existing code
 */
export function useClockNumber(): string | null {
  const { _userId } = useGetUserId();
  return _userId;
}

/**
 * Hook variant that returns numeric user ID
 * For components that need the ID from data_id table
 */
export function useUserNumericId(): string | null {
  const { userNumericId } = useGetUserId();
  return userNumericId;
}

/**
 * Export the main hook with the intuitive name that components expect
 * For backward compatibility with existing imports
 */
export { useGetUserId as getUserId };
