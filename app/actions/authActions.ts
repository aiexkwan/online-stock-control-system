'use server';

import { supabase } from '@/lib/supabase'; // Assuming supabase client is in lib
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers'; // To get current user session if needed, or pass userId directly

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Verifies the provided password against the currently authenticated user's stored password.
 * It's recommended to get the userId from a secure server-side session or context 
 * rather than relying on client-side input for userId if possible.
 * For this implementation, we'll assume userId is passed after being securely obtained.
 */
export async function verifyCurrentUserPasswordAction(
  userId: number, 
  enteredPassword: string
): Promise<ActionResult> {
  if (userId === null || typeof userId === 'undefined') {
    console.error('[verifyPasswordAction] User ID is missing or invalid.');
    return { success: false, error: 'User ID is missing or invalid.' };
  }
  if (!enteredPassword) {
    console.warn('[verifyPasswordAction] Entered password is empty for user:', userId);
    return { success: false, error: 'Password cannot be empty.' };
  }

  try {
    console.log(`[verifyPasswordAction] Verifying password for user ID: ${userId}`);
    const { data: userData, error: userError } = await supabase
      .from('data_id')
      .select('password') // Select only the password field
      .eq('id', userId)
      .single();

    if (userError) {
      console.error(`[verifyPasswordAction] Error fetching user data for user ID ${userId}:`, userError);
      return { success: false, error: 'Could not retrieve user information. Please try again.' };
    }
    
    if (!userData) {
      console.warn(`[verifyPasswordAction] No user data found for user ID ${userId}.`);
      return { success: false, error: 'User not found.' };
    }

    if (!userData.password) {
      console.error(`[verifyPasswordAction] User password field is missing in database for user ID: ${userId}`);
      return { success: false, error: 'User account configuration error. Password not set.' };
    }

    const isPasswordMatch = await bcrypt.compare(enteredPassword, userData.password);

    if (!isPasswordMatch) {
      console.warn(`[verifyPasswordAction] Password mismatch for user ID ${userId}.`);
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    console.log(`[verifyPasswordAction] Password verified successfully for user ID ${userId}.`);
    return { success: true };

  } catch (error: any) {
    console.error('[verifyPasswordAction] Unhandled error during password verification:', error);
    return { success: false, error: 'An unexpected server error occurred during password verification.' };
  }
} 