'use server';

// import { supabase } from '@/lib/supabase'; // REMOVED: Standard client is not for server actions
import { createClient as createServerSupabaseClient } from '@/app/utils/supabase/server'; // ADDED: Server client
import { createClient as createAdminClient } from '@supabase/supabase-js'; // For creating admin client if needed
import bcrypt from 'bcryptjs';

// It's highly recommended to use the Supabase Admin client for operations that modify users table directly,
// especially for password resets initiated without an authenticated user session.
// Store your Supabase Service Role Key securely in environment variables.
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Ensure this is set in your .env.local or Vercel env vars
);

export async function resetPasswordAction(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // const supabase = createServerSupabaseClient(); // If you need a user-session aware client
  // For this action, we are directly updating data_id using admin client, so user session client might not be needed.

  if (!userId || !newPassword) {
    return { success: false, error: 'User ID or new password cannot be empty.' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[Server Action] Attempting to reset password for userId: ${userId}`);

    // 1. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[Server Action] New password hashed for userId: ${userId}`);

    // 2. Update the user's password in the data_id table
    // IMPORTANT: Using supabaseAdmin here for elevated privileges.
    // Ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in your environment.
    const { data, error: updateError } = await supabaseAdmin
      .from('data_id') // Assuming passwords are in data_id as per auth.ts
      .update({
        password: hashedPassword,
        first_login: false, // Ensure first_login is set to false after password reset
      })
      .eq('id', userId)
      .select(); // select() can help confirm if a row was matched and updated

    if (updateError) {
      console.error(`[Server Action] Supabase update error for userId ${userId}:`, updateError);
      return { success: false, error: `Database error: ${updateError.message}` };
    }

    // Check if any row was actually updated. If no row matched `userId`, data will be empty.
    if (!data || data.length === 0) {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.warn(
          `[Server Action] No user found with id: ${userId} during password reset attempt.`
        );
      return { success: false, error: 'User not found. Password not updated.' };
    }

    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(
        `[Server Action] Password for userId: ${userId} updated successfully in data_id table.`
      );

    // 3. Optionally, log this action to record_history (if appropriate for password resets)
    // This might require passing the initiator if it's not the user themselves (e.g. admin reset)
    // For self-reset, the userId is the one being acted upon.
    try {
      await supabaseAdmin.from('record_history').insert({
        time: new Date().toISOString(),
        id: userId, // The user whose password was reset
        action: 'Password Reset', // A more specific action type
        remark: 'User self-service password reset successful.',
      });
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[Server Action] Password reset logged to history for userId: ${userId}`);
    } catch (historyError) {
      console.error(
        `[Server Action] Failed to log password reset to record_history for userId ${userId}:`,
        historyError
      );
      // Do not fail the whole operation if logging fails, but log the error.
    }

    return { success: true };
  } catch (error) {
    console.error(
      `[Server Action] Unexpected error in resetPasswordAction for userId ${userId}:`,
      error
    );
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}
