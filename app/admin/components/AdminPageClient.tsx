/**
 * Admin Page Client Component
 * 確保所有 hooks 在客戶端執行
 */

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
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ReportsButton } from '@/app/components/reports/ReportsButton';
import { AnalyticsButton } from '@/app/components/analytics/AnalyticsButton';
import { AnalyticsDashboardDialog } from '@/app/components/analytics/AnalyticsDashboardDialog';
import { EditDashboardButton } from '../components/EditDashboardButton';
import { RefreshButton } from '../components/RefreshButton';
import { useAuth } from '@/app/hooks/useAuth';
import MotionBackground from '../../components/MotionBackground';
import { useDialog, useReprintDialog } from '@/app/contexts/DialogContext';
import { DialogManager } from '@/app/components/admin-panel/DialogManager';
import { adminMenuItems } from '@/app/components/admin-panel/AdminMenu';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import { AdminEnhancedDashboard } from '../components/dashboard/AdminEnhancedDashboard';
import { WidgetType, DashboardLayout, WidgetConfig, WidgetSize } from '@/app/types/dashboard';
import { adminDashboardSettingsService } from '../services/adminDashboardSettingsService';
import { useAdminRefresh } from '../contexts/AdminRefreshContext';

// Group menu items by category
const groupedItems = adminMenuItems.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof adminMenuItems>);

// Default empty admin dashboard layout
const DEFAULT_ADMIN_LAYOUT: DashboardLayout = {
  widgets: []
};

