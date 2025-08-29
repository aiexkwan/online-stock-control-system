'use server';

// For direct admin operations, use server client
import { z } from 'zod';
// import bcrypt from 'bcryptjs';
// import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation';
import { createClient as createServerSideClient } from '@/app/utils/supabase/server';
import { getErrorMessage } from '@/lib/types/error-handling';
// import {
//   signOut as signOutService,
//   updatePasswordWithSupabaseAuth,
// } from '../services/supabaseAuth';

// interface ActionResult {
//   success: boolean;
//   error?: string;
// }

// COMMENT OUT or REMOVE the module-level supabaseAdmin instance AGAIN
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

const clockNumberSchema = z
  .string()
  .regex(/^\d+$/, { message: 'Clock Number must be a positive number.' })
  .transform(val => parseInt(val, 10));

// 添加 TypeScript 聲明擴展 global
declare global {
  var _passwordChangeCache:
    | {
        [key: number]: {
          timestamp: number;
          first_login: boolean;
          password: string;
        };
      }
    | undefined;
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
export async function checkFirstLoginStatus(
  clockNumberStr: string
): Promise<FirstLoginStatusResponse> {
  const supabaseAdmin = await createServerSideClient();
  const validation = clockNumberSchema.safeParse(clockNumberStr);
  if (!validation.success) {
    return {
      isFirstLogin: null,
      error: validation.error.errors[0]?.message || 'Invalid Clock Number format.',
    };
  }

  const clockNumber = validation.data;

  try {
    const { data, error } = await supabaseAdmin
      .from('data_id')
      .select('id') // Only check if user exists, first_login column doesn't exist
      .eq('id', clockNumber) // Assuming 'id' in data_id is the clockNumber (int4)
      .single();

    if (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        // PostgREST error code for "Searched for a single row, but found no rows"
        process.env.NODE_ENV !== 'production' &&
          console.warn(`[authActions] No user found in data_id for clock number: ${clockNumber}`);
        return { isFirstLogin: null, error: 'User record not found in system.' };
      }
      console.error('[authActions] Error fetching user status:', error);
      return { isFirstLogin: null, error: getErrorMessage(error) };
    }

    if (data === null) {
      // This case should ideally not happen if data is found and schema is correct
      console.error('[authActions] Invalid data for clock_number:', clockNumber, 'Data:', data);
      return { isFirstLogin: null, error: 'User data is inconsistent.' };
    }

    // Since first_login column doesn't exist in database, always return false
    // This logic might need to be implemented differently based on business requirements
    return { isFirstLogin: false };
  } catch (e: unknown) {
    console.error('[authActions] Unexpected error in checkFirstLoginStatus:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected server error occurred.';
    return { isFirstLogin: null, error: errorMessage };
  }
}

// interface LoginResult {
//   success: boolean;
//   userId?: number; // clockNumber
//   error?: string;
//   isFirstLogin?: boolean;
// }

// -------- ChangePasswordActionResult interface --------
// interface ChangePasswordActionResult {
//   success: boolean;
//   error?: string;
//   message?: string;
// }
