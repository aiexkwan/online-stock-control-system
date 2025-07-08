import { createBrowserClient } from '@supabase/ssr';
import { getCurrentSecurityConfig } from './auth-config';

// 創建瀏覽器端 Supabase 客戶端
export function createMainLoginSupabaseClient() {
  const config = getCurrentSecurityConfig();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 使用 SSR 兼容的瀏覽器客戶端
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: config.autoRefreshToken,
      persistSession: true, // 始終持久化 session 以支持 SSR
      detectSessionInUrl: true, // 啟用 URL 檢測以處理電郵確認
      storageKey: 'sb-bbmkuiplnzvpudszrend-auth-token', // 使用標準的 Supabase storage key
      flowType: 'pkce',
    },
    cookies: {
      get(name: string) {
        if (typeof document !== 'undefined') {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
        }
        return undefined;
      },
      set(name: string, value: string, options: any) {
        if (typeof document !== 'undefined') {
          let cookieString = `${name}=${value}`;
          if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options?.path) cookieString += `; path=${options.path}`;
          if (options?.domain) cookieString += `; domain=${options.domain}`;
          if (options?.secure) cookieString += `; secure`;
          if (options?.httpOnly) cookieString += `; httponly`;
          if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
          document.cookie = cookieString;
        }
      },
      remove(name: string, options: any) {
        if (typeof document !== 'undefined') {
          let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          if (options?.path) cookieString += `; path=${options.path}`;
          if (options?.domain) cookieString += `; domain=${options.domain}`;
          document.cookie = cookieString;
        }
      },
    },
  });
}
