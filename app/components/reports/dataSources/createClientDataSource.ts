/**
 * 創建客戶端數據源的輔助函數
 * 使用客戶端 Supabase client
 */

import { createClient } from '@/lib/supabase';

export function createClientSupabase() {
  return createClient();
}