/**
 * 優化版儀表板組件 - iOS 風格 Widget 系統
 * 
 * 修復說明：
 * 1. 移除了 widget 註冊表中的固定 min/max 限制
 * 2. 添加了 FlexibleWidgetSizeConfig 用於編輯模式下的彈性調整
 * 3. 確保從儲存加載的 widget 也有正確的彈性限制
 * 4. 添加了多個調整手柄 (se, s, e) 以便於操作
 * 5. 調整時會顯示 placeholder 並自動吸附到預設尺寸
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Save, X, RotateCcw, Sparkles } from 'lucide-react';
import { 
  DashboardWidget, 
  DashboardConfig,
  DashboardLayoutItem,
  WidgetType,
  WidgetSize,
  WidgetSizeConfig,
  FlexibleWidgetSizeConfig
} from '@/app/types/dashboard';
import { WidgetRegistry } from './WidgetRegistry';
import { WidgetSizeSelector } from './WidgetSizeSelector';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetSelectDialog } from './EnhancedDashboardDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Import CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  config?: DashboardConfig;
  onSave?: (config: DashboardConfig) => void;
}


export function EnhancedDashboard({ config: initialConfig, onSave }: DashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layouts, setLayouts] = useState<any>({});
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  // 初始化配置
  useEffect(() => {
    if (initialConfig) {
      setWidgets(initialConfig.widgets);
      // 確保從儲存加載的佈局有正確的彈性限制
      // 確保所有佈局項都有必要的屬性
      const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
      const validatedLayouts: any = {};
      
      breakpoints.forEach(bp => {
        const breakpointKey = bp as keyof typeof initialConfig.layouts;
        validatedLayouts[bp] = (initialConfig.layouts[breakpointKey] || []).map((item: any) => {
          const widget = initialConfig.widgets.find(w => w.id === item.i);
          const size = widget?.config?.size || WidgetSize.MEDIUM;
          const sizeConfig = WidgetSizeConfig[size];
          const flexConfig = FlexibleWidgetSizeConfig[size];
          
          return {
            i: item.i,
            x: typeof item.x === 'number' ? item.x : 0,
            y: typeof item.y === 'number' ? item.y : 0,
            w: typeof item.w === 'number' ? item.w : sizeConfig.w,
            h: typeof item.h === 'number' ? item.h : sizeConfig.h,
            ...flexConfig
          };
        });
      });
      
      setLayouts(validatedLayouts);
    } else {
      // 默認配置
      const defaultWidgets: DashboardWidget[] = [
        {
          id: 'widget-1',
          type: WidgetType.STATS_CARD,
          title: 'Total Pallets',
          config: {
            dataSource: 'total_pallets',
            icon: 'package',
            refreshInterval: 60000,
            size: WidgetSize.SMALL
          }
        },
        {
          id: 'widget-2',
          type: WidgetType.OUTPUT_STATS,
          title: 'Output Statistics',
          config: {
            refreshInterval: 30000,
            size: WidgetSize.MEDIUM
          }
        },
        {
          id: 'widget-3',
          type: WidgetType.PRODUCT_MIX_CHART,
          title: 'Product Mix',
          config: {
            refreshInterval: 300000,
            size: WidgetSize.LARGE
          }
        }
      ];
      
      const defaultLayouts = {
        lg: [
          { i: 'widget-1', x: 0, y: 0, ...WidgetSizeConfig[WidgetSize.SMALL], ...FlexibleWidgetSizeConfig[WidgetSize.SMALL] },
          { i: 'widget-2', x: 2, y: 0, ...WidgetSizeConfig[WidgetSize.MEDIUM], ...FlexibleWidgetSizeConfig[WidgetSize.MEDIUM] },
          { i: 'widget-3', x: 0, y: 2, ...WidgetSizeConfig[WidgetSize.LARGE], ...FlexibleWidgetSizeConfig[WidgetSize.LARGE] }
        ],
        md: [
          { i: 'widget-1', x: 0, y: 0, ...WidgetSizeConfig[WidgetSize.SMALL], ...FlexibleWidgetSizeConfig[WidgetSize.SMALL] },
          { i: 'widget-2', x: 2, y: 0, ...WidgetSizeConfig[WidgetSize.MEDIUM], ...FlexibleWidgetSizeConfig[WidgetSize.MEDIUM] },
          { i: 'widget-3', x: 0, y: 2, ...WidgetSizeConfig[WidgetSize.LARGE], ...FlexibleWidgetSizeConfig[WidgetSize.LARGE] }
        ],
        sm: [
          { i: 'widget-1', x: 0, y: 0, ...WidgetSizeConfig[WidgetSize.SMALL], ...FlexibleWidgetSizeConfig[WidgetSize.SMALL] },
          { i: 'widget-2', x: 0, y: 2, ...WidgetSizeConfig[WidgetSize.MEDIUM], ...FlexibleWidgetSizeConfig[WidgetSize.MEDIUM] },
          { i: 'widget-3', x: 0, y: 4, ...WidgetSizeConfig[WidgetSize.LARGE], ...FlexibleWidgetSizeConfig[WidgetSize.LARGE] }
        ],
        xs: [
          { i: 'widget-1', x: 0, y: 0, ...WidgetSizeConfig[WidgetSize.SMALL], ...FlexibleWidgetSizeConfig[WidgetSize.SMALL] },
          { i: 'widget-2', x: 0, y: 2, ...WidgetSizeConfig[WidgetSize.MEDIUM], ...FlexibleWidgetSizeConfig[WidgetSize.MEDIUM] },
          { i: 'widget-3', x: 0, y: 4, ...WidgetSizeConfig[WidgetSize.LARGE], ...FlexibleWidgetSizeConfig[WidgetSize.LARGE] }
        ],
        xxs: [
          { i: 'widget-1', x: 0, y: 0, ...WidgetSizeConfig[WidgetSize.SMALL], ...FlexibleWidgetSizeConfig[WidgetSize.SMALL] },
          { i: 'widget-2', x: 0, y: 2, ...WidgetSizeConfig[WidgetSize.MEDIUM], ...FlexibleWidgetSizeConfig[WidgetSize.MEDIUM] },
          { i: 'widget-3', x: 0, y: 4, ...WidgetSizeConfig[WidgetSize.LARGE], ...FlexibleWidgetSizeConfig[WidgetSize.LARGE] }
        ]
      };
      
      setWidgets(defaultWidgets);
      setLayouts(defaultLayouts);
    }
  }, [initialConfig]);

  // 處理佈局變更 - 確保所有 widget 都係指定尺寸
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: any) => {
    // 驗證並修正所有 widget 的尺寸
    const validatedLayouts = Object.keys(allLayouts).reduce((acc, breakpoint) => {
      acc[breakpoint] = allLayouts[breakpoint].map((item: Layout) => {
        const widget = widgets.find(w => w.id === item.i);
        if (!widget) return item;
        
        const size = widget.config.size || WidgetSize.MEDIUM;
        const sizeConfig = WidgetSizeConfig[size];
        
        // 如果尺寸不符合預設，強制修正
        if (item.w !== sizeConfig.w || item.h !== sizeConfig.h) {
          return {
            ...item,
            w: sizeConfig.w,
            h: sizeConfig.h
          };
        }
        
        return item;
      });
      return acc;
    }, {} as any);
    
    setLayouts(validatedLayouts);
  }, [widgets]);

  // 更新 widget 尺寸
  const updateWidgetSize = useCallback((widgetId: string, newSize: WidgetSize) => {
    // 更新 widget 配置
    setWidgets(prevWidgets => prevWidgets.map(w => 
      w.id === widgetId ? { ...w, config: { ...w.config, size: newSize } } : w
    ));
    
    // 更新佈局
    const sizeConfig = WidgetSizeConfig[newSize];
    const flexConfig = FlexibleWidgetSizeConfig[newSize];
    setLayouts((prevLayouts: any) => {
      const newLayouts = Object.keys(prevLayouts).reduce((acc, breakpoint) => {
        acc[breakpoint] = prevLayouts[breakpoint].map((item: Layout) => 
          item.i === widgetId ? { ...item, ...sizeConfig, ...flexConfig } : item
        );
        return acc;
      }, {} as any);
      return newLayouts;
    });
  }, []);

  // 處理調整大小時的實時反饋
  const handleResize = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
    const widget = widgets.find(w => w.id === newItem.i);
    if (!widget) return;

    // 獲取該 widget 支援的尺寸
    let supportedSizes = [
      { size: WidgetSize.SMALL, config: WidgetSizeConfig[WidgetSize.SMALL] },
      { size: WidgetSize.MEDIUM, config: WidgetSizeConfig[WidgetSize.MEDIUM] },
      { size: WidgetSize.LARGE, config: WidgetSizeConfig[WidgetSize.LARGE] }
    ];

    // Ask Database 只支援 Medium 和 Large
    if (widget.type === WidgetType.ASK_DATABASE) {
      supportedSizes = supportedSizes.filter(s => s.size !== WidgetSize.SMALL);
    }

    // 根據拖動方向判斷最接近的尺寸
    let closestSize = supportedSizes[0];
    let minDiff = Infinity;

    supportedSizes.forEach(({ size, config }) => {
      const widthDiff = Math.abs(newItem.w - config.w);
      const heightDiff = Math.abs(newItem.h - config.h);
      const totalDiff = widthDiff + heightDiff;
      
      if (totalDiff < minDiff) {
        minDiff = totalDiff;
        closestSize = { size, config };
      }
    });

    // 強制更新 placeholder 尺寸為最接近的預設尺寸
    placeholder.w = closestSize.config.w;
    placeholder.h = closestSize.config.h;
    placeholder.minW = closestSize.config.w;
    placeholder.maxW = closestSize.config.w;
    placeholder.minH = closestSize.config.h;
    placeholder.maxH = closestSize.config.h;
  }, [widgets]);

  // 處理調整大小結束 - 強制吸附到指定尺寸
  const handleResizeStop = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
    const widgetId = newItem.i;
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    // 獲取支援的尺寸
    let supportedSizes = [
      { size: WidgetSize.SMALL, config: WidgetSizeConfig[WidgetSize.SMALL] },
      { size: WidgetSize.MEDIUM, config: WidgetSizeConfig[WidgetSize.MEDIUM] },
      { size: WidgetSize.LARGE, config: WidgetSizeConfig[WidgetSize.LARGE] }
    ];

    // Ask Database 只支援 Medium 和 Large
    if (widget.type === WidgetType.ASK_DATABASE) {
      supportedSizes = supportedSizes.filter(s => s.size !== WidgetSize.SMALL);
    }

    // 根據當前尺寸判斷最接近的指定尺寸
    let closestSize = supportedSizes[0];
    let minDiff = Infinity;

    supportedSizes.forEach(({ size, config }) => {
      const widthDiff = Math.abs(newItem.w - config.w);
      const heightDiff = Math.abs(newItem.h - config.h);
      const totalDiff = widthDiff + heightDiff;
      
      if (totalDiff < minDiff) {
        minDiff = totalDiff;
        closestSize = { size, config };
      }
    });

    // 強制更新到指定尺寸
    const newLayout = layout.map(item => {
      if (item.i === widgetId) {
        return {
          ...item,
          w: closestSize.config.w,
          h: closestSize.config.h
        };
      }
      return item;
    });

    // 更新所有斷點的佈局
    setLayouts((prevLayouts: any) => {
      const updatedLayouts = { ...prevLayouts };
      updatedLayouts[currentBreakpoint] = newLayout;
      return updatedLayouts;
    });

    // 更新 widget 配置
    updateWidgetSize(widgetId, closestSize.size);
  }, [widgets, updateWidgetSize, currentBreakpoint]);

  // 添加新小部件
  const addWidget = useCallback((type: WidgetType, size: WidgetSize) => {
    const id = `widget-${uuidv4()}`;
    const registryItem = WidgetRegistry.get(type);
    
    if (!registryItem) return;
    
    const newWidget: DashboardWidget = {
      id,
      type,
      title: registryItem.name,
      config: {
        ...registryItem.defaultConfig,
        size
      }
    };
    
    // 根據選擇的尺寸創建佈局項
    const sizeConfig = WidgetSizeConfig[size];
    const flexConfig = FlexibleWidgetSizeConfig[size];
    const newLayoutItem: DashboardLayoutItem = {
      i: id,
      x: 0,
      y: 0,
      ...sizeConfig,
      ...flexConfig
    };
    
    setWidgets(prevWidgets => [...prevWidgets, newWidget]);
    
    // 為所有斷點添加佈局，確保每個斷點都有佈局
    setLayouts((prevLayouts: any) => {
      const newLayouts = { ...prevLayouts };
      const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
      
      breakpoints.forEach(bp => {
        newLayouts[bp] = [...(newLayouts[bp] || []), { ...newLayoutItem }];
      });
      
      return newLayouts;
    });
  }, []);

  // 移除小部件
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prevWidgets => prevWidgets.filter(w => w.id !== widgetId));
    
    // 從所有佈局中移除
    setLayouts((prevLayouts: any) => {
      const newLayouts = Object.keys(prevLayouts).reduce((acc, breakpoint) => {
        acc[breakpoint] = prevLayouts[breakpoint].filter((item: Layout) => item.i !== widgetId);
        return acc;
      }, {} as any);
      return newLayouts;
    });
  }, []);

  // 更新小部件配置
  const updateWidget = useCallback((widgetId: string, config: any) => {
    setWidgets(prevWidgets => prevWidgets.map(w => 
      w.id === widgetId ? { ...w, config } : w
    ));
  }, []);

  // 保存配置
  const handleSave = useCallback(() => {
    const config: DashboardConfig = {
      name: 'My Dashboard',
      widgets,
      layouts,
      updatedAt: new Date().toISOString()
    };
    
    // 調用外部保存函數
    if (onSave) {
      onSave(config);
    }
    
    setIsEditMode(false);
  }, [widgets, layouts, onSave]);

  // 重置配置
  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset the dashboard?')) {
      localStorage.removeItem('dashboard_config');
      window.location.reload();
    }
  }, []);

  return (
    <div className="w-full h-full">
      {/* 工具欄 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
          Custom Dashboard
        </h2>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button
                onClick={() => setShowAddWidget(true)}
                variant="default"
                size="sm"
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Sparkles className="h-4 w-4" />
                Add Widget
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                size="sm"
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={() => setIsEditMode(false)}
                variant="outline"
                size="sm"
                className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                variant="destructive"
                size="sm"
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditMode(true)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Edit2 className="h-4 w-4" />
              Edit Layout
            </Button>
          )}
        </div>
      </div>

      {/* Widget 選擇器彈窗 */}
      {showAddWidget && (
        <WidgetSelectDialog
          onSelect={addWidget}
          onClose={() => setShowAddWidget(false)}
        />
      )}

      {/* 編輯模式提示 */}
      {isEditMode && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            <span className="font-medium">Edit Mode:</span> Drag widgets to rearrange. Hover over widgets to change their size.
          </p>
        </div>
      )}

      {/* 網格佈局 */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={(breakpoint) => setCurrentBreakpoint(breakpoint)}
        onWidthChange={(containerWidth) => setContainerWidth(containerWidth)}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={(() => {
          // 根據當前 breakpoint 計算正方形的 row height
          const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }[currentBreakpoint] || 12;
          const margins = 16 * (cols + 1); // 計算所有 margin
          return Math.floor((containerWidth - margins) / cols);
        })()}
        isDraggable={isEditMode}
        isResizable={false}  // 禁用調整大小
        compactType="vertical"
        preventCollision={false}
        draggableCancel=".no-drag"
        margin={[16, 16]}  // 添加間距使調整更容易
        useCSSTransforms={true}
        transformScale={1}
      >
        {widgets.map((widget) => {
          // 獲取當前 widget 的佈局配置
          const currentLayoutItem = (layouts[currentBreakpoint] || []).find((item: any) => item.i === widget.id);
          
          // 如果沒有佈局配置，創建一個預設的
          if (!currentLayoutItem) {
            const size = widget.config.size || WidgetSize.MEDIUM;
            const sizeConfig = WidgetSizeConfig[size];
            const flexConfig = FlexibleWidgetSizeConfig[size];
            
            // 動態添加缺失的佈局
            const newLayoutItem = {
              i: widget.id,
              x: 0,
              y: 0,
              ...sizeConfig,
              ...flexConfig
            };
            
            setLayouts((prevLayouts: any) => ({
              ...prevLayouts,
              [currentBreakpoint]: [...(prevLayouts[currentBreakpoint] || []), newLayoutItem]
            }));
            
            return null; // 暫時不渲染，等下一次 render
          }
          
          return (
          <div key={widget.id} className="widget-container group">
            {isEditMode && (
              <div className="absolute top-2 right-2 z-10 no-drag opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                {/* Size selector - only shows on hover */}
                <WidgetSizeSelector
                  currentSize={widget.config.size || WidgetSize.MEDIUM}
                  widgetType={widget.type}
                  onChange={(size) => updateWidgetSize(widget.id, size)}
                />
                {/* Remove button */}
                <Button
                  onClick={() => removeWidget(widget.id)}
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {WidgetRegistry.createComponent(widget.type, {
              widget,
              isEditMode,
              onUpdate: (config) => updateWidget(widget.id, config),
              onRemove: () => removeWidget(widget.id)
            })}
          </div>
          );
        })}
      </ResponsiveGridLayout>

      {/* 樣式 */}
      <style jsx global>{`
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }
        .react-grid-item.cssTransforms {
          transition-property: transform;
        }
        .react-grid-item.resizing {
          z-index: 1;
          transition: none;
        }
        .react-grid-item.resizing .widget-container {
          opacity: 0.8;
        }
        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 3;
          will-change: transform;
        }
        .react-grid-item.dropping {
          visibility: hidden;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.1);
          backdrop-filter: blur(10px);
          opacity: 0.8;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 12px;
          border: 2px dashed rgba(59, 130, 246, 0.5);
        }
        .widget-container {
          height: 100%;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}