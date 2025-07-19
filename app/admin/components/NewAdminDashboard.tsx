/**
 * New Admin Dashboard Component
 * 使用固定佈局的新儀表板系統
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/hooks/useAuth';
import { format, startOfDay, endOfDay } from 'date-fns';
// Universal background is now handled at the app level
import { useDialog } from '@/app/contexts/DialogContext';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import {
  UniversalTimeRangeSelector,
  TimeFrame,
} from '@/app/components/admin/UniversalTimeRangeSelector';
import { AdminDashboardContent } from './dashboard/AdminDashboardContent';
import { LoadingScreen, FadeInContainer } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import { DashboardDataProvider } from '@/app/admin/contexts/DashboardDataContext';
import type { DashboardBatchQueryData } from '@/app/admin/types/dashboard';
// import { MenuBar } from '@/components/ui/glow-menu'; // Removed - using dynamic action bar
// import UniversalChatbot from '@/app/components/admin/UniversalChatbot'; // Removed - integrated into navigation
import {
  HomeIcon as Home,
  BeakerIcon as Beaker,
  CubeIcon as Cube,
  BuildingStorefrontIcon as Building,
  CloudArrowUpIcon as Cloud,
  PencilSquareIcon as Pencil,
  ArchiveBoxIcon as Archive,
  CogIcon as Cog,
  ChartPieIcon as ChartPie,
} from '@heroicons/react/24/outline';

// Dashboard themes with glow menu configuration - v2.0.2: 簡化為3個主題
const DASHBOARD_THEMES = [
  {
    id: 'operations-monitoring',
    label: 'Operations',
    path: '/admin/operations-monitoring',
    icon: Building,
    gradient:
      'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)',
    iconColor: 'text-purple-500',
  },
  {
    id: 'data-management',
    label: 'Data Mgmt',
    path: '/admin/data-management',
    icon: Cloud,
    gradient:
      'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(8,145,178,0.06) 50%, rgba(14,116,144,0) 100%)',
    iconColor: 'text-cyan-500',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/admin/analytics',
    icon: ChartPie,
    gradient:
      'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)',
    iconColor: 'text-red-500',
  },
];

interface NewAdminDashboardProps {
  prefetchedData?: Partial<DashboardBatchQueryData> | null; // SSR 預取數據
  ssrMode?: boolean; // 是否為 SSR 模式
}

export function NewAdminDashboard({ 
  prefetchedData, 
  ssrMode = false 
}: NewAdminDashboardProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    label: format(new Date(), 'MMM d, yyyy'),
    value: 'custom',
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });

  // Memoize dateRange to prevent infinite re-renders
  const memoizedDateRange = useMemo(() => ({
    startDate: timeFrame.start,
    endDate: timeFrame.end
  }), [timeFrame.start, timeFrame.end]);

  // 從路徑判斷當前主題
  const pathParts = pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  // If on /admin root, redirect to injection theme
  const currentTheme =
    pathParts.length === 1 && lastPart === 'admin' ? 'injection' : lastPart || 'injection';

  // Navigation menu items grouped by category

  // Universal background is handled at the app level

  // Remove artificial loading state on theme change
  // Theme switching should be instant without loading screen

  // Dialog hooks
  const { openDialog } = useDialog();

  // Void Pallet Hook
  const { state: voidState } = useVoidPallet();

  // Loading state
  if (loading) {
    return (
      <LoadingScreen isLoading={true} loadingText='Authenticating...' showMessages={false}>
        <div />
      </LoadingScreen>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className='min-h-screen'>
        <div className='relative z-10 flex min-h-screen flex-col items-center justify-center p-4 text-white'>
          <h1 className='mb-4 text-3xl font-bold text-orange-500'>Authentication Required</h1>
          <p className='mb-6 text-lg'>Please log in to access the Admin Dashboard.</p>
          <button
            onClick={() => router.push('/main-login')}
            className='rounded-lg bg-orange-500 px-6 py-3 text-white transition-colors hover:bg-orange-600'
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <LoadingScreen isLoading={isDashboardLoading}>
      <div className='min-h-screen'>
        <div className='relative z-10 flex min-h-screen flex-col overflow-x-hidden text-white'>
          {/* Navigation removed - using dynamic action bar */}

          {/* Dashboard Content Area */}
          <div className='flex-1 pb-8'>
            <div className='mx-auto h-full max-w-[1920px] px-4 sm:px-6 lg:px-8'>
              {/* 時間選擇器 - 除了 system 頁面 */}
              {currentTheme !== 'system' && (
                <div className='mb-6 flex items-center justify-end'>
                  <UniversalTimeRangeSelector value={timeFrame} onChange={setTimeFrame} />
                </div>
              )}

              {/* 主內容區域 */}
              <div
                className={
                  // v2.0.2: 更新為新主題名
                  currentTheme === 'operations-monitoring'
                    ? ''
                    : 'h-full'
                }
                style={
                  // v2.0.2: 更新為新主題名
                  currentTheme === 'operations-monitoring'
                    ? {}
                    : { minHeight: 'calc(100vh - 260px)' }
                }
              >
                <DashboardDataProvider 
                  initialDateRange={memoizedDateRange}
                  autoRefreshInterval={0}
                  prefetchedData={prefetchedData as DashboardBatchQueryData | null}
                  ssrMode={ssrMode}
                >
                  <AdminDashboardContent 
                    theme={currentTheme} 
                    timeFrame={timeFrame}
                    prefetchedData={prefetchedData as DashboardBatchQueryData | null}
                    ssrMode={ssrMode}
                  />
                </DashboardDataProvider>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='relative z-10 py-8 text-center'>
            <div className='inline-flex items-center space-x-2 text-sm text-slate-500'>
              <div className='h-1 w-1 rounded-full bg-slate-500'></div>
              <span>Pennine Manufacturing Stock Control System</span>
              <div className='h-1 w-1 rounded-full bg-slate-500'></div>
            </div>
          </div>
        </div>

        {/* Universal Chatbot removed - integrated into navigation bar */}
      </div>
    </LoadingScreen>
  );
}
