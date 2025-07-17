'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js'; // For direct admin operations
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  migrateUserToSupabaseAuth,
  signInWithSupabaseAuth,
  userExistsInSupabaseAuth,
  signOut as signOutService,
  updatePasswordWithSupabaseAuth,
} from '../services/supabaseAuth';
import { createClient as createServerSideClient } from '@/app/utils/supabase/server';
import { clockNumberToEmail } from '@/app/utils/authUtils';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface ActionResult {
  success: boolean;
  error?: string;
}

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
  // const supabaseAdmin = createAdminClient(  // No longer needed for direct password check from data_id
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.SUPABASE_SERVICE_ROLE_KEY!
  // );
  if (userId === null || typeof userId === 'undefined') {
    console.error('[verifyCurrentUserPasswordAction] User ID (clockNumber) is missing or invalid.');
    return { success: false, error: 'User ID (clockNumber) is missing or invalid.' };
  }
  if (!enteredPassword) {
    process.env.NODE_ENV !== 'production' &&
      console.warn('[verifyCurrentUserPasswordAction] Entered password is empty for user:', userId);
    return { success: false, error: 'Password cannot be empty.' };
  }

  try {
    process.env.NODE_ENV !== 'production' &&
      console.log(
        `[verifyCurrentUserPasswordAction] Verifying password for user ID (clockNumber): ${userId} using Supabase Auth`
      );

    const email = clockNumberToEmail(userId.toString()); // Convert userId (clockNumber) to email
    const supabase = await createServerSideClient(); // Create a server-side Supabase client for this action

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: enteredPassword,
    });

    if (signInError) {
      // Log the specific error for server-side debugging
      process.env.NODE_ENV !== 'production' &&
        console.warn(
          `[verifyCurrentUserPasswordAction] Supabase signInWithPassword error for ${email}:`,
          signInError.message
        );
      // Provide a generic error message to the client
      if (signInError.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      // Handle other potential errors like user not found in Supabase Auth, though this action assumes user exists
      // For other errors, a more generic message might be appropriate
      return { success: false, error: 'Password verification failed. Please try again.' };
    }

    if (!data || !data.user) {
      // This case should ideally not be reached if signInError is not present, but good to have a check
      console.error(
        `[verifyCurrentUserPasswordAction] Supabase signInWithPassword returned no user data for ${email}, though no explicit error was thrown.`
      );
      return { success: false, error: 'Password verification failed due to an unexpected issue.' };
    }

    // If signInWithPassword is successful, the password is correct.
    // The session established by this specific signInWithPassword call is scoped to this Supabase client instance
    // and should not interfere with the broader session management of the Server Action if `createServerSideClient`
    // handles cookies correctly (which it should with @supabase/ssr).
    process.env.NODE_ENV !== 'production' &&
      console.log(
        `[verifyCurrentUserPasswordAction] Password verified successfully for user ID (clockNumber) ${userId} / email ${email} via Supabase Auth.`
      );
    return { success: true };
  } catch (error: any) {
    console.error(
      '[verifyCurrentUserPasswordAction] Unhandled error during Supabase password verification:',
      error
    );
    return {
      success: false,
      error: 'An unexpected server error occurred during password verification.',
    };
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
export async function checkFirstLoginStatus(
  clockNumberStr: string
): Promise<FirstLoginStatusResponse> {
  const supabaseAdmin = createAdminClient(
    // Create instance inside function
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
      .select('first_login')
      .eq('id', clockNumber) // Assuming 'id' in data_id is the clockNumber (int4)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PostgREST error code for "Searched for a single row, but found no rows"
        process.env.NODE_ENV !== 'production' &&
          console.warn(`[authActions] No user found in data_id for clock number: ${clockNumber}`);
        return { isFirstLogin: null, error: 'User record not found in system.' };
      }
      console.error('[authActions] Error fetching first_login status:', error);
      return { isFirstLogin: null, error: error.message };
    }

    if (data === null || typeof data.first_login !== 'boolean') {
      // This case should ideally not happen if data is found and schema is correct
      console.error(
        '[authActions] Invalid data or first_login flag for clock_number:',
        clockNumber,
        'Data:',
        data
      );
      return { isFirstLogin: null, error: 'User data is inconsistent.' };
    }

    return { isFirstLogin: data.first_login };
  } catch (e: any) {
    console.error('[authActions] Unexpected error in checkFirstLoginStatus:', e);
    return { isFirstLogin: null, error: e.message || 'An unexpected server error occurred.' };
  }
}

