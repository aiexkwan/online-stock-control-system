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
  private readonly DASHBOARD_NAME = 'admin_dashboard';
  
  // 每次使用時創建新的客戶端，避免快取問題
  private getSupabase() {
    return createClient();
  }

  /**
   * 獲取當前用戶資訊
   */
  private async getCurrentUser() {
    const { data: { user }, error } = await this.getSupabase().auth.getUser();
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
      
      // 強制取得最新數據，避免快取
      const { data, error } = await this.getSupabase()
        .from('user_dashboard_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('dashboard_name', this.DASHBOARD_NAME)
        .single();

      if (error) {
        // 如果是找不到記錄的錯誤，返回 null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      console.log('Loaded dashboard config from Supabase:', JSON.stringify(data.config, null, 2));
      return data.config as DashboardLayout;
    } catch (error) {
      console.error('Error fetching admin dashboard settings:', error);
      return null;
    }
  }

  /**
   * 保存用戶的 admin dashboard 設定
   */
  async saveAdminDashboardSettings(layout: DashboardLayout): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      console.log('Saving dashboard config to Supabase:', JSON.stringify(layout, null, 2));
      
      // 創建新的 Supabase 客戶端以避免快取
      const supabase = this.getSupabase();
      
      // 使用 upsert - 如果存在則更新，不存在則插入
      const { error } = await supabase
        .from('user_dashboard_settings')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          dashboard_name: this.DASHBOARD_NAME,
          config: layout,
          is_default: false,
          updated_at: new Date().toISOString()
        }, {
          // 使用 user_id 和 dashboard_name 作為唯一標識
          onConflict: 'user_id,dashboard_name'
        });

      if (error) {
        console.error('Error saving dashboard settings:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving admin dashboard settings:', error);
      return false;
    }
  }

  /**
   * 重置為預設設定（清空所有 widgets）
   */
  async resetToDefault(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      // 從資料庫刪除
      const { error } = await this.getSupabase()
        .from('user_dashboard_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('dashboard_name', this.DASHBOARD_NAME);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error resetting admin dashboard settings:', error);
      return false;
    }
  }

  /**
   * 監聽其他標籤頁的變更（已移除 localStorage，此功能暫時停用）
   */
  onStorageChange(callback: (layout: DashboardLayout | null) => void): () => void {
    // 不再使用 localStorage，所以此功能暫時停用
    // 未來可以考慮使用 Supabase Realtime 來實現跨標籤頁同步
    return () => {};
  }
}

// 導出單例
export const adminDashboardSettingsService = new AdminDashboardSettingsService();