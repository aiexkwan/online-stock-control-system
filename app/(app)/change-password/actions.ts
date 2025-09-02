'use server';

// import { cookies } from 'next/headers'; // 由新的 _createClient 內部處理
// import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; // 已棄用
import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/utils/supabase/server'; // 使用 @supabase/ssr 的服務器客戶端
import { updatePasswordWithSupabaseAuth } from '@/app/services/supabaseAuth';
// import { redirect } from 'next/navigation'; // redirect 由客戶端處理

interface ChangePasswordActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

// 假設您的 /change-password 頁面表單調用的是這個 action
export async function updateUserPasswordInDbAction(
  prevState: ChangePasswordActionResult,
  formData: FormData
): Promise<ChangePasswordActionResult> {
  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log('[updateUserPasswordInDbAction] Action started. PrevState:', prevState);
  // const _cookieStore = cookies(); // 不再直接需要

  const supabase = await createClient(); // 使用新的輔助函數創建客戶端
  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log(
      '[updateUserPasswordInDbAction] Supabase client (from @/app/utils/supabase/server) obtained.'
    );

  const newPassword = formData.get('newPassword')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();
  // 如果您的表單還傳遞了 userId (clockNumber)，您可以在這裡獲取它，
  // 但更安全的是從下面的會話中獲取。
  // const clockNumberFromForm = formData.get('clockNumber')?.toString();

  if (
    !newPassword ||
    newPassword.trim() === '' ||
    !confirmPassword ||
    confirmPassword.trim() === ''
  ) {
    return { error: 'New password and confirmation password are required.' };
  }
  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log('[updateUserPasswordInDbAction] Attempting to get user from session...');
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(); // 使用新的 supabase client

  if (userError) {
    console.error(
      '[updateUserPasswordInDbAction] Error fetching user from _session:',
      userError.message
    );
    return { error: `Session error: ${userError.message}. Please try logging in again.` };
  }
  if (!user) {
    console.error('[updateUserPasswordInDbAction] No user session found.');
    return { error: 'No active session found. Please log in again.' };
  }
  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log('[updateUserPasswordInDbAction] User session found.');

  const clockNumber = user.user_metadata?.clock_number as string | undefined;

  if (!clockNumber) {
    // 雖然我們不直接使用 clockNumber 調用 updatePasswordWithSupabaseAuth，但日誌和可能的未來邏輯可能需要它
    console.error('[updateUserPasswordInDbAction] Clock number not found in user metadata.');
    // 考慮是否仍然需要返回錯誤，或者僅記錄警告，因為 updatePasswordWithSupabaseAuth 將使用 supabase 客戶端內部的用戶
    // return { _error: 'User identification failed (clock number missing). Cannot change password.' };
  }
  if (clockNumber) {
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[updateUserPasswordInDbAction] Clock number found in metadata.`);
  }

  // 可選：如果表單也提交了 clockNumber，可以進行驗證
  // if (clockNumberFromForm && clockNumberFromForm !== clockNumber) {
  //   console.error('[updateUserPasswordInDbAction] Form clockNumber does not match session clockNumber.');
  //   return { _error: 'User identification mismatch.' };
  // }

  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log(
      `[updateUserPasswordInDbAction] Attempting to call updatePasswordWithSupabaseAuth.`
    );

  const result = await updatePasswordWithSupabaseAuth(
    newPassword,
    supabase // 傳遞新的 supabase client
  );

  if (result.error) {
    console.error(
      `[updateUserPasswordInDbAction] Error from updatePasswordWithSupabaseAuth: ${result.error}`
    );
    // 將錯誤消息傳遞給客戶端，以便可以在表單上顯示
    return { error: result.error };
  }

  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log(
      `[updateUserPasswordInDbAction] Password changed successfully for user ${user.id}.`
    );

  // 不要立即重定向，而是返回成功狀態，讓 useFormState 更新 UI
  // 客戶端可以根據這個成功狀態來決定是否以及何時重定向
  // revalidatePath('/dashboard', 'layout');
  // revalidatePath('/change-password', 'page');
  // redirect('/dashboard');

  // 當使用 useFormState 時，通常返回一個狀態對象，而不是執行 redirect
  // redirect 應該在客戶端根據 action 的成功狀態來觸發
  // 或者，如果 action 內部必須 redirect，那麼 useFormState 可能不是最適合的模式
  // 為了讓 useFormState 能接收到成功信息，我們先返回 success: true
  // revalidatePath 仍然可以在這裡調用，因為它是服務器端操作
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/change-password', 'page');
  // 如果您希望在成功後自動重定向，並且不依賴客戶端JS，那麼 redirect() 在這裡仍然有效，
  // 但客戶端的 useFormState 可能不會再處理這個 action 的返回值。
  // 暫時先註釋掉 redirect，以便 useFormState 可以接收到成功消息。
  // redirect('/dashboard');
  return { success: true, message: 'Password has been changed successfully!' };
}

// 您可能在此文件中有其他 actions，請保留它們。
