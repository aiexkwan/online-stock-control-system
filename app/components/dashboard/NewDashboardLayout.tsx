/**
 * New Dashboard Layout System
 * 新的儀表板佈局系統 - 固定佈局，支援 8 個不同主題頁面
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { HistoryTree } from './HistoryTree';
import { TimeFrameSelector } from './TimeFrameSelector';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  theme: 'injection' | 'pipeline' | 'warehouse' | 'upload' | 'update' | 'stock-management' | 'system' | 'analysis';
}

export const NewDashboardLayout: React.FC<DashboardLayoutProps> = ({ children, theme }) => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>('today');
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // 根據不同主題返回對應的網格佈局
  const getGridLayout = () => {
    switch (theme) {
      case 'injection':
        // 注塑主題 - 強調生產流程
        return {
          gridTemplate: `
            "header header header header header header header header history history" 100px
            "stats1 stats1 stats2 stats2 stats3 stats3 stats4 stats4 history history" 100px
            "chart chart chart chart chart chart status status history history" 300px
            "chart chart chart chart chart chart status status history history" 100px
            "list list list list table table table table history history" 200px
            "list list list list table table table table history history" 100px
          `,
          areas: {
            header: 'col-span-8 bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats1: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats2: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats3: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats4: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            chart: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            status: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            list: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            table: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            history: 'bg-slate-900/50 backdrop-blur rounded-lg'
          }
        };

      case 'pipeline':
        // 管道主題 - 流程監控
        return {
          gridTemplate: `
            "header header header header header header header header history history" 100px
            "flow flow flow flow stats stats stats stats history history" 150px
            "flow flow flow flow stats stats stats stats history history" 150px
            "monitor monitor monitor monitor chart chart chart chart history history" 200px
            "alerts alerts alerts alerts chart chart chart chart history history" 200px
          `,
          areas: {
            header: 'col-span-8 bg-slate-800/50 backdrop-blur rounded-lg p-4',
            flow: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            monitor: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            chart: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            alerts: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            history: 'bg-slate-900/50 backdrop-blur rounded-lg'
          }
        };

      case 'warehouse':
        // 倉庫主題 - 庫存管理
        return {
          gridTemplate: `
            "header header header header header header header header history history" 100px
            "map map map map summary summary summary summary history history" 200px
            "map map map map stats1 stats1 stats2 stats2 history history" 100px
            "inventory inventory inventory inventory stats3 stats3 stats4 stats4 history history" 100px
            "inventory inventory inventory inventory movement movement movement movement history history" 200px
          `,
          areas: {
            header: 'col-span-8 bg-slate-800/50 backdrop-blur rounded-lg p-4',
            map: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            summary: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats1: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats2: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats3: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats4: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            inventory: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            movement: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            history: 'bg-slate-900/50 backdrop-blur rounded-lg'
          }
        };

      case 'upload':
        // 上傳主題 - 文件管理
        return {
          gridTemplate: `
            "header header header header header header header header history history" 100px
            "upload upload upload upload recent recent recent recent history history" 250px
            "queue queue queue queue recent recent recent recent history history" 150px
            "stats stats process process process process errors errors history history" 100px
            "stats stats process process process process errors errors history history" 100px
          `,
          areas: {
            header: 'col-span-8 bg-slate-800/50 backdrop-blur rounded-lg p-4',
            upload: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            recent: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            queue: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            process: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            errors: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            history: 'bg-slate-900/50 backdrop-blur rounded-lg'
          }
        };

      case 'update':
        // 更新主題 - 數據更新
        return {
          gridTemplate: `
            "header header header header header header header header history history" 100px
            "pending pending pending pending summary summary summary summary history history" 150px
            "form form form form preview preview preview preview history history" 200px
            "form form form form preview preview preview preview history history" 150px
            "log log log log stats stats stats stats history history" 100px
          `,
          areas: {
            header: 'col-span-8 bg-slate-800/50 backdrop-blur rounded-lg p-4',
            pending: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            summary: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            form: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            preview: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            log: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            stats: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            history: 'bg-slate-900/50 backdrop-blur rounded-lg'
          }
        };

      case 'stock-management':
        // 庫存管理主題
        return {
          gridTemplate: `
            "header header header header header header header header history history" 100px
            "overview overview overview overview alerts alerts alerts alerts history history" 120px
            "donut donut donut donut levels levels levels levels history history" 280px
            "transfer transfer transfer transfer inout inout inout inout history history" 200px
          `,
          areas: {
            header: 'col-span-8 bg-slate-800/50 backdrop-blur rounded-lg p-4',
            overview: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            alerts: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            donut: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            levels: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            transfer: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            inout: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            history: 'bg-slate-900/50 backdrop-blur rounded-lg'
          }
        };

      case 'system':
        // 系統主題 - 系統監控
        return {
          gridTemplate: `
            "header header header header header header header header history history" 100px
            "health health health health performance performance performance performance history history" 100px
            "metrics metrics metrics metrics performance performance performance performance history history" 200px
            "users users users users logs logs logs logs history history" 150px
            "jobs jobs jobs jobs logs logs logs logs history history" 150px
          `,
          areas: {
            header: 'col-span-8 bg-slate-800/50 backdrop-blur rounded-lg p-4',
            health: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            performance: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            metrics: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            users: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            logs: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            jobs: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            history: 'bg-slate-900/50 backdrop-blur rounded-lg'
          }
        };

      case 'analysis':
        // 分析主題 - 數據分析
        return {
          gridTemplate: `
            "header header header header header header header header history history" 100px
            "kpi1 kpi1 kpi2 kpi2 kpi3 kpi3 kpi4 kpi4 history history" 100px
            "trend trend trend trend pie pie pie pie history history" 250px
            "comparison comparison comparison comparison table table table table history history" 250px
          `,
          areas: {
            header: 'col-span-8 bg-slate-800/50 backdrop-blur rounded-lg p-4',
            kpi1: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            kpi2: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            kpi3: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            kpi4: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            trend: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            pie: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            comparison: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            table: 'bg-slate-800/50 backdrop-blur rounded-lg p-4',
            history: 'bg-slate-900/50 backdrop-blur rounded-lg'
          }
        };

      default:
        return {
          gridTemplate: '',
          areas: {}
        };
    }
  };

  const layout = getGridLayout();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 主容器 - 留有左右空間 */}
      <div className="mx-auto max-w-[1920px] px-8 py-6">
        {/* 頁面標題和導航 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white capitalize">
            {theme.replace('-', ' ')} Dashboard
          </h1>
          
          {/* 導航標籤 */}
          <div className="flex items-center gap-2">
            {['injection', 'pipeline', 'warehouse', 'upload', 'update', 'stock-management', 'system', 'analysis'].map((tab) => (
              <button
                key={tab}
                onClick={() => router.push(`/dashboard/${tab}`)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.includes(tab)
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* 主網格佈局 */}
        <div 
          className="grid gap-4"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gridTemplateRows: 'repeat(auto-fit, minmax(50px, auto))',
            gridTemplateAreas: layout.gridTemplate,
            gap: '16px',
            minHeight: 'calc(100vh - 120px)'
          }}
        >
          {/* 渲染各個區域的內容 */}
          {children}

          {/* History Tree - 固定在右側 */}
          <div style={{ gridArea: 'history' }} className={layout.areas.history}>
            {isHistoryVisible && <HistoryTree />}
          </div>
        </div>
      </div>

      {/* 移動端適配 */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr !important;
            grid-template-areas: none !important;
          }
          
          div[style*="grid-area: history"] {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default NewDashboardLayout;