'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ReportsButton } from '@/app/components/reports/ReportsButton';
import { AnalyticsButton } from '@/app/components/analytics/AnalyticsButton';
import { AnalyticsDashboardDialog } from '@/app/components/analytics/AnalyticsDashboardDialog';
import { EditDashboardButton } from './components/EditDashboardButton';
import { useAuth } from '@/app/hooks/useAuth';
import MotionBackground from '../components/MotionBackground';
import { useDialog, useReprintDialog } from '@/app/contexts/DialogContext';
import { DialogManager } from '@/app/components/admin-panel/DialogManager';
import { adminMenuItems } from '@/app/components/admin-panel/AdminMenu';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';

// Import the flexible dashboard component
import { AdminEnhancedDashboard } from './components/dashboard/AdminEnhancedDashboardSimple';
import { WidgetType, DashboardLayout, WidgetConfig, WidgetSize } from '@/app/types/dashboard';
import { adminDashboardSettingsService } from './services/adminDashboardSettingsService';

// Group menu items by category
const groupedItems = adminMenuItems.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof adminMenuItems>);

// Default admin dashboard layout - 重新安排以充分利用 20 列的空間
const DEFAULT_ADMIN_LAYOUT: DashboardLayout = {
  widgets: [
    // 第一排
    // Ask Database (if permission) - 3x3
    {
      id: 'ask-db-1',
      type: WidgetType.ASK_DATABASE,
      gridProps: { x: 0, y: 0, w: 3, h: 3 },
      config: { 
        size: WidgetSize.MEDIUM,
        refreshInterval: 0
      }
    },
    // Finished Product - 3x3
    {
      id: 'finished-product-1',
      type: WidgetType.FINISHED_PRODUCT,
      gridProps: { x: 3, y: 0, w: 3, h: 3 },
      config: { 
        size: WidgetSize.MEDIUM,
        refreshInterval: 60000
      }
    },
    // Material Received - 3x3
    {
      id: 'material-received-1',
      type: WidgetType.MATERIAL_RECEIVED,
      gridProps: { x: 6, y: 0, w: 3, h: 3 },
      config: { 
        size: WidgetSize.MEDIUM,
        refreshInterval: 60000
      }
    },
    // ACO Order Progress - 3x3
    {
      id: 'aco-order-1',
      type: WidgetType.ACO_ORDER_PROGRESS,
      gridProps: { x: 9, y: 0, w: 3, h: 3 },
      config: { 
        size: WidgetSize.MEDIUM,
        refreshInterval: 60000
      }
    },
    // Inventory Search - 3x3
    {
      id: 'inventory-search-1',
      type: WidgetType.INVENTORY_SEARCH,
      gridProps: { x: 12, y: 0, w: 3, h: 3 },
      config: { 
        size: WidgetSize.MEDIUM,
        refreshInterval: 0
      }
    },
    // Void Stats - 3x3
    {
      id: 'void-stats-1',
      type: WidgetType.VOID_STATS,
      gridProps: { x: 15, y: 0, w: 3, h: 3 },
      config: { 
        size: WidgetSize.MEDIUM,
        refreshInterval: 60000
      }
    },
    // 1x1 widgets 在最右邊
    // Output Stats - 1x1
    {
      id: 'output-stats-1',
      type: WidgetType.OUTPUT_STATS,
      gridProps: { x: 18, y: 0, w: 1, h: 1 },
      config: { 
        size: WidgetSize.SMALL,
        refreshInterval: 60000,
        timeRange: 'Today'
      }
    },
    // Booked Out Stats - 1x1
    {
      id: 'booked-out-stats-1',
      type: WidgetType.BOOKED_OUT_STATS,
      gridProps: { x: 19, y: 0, w: 1, h: 1 },
      config: { 
        size: WidgetSize.SMALL,
        refreshInterval: 60000,
        timeRange: 'Today'
      }
    },
    // Product Mix Chart - 1x1 (Overview)
    {
      id: 'product-mix-1',
      type: WidgetType.PRODUCT_MIX_CHART,
      gridProps: { x: 18, y: 1, w: 1, h: 1 },
      config: { 
        size: WidgetSize.SMALL,
        refreshInterval: 60000,
        timeRange: 'Today'
      }
    }
  ]
};

