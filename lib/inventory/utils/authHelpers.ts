/**
 * Common authentication helper functions
 * Consolidates repeated auth logic from multiple hooks
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get current user ID (clock number) from authenticated user
 * Previously duplicated in useStockMovement, useStockMovementV2, useStockMovementRPC
 */
export async function getCurrentUserId(supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      // Extract clock number from email (e.g., "1234@example.com" -> "1234")
      return user.email.split('@')[0];
    }
    return null;
  } catch (error) {
    console.error('[authHelpers] Error getting current user ID:', error);
    return null;
  }
}

/**
 * Get current user's numeric ID from data_id table
 */
export async function getCurrentUserNumericId(supabase: SupabaseClient): Promise<number | null> {
  try {
    const userId = await getCurrentUserId(supabase);
    if (!userId) return null;
    
    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) {
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
 */
export async function verifyUserId(supabase: SupabaseClient, userId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('data_id')
      .select('id')
      .eq('id', userId)
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('[authHelpers] Error verifying user ID:', error);
    return false;
  }
}

/**
 * Get user details from data_id table
 */
export async function getUserDetails(supabase: SupabaseClient, userId: number) {
  try {
    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, email, department')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[authHelpers] Error getting user details:', error);
    return null;
  }
}