import { SupabaseClient } from '@supabase/supabase-js';
import { cleanupLegacyAuth, shouldCleanupLegacyAuth } from './cleanup-legacy-auth';
import { createClient } from '@/app/utils/supabase/client';

// 簡化的統一認證客戶端
class UnifiedAuth {
  private supabaseClient: SupabaseClient | null = null;

  // 獲取或創建 Supabase 客戶端（單例模式）
  private getSupabaseClient(): SupabaseClient {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }

    // 確保只在客戶端環境中執行
    if (typeof window === 'undefined') {
      throw new Error('UnifiedAuth should only be used on client side');
    }

    // 只在瀏覽器環境中檢查並清理舊版認證數據
    if (shouldCleanupLegacyAuth()) {
      process.env.NODE_ENV !== 'production' &&
        console.log('[UnifiedAuth] Detected legacy auth data, cleaning up...');
      cleanupLegacyAuth();
    }

    // 使用統一的 Supabase 客戶端（已啟用 PKCE）
    try {
      this.supabaseClient = createClient();
      return this.supabaseClient;
    } catch (error) {
      console.error('[UnifiedAuth] Failed to create Supabase client:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    // 企業域名驗證
    if (!email.endsWith('@pennineindustries.com')) {
      throw new Error('只允許 Pennine Industries 員工登入');
    }

    const supabase = this.getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string) {
    if (!email.endsWith('@pennineindustries.com')) {
      throw new Error('只允許 Pennine Industries 員工註冊');
    }

    const supabase = this.getSupabaseClient();

    // 設置正確的重定向 URL
    const redirectTo =
      typeof window !== 'undefined'
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const supabase = this.getSupabaseClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error && !error.message.includes('Auth session missing') && !error.message.includes('Invalid Refresh Token')) {
      throw error;
    }

    return user;
  }

  async resetPassword(email: string) {
    if (!email.endsWith('@pennineindustries.com')) {
      throw new Error('只允許 Pennine Industries 員工重設密碼');
    }

    const supabase = this.getSupabaseClient();

    // 設置正確的重定向 URL
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/main-login/reset?step=reset`
        : '/main-login/reset?step=reset';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const supabase = this.getSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  getSecurityInfo() {
    // 返回安全配置信息
    return {
      useLocalStorage: false, // 使用 Supabase Auth，不依賴 localStorage
      sessionTimeout: 24 * 60 * 60 * 1000, // 24小時（Supabase 預設）
      requireSecureConnection: true,
    };
  }

  isSessionExpiringSoon(): boolean {
    // Supabase 會自動處理 session 刷新，所以這裡返回 false
    // 實際上 Supabase 的 session 會在過期前自動刷新
    return false;
  }
}

// 導出統一的認證實例
export const unifiedAuth = new UnifiedAuth();
