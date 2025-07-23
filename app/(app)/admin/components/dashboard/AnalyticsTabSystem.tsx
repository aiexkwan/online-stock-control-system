/**
 * Analytics Tab System - Phase 3.0 重構
 * 專家會議決策 (2025-07-22)：Widget 選擇器系統
 * - 左側：11個 UnifiedWidget 選擇界面
 * - 右側：AnalysisDisplayContainer 顯示選中的 widgets
 * - 移除原有的 Tab 分類，改為直接的 Widget 控制
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { getCacheAdapter } from '@/lib/cache/cache-factory';
import { GlassmorphicCard } from '@/app/components/visual-system/effects/GlassmorphicCard';
import { AnalysisDisplayContainer, ANALYSIS_WIDGET_SELECTION, AnalysisWidgetId } from './widgets/AnalysisDisplayContainer';
import { UNIFIED_WIDGET_CONFIG } from '@/lib/widgets/unified-widget-config';
import { 
  ChartBarIcon,
  CubeIcon,
  DocumentTextIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Widget 類別配置 - 基於 UnifiedWidget 系統
export interface WidgetCategory {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  widgets: AnalysisWidgetId[];
}

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  {
    id: 'core',
    label: 'Core Analysis',
    icon: EyeIcon,
    color: 'text-blue-400',
    widgets: ['HistoryTreeV2']
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: CubeIcon,
    color: 'text-green-400',
    widgets: ['InventoryOrderedAnalysisWidget', 'StockDistributionChartV2', 'StockLevelHistoryChart']
  },
  {
    id: 'products',
    label: 'Products',
    icon: ChartBarIcon,
    color: 'text-orange-400',
    widgets: ['TopProductsByQuantityWidget', 'TopProductsDistributionWidget']
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: WrenchScrewdriverIcon,
    color: 'text-purple-400',
    widgets: ['TransferTimeDistributionWidget', 'WarehouseWorkLevelAreaChart', 'WarehouseTransferListWidget']
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: ClipboardDocumentListIcon,
    color: 'text-cyan-400',
    widgets: ['TransactionReportWidget']
  },
  {
    id: 'legacy',
    label: 'Legacy',
    icon: CogIcon,
    color: 'text-gray-400',
    widgets: ['AnalysisExpandableCards']
  }
];

// 預設選中的 widget (單選模式)
const DEFAULT_SELECTED_WIDGET: AnalysisWidgetId = 'HistoryTreeV2';

interface AnalyticsTabSystemProps {
  theme: string;
  timeFrame: TimeFrame;
}

interface WidgetSelectionState {
  selectedWidget: AnalysisWidgetId;
  expandedCategories: string[];
  userBehavior: {
    selections: number;
    lastChange: Date;
  };
}

export const AnalyticsTabSystem: React.FC<AnalyticsTabSystemProps> = ({
  theme,
  timeFrame,
}) => {
  // Widget 單選狀態管理
  const [selectionState, setSelectionState] = useState<WidgetSelectionState>({
    selectedWidget: DEFAULT_SELECTED_WIDGET,
    expandedCategories: ['core', 'inventory'], // 預設展開前兩個類別
    userBehavior: {
      selections: 0,
      lastChange: new Date(),
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  // Redis 緩存適配器
  const cacheAdapter = useMemo(() => getCacheAdapter(), []);

  // 緩存 Widget 選擇狀態
  const cacheSelectionState = useCallback(async (newState: WidgetSelectionState) => {
    try {
      await cacheAdapter.set(
        `analytics_widget_selection:${theme}`, 
        newState, 
        600 // 10分鐘 TTL - Widget 選擇相對穩定
      );
    } catch (error) {
      console.warn('Widget selection cache failed:', error);
    }
  }, [cacheAdapter, theme]);

  // 恢復緩存的選擇狀態
  useEffect(() => {
    const restoreSelectionState = async () => {
      try {
        const cachedState = await cacheAdapter.get<WidgetSelectionState>(`analytics_widget_selection:${theme}`);
        if (cachedState && cachedState.selectedWidget) {
          setSelectionState(cachedState);
        }
      } catch (error) {
        console.warn('Widget selection restore failed:', error);
      }
    };

    restoreSelectionState();
  }, [cacheAdapter, theme]);

  // Widget 單選處理
  const handleWidgetSelect = useCallback(async (widgetId: AnalysisWidgetId) => {
    // 如果已經選中同一個widget，不需要更新
    if (selectionState.selectedWidget === widgetId) {
      return;
    }

    const newState: WidgetSelectionState = {
      selectedWidget: widgetId,
      expandedCategories: selectionState.expandedCategories,
      userBehavior: {
        selections: selectionState.userBehavior.selections + 1,
        lastChange: new Date(),
      },
    };

    setSelectionState(newState);
    await cacheSelectionState(newState);
  }, [selectionState, cacheSelectionState]);

  // 類別展開/收合處理
  const handleCategoryToggle = useCallback((categoryId: string) => {
    const isExpanded = selectionState.expandedCategories.includes(categoryId);
    const newExpandedCategories = isExpanded
      ? selectionState.expandedCategories.filter(id => id !== categoryId)
      : [...selectionState.expandedCategories, categoryId];

    setSelectionState(prev => ({
      ...prev,
      expandedCategories: newExpandedCategories
    }));
  }, [selectionState.expandedCategories]);

  // Widget 錯誤處理
  const handleWidgetError = useCallback((widgetId: string, error: Error) => {
    console.error(`Widget ${widgetId} failed to load:`, error);
    // 可以在這裡添加錯誤通知或移除失敗的 widget
  }, []);

  // 動畫配置
  const checkboxVariants = {
    unchecked: { scale: 1, opacity: 0.7 },
    checked: { scale: 1.05, opacity: 1 },
    hover: { scale: 1.1 }
  };

  const categoryVariants = {
    collapsed: { height: 'auto', opacity: 0.8 },
    expanded: { height: 'auto', opacity: 1 }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <div className="flex h-full w-full gap-4">
      {/* 左側 Widget 選擇區域 */}
      <div className="w-80 flex-shrink-0">
        <GlassmorphicCard 
          variant="default" 
          hover={false}
          borderGlow={false}
          padding="none"
          className="h-full"
        >
          {/* 標題區域 */}
          <div className="border-b border-slate-600/50 p-4">
            <h3 className="text-lg font-semibold text-white">Analysis Widgets</h3>
            <p className="mt-1 text-sm text-slate-400">
              Select one widget to display (Single Selection Mode)
            </p>
          </div>

          {/* Widget 分類和選擇列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-4">
              {WIDGET_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isExpanded = selectionState.expandedCategories.includes(category.id);
                const categoryHasSelected = category.widgets.includes(selectionState.selectedWidget);

                return (
                  <div key={category.id} className="space-y-1">
                    {/* 類別標題 */}
                    <motion.button
                      onClick={() => handleCategoryToggle(category.id)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-700/50 transition-colors"
                      variants={categoryVariants}
                      animate={isExpanded ? "expanded" : "collapsed"}
                    >
                      <Icon className={`h-4 w-4 ${category.color}`} />
                      <span className="text-sm font-medium text-slate-300 flex-1 text-left">
                        {category.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {categoryHasSelected ? '✓' : ''}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-slate-400"
                      >
                        ▼
                      </motion.div>
                    </motion.button>

                    {/* Widget 選項 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1 ml-6 pl-2 border-l border-slate-600/30">
                            {category.widgets.map((widgetId) => {
                              const isSelected = selectionState.selectedWidget === widgetId;
                              const config = UNIFIED_WIDGET_CONFIG[widgetId];
                              const isAnalysisWidget = ANALYSIS_WIDGET_SELECTION.includes(widgetId);

                              return (
                                <motion.button
                                  key={widgetId}
                                  onClick={() => handleWidgetSelect(widgetId)}
                                  className={`
                                    flex items-start gap-3 p-2 rounded-md cursor-pointer transition-all duration-200 w-full text-left
                                    ${isSelected 
                                      ? 'bg-blue-500/20 border border-blue-500/50 ring-1 ring-blue-500/30' 
                                      : 'hover:bg-slate-700/30'
                                    }
                                  `}
                                  whileHover={{ x: 2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <motion.div
                                    className="flex items-center justify-center mt-0.5"
                                    variants={checkboxVariants}
                                    animate={isSelected ? "checked" : "unchecked"}
                                    whileHover="hover"
                                  >
                                    <div className={`
                                      w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                      ${isSelected 
                                        ? 'bg-blue-500 border-blue-500 ring-2 ring-blue-500/20' 
                                        : 'border-slate-500 hover:border-slate-400'
                                      }
                                    `}>
                                      {isSelected && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                      )}
                                    </div>
                                  </motion.div>

                                  <div className="flex-1 min-w-0">
                                    <div className={`
                                      text-sm font-medium transition-colors
                                      ${isSelected ? 'text-white' : 'text-slate-300'}
                                    `}>
                                      {config?.name || widgetId}
                                    </div>
                                    {config?.description && (
                                      <p className={`
                                        text-xs mt-0.5 leading-relaxed
                                        ${isSelected ? 'text-slate-300' : 'text-slate-500'}
                                      `}>
                                        {config.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`
                                        text-xs px-1.5 py-0.5 rounded
                                        ${isSelected 
                                          ? 'bg-blue-500/20 text-blue-300' 
                                          : 'bg-slate-600/50 text-slate-400'
                                        }
                                      `}>
                                        {config?.category}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        Priority: {config?.preloadPriority}
                                      </span>
                                    </div>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 統計信息 */}
          <div className="border-t border-slate-600/50 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Selected: {UNIFIED_WIDGET_CONFIG[selectionState.selectedWidget]?.name}</span>
              <span>Changes: {selectionState.userBehavior.selections}</span>
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* 右側 Widget 顯示區域 */}
      <div className="flex-1 min-w-0">
        <motion.div
          className="h-full w-full"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          <AnalysisDisplayContainer
            selectedWidget={selectionState.selectedWidget}
            onWidgetError={handleWidgetError}
            className="h-full"
          />
        </motion.div>
      </div>
    </div>
  );
};