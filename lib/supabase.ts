import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('[Supabase Init] URL:', supabaseUrl ? 'Loaded' : 'MISSING!');
console.log('[Supabase Init] Anon Key:', supabaseAnonKey ? 'Loaded' : 'MISSING!');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('[Supabase Init] Client created:', supabase ? 'Yes' : 'No');
console.log('[Supabase Init] Storage available:', supabase && supabase.storage ? 'Yes' : 'No');

// 臨時掛到 window 方便 debug
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.supabase = supabase;
} 