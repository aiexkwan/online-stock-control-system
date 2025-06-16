/**
 * 儀表板設定 Hook
 * 提供儀表板配置的讀取、保存和同步功能
 */

import { useState, useEffect, useCallback } from 'react';
import { DashboardConfig } from '@/app/types/dashboard';
import { dashboardSettingsService } from '@/app/services/dashboardSettingsService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/app/hooks/useAuth';

export function useDashboardSettings(dashboardName: string = 'custom') {
  const [config, setConfig] = useState<DashboardConfig | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // 載入儀表板設定
  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 首先嘗試從 Supabase 載入
      const settings = await dashboardSettingsService.getDashboardSettings(dashboardName);
      
      if (settings) {
        setConfig(settings.config);
      } else {
        // 如果 Supabase 沒有設定，嘗試從 localStorage 遷移
        const migrated = await dashboardSettingsService.migrateFromLocalStorage();
        
        if (migrated) {
          // 重新載入遷移後的設定
          const newSettings = await dashboardSettingsService.getDashboardSettings(dashboardName);
          if (newSettings) {
            setConfig(newSettings.config);
            toast({
              title: 'Settings Migrated',
              description: 'Your dashboard settings have been synced to the cloud.',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard settings:', error);
      
      // 如果載入失敗，嘗試使用 localStorage 作為備份
      const savedConfig = localStorage.getItem('dashboard_config');
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
          toast({
            title: 'Offline Mode',
            description: 'Using local settings. Changes will sync when connection is restored.',
            variant: 'destructive',
          });
        } catch (err) {
          console.error('Failed to parse local config:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, dashboardName, toast]);

  // 保存儀表板設定
  const saveSettings = useCallback(async (newConfig: DashboardConfig) => {
    if (!isAuthenticated) {
      // 如果未登入，只保存到 localStorage
      localStorage.setItem('dashboard_config', JSON.stringify(newConfig));
      setConfig(newConfig);
      toast({
        title: 'Settings Saved Locally',
        description: 'Login to sync your settings across devices.',
      });
      return;
    }

    try {
      setSaving(true);
      
      // 同時保存到 Supabase 和 localStorage（作為備份）
      await dashboardSettingsService.saveDashboardSettings(newConfig, dashboardName);
      localStorage.setItem('dashboard_config', JSON.stringify(newConfig));
      
      setConfig(newConfig);
      toast({
        title: 'Dashboard Saved',
        description: 'Your dashboard configuration has been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save dashboard settings:', error);
      
      // 如果保存到 Supabase 失敗，至少保存到 localStorage
      localStorage.setItem('dashboard_config', JSON.stringify(newConfig));
      setConfig(newConfig);
      
      toast({
        title: 'Save Error',
        description: 'Settings saved locally. Will sync when connection is restored.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, dashboardName, toast]);

  // 重置為預設設定
  const resetSettings = useCallback(async () => {
    if (!isAuthenticated) {
      localStorage.removeItem('dashboard_config');
      setConfig(undefined);
      toast({
        title: 'Reset Complete',
        description: 'Dashboard has been reset to default.',
      });
      return;
    }

    try {
      setSaving(true);
      
      await dashboardSettingsService.resetToDefault(dashboardName);
      localStorage.removeItem('dashboard_config');
      setConfig(undefined);
      
      toast({
        title: 'Reset Complete',
        description: 'Dashboard has been reset to default.',
      });
    } catch (error) {
      console.error('Failed to reset dashboard settings:', error);
      toast({
        title: 'Reset Error',
        description: 'Failed to reset dashboard settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, dashboardName, toast]);

  // 當認證狀態改變時重新載入設定
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    config,
    loading,
    saving,
    saveSettings,
    resetSettings,
    reloadSettings: loadSettings,
  };
}