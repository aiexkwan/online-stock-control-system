/**
 * 自定義儀表板頁面
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Dashboard } from '@/app/components/dashboard/Dashboard';
import { DashboardConfig } from '@/app/types/dashboard';
import { registerWidgets } from '@/app/components/dashboard/widgets';
import { useToast } from '@/components/ui/use-toast';

export default function CustomDashboardPage() {
  const [config, setConfig] = useState<DashboardConfig | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    // 註冊所有小部件
    registerWidgets();
    
    // 從 localStorage 加載配置
    const savedConfig = localStorage.getItem('dashboard_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (err) {
        console.error('Failed to load dashboard config:', err);
      }
    }
  }, []);

  const handleSave = (newConfig: DashboardConfig) => {
    setConfig(newConfig);
    toast({
      title: 'Dashboard Saved',
      description: 'Your dashboard configuration has been saved successfully.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        <Dashboard config={config} onSave={handleSave} />
      </div>
    </div>
  );
}