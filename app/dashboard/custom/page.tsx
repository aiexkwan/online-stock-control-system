/**
 * 自定義儀表板頁面
 * 支援雲端同步的用戶儀表板設定
 */

'use client';

import React, { useEffect } from 'react';
import { EnhancedDashboard } from '@/app/components/dashboard/EnhancedDashboard';
import { registerWidgets } from '@/app/components/dashboard/widgets';
import { useDashboardSettings } from '@/app/hooks/useDashboardSettings';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomDashboardPage() {
  const { config, loading, saveSettings } = useDashboardSettings('custom');

  useEffect(() => {
    // 註冊所有小部件
    registerWidgets();
  }, []);

  // 載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto p-6">
          <div className="space-y-6">
            {/* 標題骨架 */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-48 bg-slate-700" />
              <Skeleton className="h-10 w-32 bg-slate-700" />
            </div>
            
            {/* 儀表板骨架 */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <Skeleton className="h-40 bg-slate-700" />
              </div>
              <div className="col-span-4">
                <Skeleton className="h-40 bg-slate-700" />
              </div>
              <div className="col-span-4">
                <Skeleton className="h-40 bg-slate-700" />
              </div>
              <div className="col-span-6">
                <Skeleton className="h-60 bg-slate-700" />
              </div>
              <div className="col-span-6">
                <Skeleton className="h-60 bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        <EnhancedDashboard config={config} onSave={saveSettings} />
      </div>
    </div>
  );
}