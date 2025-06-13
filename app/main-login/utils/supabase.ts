import { createBrowserClient } from '@supabase/ssr';

// 創建客戶端組件專用的 Supabase 客戶端
export const createMainLoginClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing');
    throw new Error('Supabase configuration is missing');
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Email 域名驗證
export const validatePennineDomain = (email: string): boolean => {
  return email.toLowerCase().endsWith('@pennineindustries.com');
};

// 主登入認證函數
export const mainLoginAuth = {
  // 登入
  signIn: async (email: string, password: string) => {
    const supabase = createMainLoginClient();
    
    // 驗證域名
    if (!validatePennineDomain(email)) {
      throw new Error('Only @pennineindustries.com email addresses are allowed');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // 註冊
  signUp: async (email: string, password: string, metadata?: { 
    firstName?: string; 
    lastName?: string; 
    department?: string; 
  }) => {
    const supabase = createMainLoginClient();
    
    // 驗證域名
    if (!validatePennineDomain(email)) {
      throw new Error('Only @pennineindustries.com email addresses are allowed');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata?.firstName || '',
          last_name: metadata?.lastName || '',
          department: metadata?.department || '',
          email_domain: '@pennineindustries.com'
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // 密碼重設
  resetPassword: async (email: string) => {
    const supabase = createMainLoginClient();
    
    // 驗證域名
    if (!validatePennineDomain(email)) {
      throw new Error('Only @pennineindustries.com email addresses are allowed');
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/main-login/reset?token=reset`,
    });
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // 更新密碼
  updatePassword: async (newPassword: string) => {
    const supabase = createMainLoginClient();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // 登出
  signOut: async () => {
    const supabase = createMainLoginClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // 獲取當前用戶
  getCurrentUser: async () => {
    const supabase = createMainLoginClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // 如果是 Auth session missing，返回 null 而不是拋出錯誤
      if (error.message.includes('Auth session missing')) {
        return null;
      }
      throw new Error(error.message);
    }
    
    return user;
  }
}; 