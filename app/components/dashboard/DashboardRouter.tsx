/**
 * Dashboard Router Component
 * 統一的儀表板路由組件
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NewDashboardLayout } from './NewDashboardLayout';
import { dashboardConfigs } from './dashboardConfigs';
import { DashboardWidgetRenderer } from './DashboardWidgetRenderer';

export const DashboardRouter: React.FC = () => {
  const pathname = usePathname();
  
  // 從路徑中提取主題
  const theme = pathname.split('/').pop() as string;
  const config = dashboardConfigs[theme];

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Dashboard Not Found</h1>
          <p className="text-gray-400">The requested dashboard theme &quot;{theme}&quot; does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <NewDashboardLayout theme={theme as any}>
      {config.widgets.map((widget, index) => (
        <DashboardWidgetRenderer
          key={`${widget.gridArea}-${index}`}
          config={widget}
          theme={theme}
        />
      ))}
    </NewDashboardLayout>
  );
};