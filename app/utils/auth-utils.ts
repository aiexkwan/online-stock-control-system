import { createClient } from '../../lib/supabase';

/**
 * 統一的用戶認證工具函數
 * 用於獲取當前用戶的 Clock Number（用戶 ID）
 */
export class AuthUtils {
  private static supabase = createClient();

  /**
   * 獲取當前用戶的 Clock Number
   * @returns Promise<string | null> - 用戶的 Clock Number 或 null
   */
  static async getCurrentUserClockNumber(): Promise<string | null> {
    try {
      // 使用 Supabase Auth 獲取當前用戶
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.error('[AuthUtils] Failed to get user:', error);
        return null;
      }
      
      if (user && user.email) {
        // 從 email 提取用戶 ID（格式：operator@pennineindustries.com → operator）
        const emailPrefix = user.email.split('@')[0];
        return emailPrefix;
      }
      
      console.log('[AuthUtils] No authenticated user found');
      return null;
    } catch (error) {
      console.error('[AuthUtils] Error getting user clock number:', error);
      return null;
    }
  }

  /**
   * 獲取當前用戶的完整信息
   * @returns Promise<User | null> - Supabase 用戶對象或 null
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.error('[AuthUtils] Failed to get user:', error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('[AuthUtils] Error getting user:', error);
      return null;
    }
  }

  /**
   * 檢查用戶是否已認證
   * @returns Promise<boolean> - 是否已認證
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * 向後兼容：檢查舊版 localStorage（僅在過渡期使用）
   * @deprecated 請使用 getCurrentUserClockNumber() 替代
   * @returns string | null - 舊版 Clock Number 或 null
   */
  static getLegacyClockNumber(): string | null {
    return localStorage.getItem('loggedInUserClockNumber');
  }

  /**
   * 統一獲取 Clock Number（新版優先，舊版備用）
   * @returns Promise<string | null> - Clock Number 或 null
   */
  static async getClockNumber(): Promise<string | null> {
    // 優先使用新版認證系統
    const newClockNumber = await this.getCurrentUserClockNumber();
    if (newClockNumber) {
      return newClockNumber;
    }

    // 備用：檢查舊版 localStorage（過渡期使用）
    const legacyClockNumber = this.getLegacyClockNumber();
    if (legacyClockNumber) {
      console.warn('[AuthUtils] Using legacy clock number, consider migrating to new auth system');
      return legacyClockNumber;
    }

    return null;
  }
} 