export function AdminPageClient() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_ADMIN_LAYOUT);
  const [tempLayout, setTempLayout] = useState<DashboardLayout | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Dialog hooks - these will now work because we're inside DialogProvider
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
        console.log('Raw layout from service:', savedLayout);
        console.log('Layout timestamp:', new Date().toISOString());
        
        if (savedLayout && savedLayout.widgets && Array.isArray(savedLayout.widgets)) {
          // 驗證並修復載入的數據
          const validatedLayout: DashboardLayout = {
            widgets: savedLayout.widgets.map((widget, index) => {
              // 根據 widget size 確定正確的寬高
              const size = widget.config?.size || WidgetSize.MEDIUM;
              let defaultW = 3, defaultH = 3;
              
              switch (size) {
                case WidgetSize.SMALL:
                  defaultW = defaultH = 1;
                  break;
                case WidgetSize.MEDIUM:
                  defaultW = defaultH = 3;
                  break;
                case WidgetSize.LARGE:
                  defaultW = defaultH = 5;
                  break;
                case WidgetSize.XLARGE:
                  defaultW = defaultH = 6;
                  break;
              }
              
              const validatedWidget = {
                ...widget,
                id: widget.id || `widget-${Date.now()}-${Math.random()}`,
                type: widget.type || WidgetType.OUTPUT_STATS,
                gridProps: {
                  x: typeof widget.gridProps?.x === 'number' && !isNaN(widget.gridProps.x) ? widget.gridProps.x : 0,
                  y: typeof widget.gridProps?.y === 'number' && !isNaN(widget.gridProps.y) ? widget.gridProps.y : 0,
                  w: typeof widget.gridProps?.w === 'number' && !isNaN(widget.gridProps.w) && widget.gridProps.w > 0 ? widget.gridProps.w : defaultW,
                  h: typeof widget.gridProps?.h === 'number' && !isNaN(widget.gridProps.h) && widget.gridProps.h > 0 ? widget.gridProps.h : defaultH
                },
                config: {
                  ...widget.config,
                  size: size
                }
              };
              
              console.log(`Widget ${index}: ${widget.type}`, {
                original: widget.gridProps,
                validated: validatedWidget.gridProps
              });
              
              return validatedWidget;
            })
          };
          console.log('Validated layout:', validatedLayout);
          setLayout(validatedLayout);
        } else {
          // 如果沒有儲存的設定，使用空白佈局
          setLayout(DEFAULT_ADMIN_LAYOUT);
        }
      } catch (error) {
        console.error('Error loading layout:', error);
        // 載入失敗時使用空白佈局
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
          widgets: newLayout.widgets.map(widget => {
            // 根據 widget size 確定正確的寬高
            const size = widget.config?.size || WidgetSize.MEDIUM;
            let defaultW = 3, defaultH = 3;
            
            switch (size) {
              case WidgetSize.SMALL:
                defaultW = defaultH = 1;
                break;
              case WidgetSize.MEDIUM:
                defaultW = defaultH = 3;
                break;
              case WidgetSize.LARGE:
                defaultW = defaultH = 5;
                break;
              case WidgetSize.XLARGE:
                defaultW = defaultH = 6;
                break;
            }
            
            return {
              ...widget,
              id: widget.id || `widget-${Date.now()}-${Math.random()}`,
              type: widget.type || WidgetType.OUTPUT_STATS,
              gridProps: {
                x: typeof widget.gridProps?.x === 'number' && !isNaN(widget.gridProps.x) ? widget.gridProps.x : 0,
                y: typeof widget.gridProps?.y === 'number' && !isNaN(widget.gridProps.y) ? widget.gridProps.y : 0,
                w: typeof widget.gridProps?.w === 'number' && !isNaN(widget.gridProps.w) && widget.gridProps.w > 0 ? widget.gridProps.w : defaultW,
                h: typeof widget.gridProps?.h === 'number' && !isNaN(widget.gridProps.h) && widget.gridProps.h > 0 ? widget.gridProps.h : defaultH
              },
              config: {
                ...widget.config,
                size: size
              }
            };
          })
        };
        setLayout(validatedLayout);
        toast.info('Dashboard layout updated from another tab');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, layout]);

  // 使用 useRef 來儲存 debounce timer
  const saveTimerRef = useRef<NodeJS.Timeout>();
  
  // Handle layout changes during editing
  const handleLayoutChange = (newLayout: DashboardLayout) => {
    if (isEditMode) {
      // 編輯模式下，只更新臨時佈局
      setTempLayout(newLayout);
    } else {
      // 非編輯模式下，直接更新主佈局（這應該不會發生）
      setLayout(newLayout);
    }
  };

  // Save layout to database
  const saveLayoutToDatabase = async (layoutToSave: DashboardLayout) => {
    try {
      const success = await adminDashboardSettingsService.saveAdminDashboardSettings(layoutToSave);
      if (success) {
        toast.success('Dashboard layout saved successfully');
        console.log('Dashboard layout saved to cloud');
      } else {
        toast.error('Failed to save dashboard layout to cloud');
        console.log('Failed to save to cloud');
      }
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      toast.error('Failed to save dashboard layout');
    }
  };

  // Handle edit mode toggle
  const handleEditModeToggle = () => {
    if (isEditMode) {
      // 結束編輯模式
      setIsEditMode(false);
      setTempLayout(null);
    } else {
      // 進入編輯模式
      setIsEditMode(true);
      setTempLayout(layout); // 複製當前佈局作為臨時佈局
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (tempLayout) {
      // 儲存臨時佈局到資料庫
      await saveLayoutToDatabase(tempLayout);
      // 更新主佈局
      setLayout({...tempLayout}); // 使用展開運算符確保 React 檢測到狀態變化
      // 結束編輯模式
      setIsEditMode(false);
      setTempLayout(null);
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    // 取消編輯，恢復原始佈局
    setIsEditMode(false);
    setTempLayout(null);
    toast.info('Changes discarded');
  };

  // Add widget
  const handleAddWidget = (widgetType: WidgetType, config?: Partial<WidgetConfig>) => {
    const currentLayout = isEditMode && tempLayout ? tempLayout : layout;
    
    // 計算新 widget 的尺寸
    const widgetWidth = config?.size === WidgetSize.XLARGE ? 6 : config?.size === WidgetSize.LARGE ? 5 : config?.size === WidgetSize.SMALL ? 1 : 3;
    const widgetHeight = config?.size === WidgetSize.XLARGE ? 6 : config?.size === WidgetSize.LARGE ? 5 : config?.size === WidgetSize.SMALL ? 1 : 3;
    
    // 找到一個合適的位置放置新 widget
    let newX = 0;
    let newY = 0;
    
    // 如果有現存的 widgets，智能尋找空位
    if (currentLayout.widgets.length > 0) {
      const maxCols = 20; // Grid 最大列數 - 與 AdminEnhancedDashboard 保持一致
      
      // 創建一個佔用圖表來追蹤哪些格子已被佔用
      const occupancyMap: boolean[][] = [];
      
      // 初始化佔用圖表
      currentLayout.widgets.forEach(widget => {
        const x = widget.gridProps?.x || 0;
        const y = widget.gridProps?.y || 0;
        const w = widget.gridProps?.w || 3;
        const h = widget.gridProps?.h || 3;
        
        for (let row = y; row < y + h; row++) {
          if (!occupancyMap[row]) occupancyMap[row] = [];
          for (let col = x; col < x + w; col++) {
            occupancyMap[row][col] = true;
          }
        }
      });
      
      // 尋找第一個可以容納新 widget 的空位
      let found = false;
      for (let y = 0; y < 100 && !found; y++) { // 限制最多搜尋 100 行
        for (let x = 0; x <= maxCols - widgetWidth && !found; x++) {
          // 檢查這個位置是否可以放置新 widget
          let canPlace = true;
          for (let dy = 0; dy < widgetHeight && canPlace; dy++) {
            for (let dx = 0; dx < widgetWidth && canPlace; dx++) {
              if (occupancyMap[y + dy] && occupancyMap[y + dy][x + dx]) {
                canPlace = false;
              }
            }
          }
          
          if (canPlace) {
            newX = x;
            newY = y;
            found = true;
          }
        }
      }
      
      // 如果找不到空位，放在所有 widgets 下方
      if (!found) {
        const bottomMostWidget = currentLayout.widgets.reduce((prev, curr) => {
          const prevBottom = (prev.gridProps?.y || 0) + (prev.gridProps?.h || 0);
          const currBottom = (curr.gridProps?.y || 0) + (curr.gridProps?.h || 0);
          return currBottom > prevBottom ? curr : prev;
        });
        newY = (bottomMostWidget.gridProps?.y || 0) + (bottomMostWidget.gridProps?.h || 0);
      }
    }
    
    const newWidget: WidgetConfig = {
      id: `${widgetType.toLowerCase()}-${Date.now()}`,
      type: widgetType,
      gridProps: { 
        x: newX, 
        y: newY, 
        w: widgetWidth,
        h: widgetHeight,
        minW: config?.size === WidgetSize.XLARGE ? 6 : config?.size === WidgetSize.SMALL ? 1 : 3,
        minH: config?.size === WidgetSize.XLARGE ? 6 : config?.size === WidgetSize.SMALL ? 1 : 3,
        maxW: config?.size === WidgetSize.XLARGE ? 6 : config?.size === WidgetSize.LARGE ? 5 : 3,
        maxH: config?.size === WidgetSize.XLARGE ? 6 : config?.size === WidgetSize.LARGE ? 5 : 3
      },
      config: {
        size: config?.size || WidgetSize.MEDIUM,
        refreshInterval: config?.refreshInterval || 60000,
        ...config
      }
    };

    const newLayout: DashboardLayout = {
      widgets: [...currentLayout.widgets, newWidget]
    };
    
    handleLayoutChange(newLayout);
  };

  // Remove widget
  const handleRemoveWidget = (widgetId: string) => {
    const currentLayout = isEditMode && tempLayout ? tempLayout : layout;
    
    const newLayout: DashboardLayout = {
      widgets: currentLayout.widgets.filter(w => w.id !== widgetId)
    };
    handleLayoutChange(newLayout);
  };

  // Update widget
  const handleUpdateWidget = (widgetId: string, updates: Partial<WidgetConfig>) => {
    const currentLayout = isEditMode && tempLayout ? tempLayout : layout;
    
    const newLayout: DashboardLayout = {
      widgets: currentLayout.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      )
    };
    handleLayoutChange(newLayout);
  };

  // Reset layout
  const handleResetLayout = async () => {
    if (confirm('Are you sure you want to clear all widgets from the dashboard?')) {
      if (isEditMode) {
        // 編輯模式下，只重置臨時佈局
        setTempLayout(DEFAULT_ADMIN_LAYOUT);
        toast.info('Dashboard cleared (not saved yet)');
      } else {
        // 非編輯模式下，直接重置並儲存
        setLayout(DEFAULT_ADMIN_LAYOUT);
        // 同時從資料庫刪除儲存的設定
        const success = await adminDashboardSettingsService.resetToDefault();
        if (success) {
          toast.success('Dashboard cleared');
        }
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
      <div className="text-white min-h-screen flex flex-col overflow-x-hidden">
        {/* Admin Panel Navigation Bar */}
        <div className="bg-slate-800/40 backdrop-blur-xl border-y border-slate-700/50 sticky top-0 z-30">
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
                {/* Refresh Button */}
                <RefreshButton
                  variant="outline"
                  size="sm"
                  className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white"
                />
                
                {/* Edit Dashboard Button */}
                <EditDashboardButton
                  isEditMode={isEditMode}
                  onToggleEdit={isEditMode ? handleEditModeToggle : handleEditModeToggle}
                  onSaveChanges={handleSaveChanges}
                  onCancelEdit={handleCancelEdit}
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
        <div className={`flex-1 w-full px-4 sm:px-6 lg:px-8 ${
          (isEditMode && tempLayout ? tempLayout : layout).widgets.length === 0 ? 'pt-8 pb-24' : 'pt-8 pb-24'
        }`}>
          <AdminEnhancedDashboard
            layout={isEditMode && tempLayout ? tempLayout : layout}
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
      <div className="text-center py-8 relative z-10">
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