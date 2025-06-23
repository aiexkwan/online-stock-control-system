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
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/app/hooks/useAuth';
import { format, startOfDay, endOfDay } from 'date-fns';
// Universal background is now handled at the app level
import { useDialog, useReprintDialog } from '@/app/contexts/DialogContext';
import { DialogManager } from '@/app/components/admin-panel/DialogManager';
import { adminMenuItems } from '@/app/components/admin-panel/AdminMenu';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import { UniversalTimeRangeSelector, TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { AdminDashboardContent } from './dashboard/AdminDashboardContent';
import { LoadingScreen, FadeInContainer } from './LoadingScreen';
import { cn } from '@/lib/utils';
import { MenuBar } from '@/components/ui/glow-menu';
import UniversalChatbot from '@/app/components/admin/UniversalChatbot';
import { 
  HomeIcon as Home,
  BeakerIcon as Beaker,
  CubeIcon as Cube,
  BuildingStorefrontIcon as Building,
  CloudArrowUpIcon as Cloud,
  PencilSquareIcon as Pencil,
  ArchiveBoxIcon as Archive,
  CogIcon as Cog,
  ChartBarIcon as Chart
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
    icon: Chart,
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500"
  }
];

// Group menu items by category
const groupedItems = adminMenuItems.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof adminMenuItems>);

