import { supabase } from '@/lib/supabase';

export interface UserData {
  id: string;
  name: string;
  department: string;
  password?: string;
  permissions: {
    qc: boolean;
    receive: boolean;
    void: boolean;
    view: boolean;
    resume: boolean;
    report: boolean;
  };
}

export async function authenticateUser(userId: string, password: string): Promise<{
  success: boolean;
  user?: UserData;
  isFirstLogin?: boolean;
  error?: string;
}> {
  try {
    // 1. 檢查用戶是否存在
    const { data: userData, error: userError } = await supabase
      .from('data_id')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User query error:', userError);
      throw new Error(userError.message);
    }

    if (!userData) {
      throw new Error(`用戶 ${userId} 不存在`);
    }

    // 2. 檢查密碼邏輯
    // 2.1 如果用戶沒有自定義密碼（首次登錄）
    if (!userData.password) {
      // 只能使用用戶ID作為密碼
      if (password !== userId) {
        throw new Error('首次登錄請使用用戶ID作為密碼');
      }
      return {
        success: true,
        user: userData,
        isFirstLogin: true
      };
    }

    // 2.2 如果用戶已有自定義密碼
    if (password === userId) {
      throw new Error('請使用您的自定義密碼登錄');
    }

    if (password !== userData.password) {
      throw new Error('密碼錯誤');
    }

    return {
      success: true,
      user: userData,
      isFirstLogin: false
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '登錄失敗，請稍後再試'
    };
  }
} 