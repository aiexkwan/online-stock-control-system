/**
 * Unified useUserId Hook
 * 統一的用戶 ID 獲取 Hook，整合不同模組的用戶身份邏輯
 * 
 * Features:
 * - 自動獲取當前登入用戶的 clock number
 * - 支援實時監聽認證狀態變化
 * - 提供用戶詳細信息查詢
 * - 內建緩存機制減少重複查詢
 * - 統一錯誤處理
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';

interface UserDetails {
  id: number;
  name: string;
  email: string;
  department?: string;
  clockNumber: string;
}

interface UseUserIdReturn {
  // Core data
  userId: string | null;           // Clock number (e.g., "1234")
  userNumericId: number | null;    // Numeric ID from data_id table
  userDetails: UserDetails | null;  // Full user details
  
  // State
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  
  // Actions
  refreshUser: () => Promise<void>;
  verifyUserId: (userId: number) => Promise<boolean>;
}

// Cache for user details to avoid repeated queries
const userCache = new Map<string, { data: UserDetails; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract clock number from email
 * Supports formats: "1234@pennine.com", "1234@example.com"
 */
function extractClockNumberFromEmail(email: string): string | null {
  const match = email.match(/^(\d+)@/);
  return match ? match[1] : null;
}

/**
 * Unified User ID Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { userId, userDetails, isLoading } = useUserId();
 *   
 *   if (isLoading) return <div>Loading user...</div>;
 *   
 *   return <div>Welcome, {userDetails?.name || userId}</div>;
 * }
 * ```
 */
export function useUserId(): UseUserIdReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [userNumericId, setUserNumericId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const supabaseRef = useRef<SupabaseClient>();
  
  // Initialize Supabase client
  useEffect(() => {
    supabaseRef.current = createClient();
  }, []);
  
  /**
   * Get user details from data_id table
   */
  const fetchUserDetails = useCallback(async (clockNumber: string): Promise<UserDetails | null> => {
    if (!supabaseRef.current) return null;
    
    // Check cache first
    const cached = userCache.get(clockNumber);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    
    try {
      const numericId = parseInt(clockNumber, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid clock number format');
      }
      
      const { data, error } = await supabaseRef.current
        .from('data_id')
        .select('id, name, email, department')
        .eq('id', numericId)
        .single();
      
      if (error) throw error;
      
      const details: UserDetails = {
        id: data.id,
        name: data.name,
        email: data.email,
        department: data.department,
        clockNumber
      };
      
      // Update cache
      userCache.set(clockNumber, { data: details, timestamp: Date.now() });
      
      return details;
    } catch (err) {
      console.error('[useUserId] Error fetching user details:', err);
      return null;
    }
  }, []);
  
  /**
   * Get current authenticated user
   */
  const getCurrentUser = useCallback(async () => {
    if (!supabaseRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: authError } = await supabaseRef.current.auth.getUser();
      
      if (authError) throw authError;
      
      if (user?.email) {
        const clockNumber = extractClockNumberFromEmail(user.email);
        
        if (clockNumber) {
          setUserId(clockNumber);
          setUserNumericId(parseInt(clockNumber, 10));
          setIsAuthenticated(true);
          
          // Fetch full user details
          const details = await fetchUserDetails(clockNumber);
          if (details) {
            setUserDetails(details);
          }
        } else {
          throw new Error('Invalid email format - clock number not found');
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
      console.error('[useUserId] Error getting user:', error);
      
      // Only show toast for non-authentication errors
      if (!error.message.includes('not authenticated')) {
        toast.error(`Failed to get user: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserDetails]);
  
  /**
   * Verify if a user ID exists in the system
   */
  const verifyUserId = useCallback(async (userId: number): Promise<boolean> => {
    if (!supabaseRef.current) return false;
    
    try {
      const { data, error } = await supabaseRef.current
        .from('data_id')
        .select('id')
        .eq('id', userId)
        .single();
      
      return !error && !!data;
    } catch (err) {
      console.error('[useUserId] Error verifying user ID:', err);
      return false;
    }
  }, []);
  
  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    await getCurrentUser();
  }, [getCurrentUser]);
  
  // Initial load
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);
  
  // Listen for auth state changes
  useEffect(() => {
    if (!supabaseRef.current) return;
    
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await getCurrentUser();
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setUserNumericId(null);
          setUserDetails(null);
          setIsAuthenticated(false);
          userCache.clear(); // Clear cache on sign out
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [getCurrentUser]);
  
  return {
    userId,
    userNumericId,
    userDetails,
    isLoading,
    error,
    isAuthenticated,
    refreshUser,
    verifyUserId
  };
}

/**
 * Hook variant that only returns the clock number
 * For backward compatibility with existing code
 */
export function useClockNumber(): string | null {
  const { userId } = useUserId();
  return userId;
}

/**
 * Hook variant that returns numeric user ID
 * For components that need the numeric ID from data_id table
 */
export function useUserNumericId(): number | null {
  const { userNumericId } = useUserId();
  return userNumericId;
}