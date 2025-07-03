/**
 * New Admin Dashboard Component
 * 使用固定佈局的新儀表板系統
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/app/hooks/useAuth';
import { format, startOfDay, endOfDay } from 'date-fns';
// Universal background is now handled at the app level
import { useDialog } from '@/app/contexts/DialogContext';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import { UniversalTimeRangeSelector, TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { AdminDashboardContent } from './dashboard/AdminDashboardContent';
import { LoadingScreen, FadeInContainer } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
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
  ChartPieIcon as ChartPie
} from '@heroicons/react/24/outline';

// Dashboard themes with glow menu configuration
const DASHBOARD_THEMES = [
  { 
    id: 'injection', 
    label: 'Injection', 
    path: '/admin/injection',
    icon: Beaker,
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
    iconColor: "text-purple-500"
  },
  { 
    id: 'pipeline', 
    label: 'Pipeline', 
    path: '/admin/pipeline',
    icon: Cube,
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500"
  },
  { 
    id: 'warehouse', 
    label: 'Warehouse', 
    path: '/admin/warehouse',
    icon: Building,
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500"
  },
  { 
    id: 'upload', 
    label: 'Upload', 
    path: '/admin/upload',
    icon: Cloud,
    gradient: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(8,145,178,0.06) 50%, rgba(14,116,144,0) 100%)",
    iconColor: "text-cyan-500"
  },
  { 
    id: 'update', 
    label: 'Update', 
    path: '/admin/update',
    icon: Pencil,
    gradient: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.06) 50%, rgba(190,24,93,0) 100%)",
    iconColor: "text-pink-500"
  },
  { 
    id: 'stock-management', 
    label: 'Stock Mgmt', 
    path: '/admin/stock-management',
    icon: Archive,
    gradient: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.06) 50%, rgba(217,119,6,0) 100%)",
    iconColor: "text-amber-500"
  },
  { 
    id: 'system', 
    label: 'System', 
    path: '/admin/system',
    icon: Cog,
    gradient: "radial-gradient(circle, rgba(107,114,128,0.15) 0%, rgba(75,85,99,0.06) 50%, rgba(55,65,81,0) 100%)",
    iconColor: "text-gray-500"
  },
  { 
    id: 'analysis', 
    label: 'Analysis', 
    path: '/admin/analysis',
    icon: ChartPie,
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500"
  }
];


export function NewAdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    label: format(new Date(), 'MMM d, yyyy'),
    value: 'custom',
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  });
  
  // 從路徑判斷當前主題
  const pathParts = pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  // If on /admin root, redirect to injection theme
  const currentTheme = (pathParts.length === 1 && lastPart === 'admin') ? 'injection' : lastPart || 'injection';
  
  // Navigation menu items grouped by category
  
  // Universal background is handled at the app level

  // Remove artificial loading state on theme change
  // Theme switching should be instant without loading screen
  
  // Dialog hooks
  const { openDialog } = useDialog();

  // Void Pallet Hook
  const {
    state: voidState,
  } = useVoidPallet();


  // Loading state
  if (loading) {
    return (
      <LoadingScreen isLoading={true} loadingText="Authenticating..." showMessages={false}>
        <div />
      </LoadingScreen>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <h1 className="text-3xl font-bold mb-4 text-orange-500">Authentication Required</h1>
          <p className="text-lg mb-6">Please log in to access the Admin Dashboard.</p>
          <button 
            onClick={() => router.push('/main-login')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
      <div className="min-h-screen">
        <div className="text-white min-h-screen flex flex-col overflow-x-hidden relative z-10">
          {/* Navigation removed - using dynamic action bar */}

        {/* Dashboard Content Area */}
        <div className="flex-1 pb-8">
          <div className="mx-auto max-w-[1920px] h-full px-4 sm:px-6 lg:px-8">
            {/* 時間選擇器 - 除了 system 頁面 */}
            {currentTheme !== 'system' && (
              <div className="mb-6 flex items-center justify-end">
                <UniversalTimeRangeSelector 
                  value={timeFrame}
                  onChange={setTimeFrame}
                />
              </div>
            )}

            {/* 主內容區域 */}
            <div className={(currentTheme === 'injection' || currentTheme === 'pipeline' || currentTheme === 'warehouse') ? '' : 'h-full'} 
                 style={(currentTheme === 'injection' || currentTheme === 'pipeline' || currentTheme === 'warehouse') ? {} : { minHeight: 'calc(100vh - 260px)' }}>
              <AdminDashboardContent 
                theme={currentTheme} 
                timeFrame={timeFrame}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 relative z-10">
          <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
            <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            <span>Pennine Manufacturing Stock Control System</span>
            <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Universal Chatbot removed - integrated into navigation bar */}
      </div>
    </LoadingScreen>
  );
}