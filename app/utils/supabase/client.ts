import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../../types/database/supabase';

export function createClient() {
  // 添加安全檢查避免 webpack 載入時崩潰
  if (typeof window === 'undefined') {
    // 服務器端渲染時返回簡化版本
    console.warn('[createClient] SSR detected, skipping client creation');
    // Return a minimal mock client for SSR compatibility
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({ data: [], error: null }),
      }),
      rpc: () => Promise.resolve({ data: null, error: null }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          download: () => Promise.resolve({ data: null, error: null }),
        }),
      },
    } as any;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[createClient] Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
    });
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
    },
    cookies: {
      get(_name: string) {
        if (typeof document !== 'undefined') {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${_name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
        }
        return undefined;
      },
      set(_name: string, value: string, options: Record<string, unknown>) {
        if (typeof document !== 'undefined') {
          let cookieString = `${_name}=${value}`;
          if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options?.path) cookieString += `; path=${options.path}`;
          if (options?.domain) cookieString += `; domain=${options.domain}`;
          if (options?.secure) cookieString += `; secure`;
          if (options?.httpOnly) cookieString += `; httponly`;
          if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
          document.cookie = cookieString;
        }
      },
      remove(_name: string, options: Record<string, unknown>) {
        if (typeof document !== 'undefined') {
          let cookieString = `${_name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          if (options?.path) cookieString += `; path=${options.path}`;
          if (options?.domain) cookieString += `; domain=${options.domain}`;
          document.cookie = cookieString;
        }
      },
    },
  });
}
