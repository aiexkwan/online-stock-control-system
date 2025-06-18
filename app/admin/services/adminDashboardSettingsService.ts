/**
 * Admin Dashboard 設定服務
 * 處理管理員儀表板配置的儲存和讀取
 */

import { createClient } from '@/lib/supabase';
import { DashboardLayout, DashboardConfig } from '@/app/types/dashboard';

export interface AdminDashboardSettings {
  id?: string;
  user_id: string;
  email: string;
  dashboard_name: string;
  config: DashboardLayout;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

class AdminDashboardSettingsService {
  private supabase = createClient();
  private readonly DASHBOARD_NAME = 'admin_dashboard';
  private readonly LOCAL_STORAGE_KEY = 'adminDashboardLayout';

  /**
   * 獲取當前用戶資訊
   */
  private async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * 獲取用戶的 admin dashboard 設定
   */
  async getAdminDashboardSettings(): Promise<DashboardLayout | null> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('user_dashboard_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('dashboard_name', this.DASHBOARD_NAME)
        .single();

      if (error) {
        // 如果是找不到記錄的錯誤，嘗試從 localStorage 遷移
        if (error.code === 'PGRST116') {
          const migrated = await this.migrateFromLocalStorage();
          if (migrated) {
            return this.getAdminDashboardSettings();
          }
          return null;
        }
        throw error;
      }

      return data.config as DashboardLayout;
    } catch (error) {
      console.error('Error fetching admin dashboard settings:', error);
      
      // 如果從資料庫讀取失敗，嘗試從 localStorage 讀取
      const localLayout = this.getLocalLayout();
      if (localLayout) {
        return localLayout;
      }
      
      return null;
    }
  }

  /**
   * 保存用戶的 admin dashboard 設定
   */
  async saveAdminDashboardSettings(layout: DashboardLayout): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      // 同時保存到 localStorage（作為備份）
      this.saveLocalLayout(layout);
      
      // 檢查是否已存在設定
      const { data: existing, error: fetchError } = await this.supabase
        .from('user_dashboard_settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('dashboard_name', this.DASHBOARD_NAME)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existing) {
        // 更新現有設定
        const { error } = await this.supabase
          .from('user_dashboard_settings')
          .update({
            config: layout,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // 創建新設定
        const { error } = await this.supabase
          .from('user_dashboard_settings')
          .insert({
            user_id: user.id,
            email: user.email || '',
            dashboard_name: this.DASHBOARD_NAME,
            config: layout,
            is_default: false
          });

        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving admin dashboard settings:', error);
      
      // 即使資料庫儲存失敗，也要確保 localStorage 有儲存
      this.saveLocalLayout(layout);
      
      return false;
    }
  }

  /**
   * 重置為預設設定
   */
  async resetToDefault(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      // 從資料庫刪除
      const { error } = await this.supabase
        .from('user_dashboard_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('dashboard_name', this.DASHBOARD_NAME);

      if (error) throw error;
      
      // 清除 localStorage
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      
      return true;
    } catch (error) {
      console.error('Error resetting admin dashboard settings:', error);
      return false;
    }
  }

  /**
   * 從 localStorage 讀取佈局
   */
  private getLocalLayout(): DashboardLayout | null {
    try {
      const saved = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return null;
  }

  /**
   * 保存佈局到 localStorage
   */
  private saveLocalLayout(layout: DashboardLayout): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * 從 localStorage 遷移設定到 Supabase
   */
  private async migrateFromLocalStorage(): Promise<boolean> {
    try {
      const localLayout = this.getLocalLayout();
      if (!localLayout) return false;

      await this.saveAdminDashboardSettings(localLayout);
      
      return true;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return false;
    }
  }

  /**
   * 監聽其他標籤頁的變更
   */
  onStorageChange(callback: (layout: DashboardLayout | null) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === this.LOCAL_STORAGE_KEY) {
        const newLayout = e.newValue ? JSON.parse(e.newValue) : null;
        callback(newLayout);
      }
    };

    window.addEventListener('storage', handler);
    
    // 返回清理函數
    return () => {
      window.removeEventListener('storage', handler);
    };
  }
}

// 導出單例
export const adminDashboardSettingsService = new AdminDashboardSettingsService();