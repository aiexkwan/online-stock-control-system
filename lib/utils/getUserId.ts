'use server';

import { createClient } from '@/app/utils/supabase/server';

/**
 * 從用戶 email 獲取 data_id 表中的 ID
 * @param email 用戶 email
 * @returns 用戶 ID 或 null
 */
export async function getUserIdFromEmail(email: string): Promise<number | null> {
  try {
    const supabase = createClient();
    
    // 從 email 提取用戶名（去掉 @pennineindustries.com）
    const username = email.includes('@') 
      ? email.split('@')[0] 
      : email;
    
    // 查詢 data_id 表
    const { data, error } = await supabase
      .from('data_id')
      .select('id')
      .eq('name', username)
      .single();
    
    if (error) {
      console.error('[getUserIdFromEmail] Error:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('[getUserIdFromEmail] Unexpected error:', error);
    return null;
  }
}