export function NewAdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    label: format(new Date(), 'MMM d, yyyy'),
    value: 'custom',
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  });
  
  // 從路徑判斷當前主題
  const pathParts = pathname.split('/').filter(Boolean);
  const currentTheme = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'injection';
  
  // Universal background is handled at the app level

  // Simulate loading state
  useEffect(() => {
    setIsDashboardLoading(true);
    const timer = setTimeout(() => {
      setIsDashboardLoading(false);
    }, 1500); // 1.5 seconds loading time
    
    return () => clearTimeout(timer);
  }, [currentTheme]); // Reload when theme changes
  
  // Dialog hooks
  const { openDialog } = useDialog();
  const { open: openReprintDialog } = useReprintDialog();

  // Void Pallet Hook
  const {
    state: voidState,
    handleReprintInfoConfirm,
    handleReprintInfoCancel,
    getReprintType,
  } = useVoidPallet();

  // Handle reprint needed callback
  const handleReprintNeeded = useCallback((reprintInfo: any) => {
    openReprintDialog(reprintInfo);
  }, [openReprintDialog]);

  // Handle reprint confirm
  const handleReprintConfirm = useCallback(async (reprintInfo: any) => {
    try {
      const reprintInfoInput = {
        type: reprintInfo.type,
        originalPalletInfo: reprintInfo.palletInfo,
        correctedProductCode: reprintInfo.correctedProductCode,
        correctedQuantity: reprintInfo.correctedQuantity,
        remainingQuantity: reprintInfo.reprintInfo?.remainingQuantity
      };
      
      await handleReprintInfoConfirm(reprintInfoInput);
    } catch (error) {
      console.error('Reprint failed:', error);
    }
  }, [handleReprintInfoConfirm]);

  // Handle item click
  const handleItemClick = (item: any) => {
    switch (item.action) {
      case 'void-pallet':
        openDialog('voidPallet');
        break;
      case 'view-history':
        openDialog('viewHistory');
        break;
      case 'database-update':
        openDialog('databaseUpdate');
        break;
      case 'upload-files-only':
        openDialog('uploadFilesOnly');
        break;
      case 'upload-order-pdf':
        openDialog('uploadOrderPdf');
        break;
      case 'product-spec':
        openDialog('productSpec');
        break;
      // Reports
      case 'void-pallet-report':
        window.dispatchEvent(new CustomEvent('openVoidPalletReport'));
        break;
      case 'order-loading-report':
        window.dispatchEvent(new CustomEvent('openOrderLoadingReport'));
        break;
      case 'stock-take-report':
        window.dispatchEvent(new CustomEvent('openStockTakeReport'));
        break;
      case 'aco-order-report':
        window.dispatchEvent(new CustomEvent('openAcoOrderReport'));
        break;
      case 'transaction-report':
        window.dispatchEvent(new CustomEvent('openTransactionReport'));
        break;
      case 'grn-report':
        window.dispatchEvent(new CustomEvent('openGrnReport'));
        break;
      case 'export-all-data':
        window.dispatchEvent(new CustomEvent('openExportAllData'));
        break;
      // Analytics
      case 'finished-transfer':
        window.dispatchEvent(new CustomEvent('openFinishedTransfer'));
        break;
      case 'order-trend':
        window.dispatchEvent(new CustomEvent('openOrderTrend'));
        break;
      case 'staff-workload':
        window.dispatchEvent(new CustomEvent('openStaffWorkload'));
        break;
      default:
        // No default action
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="text-lg mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative z-10">
          <h1 className="text-3xl font-bold mb-4 text-orange-500">Authentication Required</h1>
          <p className="text-lg mb-6">Please log in to access the Admin Panel.</p>
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
          {/* Admin Panel Navigation Bar */}
        <div className="sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left side - Dashboard Theme Tabs with Glow Effect */}
            <div className="hidden lg:flex items-center">
              <MenuBar
                items={DASHBOARD_THEMES.map(theme => ({
                  ...theme,
                  href: theme.path
                }))}
                activeItem={DASHBOARD_THEMES.find(t => t.id === currentTheme)?.label || 'Injection'}
                onItemClick={(label) => {
                  const theme = DASHBOARD_THEMES.find(t => t.label === label);
                  if (theme) router.push(theme.path);
                }}
              />
            </div>

            {/* Center - Navigation Menu */}
            <div className="hidden md:flex items-center space-x-1 flex-1 justify-center lg:justify-end">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="relative group">
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300 cursor-pointer">
                    {category}
                    <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  </div>
                  
                  {/* Hover Dropdown */}
                  <div className="absolute top-full right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl z-40 min-w-[280px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    {items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleItemClick(item);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-5 py-4 text-left hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-2xl last:rounded-b-2xl group/item ${item.color}`}
                        >
                          <div className="flex items-center gap-4">
                            <IconComponent className="w-5 h-5 group-hover/item:scale-110 transition-transform duration-300" />
                            <div>
                              <div className="text-sm font-medium">
                                {item.title}
                              </div>
                              <div className="text-xs text-slate-400">{item.description}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right side - Mobile menu button */}
            <div className="flex items-center gap-2">
              {/* Mobile Dashboard Theme Selector - Keep simple dropdown for mobile */}
              <div className="lg:hidden">
                <select 
                  value={currentTheme}
                  onChange={(e) => {
                    const theme = DASHBOARD_THEMES.find(t => t.id === e.target.value);
                    if (theme) router.push(theme.path);
                  }}
                  className="bg-slate-700/50 text-white text-sm rounded-lg px-3 py-2 border border-slate-600/50"
                >
                  {DASHBOARD_THEMES.map((theme) => (
                    <option key={theme.id} value={theme.id}>{theme.label}</option>
                  ))}
                </select>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300"
                >
                  {isDropdownOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                  ) : (
                    <Bars3Icon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden border-t border-slate-700/50 py-6"
              >
                <div className="space-y-6 px-4">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                handleItemClick(item);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 rounded-xl transition-all duration-300 ${item.color}`}
                            >
                              <div className="flex items-center gap-4">
                                <IconComponent className="w-5 h-5" />
                                <div>
                                  <div className="text-sm font-medium">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-slate-400">{item.description}</div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dashboard Content Area */}
        <div className="flex-1 pb-8">
          <div className="mx-auto max-w-[1920px] h-full px-4 sm:px-6 lg:px-8">
            {/* 時間選擇器 */}
            <div className="mb-6 flex items-center justify-end">
              <UniversalTimeRangeSelector 
                value={timeFrame}
                onChange={setTimeFrame}
              />
            </div>

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
      
      {/* Dialog Manager */}
      <DialogManager
        onReprintNeeded={handleReprintNeeded}
        onReprintConfirm={handleReprintConfirm}
        onReprintCancel={() => {}}
        voidState={voidState}
      />
      
      {/* Universal Chatbot */}
      <UniversalChatbot />
      </div>
    </LoadingScreen>
  );
}