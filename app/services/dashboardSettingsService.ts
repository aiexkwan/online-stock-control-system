/**
 * 儀表板設定服務 (Card Architecture)
 * 處理用戶儀表板配置的儲存和讀取
 * Updated: 2025-08 - Migrated from Widget to Card system
 */

import { createClient } from '@/lib/supabase';

// Dashboard configuration types (updated to Card architecture)
export interface DashboardConfig {
  id?: string;
  _name: string;
  description?: string;
  cards: DashboardCard[];
  layouts: {
    lg?: DashboardLayoutItem[];
    md?: DashboardLayoutItem[];
    sm?: DashboardLayoutItem[];
    xs?: DashboardLayoutItem[];
    xxs?: DashboardLayoutItem[];
  };
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardCard {
  id: string;
  type: string;
  title: string;
  _config: {
    refreshInterval?: number;
    dataSource?: string;
    theme?: string;
    [key: string]: unknown;
  };
  permissions?: string[];
}

export interface DashboardLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardSettings {
  id?: string;
  user_id: string;
  email: string;
  dashboard_name: string;
  _config: DashboardConfig;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

class DashboardSettingsService {
  private supabase: ReturnType<typeof createClient> | null = null;

  private getSupabase() {
    if (!this.supabase) {
      this.supabase = createClient();
    }
    return this.supabase;
  }

  /**
   * 獲取當前用戶資訊
   */
  private async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.getSupabase().auth.getUser();
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

      const { data, error } = await this.getSupabase()
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

      return data as unknown as DashboardSettings;
    } catch (err) {
      console.error('Error fetching dashboard settings:', err);
      return null;
    }
  }

  /**
   * 保存用戶的儀表板設定
   */
  async saveDashboardSettings(
    _config: DashboardConfig,
    dashboardName: string = 'custom'
  ): Promise<DashboardSettings | null> {
    try {
      const user = await this.getCurrentUser();

      // 檢查是否已存在設定
      const existing = await this.getDashboardSettings(dashboardName);

      if (existing) {
        // 更新現有設定
        const { data, error } = await this.getSupabase()
          .from('user_dashboard_settings')
          .update({
            _config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id!)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as DashboardSettings;
      } else {
        // 創建新設定
        const { data, error } = await this.getSupabase()
          .from('user_dashboard_settings')
          .insert({
            user_id: user.id,
            email: user.email || '',
            dashboard_name: dashboardName,
            _config,
            is_default: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data as unknown as DashboardSettings;
      }
    } catch (err) {
      console.error('Error saving dashboard settings:', err);
      throw err;
    }
  }

  /**
   * 刪除用戶的儀表板設定
   */
  async deleteDashboardSettings(dashboardName: string = 'custom'): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();

      const { error } = await this.getSupabase()
        .from('user_dashboard_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('dashboard_name', dashboardName);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting dashboard settings:', err);
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

      const _config = JSON.parse(localConfig) as DashboardConfig;
      await this.saveDashboardSettings(_config);

      // 成功遷移後刪除 localStorage 中的設定
      localStorage.removeItem('dashboard_config');

      return true;
    } catch (err) {
      console.error('Error migrating from localStorage:', err);
      return false;
    }
  }
}

// 導出單例
// 使用延遲初始化以避免 SSR 問題
let serviceInstance: DashboardSettingsService | null = null;

export const dashboardSettingsService = {
  getInstance(): DashboardSettingsService {
    if (!serviceInstance) {
      serviceInstance = new DashboardSettingsService();
    }
    return serviceInstance;
  },
};
