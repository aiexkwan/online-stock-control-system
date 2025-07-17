// 清理舊版認證數據的工具
export function cleanupLegacyAuth() {
  if (typeof window === 'undefined') return;

  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log('[CleanupLegacyAuth] Starting cleanup of legacy authentication data');

  // 清理舊的 localStorage 項目
  const legacyKeys = [
    'loggedInUserClockNumber',
    'user',
    'isTemporaryLogin',
    'firstLogin',
    'sb-bbmkuiplnzvpudszrend-auth-token',
  ];

  legacyKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[CleanupLegacyAuth] Removing legacy localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });

  // 清理舊的 cookies
  const legacyCookies = ['loggedInUserClockNumber', 'sb-bbmkuiplnzvpudszrend-auth-token'];

  legacyCookies.forEach(cookieName => {
    // 刪除 cookie（設置過期時間為過去）
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[CleanupLegacyAuth] Cleared legacy cookie: ${cookieName}`);
  });

  // 清理所有以 sb- 開頭的 Supabase cookies（舊版本）
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=');
    const trimmedName = name.trim();
    if (trimmedName.startsWith('sb-')) {
      document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[CleanupLegacyAuth] Cleared Supabase cookie: ${trimmedName}`);
    }
  });

  // 清理所有以 pennine_secure_ 開頭的項目（如果需要重置）
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('pennine_secure_')) {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[CleanupLegacyAuth] Found secure storage key: ${key}`);
      // 可選：如果需要完全重置，取消註釋下面這行
      // localStorage.removeItem(key);
    }
  }

  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log('[CleanupLegacyAuth] Legacy cleanup completed');
}

// 檢查是否需要清理
export function shouldCleanupLegacyAuth(): boolean {
  if (typeof window === 'undefined') return false;

  // 檢查是否存在舊的認證數據
  const hasLegacyLocalStorage = localStorage.getItem('loggedInUserClockNumber') !== null;
  const hasLegacyCookie = document.cookie.includes('loggedInUserClockNumber=');

  return hasLegacyLocalStorage || hasLegacyCookie;
}

// 強制清理所有認證數據（用於登出或重置）
export function forceCleanupAllAuth() {
  if (typeof window === 'undefined') return;

  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log('[CleanupLegacyAuth] Force cleanup all authentication data');

  // 清理所有 localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.includes('auth') ||
        key.includes('user') ||
        key.includes('login') ||
        key.includes('pennine') ||
        key.startsWith('sb-'))
    ) {
      localStorage.removeItem(key);
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[CleanupLegacyAuth] Removed: ${key}`);
    }
  }

  // 清理所有相關 cookies
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=');
    const trimmedName = name.trim();
    if (
      trimmedName.includes('auth') ||
      trimmedName.includes('user') ||
      trimmedName.includes('login') ||
      trimmedName.includes('pennine') ||
      trimmedName.startsWith('sb-')
    ) {
      document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    }
  });

  (process.env.NODE_ENV as string) !== 'production' &&
    (process.env.NODE_ENV as string) !== 'production' &&
    console.log('[CleanupLegacyAuth] Force cleanup completed');
}
