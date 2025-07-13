import { createClient } from '@supabase/supabase-js';
import { getCurrentSecurityConfig } from './auth-config';
import { cleanupLegacyAuth, shouldCleanupLegacyAuth } from './cleanup-legacy-auth';
import { createMainLoginSupabaseClient } from './supabase-client';

// 安全存儲類
class SecureStorage {
  private readonly keyPrefix = 'pennine_secure_';
  private readonly maxAge = 2 * 60 * 60 * 1000; // 2小時過期

  getItem(key: string): string | null {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

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
        // 在開發環境下，允許 localhost 相關的域名
        if (process.env.NODE_ENV === 'development') {
          const isDevelopmentDomain = 
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            parsed.domain === 'localhost' ||
            parsed.domain === '127.0.0.1' ||
            parsed.domain.startsWith('192.168.');
          
          if (!isDevelopmentDomain) {
            this.removeItem(key);
            return null;
          }
        } else {
          this.removeItem(key);
          return null;
        }
      }

      return parsed.value;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const item = {
        value,
        expires: Date.now() + this.maxAge,
        domain: window.location.hostname,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.keyPrefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
    }
  }

  removeItem(key: string): void {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.keyPrefix + key);
  }

  cleanup(): void {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

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
          localStorage.removeItem(key);
        }
      }
    }
  }
}

// 統一的認證客戶端
class UnifiedAuth {
  private config = getCurrentSecurityConfig();
  private secureStorage = new SecureStorage();
  private supabaseClient: any = null;

  // 獲取或創建 Supabase 客戶端（單例模式）
  private getSupabaseClient() {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }

    // 只在瀏覽器環境中檢查並清理舊版認證數據
    if (typeof window !== 'undefined' && shouldCleanupLegacyAuth()) {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[UnifiedAuth] Detected legacy auth data, cleaning up...');
      cleanupLegacyAuth();
    }

    // 使用 SSR 兼容的客戶端
    this.supabaseClient = createMainLoginSupabaseClient();

    // 如果使用安全存儲，設置定期清理（僅在瀏覽器環境）
    if (typeof window !== 'undefined' && this.config.useLocalStorage) {
      setInterval(
        () => {
          this.secureStorage.cleanup();
        },
        5 * 60 * 1000
      ); // 每5分鐘清理一次
    }

    return this.supabaseClient;
  }

  async signIn(email: string, password: string) {
    // 額外的域名驗證
    if (!email.endsWith('@pennineindustries.com')) {
      throw new Error('只允許 Pennine Industries 員工登入');
    }

    const supabase = this.getSupabaseClient();
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[UnifiedAuth] Using ${this.config.mode} mode for sign in`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // 記錄登入時間（僅在安全模式下且在瀏覽器環境）
    if (typeof window !== 'undefined' && this.config.useLocalStorage && data.session) {
      this.secureStorage.setItem('last_login', Date.now().toString());
      this.secureStorage.setItem('login_domain_verified', 'true');
    }

    return data;
  }

  async signUp(email: string, password: string) {
    if (!email.endsWith('@pennineindustries.com')) {
      throw new Error('只允許 Pennine Industries 員工註冊');
    }

    const supabase = this.getSupabaseClient();
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[UnifiedAuth] Using ${this.config.mode} mode for sign up`);

    // 設置正確的重定向 URL
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/main-login?confirmed=true`
      : '/main-login?confirmed=true';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const supabase = this.getSupabaseClient();
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[UnifiedAuth] Using ${this.config.mode} mode for sign out`);

    // 清理本地存儲（如果使用的話且在瀏覽器環境）
    if (typeof window !== 'undefined' && this.config.useLocalStorage) {
      this.secureStorage.cleanup();
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const supabase = this.getSupabaseClient();

    // 檢查域名驗證標記（僅在安全模式下且在瀏覽器環境）
    if (typeof window !== 'undefined' && this.config.useLocalStorage) {
      const domainVerified = this.secureStorage.getItem('login_domain_verified');
      if (!domainVerified) {
        // 在開發環境下，嘗試從現有的 session 中恢復驗證標記
        if (process.env.NODE_ENV === 'development') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            // 恢復域名驗證標記
            this.secureStorage.setItem('login_domain_verified', 'true');
            console.log('[UnifiedAuth] Domain verification restored in development mode');
          } else {
            await supabase.auth.signOut();
            throw new Error('Domain verification failed - please sign in again');
          }
        } else {
          await supabase.auth.signOut();
          throw new Error('Domain verification failed - please sign in again');
        }
      }
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error && !error.message.includes('Auth session missing')) {
      throw error;
    }

    return user;
  }

  // 檢查 session 是否即將過期（僅在安全模式下且在瀏覽器環境）
  isSessionExpiringSoon(): boolean {
    if (typeof window === 'undefined' || !this.config.useLocalStorage) {
      return false;
    }

    const lastLogin = this.secureStorage.getItem('last_login');
    if (!lastLogin) return true;

    const loginTime = parseInt(lastLogin);
    const now = Date.now();
    const timeElapsed = now - loginTime;
    const maxAge = this.config.sessionTimeout;

    return timeElapsed > maxAge * 0.8; // 如果已過80%時間，視為即將過期
  }

  // 獲取當前配置信息
  getSecurityInfo() {
    return {
      mode: this.config.mode,
      useLocalStorage: this.config.useLocalStorage,
      sessionTimeout: this.config.sessionTimeout,
      autoRefreshToken: this.config.autoRefreshToken,
      extraSecurityChecks: this.config.extraSecurityChecks,
    };
  }

  // 檢查是否需要顯示安全警告
  shouldShowSecurityWarning(): boolean {
    return this.config.mode !== 'strict';
  }
}

// 導出統一的認證實例
export const unifiedAuth = new UnifiedAuth();

// 為了向後兼容，也導出原來的接口
export const mainLoginAuth = unifiedAuth;