export default function AdminPanelPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_ADMIN_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Dialog hooks
  const { openDialog } = useDialog();
  const { open: openReprintDialog } = useReprintDialog();

  // Void Pallet Hook for reprint functionality
  const {
    state: voidState,
    handleReprintInfoConfirm,
    handleReprintInfoCancel,
    getReprintType,
  } = useVoidPallet();

  // Handle reprint needed callback from VoidPalletDialog
  const handleReprintNeeded = useCallback((reprintInfo: any) => {
    console.log('Reprint needed:', reprintInfo);
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
      
      console.log('Calling handleReprintInfoConfirm with:', reprintInfoInput);
      await handleReprintInfoConfirm(reprintInfoInput);
    } catch (error) {
      console.error('Reprint failed:', error);
    }
  }, [handleReprintInfoConfirm]);

  // Handle reprint cancel
  const handleReprintCancel = useCallback(() => {
    // Dialog will be closed by DialogManager
  }, []);

  // Handle item click with support for different actions
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
      default:
        // No default action
    }
  };

  // Load saved layout from database
  useEffect(() => {
    const loadLayout = async () => {
      try {
        // 先嘗試從資料庫載入
        const savedLayout = await adminDashboardSettingsService.getAdminDashboardSettings();
        if (savedLayout) {
          // 驗證並修復載入的數據
          const validatedLayout: DashboardLayout = {
            widgets: savedLayout.widgets.map(widget => ({
              ...widget,
              gridProps: {
                x: typeof widget.gridProps?.x === 'number' ? widget.gridProps.x : 0,
                y: typeof widget.gridProps?.y === 'number' ? widget.gridProps.y : 0,
                w: typeof widget.gridProps?.w === 'number' ? widget.gridProps.w : 3,
                h: typeof widget.gridProps?.h === 'number' ? widget.gridProps.h : 3
              },
              config: {
                ...widget.config,
                size: widget.config?.size || WidgetSize.MEDIUM
              }
            }))
          };
          setLayout(validatedLayout);
        } else {
          // 如果沒有儲存的設定，使用預設
          setLayout(DEFAULT_ADMIN_LAYOUT);
        }
      } catch (error) {
        console.error('Error loading layout:', error);
        // 載入失敗時使用預設
        setLayout(DEFAULT_ADMIN_LAYOUT);
      }
    };

    if (isAuthenticated) {
      loadLayout();
    }
  }, [isAuthenticated]);

  // 監聽其他標籤頁或裝置的變更
  useEffect(() => {
    if (!isAuthenticated) return;

    // 監聽 localStorage 變更（同一裝置的不同標籤頁）
    const unsubscribe = adminDashboardSettingsService.onStorageChange((newLayout) => {
      if (newLayout) {
        // 驗證載入的數據
        const validatedLayout: DashboardLayout = {
          widgets: newLayout.widgets.map(widget => ({
            ...widget,
            gridProps: {
              x: typeof widget.gridProps?.x === 'number' ? widget.gridProps.x : 0,
              y: typeof widget.gridProps?.y === 'number' ? widget.gridProps.y : 0,
              w: typeof widget.gridProps?.w === 'number' ? widget.gridProps.w : 3,
              h: typeof widget.gridProps?.h === 'number' ? widget.gridProps.h : 3
            },
            config: {
              ...widget.config,
              size: widget.config?.size || WidgetSize.MEDIUM
            }
          }))
        };
        setLayout(validatedLayout);
        toast.info('Dashboard layout updated from another tab');
      }
    });

    // 定期檢查資料庫更新（不同裝置的同步）
    const interval = setInterval(async () => {
      try {
        const cloudLayout = await adminDashboardSettingsService.getAdminDashboardSettings();
        if (cloudLayout && JSON.stringify(cloudLayout) !== JSON.stringify(layout)) {
          setLayout(cloudLayout);
          toast.info('Dashboard layout synced from cloud');
        }
      } catch (error) {
        console.error('Error syncing layout:', error);
      }
    }, 30000); // 每 30 秒檢查一次

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isAuthenticated, layout]);

  // Save layout when it changes
  const handleLayoutChange = async (newLayout: DashboardLayout) => {
    setLayout(newLayout);
    
    // 儲存到資料庫（背景執行，不阻塞 UI）
    adminDashboardSettingsService.saveAdminDashboardSettings(newLayout).then(success => {
      if (success) {
        console.log('Dashboard layout saved to cloud');
      } else {
        console.log('Dashboard layout saved locally');
      }
    });
  };

  // Add widget
  const handleAddWidget = (widgetType: WidgetType, config?: Partial<WidgetConfig>) => {
    const newWidget: WidgetConfig = {
      id: `${widgetType.toLowerCase()}-${Date.now()}`,
      type: widgetType,
      gridProps: { 
        x: 0, 
        y: 0, 
        w: config?.size === WidgetSize.LARGE ? 5 : config?.size === WidgetSize.SMALL ? 1 : 3,
        h: config?.size === WidgetSize.LARGE ? 5 : config?.size === WidgetSize.SMALL ? 1 : 3,
        minW: config?.size === WidgetSize.SMALL ? 1 : 3,
        minH: config?.size === WidgetSize.SMALL ? 1 : 3,
        maxW: config?.size === WidgetSize.LARGE ? 5 : 3,
        maxH: config?.size === WidgetSize.LARGE ? 5 : 3
      },
      config: {
        size: config?.size || WidgetSize.MEDIUM,
        refreshInterval: config?.refreshInterval || 60000,
        ...config
      }
    };

    const newLayout: DashboardLayout = {
      widgets: [...layout.widgets, newWidget]
    };
    
    handleLayoutChange(newLayout);
  };

  // Remove widget
  const handleRemoveWidget = (widgetId: string) => {
    const newLayout: DashboardLayout = {
      widgets: layout.widgets.filter(w => w.id !== widgetId)
    };
    handleLayoutChange(newLayout);
  };

  // Update widget
  const handleUpdateWidget = (widgetId: string, updates: Partial<WidgetConfig>) => {
    const newLayout: DashboardLayout = {
      widgets: layout.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      )
    };
    handleLayoutChange(newLayout);
  };

  // Reset layout
  const handleResetLayout = async () => {
    if (confirm('Are you sure you want to reset the dashboard to default layout?')) {
      // 重置到預設佈局
      handleLayoutChange(DEFAULT_ADMIN_LAYOUT);
      
      // 同時從資料庫刪除儲存的設定
      const success = await adminDashboardSettingsService.resetToDefault();
      if (success) {
        toast.success('Dashboard reset to default');
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        <p className="text-lg mt-4">Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
        <h1 className="text-3xl font-bold mb-4 text-orange-500">Authentication Required</h1>
        <p className="text-lg mb-6">Please log in to access the Admin Panel.</p>
        <button 
          onClick={() => router.push('/main-login')}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <MotionBackground>
      <div className="text-white">
        {/* Admin Panel Navigation Bar */}
        <div className="bg-slate-800/40 backdrop-blur-xl border-y border-slate-700/50 sticky top-0 z-30 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Empty space or could be used for breadcrumbs */}
              <div className="flex items-center">
                {/* Removed Edit Dashboard button from here */}
              </div>

              {/* Center - Navigation Menu */}
              <div className="hidden md:flex items-center space-x-1">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="relative group">
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300 cursor-pointer">
                      {category}
                      <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
                    </div>
                    
                    {/* Hover Dropdown */}
                    <div className="absolute top-full left-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl z-40 min-w-[280px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
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

              {/* Right side - Edit Dashboard, Analytics, Reports buttons and Mobile menu button */}
              <div className="flex items-center gap-2">
                {/* Edit Dashboard Button */}
                <EditDashboardButton
                  isEditMode={isEditMode}
                  onToggleEdit={() => setIsEditMode(!isEditMode)}
                  onResetLayout={handleResetLayout}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white"
                />
                
                {/* Analytics Button */}
                <AnalyticsButton 
                  variant="outline"
                  size="sm"
                  className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white"
                />
                
                {/* Reports Button */}
                <ReportsButton 
                  variant="outline"
                  size="sm"
                  className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white"
                />
                
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
                  <div className="space-y-6">
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
        </div>

        {/* Dashboard Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-12">
          <AdminEnhancedDashboard
            layout={layout}
            onLayoutChange={handleLayoutChange}
            onAddWidget={handleAddWidget}
            onRemoveWidget={handleRemoveWidget}
            onUpdateWidget={handleUpdateWidget}
            isEditMode={isEditMode}
            maxCols={20}
            rowHeight={60}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-16">
        <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
          <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
          <span>Pennine Manufacturing Stock Control System</span>
          <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
        </div>
      </div>

      {/* Dialog Manager */}
      <DialogManager
        onReprintNeeded={handleReprintNeeded}
        onReprintConfirm={handleReprintConfirm}
        onReprintCancel={handleReprintCancel}
        voidState={voidState}
      />
      
      {/* Analytics Dashboard Dialog */}
      <AnalyticsDashboardDialog />
    </MotionBackground>
  );
}