import { isNotProduction } from '@/lib/utils/env';
import { authLogger } from '@/lib/logger';

/**
 * 將用戶 ID (時鐘編號) 轉換為 Supabase Auth 可用的電子郵件格式
 *
 * 因為 Supabase Auth 需要電子郵件格式的帳戶名稱，所以我們需要將時鐘編號轉換為一個
 * 虛擬的電子郵件地址。這個函數將時鐘編號轉換為格式為 "[時鐘編號]@pennineindustries.com" 的郵箱。
 *
 * @param clockNumber - 用戶的時鐘編號，可以是數字或字符串
 * @returns 格式化為電子郵件的時鐘編號
 */
export function clockNumberToEmail(clockNumber: string): string {
  const email = `${clockNumber}@pennineindustries.com`;
  
  if (isNotProduction()) {
    authLogger.debug({
      function: 'clockNumberToEmail',
      clockNumber,
      email,
    }, 'Converted clock number to email');
  }
  
  return email;
}

/**
 * 從電子郵件格式提取用戶 ID (時鐘編號)
 *
 * 此函數與 clockNumberToEmail 相反，從 Supabase Auth 的用戶電子郵件中提取原始時鐘編號。
 * 用於從用戶會話或 Supabase Auth 數據中獲取用戶的實際時鐘編號，以便與舊系統保持兼容。
 *
 * @param email - Supabase Auth 中的用戶電子郵件地址
 * @returns 提取出的時鐘編號，如果格式不匹配則返回 null
 */
export function emailToClockNumber(email: string | null | undefined): string | null {
  if (!email) {
    if (isNotProduction()) {
      authLogger.warn({
        function: 'emailToClockNumber',
        input: email,
      }, 'Called with null or undefined email');
    }
    return null;
  }

  // Handle special case of "@pennineindustries.com" (empty clock number)
  if (email === '@pennineindustries.com') {
    authLogger.debug({
      function: 'emailToClockNumber',
      email,
      result: '(empty)',
    }, 'Handled special case of empty clock number');
    return '';
  }

  const match = email.match(/^(.+)@pennineindustries\.com$/);
  const clockNumber = match ? match[1] : null;
  
  if (isNotProduction()) {
    authLogger.debug({
      function: 'emailToClockNumber',
      email,
      clockNumber,
      success: !!clockNumber,
    }, clockNumber ? 'Successfully extracted clock number' : 'Failed to extract clock number - invalid format');
  }
  
  return clockNumber;
}
