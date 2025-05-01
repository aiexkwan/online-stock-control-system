import { createClient } from '@supabase/supabase-js';

// 安全的 localStorage 檢查
function isLocalStorageAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// 安全的 localStorage 操作
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return isLocalStorageAvailable() ? localStorage.getItem(key) : null;
    } catch (e) {
      console.warn('localStorage access failed:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage remove failed:', e);
    }
  }
};

if (typeof window !== 'undefined') {
  // 客戶端環境
  if (!safeStorage.getItem('supabase.auth.token')) {
    safeStorage.removeItem('supabase.auth.token');
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
    storage: typeof window !== 'undefined' ? {
      getItem: safeStorage.getItem,
      setItem: safeStorage.setItem,
      removeItem: safeStorage.removeItem
    } : undefined,
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