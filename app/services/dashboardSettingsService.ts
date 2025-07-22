/**
 * 儀表板設定服務
 * 處理用戶儀表板配置的儲存和讀取
 */

import { createClient } from '@/lib/supabase';
import { DashboardConfig } from '@/types/components/dashboard';

export interface DashboardSettings {
  id?: string;
  user_id: string;
  email: string;
  dashboard_name: string;
  config: DashboardConfig;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

class DashboardSettingsService {
  private supabase = createClient();

  /**
   * 獲取當前用戶資訊
   */
  private async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * 獲取用戶的儀表板設定
   */
  async getDashboardSettings(dashboardName: string = 'custom'): Promise<DashboardSettings | null> {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await (this.supabase as any)
        .from('user_dashboard_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('dashboard_name', dashboardName)
        .single();

      if (error) {
        // 如果是找不到記錄的錯誤，返回 null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching dashboard settings:', error);
      return null;
    }
  }

  /**
   * 保存用戶的儀表板設定
   */
  async saveDashboardSettings(
    config: DashboardConfig,
    dashboardName: string = 'custom'
  ): Promise<DashboardSettings | null> {
    try {
      const user = await this.getCurrentUser();

      // 檢查是否已存在設定
      const existing = await this.getDashboardSettings(dashboardName);

      if (existing) {
        // 更新現有設定
        const { data, error } = await (this.supabase as any)
          .from('user_dashboard_settings')
          .update({
            config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // 創建新設定
        const { data, error } = await (this.supabase as any)
          .from('user_dashboard_settings')
          .insert({
            user_id: user.id,
            email: user.email || '',
            dashboard_name: dashboardName,
            config,
            is_default: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error saving dashboard settings:', error);
      throw error;
    }
  }

  /**
   * 刪除用戶的儀表板設定
   */
  async deleteDashboardSettings(dashboardName: string = 'custom'): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();

      const { error } = await (this.supabase as any)
        .from('user_dashboard_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('dashboard_name', dashboardName);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting dashboard settings:', error);
      return false;
    }
  }

  /**
   * 重置為預設設定
   */
  async resetToDefault(dashboardName: string = 'custom'): Promise<boolean> {
    return this.deleteDashboardSettings(dashboardName);
  }

  /**
   * 從 localStorage 遷移設定到 Supabase
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      const localConfig = localStorage.getItem('dashboard_config');
      if (!localConfig) return false;

      const config = JSON.parse(localConfig) as DashboardConfig;
      await this.saveDashboardSettings(config);

      // 成功遷移後刪除 localStorage 中的設定
      localStorage.removeItem('dashboard_config');

      return true;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return false;
    }
  }
}

// 導出單例
export const dashboardSettingsService = new DashboardSettingsService();
