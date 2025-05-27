import { createClient } from '@supabase/supabase-js';

// 簡化的 Supabase 客戶端 - 不儲存到 localStorage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined, // 不使用任何本地存儲
    autoRefreshToken: false, // 不自動刷新 token
    persistSession: false, // 不持久化 session
    detectSessionInUrl: false // 不從 URL 檢測 session
  }
});

// 簡化的認證函數
export const simpleAuth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && !error.message.includes('Auth session missing')) {
      throw error;
    }
    return user;
  }
}; 