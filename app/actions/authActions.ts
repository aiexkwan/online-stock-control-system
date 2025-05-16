'use server';

import { supabase } from '@/lib/supabase'; // Assuming supabase client is in lib
import { cookies } from 'next/headers'; // To get current user session if needed, or pass userId directly
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

interface ActionResult {
  success: boolean;
  error?: string;
}

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const clockNumberSchema = z.string().regex(/^\d+$/, { message: 'Clock Number must be a positive number.' }).transform(val => parseInt(val, 10));

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

interface FirstLoginStatusResponse {
  isFirstLogin: boolean | null; // null if user not found or error
  error?: string;
}

/**
 * Checks the first_login status for a given clock number from the data_id table.
 * @param clockNumberStr The user's clock number as a string.
 * @returns An object indicating if it's a first login, or an error message.
 */
export async function checkFirstLoginStatus(clockNumberStr: string): Promise<FirstLoginStatusResponse> {
  const validation = clockNumberSchema.safeParse(clockNumberStr);
  if (!validation.success) {
    return { isFirstLogin: null, error: validation.error.errors[0]?.message || 'Invalid Clock Number format.' };
  }

  const clockNumber = validation.data;

  try {
    const { data, error } = await supabaseAdmin
      .from('data_id')
      .select('first_login')
      .eq('id', clockNumber) // Assuming 'id' in data_id is the clockNumber (int4)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error code for "Searched for a single row, but found no rows"
        console.warn(`[authActions] No user found in data_id for clock number: ${clockNumber}`);
        return { isFirstLogin: null, error: 'User record not found in system.' }; 
      }
      console.error('[authActions] Error fetching first_login status:', error);
      return { isFirstLogin: null, error: error.message };
    }

    if (data === null || typeof data.first_login !== 'boolean') {
        // This case should ideally not happen if data is found and schema is correct
        console.error('[authActions] Invalid data or first_login flag for clock_number:', clockNumber, 'Data:', data);
        return { isFirstLogin: null, error: 'User data is inconsistent.' };
    }

    return { isFirstLogin: data.first_login };

  } catch (e: any) {
    console.error('[authActions] Unexpected error in checkFirstLoginStatus:', e);
    return { isFirstLogin: null, error: e.message || 'An unexpected server error occurred.' };
  }
}

import bcrypt from 'bcryptjs'; // Ensure bcryptjs is imported if not already

interface LoginResult {
  success: boolean;
  userId?: number; // clockNumber
  error?: string;
  isFirstLogin?: boolean; 
}

export async function customLoginAction(clockNumberStr: string, passwordInput: string): Promise<LoginResult> {
  const clockValidation = clockNumberSchema.safeParse(clockNumberStr);
  if (!clockValidation.success) {
    return { success: false, error: clockValidation.error.errors[0]?.message || 'Invalid Clock Number format.' };
  }
  if (!passwordInput) {
    return { success: false, error: 'Password cannot be empty.' };
  }

  const clockNumber = clockValidation.data;

  try {
    // Step A: Try selecting only the password first for debugging
    const { data: passwordOnlyData, error: passwordOnlyError } = await supabaseAdmin
      .from('data_id')
      .select('password')
      .eq('id', clockNumber)
      .single();

    console.log('[customLoginAction] Debug - Password Only Query Result for ', clockNumber, ':', JSON.stringify(passwordOnlyData));
    if (passwordOnlyError) {
        console.error('[customLoginAction] Debug - Error from password-only query:', passwordOnlyError);
    }

    // Original query
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('data_id')
      .select('id, first_login, password') // Changed order, password last
      .eq('id', clockNumber) 
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') { // User not found
        console.warn(`[customLoginAction] User not found for clock number: ${clockNumber}`);
        return { success: false, error: 'Invalid Clock Number or Password.' };
      }
      console.error('[customLoginAction] Error fetching user from data_id:', dbError);
      return { success: false, error: 'Database error during login.' };
    }

    // 關鍵的檢查點
    // Log the entire userData object received from the database before the check
    console.log('[customLoginAction] UserData received from database for clock number ', clockNumber, ':', JSON.stringify(userData));

    if (!userData || !userData.password) {
      console.error('[customLoginAction] User data or password hash missing for clock number:', clockNumber, 'User Data was:', userData);
      return { success: false, error: 'User account not configured correctly.' };
    }

    const isPasswordMatch = await bcrypt.compare(passwordInput, userData.password);

    if (!isPasswordMatch) {
      console.warn(`[customLoginAction] Password mismatch for clock number: ${clockNumber}`);
      return { success: false, error: 'Invalid Clock Number or Password.' };
    }

    console.log(`[customLoginAction] Login successful for clock number: ${clockNumber}`);
    return { 
      success: true, 
      userId: userData.id, // This is the clockNumber
      isFirstLogin: userData.first_login // Return first_login status directly
    };

  } catch (e: any) {
    console.error('[customLoginAction] Unexpected error:', e);
    return { success: false, error: e.message || 'An unexpected server error occurred.' };
  }
} 