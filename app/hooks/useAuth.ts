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

/**
 * Hook to get current user's clock number with database lookup fallback
 */
export function useCurrentUserClockNumber(): {
  clockNumber: string | null;
  loading: boolean;
  error: string | null;
} {
  const { user, loading: authLoading } = useAuth();
  const [clockNumber, setClockNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getClockNumber = async () => {
      console.log('[useCurrentUserClockNumber] Starting clock number lookup...');
      console.log('[useCurrentUserClockNumber] Auth loading:', authLoading);
      console.log('[useCurrentUserClockNumber] User:', user);
      
      if (authLoading) {
        console.log('[useCurrentUserClockNumber] Auth still loading, waiting...');
        return;
      }
      
      if (!user) {
        console.log('[useCurrentUserClockNumber] No user found');
        setClockNumber(null);
        setError('No authenticated user');
        setLoading(false);
        return;
      }

      try {
        console.log('[useCurrentUserClockNumber] User email:', user.email);
        console.log('[useCurrentUserClockNumber] User metadata:', user.user_metadata);
        
        // First try to get from user metadata
        if (user.user_metadata?.clock_number) {
          const clockNum = user.user_metadata.clock_number.toString();
          console.log('[useCurrentUserClockNumber] Found clock number in metadata:', clockNum);
          setClockNumber(clockNum);
          setError(null);
          setLoading(false);
          return;
        }

        console.log('[useCurrentUserClockNumber] No clock number in metadata, trying database lookup...');

        // Fallback: lookup by email in data table
        if (user.email) {
          const { data, error: dbError } = await supabase
            .from('data_id')
            .select('id')
            .eq('email', user.email)
            .single();

          console.log('[useCurrentUserClockNumber] Database query result:', { data, error: dbError });

          if (dbError) {
            console.error('[useCurrentUserClockNumber] Database error:', dbError);
            setError(`Failed to lookup clock number: ${dbError.message}`);
            setClockNumber(null);
          } else if (data?.id) {
            const clockNum = data.id.toString();
            console.log('[useCurrentUserClockNumber] Found clock number in database:', clockNum);
            setClockNumber(clockNum);
            setError(null);
          } else {
            console.log('[useCurrentUserClockNumber] No clock number found in database');
            setError('No clock number found for user');
            setClockNumber(null);
          }
        } else {
          console.log('[useCurrentUserClockNumber] No email found for user');
          setError('No email found for user');
          setClockNumber(null);
        }
      } catch (err: any) {
        console.error('[useCurrentUserClockNumber] Error getting clock number:', err);
        setError(err.message);
        setClockNumber(null);
      } finally {
        setLoading(false);
      }
    };

    getClockNumber();
  }, [user, authLoading, supabase]);

  console.log('[useCurrentUserClockNumber] Current state:', { clockNumber, loading, error });

  return { clockNumber, loading, error };
} 