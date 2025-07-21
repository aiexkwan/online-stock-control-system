import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 單例模式，避免創建多個 client 實例
let simpleClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * 簡單的 Supabase client，用於 RPC 調用
 * 不處理 cookies，避免潛在的問題
 * 使用單例模式避免多個 GoTrueClient 實例
 */
export function createSimpleClient() {
  // 如果已經有實例，直接返回
  if (simpleClient) {
    return simpleClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  simpleClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
    global: {
      fetch: (url, options = {}) => {
        // 加入超時控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 秒超時

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    },
  });

  return simpleClient;
}
