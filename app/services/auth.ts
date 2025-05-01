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
      throw new Error(`User ${userId} does not exist`);
    }

    // 2. 檢查密碼邏輯
    // 2.1 如果用戶沒有自定義密碼（首次登錄）
    if (!userData.password) {
      // 只能使用用戶ID作為密碼
      if (password !== userId) {
        throw new Error('For first login, please use your Clock Number as password');
      }
      return {
        success: true,
        user: userData,
        isFirstLogin: true
      };
    }

    // 2.2 如果用戶已有自定義密碼
    if (password === userId) {
      throw new Error('Please Login With Your Custom Password');
    }

    if (password !== userData.password) {
      throw new Error('Incorrect password');
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
      error: error instanceof Error ? error.message : 'Login failed, please try again later'
    };
  }
} 