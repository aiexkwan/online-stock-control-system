import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  // 客戶端環境
  if (!window.localStorage.getItem('supabase.auth.token')) {
    window.localStorage.removeItem('supabase.auth.token');
  }
}

const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'pennine-stock@0.1.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
}); 