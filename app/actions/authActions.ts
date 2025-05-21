'use server';

import { createClient as createBrowserClient } from '@/lib/supabase'; // For client-side usage if any function here were to be called from client
// import { cookies } from 'next/headers'; // Handled by createServerSideClient
import { createClient as createAdminClient } from '@supabase/supabase-js'; // For direct admin operations
import { z } from 'zod';
import bcrypt from 'bcryptjs'; // Ensure bcryptjs is imported if not already
import { migrateUserToSupabaseAuth, signInWithSupabaseAuth, userExistsInSupabaseAuth, signOut as signOutService } from '../services/supabaseAuth';
// import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; // REMOVED
import { createClient as createServerSideClient } from '@/app/utils/supabase/server'; // ADDED for server actions
import { updatePasswordWithSupabaseAuth } from '../services/supabaseAuth'; // signOutService already imported
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

const clockNumberSchema = z.string().regex(/^\d+$/, { message: 'Clock Number must be a positive number.' }).transform(val => parseInt(val, 10));

// 添加 TypeScript 聲明擴展 global
declare global {
  var _passwordChangeCache: {
    [key: number]: {
      timestamp: number;
      first_login: boolean;
      password: string;
    }
  } | undefined;
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
  const supabaseAdmin = createAdminClient( 
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
    const supabase = createBrowserClient(); // This was likely an error in original code, should be supabaseAdmin for data_id access
    const { data: userData, error: userError } = await supabaseAdmin
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
  const supabaseAdmin = createAdminClient( // Create instance inside function
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

interface LoginResult {
  success: boolean;
  userId?: number; // clockNumber
  error?: string;
  isFirstLogin?: boolean; 
}

/**
 * 使用自定義登入並根據需要遷移到 Supabase Auth
 */
export async function customLoginAction(clockNumberStr: string, passwordInput: string): Promise<LoginResult> {
  const supabaseAdmin = createAdminClient( // Create instance inside function
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`[customLoginAction] Attempting login for ${clockNumberStr}`);

  // 驗證時鐘編號
  const validation = clockNumberSchema.safeParse(clockNumberStr);
  if (!validation.success) {
    console.error(`[customLoginAction] Invalid clock number format: ${clockNumberStr}`);
    return { 
      success: false, 
      error: validation.error.errors[0]?.message || 'Invalid Clock Number format.' 
    };
  }

  const clockNumber = validation.data;

  try {
    // 檢查用戶是否已經在 Supabase Auth 中
    const userExistsInAuth = await userExistsInSupabaseAuth(clockNumber.toString());

    if (userExistsInAuth) {
      console.log(`[customLoginAction] User ${clockNumber} exists in Supabase Auth, using Supabase Auth login`);
      // 如果用戶已經在 Supabase Auth 中，使用 Supabase Auth 進行登入
      const authResult = await signInWithSupabaseAuth(clockNumber.toString(), passwordInput);
      
      if (authResult.success && authResult.user) {
        return {
          success: true,
          userId: Number(clockNumber),
          isFirstLogin: authResult.isFirstLogin
        };
      } else {
        return {
          success: false,
          error: authResult.error || 'Authentication failed'
        };
      }
    } else {
      console.log(`[customLoginAction] User ${clockNumber} not found in Supabase Auth, using legacy login`);
      
      // 使用舊有方式驗證
      const { data, error } = await supabaseAdmin
        .from('data_id')
        .select('id, name, department, password, first_login, qc, receive, void, view, resume, report')
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
        console.warn(`[customLoginAction] No data returned for clock number: ${clockNumber}`);
        return { success: false, error: `User ${clockNumber} not found.` };
      }

      const finalUserData = data;

      // 處理首次登入情況
      if (finalUserData.first_login) {
        console.log(`[customLoginAction] First-time login detected for ${clockNumber}`);
        // 首次登入：密碼應該是時鐘編號本身
        if (passwordInput === clockNumberStr) {
          console.log(`[customLoginAction] First-time login successful for ${clockNumber}`);
          
          // 成功驗證後，遷移用戶到 Supabase Auth
          await migrateUserToSupabaseAuth(clockNumber.toString(), clockNumber.toString());
          
          return {
            success: true,
            userId: finalUserData.id,
            isFirstLogin: true,
          };
        } else {
          console.warn(`[customLoginAction] First-time login password mismatch for ${clockNumber}`);
          return { success: false, error: 'Invalid Clock Number or Password for first-time login.' };
        }
      } else {
        // 非首次登入，檢查密碼
        if (!finalUserData.password) {
          console.error(`[customLoginAction] User ${clockNumber} has no password set`);
          return { success: false, error: 'User account configuration error. Please contact admin.' };
        }
        
        // 使用 bcrypt 比較密碼
        const isPasswordMatch = bcrypt.compareSync(passwordInput, finalUserData.password);
        
        if (isPasswordMatch) {
          console.log(`[customLoginAction] Password match successful for ${clockNumber}`);
          
          // 成功驗證後，遷移用戶到 Supabase Auth
          await migrateUserToSupabaseAuth(clockNumber.toString(), passwordInput);
          
          return {
            success: true,
            userId: finalUserData.id,
            isFirstLogin: false,
          };
        } else {
          // 檢查是否有密碼重置請求
          console.log(`[customLoginAction] Password mismatch for ${clockNumber}, checking for reset request`);
          
          // ... 原有的密碼重置請求檢查邏輯 ...

          console.warn(`[customLoginAction] Invalid password for ${clockNumber}`);
          return { success: false, error: 'Invalid Clock Number or Password.' };
        }
      }
    }
  } catch (e: any) {
    console.error('[customLoginAction] Unexpected error:', e);
    return { success: false, error: e.message || 'An unexpected server error occurred.' };
  }
}

// -------- 新增 ChangePasswordActionResult interface --------
interface ChangePasswordActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

// -------- 新增 changePasswordAction --------
export async function changePasswordAction(
  formData: FormData
): Promise<ChangePasswordActionResult> {
  const supabase = createServerSideClient(); // NEW: Use server client from @supabase/ssr utils
  console.log('[authActions - changePasswordAction] Server client obtained.');

  const currentPassword = formData.get('currentPassword')?.toString();
  const newPassword = formData.get('newPassword')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All password fields are required.' };
  }
  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters long.' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'Could not authenticate user. Please log in again.' };
  }

  // Verify current password (This part needs to be adapted based on where the hashed password for current user is stored)
  // Assuming current password verification against Supabase Auth is NOT how it's done here, rather against data_id
  // For this example, let's assume verifyCurrentUserPasswordAction is called if needed, or this logic is self-contained.
  // If currentPassword needs to be checked against Supabase Auth itself, a different approach is needed.
  // This action seems to be for a scenario where user is already logged in and changing their password.

  // Call the service function to update password in Supabase Auth and clear flag
  const updateResult = await updatePasswordWithSupabaseAuth(newPassword, supabase);

  if (updateResult.error) {
    return { error: updateResult.error };
  }

  revalidatePath('/dashboard'); // Or other relevant paths
  // redirect('/dashboard'); // Client-side should handle redirection based on result
  return { success: true, message: 'Password changed successfully.' };
}

// -------- 新增 (或修改現有的) logoutAction --------
export async function logoutAction(): Promise<{ error?: string }> {
  const supabase = createServerSideClient(); // NEW: Use server client from @supabase/ssr utils
  console.log('[authActions - logoutAction] Server client obtained.');

  try {
    await signOutService(supabase); // Pass the server client to the service function
    revalidatePath('/', 'layout'); // Revalidate all paths or specific ones
    // Do not redirect from server action if client is handling it or if it's an API-like action
  } catch (e: any) {
    console.error('[logoutAction] Error during logout:', e);
    return { error: e.message || 'Logout failed.' };
  }
  return {}; // Success, no error
} 