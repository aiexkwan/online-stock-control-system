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
      flowType: 'pkce'
    }
  });
} 