import { createClient } from '@supabase/supabase-js';

// 安全的 Supabase 客戶端配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 自定義安全存儲類
class SecureStorage {
  private readonly keyPrefix = 'pennine_secure_';
  private readonly maxAge = 2 * 60 * 60 * 1000; // 2小時過期

  getItem(key: string): string | null {
    try {
      const item = localStorage.getItem(this.keyPrefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      // 檢查是否過期
      if (now > parsed.expires) {
        this.removeItem(key);
        return null;
      }

      // 驗證域名（額外安全檢查）
      if (parsed.domain && parsed.domain !== window.location.hostname) {
        this.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      const item = {
        value,
        expires: Date.now() + this.maxAge,
        domain: window.location.hostname,
        timestamp: Date.now()
      };
      localStorage.setItem(this.keyPrefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(this.keyPrefix + key);
  }

  // 清理所有過期項目
  cleanup(): void {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.keyPrefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (now > parsed.expires) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // 如果解析失敗，刪除該項目
          localStorage.removeItem(key);
        }
      }
    }
  }
}

const secureStorage = new SecureStorage();

// 定期清理過期項目
setInterval(() => {
  secureStorage.cleanup();
}, 5 * 60 * 1000); // 每5分鐘清理一次

export const secureSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true, // 允許自動刷新
    persistSession: true, // 持久化 session，但有時間限制
    detectSessionInUrl: false,
    // 額外的安全配置
    storageKey: 'pennine-auth-token',
    flowType: 'pkce' // 使用更安全的 PKCE 流程
  }
});

// 安全的認證函數
export const secureAuth = {
  signIn: async (email: string, password: string) => {
    // 額外的域名驗證
    if (!email.endsWith('@pennineindustries.com')) {
      throw new Error('只允許 Pennine Industries 員工登入');
    }

    const { data, error } = await secureSupabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // 記錄登入時間和IP（如果需要）
    if (data.session) {
      secureStorage.setItem('last_login', Date.now().toString());
      secureStorage.setItem('login_domain_verified', 'true');
    }
    
    return data;
  },

  signUp: async (email: string, password: string) => {
    if (!email.endsWith('@pennineindustries.com')) {
      throw new Error('只允許 Pennine Industries 員工註冊');
    }

    const { data, error } = await secureSupabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    // 清理所有本地存儲
    secureStorage.cleanup();
    const { error } = await secureSupabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    // 檢查域名驗證標記
    const domainVerified = secureStorage.getItem('login_domain_verified');
    if (!domainVerified) {
      await secureSupabase.auth.signOut();
      throw new Error('Domain verification failed');
    }

    const { data: { user }, error } = await secureSupabase.auth.getUser();
    if (error && !error.message.includes('Auth session missing')) {
      throw error;
    }
    
    // 額外驗證用戶 email 域名
    if (user && user.email && !user.email.endsWith('@pennineindustries.com')) {
      await secureSupabase.auth.signOut();
      throw new Error('Unauthorized domain detected');
    }
    
    return user;
  },

  // 檢查 session 是否即將過期
  isSessionExpiringSoon: (): boolean => {
    const lastLogin = secureStorage.getItem('last_login');
    if (!lastLogin) return true;
    
    const loginTime = parseInt(lastLogin);
    const now = Date.now();
    const timeElapsed = now - loginTime;
    const maxAge = 2 * 60 * 60 * 1000; // 2小時
    
    return timeElapsed > (maxAge * 0.8); // 如果已過80%時間，視為即將過期
  }
}; 