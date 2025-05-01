import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  // 客戶端環境
  if (!window.localStorage.getItem('supabase.auth.token')) {
    window.localStorage.removeItem('supabase.auth.token');
  }
}

const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MTU2MDQsImV4cCI6MjA2MTI5MTYwNH0._xBzFK-3gOqyztwpvR6xfMbLd3ynTubEg5Z1iLYj92Q';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
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