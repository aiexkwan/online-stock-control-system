/**
 * Admin-specific Enhanced Dashboard Component
 * Simplified interface for admin panel usage
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { 
  DashboardLayout,
  WidgetConfig,
  WidgetType,
  WidgetSize
} from '@/app/types/dashboard';
import { WidgetRegistry } from './WidgetRegistry';
import { WidgetSelectDialog } from './EnhancedDashboardDialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Register all admin widgets
import './registerAdminWidgets';

// Import CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../../styles/dashboard.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface AdminDashboardProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onAddWidget: (widgetType: WidgetType, config?: Partial<WidgetConfig['config']>) => void;
  onRemoveWidget: (widgetId: string) => void;
  onUpdateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  isEditMode: boolean;
  maxCols?: number;
  rowHeight?: number;
}

// 網格列數定義 - 增加列數以充分利用螢幕寬度
const BREAKPOINTS = {
  lg: 1400,
  md: 1200,
  sm: 768,
  xs: 480,
  xxs: 0
};

const COLS = {
  lg: 20,  // 增加到 20 列以更好利用寬螢幕
  md: 15,
  sm: 10,
  xs: 6,
  xxs: 4
};

export function AdminEnhancedDashboard({ 
  layout,
  onLayoutChange,
  onAddWidget,
  onRemoveWidget,
  onUpdateWidget,
  isEditMode,
  maxCols = 12,
  rowHeight = 60
}: AdminDashboardProps) {
  // 立即驗證並修復 layout
  const validatedLayout = useMemo(() => {
    if (!layout || !layout.widgets || !Array.isArray(layout.widgets)) {
      return { widgets: [] };
    }
    
    return {
      widgets: layout.widgets.map(widget => {
        // 確保每個 widget 都有必要的屬性
        const validatedWidget = {
          ...widget,
          id: widget.id || `widget-${Date.now()}-${Math.random()}`,
          type: widget.type || WidgetType.STATS_CARD,
          gridProps: {
            x: (typeof widget.gridProps?.x === 'number' && !isNaN(widget.gridProps.x)) ? widget.gridProps.x : 0,
            y: (typeof widget.gridProps?.y === 'number' && !isNaN(widget.gridProps.y)) ? widget.gridProps.y : 0,
            w: (typeof widget.gridProps?.w === 'number' && !isNaN(widget.gridProps.w)) ? widget.gridProps.w : 3,
            h: (typeof widget.gridProps?.h === 'number' && !isNaN(widget.gridProps.h)) ? widget.gridProps.h : 3
          },
          config: {
            size: widget.config?.size || WidgetSize.MEDIUM,
            refreshInterval: widget.config?.refreshInterval || 60000,
            ...(widget.config || {})
          }
        };
        
        return validatedWidget;
      })
    };
  }, [layout]);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 計算正方形尺寸
  const calculateCellSize = useCallback(() => {
    if (!containerRef.current) return rowHeight;
    
    const containerWidth = containerRef.current.offsetWidth;
    const cols = COLS[currentBreakpoint as keyof typeof COLS] || COLS.lg;
    const margin = 20;
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const cellWidth = (availableWidth - (cols - 1) * margin) / cols;
    
    return Math.max(60, Math.floor(cellWidth));
  }, [currentBreakpoint, rowHeight]);
  
  const [cellSize, setCellSize] = useState(() => calculateCellSize());
  
  // 當斷點變化時重新計算
  useEffect(() => {
    const newSize = calculateCellSize();
    if (newSize !== cellSize) {
      setCellSize(newSize);
    }
  }, [currentBreakpoint, calculateCellSize, cellSize]);

  // 將 validatedLayout.widgets 轉換為 react-grid-layout 格式
  const gridLayouts = useMemo(() => {
    const layouts: any = {};
    
    // 如果沒有 widgets，返回空佈局
    if (!validatedLayout.widgets || validatedLayout.widgets.length === 0) {
      Object.keys(COLS).forEach(breakpoint => {
        layouts[breakpoint] = [];
      });
      return layouts;
    }
    
    Object.keys(COLS).forEach(breakpoint => {
      const cols = COLS[breakpoint as keyof typeof COLS];
      layouts[breakpoint] = validatedLayout.widgets.map(widget => {
        // 根據不同斷點調整位置和大小
        const scaleFactor = breakpoint === 'lg' ? 1 : cols / COLS.lg;
        
        const layoutItem = {
          i: widget.id || `widget-${Date.now()}`,
          x: Math.max(0, Math.floor(widget.gridProps.x * scaleFactor)),
          y: Math.max(0, widget.gridProps.y),
          w: Math.max(1, Math.min(cols, widget.gridProps.w)),
          h: Math.max(1, widget.gridProps.h),
          minW: widget.config.size === WidgetSize.SMALL ? 1 : 3,
          minH: widget.config.size === WidgetSize.SMALL ? 1 : 3,
          maxW: widget.config.size === WidgetSize.LARGE ? 5 : widget.config.size === WidgetSize.SMALL ? 1 : 3,
          maxH: widget.config.size === WidgetSize.LARGE ? 5 : widget.config.size === WidgetSize.SMALL ? 1 : 3
        };
        
        // 最後一次檢查
        if (isNaN(layoutItem.x) || layoutItem.x === undefined) layoutItem.x = 0;
        if (isNaN(layoutItem.y) || layoutItem.y === undefined) layoutItem.y = 0;
        if (isNaN(layoutItem.w) || layoutItem.w === undefined) layoutItem.w = 3;
        if (isNaN(layoutItem.h) || layoutItem.h === undefined) layoutItem.h = 3;
        
        return layoutItem;
      });
    });
    
    return layouts;
  }, [validatedLayout.widgets]);

  // 處理佈局變更
  const handleLayoutChange = useCallback((currentLayout: any[], allLayouts: any) => {
    // 防止在初始化時觸發
    if (!currentLayout || currentLayout.length === 0) return;
    
    const updatedWidgets = validatedLayout.widgets.map(widget => {
      const layoutItem = currentLayout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          gridProps: {
            x: layoutItem.x || 0,
            y: layoutItem.y || 0,
            w: layoutItem.w || 3,
            h: layoutItem.h || 3
          }
        };
      }
      return widget;
    });

    onLayoutChange({ widgets: updatedWidgets });
  }, [validatedLayout.widgets, onLayoutChange]);

  // 處理添加小部件
  const handleAddWidget = useCallback((widgetType: WidgetType, size: WidgetSize = WidgetSize.MEDIUM) => {
    const config = {
      size,
      refreshInterval: 60000
    };
    onAddWidget(widgetType, config);
    setShowAddWidget(false);
  }, [onAddWidget]);
  
  // 驗證 widgets 數據
  useEffect(() => {
    if (validatedLayout.widgets.length > 0) {
      console.log('Validated layout:', validatedLayout);
      console.log('Grid layouts:', gridLayouts);
      
      // 檢查是否有無效的佈局項
      Object.entries(gridLayouts).forEach(([breakpoint, items]) => {
        (items as any[]).forEach((item, index) => {
          if (typeof item.x !== 'number' || isNaN(item.x)) {
            console.error(`Invalid x value for widget ${item.i} at breakpoint ${breakpoint}:`, item);
          }
        });
      });
    }
  }, [validatedLayout, gridLayouts]);

  // 處理移除小部件
  const handleRemoveWidget = useCallback((widgetId: string) => {
    if (confirm('Are you sure you want to remove this widget?')) {
      onRemoveWidget(widgetId);
    }
  }, [onRemoveWidget]);

  // 處理小部件尺寸變更
  const handleSizeChange = useCallback((widgetId: string, newSize: WidgetSize) => {
    const widget = validatedLayout.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const sizeMap = {
      [WidgetSize.SMALL]: { w: 1, h: 1 },
      [WidgetSize.MEDIUM]: { w: 3, h: 3 },
      [WidgetSize.LARGE]: { w: 5, h: 5 }
    };

    const newGridProps = {
      ...widget.gridProps,
      ...sizeMap[newSize]
    };

    onUpdateWidget(widgetId, {
      config: { ...widget.config, size: newSize },
      gridProps: newGridProps
    });
  }, [validatedLayout.widgets, onUpdateWidget]);

  // 處理斷點變更
  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  }, []);

  return (
    <>
      <div className={cn("relative admin-dashboard", isEditMode && "edit-mode")}>
        {/* 編輯模式工具欄 */}
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex justify-between items-center"
          >
            <Button
              onClick={() => setShowAddWidget(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
            <p className="text-sm text-slate-400">
              Drag widgets to rearrange • Click size selector to resize
            </p>
          </motion.div>
        )}

        {/* 響應式網格佈局 */}
        <div ref={containerRef}>
          <ResponsiveGridLayout
            className={cn(
              "layout",
              isEditMode && "edit-mode"
            )}
            layouts={gridLayouts}
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={cellSize}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            compactType="vertical"
            preventCollision={false}
            margin={[20, 20]}
            containerPadding={[20, 20]}
            useCSSTransforms={true}
            transformScale={1}
            isBounded={false}
            autoSize={false}
            measureBeforeMount={false}
          >
          {validatedLayout.widgets.map((widget) => (
            <div key={widget.id} className="widget-container" data-grid={`${widget.gridProps.w}x${widget.gridProps.h}`}>
              <div className="h-full relative">
                  {/* 編輯模式覆蓋層 */}
                  {isEditMode && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                        {/* 尺寸選擇器 */}
                        <select
                          value={widget.config.size}
                          onChange={(e) => handleSizeChange(widget.id, e.target.value as WidgetSize)}
                          className="px-2 py-1 text-xs bg-slate-700 text-white rounded-md border border-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value={WidgetSize.SMALL}>1x1</option>
                          <option value={WidgetSize.MEDIUM}>3x3</option>
                          <option value={WidgetSize.LARGE}>5x5</option>
                        </select>
                        
                        {/* 移除按鈕 */}
                        <button
                          onClick={() => handleRemoveWidget(widget.id)}
                          className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 渲染小部件 */}
                  {WidgetRegistry.createComponent(widget.type, {
                    widget: {
                      ...widget,
                      config: {
                        ...widget.config,
                        size: widget.config.size || WidgetSize.MEDIUM
                      }
                    },
                    isEditMode
                  })}
              </div>
            </div>
          ))}
          </ResponsiveGridLayout>
        </div>
        
        {/* 空 widget提示 */}
        {validatedLayout.widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <p className="text-lg mb-4">No widgets added yet</p>
            {isEditMode && (
              <Button
                onClick={() => setShowAddWidget(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Widget
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 添加小部件對話框 */}
      <WidgetSelectDialog
        isOpen={showAddWidget}
        onClose={() => setShowAddWidget(false)}
        onSelect={handleAddWidget}
      />
    </>
  );
}

// 添加樣式
const styles = `
  .layout {
    position: relative;
    min-height: 400px;
  }

  .widget-container {
    position: relative;
    height: 100%;
  }

  .react-grid-item {
    background: transparent;
  }
  
  /* 只在非拖動狀態下才有 transition */
  .react-grid-item.cssTransforms {
    transition: transform 200ms ease;
  }
  
  .react-grid-item.react-draggable-dragging {
    transition: none !important;
  }

  .react-grid-item.react-grid-placeholder {
    background: rgba(59, 130, 246, 0.2) !important;
    border: 2px dashed rgba(59, 130, 246, 0.5);
    border-radius: 0.75rem;
    opacity: 1 !important;
  }

  .react-grid-item > .react-resizable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    background: transparent;
  }

  .react-grid-item > .react-resizable-handle::after {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 5px;
    height: 5px;
    border-right: 2px solid rgba(255, 255, 255, 0.6);
    border-bottom: 2px solid rgba(255, 255, 255, 0.6);
  }

  .edit-mode .react-grid-item:hover {
    cursor: move;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    border-radius: 0.75rem;
  }

  .edit-mode .react-grid-item > .react-resizable-handle {
    display: block;
  }

  .react-grid-item.resizing {
    opacity: 0.9;
    z-index: 100;
  }

  .react-grid-item.static {
    background: transparent;
  }
`;

// 將樣式注入到文檔中
if (typeof document !== 'undefined') {
  const styleElement = document.getElementById('enhanced-dashboard-styles');
  if (!styleElement) {
    const newStyleElement = document.createElement('style');
    newStyleElement.id = 'enhanced-dashboard-styles';
    newStyleElement.innerHTML = styles;
    document.head.appendChild(newStyleElement);
  }
}