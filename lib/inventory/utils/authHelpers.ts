/**
 * Common authentication helper functions
 * Consolidates repeated auth logic from multiple hooks
 */

import type { SupabaseClient, Tables } from '../../../types/database/supabase';

/**
 * Get current user ID (clock number) from authenticated user
 * Previously duplicated in useStockMovement, useStockMovementV2, useStockMovementRPC
 * @param supabase - Supabase client instance with typed database schema
 * @returns Promise that resolves to user ID string or null if not authenticated
 */
export async function getCurrentUserId(supabase: SupabaseClient): Promise<string | null> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('[authHelpers] Auth error getting current user:', authError);
      return null;
    }

    if (user?.email) {
      // Extract clock number from email (e.g., "1234@example.com" -> "1234")
      const userId = user.email.split('@')[0];
      return userId || null;
    }

    return null;
  } catch (error) {
    console.error('[authHelpers] Error getting current user ID:', error);
    return null;
  }
}

/**
 * Get current user's numeric ID from data_id table
 * @param supabase - Supabase client instance with typed database schema
 * @returns Promise that resolves to numeric user ID or null if invalid/not found
 */
export async function getCurrentUserNumericId(supabase: SupabaseClient): Promise<number | null> {
  try {
    const userId = await getCurrentUserId(supabase);
    if (!userId) {
      console.warn('[authHelpers] No user ID available for numeric conversion');
      return null;
    }

    const numericId = parseInt(userId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      console.error('[authHelpers] Invalid numeric user ID:', userId);
      return null;
    }

    return numericId;
  } catch (error) {
    console.error('[authHelpers] Error getting numeric user ID:', error);
    return null;
  }
}

/**
 * Verify if a user ID exists in the data_id table
 * @param supabase - Supabase client instance with typed database schema
 * @param userId - Numeric user ID to verify
 * @returns Promise that resolves to true if user exists, false otherwise
 */
export async function verifyUserId(supabase: SupabaseClient, userId: number): Promise<boolean> {
  try {
    if (!userId || userId <= 0) {
      console.warn('[authHelpers] Invalid user ID provided for verification:', userId);
      return false;
    }

    const { data, error } = await supabase.from('data_id').select('id').eq('id', userId).single();

    if (error) {
      // PGRST116 means no rows returned, which is expected for non-existent users
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('[authHelpers] Database error verifying user ID:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[authHelpers] Error verifying user ID:', error);
    return false;
  }
}

// Type alias for user details return type
type UserDetails = Pick<Tables<'data_id'>, 'id' | 'name' | 'email' | 'department'> | null;

/**
 * Get user details from data_id table
 * @param supabase - Supabase client instance with typed database schema
 * @param userId - Numeric user ID to fetch details for
 * @returns Promise that resolves to user details or null if not found
 */
export async function getUserDetails(
  supabase: SupabaseClient,
  userId: number
): Promise<UserDetails> {
  try {
    if (!userId || userId <= 0) {
      console.warn('[authHelpers] Invalid user ID provided for details fetch:', userId);
      return null;
    }

    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, email, department')
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 means no rows returned, which is expected for non-existent users
      if (error.code === 'PGRST116') {
        console.warn('[authHelpers] User not found:', userId);
        return null;
      }
      console.error('[authHelpers] Database error getting user details:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[authHelpers] Error getting user details:', error);
    return null;
  }
}