interface LoginResult {
  success: boolean;
  userId?: number; // clockNumber
  error?: string;
  isFirstLogin?: boolean;
}

/**
 * 使用自定義登入並根據需要遷移到 Supabase Auth
 */
export async function customLoginAction(
  clockNumberStr: string,
  passwordInput: string
): Promise<LoginResult> {
  const supabase = await createServerSideClient(); // <--- ADDED: Create SSR client at the top
  const supabaseAdmin = createAdminClient(
    // Create instance inside function
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  process.env.NODE_ENV !== 'production' &&
    console.log(`[customLoginAction] Attempting login for ${clockNumberStr}`);

  // 驗證時鐘編號
  const validation = clockNumberSchema.safeParse(clockNumberStr);
  if (!validation.success) {
    console.error(`[customLoginAction] Invalid clock number format: ${clockNumberStr}`);
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Invalid Clock Number format.',
    };
  }

  const clockNumber = validation.data;

  try {
    // 檢查用戶是否已經在 Supabase Auth 中
    const userExistsInAuth = await userExistsInSupabaseAuth(supabase, clockNumber.toString()); // <--- UPDATED: Pass client

    if (userExistsInAuth) {
      process.env.NODE_ENV !== 'production' &&
        console.log(
          `[customLoginAction] User ${clockNumber} exists in Supabase Auth, using Supabase Auth login`
        );
      const authResult = await signInWithSupabaseAuth(
        supabase,
        clockNumber.toString(),
        passwordInput
      );
      process.env.NODE_ENV !== 'production' &&
        console.log(
          '[customLoginAction] signInWithSupabaseAuth result:',
          JSON.stringify(authResult, null, 2)
        );

      if (!authResult.success) {
        console.error('[customLoginAction] Login failed:', authResult.error);
        return {
          success: false,
          error: authResult.error || 'Invalid credentials. Please try again.',
        };
      }

      if (authResult.success && authResult.user) {
        // 直接使用 authResult 返回的 isFirstLogin 值，這個值已經反映了 needs_password_change 狀態
        process.env.NODE_ENV !== 'production' &&
          console.log(
            '[customLoginAction] Login successful with first login status (from Supabase Auth):',
            authResult.isFirstLogin
          );
        return {
          success: true,
          userId: clockNumber,
          isFirstLogin: authResult.isFirstLogin || false,
        };
      }
    } else {
      process.env.NODE_ENV !== 'production' &&
        console.log(
          `[customLoginAction] User ${clockNumber} not found in Supabase Auth, using legacy login`
        );

      // 使用舊有方式驗證
      const { data, error } = await supabaseAdmin
        .from('data_id')
        .select(
          'id, name, department, password, first_login, qc, receive, void, view, resume, report'
        )
        .eq('id', clockNumber)
        .single();

      if (error) {
        console.error(`[customLoginAction] Error fetching user data:`, error);
        if (error.code === 'PGRST116') {
          return { success: false, error: `User ${clockNumber} not found.` };
        }
        return { success: false, error: 'Error fetching user data.' };
      }

      if (!data) {
        process.env.NODE_ENV !== 'production' &&
          console.warn(`[customLoginAction] No data returned for clock number: ${clockNumber}`);
        return { success: false, error: `User ${clockNumber} not found.` };
      }

      const finalUserData = data;

      // 處理首次登入情況
      if (finalUserData.first_login) {
        process.env.NODE_ENV !== 'production' &&
          console.log(`[customLoginAction] First-time login detected for ${clockNumber}`);
        // 首次登入：密碼應該是時鐘編號本身
        if (passwordInput === clockNumberStr) {
          process.env.NODE_ENV !== 'production' &&
            console.log(`[customLoginAction] First-time login successful for ${clockNumber}`);

          const migrationResult = await migrateUserToSupabaseAuth(
            supabase,
            clockNumber.toString(),
            null
          );
          process.env.NODE_ENV !== 'production' &&
            console.log(
              '[customLoginAction] migrateUserToSupabaseAuth result (first-time login):',
              JSON.stringify(migrationResult, null, 2)
            ); // <--- ADDED LOG

          const resultToReturn1 = {
            success: migrationResult.success, // Base success on migration
            userId: finalUserData.id,
            isFirstLogin: true, // Still a first login attempt
            error: migrationResult.error, // Pass error if any
          };
          process.env.NODE_ENV !== 'production' &&
            console.log(
              '[customLoginAction] Returning from first-time login block:',
              JSON.stringify(resultToReturn1, null, 2)
            ); // <--- ADDED LOG
          return resultToReturn1;
        } else {
          process.env.NODE_ENV !== 'production' &&
            console.warn(
              `[customLoginAction] First-time login password mismatch for ${clockNumber}`
            );
          process.env.NODE_ENV !== 'production' &&
            console.log(
              '[customLoginAction] Returning failure (first-time login password mismatch).'
            ); // <--- ADDED LOG
          return {
            success: false,
            error: 'Invalid Clock Number or Password for first-time login.',
          };
        }
      } else {
        // 非首次登入，檢查密碼
        if (!finalUserData.password) {
          console.error(`[customLoginAction] User ${clockNumber} has no password set`);
          return {
            success: false,
            error: 'User account configuration error. Please contact admin.',
          };
        }

        // 使用 bcrypt 比較密碼
        const isPasswordMatch = bcrypt.compareSync(passwordInput, finalUserData.password);

        if (isPasswordMatch) {
          process.env.NODE_ENV !== 'production' &&
            console.log(`[customLoginAction] Password match successful for ${clockNumber}`);

          const migrationResult = await migrateUserToSupabaseAuth(
            supabase,
            clockNumber.toString(),
            passwordInput
          );
          process.env.NODE_ENV !== 'production' &&
            console.log(
              '[customLoginAction] migrateUserToSupabaseAuth result (legacy regular login):',
              JSON.stringify(migrationResult, null, 2)
            ); // <--- ADDED LOG

          const resultToReturn2 = {
            success: migrationResult.success, // Base success on migration
            userId: finalUserData.id,
            isFirstLogin: false, // Not a first login
            error: migrationResult.error, // Pass error if any
          };
          process.env.NODE_ENV !== 'production' &&
            console.log(
              '[customLoginAction] Returning from legacy regular login block:',
              JSON.stringify(resultToReturn2, null, 2)
            ); // <--- ADDED LOG
          return resultToReturn2;
        } else {
          // isPasswordMatch is false
          process.env.NODE_ENV !== 'production' &&
            console.warn(`[customLoginAction] Password mismatch for ${clockNumber}.`);
          process.env.NODE_ENV !== 'production' &&
            console.log('[customLoginAction] Returning failure (legacy password mismatch).'); // <--- ADDED LOG
          return { success: false, error: 'Invalid Clock Number or Password.' };
        }
      }
    }

    // 如果用戶唔存在或者登入失敗，返回錯誤
    return {
      success: false,
      error: 'Invalid credentials or user not found. Please try again.',
    };
  } catch (e: any) {
    console.error('[customLoginAction] Unexpected error:', e);
    return { success: false, error: e.message || 'An unexpected server error occurred.' };
  }
}

// -------- 新增 ChangePasswordActionResult interface --------
interface ChangePasswordActionResult {
  // ... existing code ...
}
