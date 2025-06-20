/**
 * Admin-specific Enhanced Dashboard Component
 * Simplified interface for admin panel usage
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ReactGridLayout from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { 
  DashboardLayout,
  WidgetConfig,
  WidgetType,
  WidgetSize,
  WidgetSizeConfig
} from '@/app/types/dashboard';
import { WidgetRegistry } from './WidgetRegistry';
import { WidgetSelectDialog } from './EnhancedDashboardDialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WidgetSizeSelector } from './WidgetSizeSelector';

// Register all admin widgets
import './registerAdminWidgets';

// Import CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../../styles/dashboard.css';

const ResponsiveGridLayout = WidthProvider(Responsive);
const GridLayout = WidthProvider(ReactGridLayout);

interface AdminDashboardProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onAddWidget: (widgetType: WidgetType, config?: Partial<WidgetConfig['config']>) => void;
  onRemoveWidget: (widgetId: string) => void;
  onUpdateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  isEditMode: boolean;
  maxCols?: number;
  rowHeight?: number;
  onBreakpointChange?: (breakpoint: string) => void;
}

// 網格列數定義
const BREAKPOINTS = {
  lg: 1400,
  md: 1200,
  sm: 768,
  xs: 480,
  xxs: 0
};

// 目標格子大小（正方形）
const TARGET_CELL_SIZE = 90; // 90px per cell

// 動態計算列數 - 確保格子保持正方形
const calculateCols = (containerWidth: number): number => {
  // 如果寬度大於等於 1920，固定使用 18 列
  if (containerWidth >= 1920) {
    return 18; // 固定 18 列，可以放下三個 5x5 widget 加上適當間距
  }
  
  // 低於 1920 的情況下動態調整
  const margin = 16; // grid margin between items
  const containerPadding = 80; // container padding (40px each side)
  
  // 可用寬度 = 容器寬度 - 左右 padding
  const availableWidth = containerWidth - containerPadding;
  
  // 計算可以容納多少個目標大小的格子
  // 每個格子需要 TARGET_CELL_SIZE 寬度 + margin（除了最後一個）
  const cols = Math.floor((availableWidth + margin) / (TARGET_CELL_SIZE + margin));
  
  // 最少 15 列，確保能放下三個 5x5 的 widget
  return Math.max(15, Math.min(18, cols));
};

export function AdminEnhancedDashboard({
  layout,
  onLayoutChange,
  onAddWidget,
  onRemoveWidget,
  onUpdateWidget,
  isEditMode,
  maxCols = 20,
  rowHeight = 60,
  onBreakpointChange
}: AdminDashboardProps) {
  // 追蹤是否為初始載入
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [key, setKey] = useState(0); // 用於強制重新渲染
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false); // 延遲渲染標誌
  
  // 立即驗證並修復 layout
  const validatedLayout = useMemo(() => {
    if (!layout || !layout.widgets || !Array.isArray(layout.widgets)) {
      return { widgets: [] };
    }
    
    return {
      widgets: layout.widgets
        .filter(widget => widget && typeof widget === 'object')
        .map((widget, index) => {
          // 確保每個 widget 都有必要的屬性
          const w = (typeof widget.gridProps?.w === 'number' && !isNaN(widget.gridProps.w) && widget.gridProps.w > 0) ? widget.gridProps.w : 3;
          
          // 根據寬度自動修正高度以保持正方形
          // 如果高度不等於寬度，則修正為正方形
          let h = (typeof widget.gridProps?.h === 'number' && !isNaN(widget.gridProps.h) && widget.gridProps.h > 0) ? widget.gridProps.h : 3;
          
          // 強制高度等於寬度以確保正方形
          h = w;
          
          // 獲取原始 x 座標
          let x = (typeof widget.gridProps?.x === 'number' && !isNaN(widget.gridProps.x)) ? widget.gridProps.x : 0;
          let y = (typeof widget.gridProps?.y === 'number' && !isNaN(widget.gridProps.y)) ? widget.gridProps.y : 0;
          
          // 確保 x 座標不超出新的網格邊界
          // 18 列網格中，5x5 的 widget 最大 x 座標是 13
          if (x + w > 18) {
            x = Math.max(0, 18 - w);
          }
          
          const validatedWidget = {
            ...widget,
            id: widget.id || `widget-${Date.now()}-${index}-${Math.random()}`,
            type: widget.type || WidgetType.STATS_CARD,
            gridProps: {
              x: x,
              y: y,
              w: w,
              h: h
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
  const [dynamicCols, setDynamicCols] = useState<{[key: string]: number}>({
    lg: 18,  // 1920×1080 標準：18 列
    md: 15,
    sm: 15,
    xs: 10,
    xxs: 6
  });
  // 初始化時就計算正確的 rowHeight
  const [actualRowHeight, setActualRowHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth - 80; // 估算容器寬度
      
      // 1920×1080 標準情況下的固定 rowHeight
      if (width >= 1920) {
        const margin = 16;
        const containerPadding = 80;
        const availableWidth = 1920 - containerPadding;
        const cellWidth = (availableWidth - (margin * 17)) / 18; // 18列，17個間距
        return Math.round(cellWidth);
      }
      
      // 低於 1920 的動態計算
      const cols = calculateCols(width);
      const margin = 16;
      const containerPadding = 80;
      const availableWidth = width - containerPadding;
      const cellWidth = (availableWidth - (margin * (cols - 1))) / cols;
      return Math.round(cellWidth);
    }
    return TARGET_CELL_SIZE;
  });
  
  // 動態計算列數和格子大小
  useEffect(() => {
    const updateGridCols = () => {
      try {
        if (!containerRef.current) return;
        
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        if (width <= 0 || height <= 0) return; // 防止無效寬度或高度
        
        let calculatedRowHeight;
        let cols;
        
        // 1920×1080 標準情況下的固定設置
        if (width >= 1920) {
          const margin = 16;
          const containerPadding = 80;
          const availableWidth = 1920 - containerPadding;
          const actualCellWidth = (availableWidth - (margin * 17)) / 18; // 18列，17個間距
          calculatedRowHeight = Math.round(actualCellWidth);
          cols = 18;
          setActualRowHeight(calculatedRowHeight);
          
          // 設定固定的列數
          setDynamicCols({
            lg: 18,
            md: 18,
            sm: 18,
            xs: 18,
            xxs: 18
          });
        } else {
          // 低於 1920 的動態調整
          cols = calculateCols(width);
          const margin = 16;
          const containerPadding = 80;
          const availableWidth = width - containerPadding;
          const actualCellWidth = (availableWidth - (margin * (cols - 1))) / cols;
          calculatedRowHeight = Math.round(actualCellWidth);
          setActualRowHeight(calculatedRowHeight);
          
          // 為所有 breakpoint 設定相同的列數
          setDynamicCols({
            lg: cols,
            md: cols,
            sm: cols,
            xs: cols,
            xxs: cols
          });
        }
        
        // 調試信息
        console.log('Grid calculations:', {
          containerWidth: width,
          cols: cols,
          isStandardResolution: width >= 1920,
          calculatedRowHeight: calculatedRowHeight
        });
      } catch (error) {
        console.error('Error updating grid cols:', error);
      }
    };
    
    // 延遲初始計算，確保 DOM 已準備好
    setTimeout(updateGridCols, 100);
    
    // 監聽視窗大小變化
    window.addEventListener('resize', updateGridCols);
    
    // 監聽容器大小變化
    const resizeObserver = new ResizeObserver(updateGridCols);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateGridCols);
      resizeObserver.disconnect();
    };
  }, []);

  // 將 validatedLayout.widgets 轉換為 react-grid-layout 格式
  const gridLayouts = useMemo(() => {
    const layouts: any = {};
    
    // 如果沒有 widgets，返回空佈局
    if (!validatedLayout.widgets || validatedLayout.widgets.length === 0) {
      Object.keys(dynamicCols).forEach(breakpoint => {
        layouts[breakpoint] = [];
      });
      return layouts;
    }
    
    
    // 為每個斷點創建完全相同的布局
    Object.keys(dynamicCols).forEach(breakpoint => {
      layouts[breakpoint] = validatedLayout.widgets.map((widget, index) => {
        // 直接使用 widget 的座標，不做任何限制
        const x = widget.gridProps?.x ?? 0;
        const y = widget.gridProps?.y ?? 0;
        const w = widget.gridProps?.w ?? 3;
        const h = widget.gridProps?.h ?? 3;
        
        const layoutItem = {
          i: widget.id,
          x: x,
          y: y,
          w: w,
          h: w, // 強制高度等於寬度
          isDraggable: isEditMode,
          isResizable: isEditMode,
          static: false
        };
        
        return layoutItem;
      });
    });
    
    return layouts;
  }, [validatedLayout.widgets, isEditMode, dynamicCols]);
  
  // 簡單的 layout 格式（用於測試）
  const simpleLayout = useMemo(() => {
    return validatedLayout.widgets.map((widget) => ({
      i: widget.id,
      x: widget.gridProps?.x ?? 0,
      y: widget.gridProps?.y ?? 0,
      w: widget.gridProps?.w ?? 3,
      h: widget.gridProps?.w ?? 3, // 使用 w 作為 h 確保正方形
      static: false,
      isDraggable: isEditMode,
      isResizable: isEditMode
    }));
  }, [validatedLayout.widgets, isEditMode]);

  // 處理佈局變更
  const handleLayoutChange = useCallback((currentLayout: any[], allLayouts: any) => {
    // 防止在初始化時觸發
    if (!currentLayout || currentLayout.length === 0) return;
    
    // 如果是初始載入，標記為已完成並跳過
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    
    // 只在編輯模式下處理佈局變更
    if (!isEditMode) {
      return;
    }
    
    console.log('Layout change:', currentLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h
    })));
    
    const updatedWidgets = validatedLayout.widgets.map(widget => {
      const layoutItem = currentLayout.find(item => item.i === widget.id);
      if (layoutItem) {
        // 確保保持正方形 - 使用寬度作為高度
        const width = Math.max(1, layoutItem.w || 3);
        const height = Math.max(1, layoutItem.h || width);
        
        // 如果不是正方形，強制使用寬度
        const finalSize = width;
        
        return {
          ...widget,
          gridProps: {
            x: Math.max(0, layoutItem.x || 0),
            y: Math.max(0, layoutItem.y || 0),
            w: finalSize,
            h: finalSize // 高度始終等於寬度
          }
        };
      }
      return widget;
    });

    onLayoutChange({ widgets: updatedWidgets });
  }, [validatedLayout.widgets, onLayoutChange, isEditMode, isInitialLoad]);

  // 處理 breakpoint 變更
  const handleBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
    if (onBreakpointChange) {
      onBreakpointChange(breakpoint);
    }
  }, [onBreakpointChange]);

  // 處理添加小部件
  const handleAddWidget = useCallback((widgetType: WidgetType, size: WidgetSize = WidgetSize.MEDIUM) => {
    const config = {
      size,
      refreshInterval: 60000
    };
    onAddWidget(widgetType, config);
    setShowAddWidget(false);
  }, [onAddWidget]);
  
  
  // 當布局改變時重置初始載入標誌
  useEffect(() => {
    setIsInitialLoad(true);
    // 只在第一次有數據時設置 key
    if (!hasInitialized && validatedLayout.widgets.length > 0) {
      setKey(Date.now());
      setHasInitialized(true);
    }
  }, [layout, hasInitialized, validatedLayout.widgets.length]);
  
  
  // 延遲渲染 - 確保布局數據完全準備好
  useEffect(() => {
    if (validatedLayout.widgets.length > 0 && !isReady) {
      // 使用 setTimeout 確保在下一個渲染週期
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [validatedLayout.widgets.length, isReady]);
  
  

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

    // 使用統一的 WidgetSizeConfig
    const newDimensions = WidgetSizeConfig[newSize];

    const newGridProps = {
      ...widget.gridProps,
      w: newDimensions.w,
      h: newDimensions.h
    };

    onUpdateWidget(widgetId, {
      config: { ...widget.config, size: newSize },
      gridProps: newGridProps
    });
  }, [validatedLayout.widgets, onUpdateWidget]);


  return (
    <>
      <div className={cn("relative admin-dashboard", isEditMode && "edit-mode")}>
        {/* 編輯模式工具欄 */}
        {isEditMode && validatedLayout.widgets.length > 0 && (
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
        {validatedLayout.widgets.length > 0 && isReady && (
        <div ref={containerRef} style={{ width: '100%' }}>
          <ResponsiveGridLayout
            key={key}  // 使用 key 強制重新創建組件
            className={cn(
              "layout",
              isEditMode && "edit-mode"
            )}
            layouts={gridLayouts}
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            onDrag={(layout, oldItem, newItem, placeholder, e, element) => {
              // 確保拖動時保持正方形
              if (newItem.h !== newItem.w) {
                newItem.h = newItem.w;
              }
              if (placeholder && placeholder.h !== placeholder.w) {
                placeholder.h = placeholder.w;
              }
            }}
            breakpoints={BREAKPOINTS}
            cols={dynamicCols}
            rowHeight={actualRowHeight}
            onDragStart={(layout, oldItem, newItem, placeholder, e, element) => {
              console.log('Drag start:', { oldItem, newItem });
            }}
            onDragStop={(layout, oldItem, newItem, placeholder, e, element) => {
              console.log('Drag stop:', { oldItem, newItem });
            }}
            compactType={null}  // 關閉自動壓縮，避免小工具自動重新排列
            preventCollision={false}  // 允許 widgets 自由定位
            isDraggable={isEditMode}
            isResizable={isEditMode}
            resizeHandles={['se']} // 只啟用右下角的 resize handle
            margin={[16, 16]}
            containerPadding={[40, 20]}
            useCSSTransforms={true}
            autoSize={false}  // 關閉自動調整大小，保持正方形
            onResize={(layout, oldItem, newItem, placeholder, e, element) => {
              // 在調整大小時強制保持正方形
              newItem.h = newItem.w;
              if (placeholder) {
                placeholder.h = newItem.w;
              }
            }}
            measureBeforeMount={false}
            draggableHandle=".widget-drag-handle"
            draggableCancel=".widget-no-drag"
            allowOverlap={true}  // 允許 widgets 重疊
            isDroppable={false}  // 禁用 drop 功能
          >
          {validatedLayout.widgets.map((widget) => (
            <div 
              key={widget.id} 
              className={cn("widget-container", isEditMode && "widget-drag-handle")}
            >
              {/* 編輯模式覆蓋層 */}
              {isEditMode && (
                <div 
                  className="absolute inset-0 pointer-events-none" 
                  style={{ zIndex: 999 }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div 
                    className="absolute top-2 right-2 flex gap-2 pointer-events-auto widget-no-drag" 
                    style={{ zIndex: 1000 }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {/* 尺寸選擇器 */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <WidgetSizeSelector
                        currentSize={widget.config.size || WidgetSize.MEDIUM}
                        widgetType={widget.type}
                        onChange={(size) => handleSizeChange(widget.id, size)}
                        className="px-2 py-1 text-xs bg-slate-700 text-white rounded-md border border-slate-600"
                      />
                    </div>
                    
                    {/* 移除按鈕 */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemoveWidget(widget.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md text-lg font-bold transition-colors cursor-pointer"
                      style={{ zIndex: 1001, position: 'relative' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* 渲染小部件 */}
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
        )}
        
        {/* 空 widget提示 */}
        {validatedLayout.widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-8">
            {isEditMode ? (
              <>
                <p className="text-lg mb-4 text-slate-400">No widgets added yet</p>
                <Button
                  onClick={() => setShowAddWidget(true)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Widget
                </Button>
              </>
            ) : (
              <div className="text-center space-y-6">
                <h2 className="text-5xl font-light text-white/20 tracking-wider">
                  DASHBOARD IS EMPTY
                </h2>
                <p className="text-2xl text-white/15 tracking-wide">
                  Click [EDIT DASHBOARD] to customize your dashboard
                </p>
              </div>
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
    height: 100%;
    /* 防止閃爍 */
    -webkit-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-transform: translate3d(0, 0, 0);
    -moz-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }

  .widget-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  /* 確保內部內容填滿容器 */
  .widget-container > *:not(.absolute) {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: auto;
  }

  .react-grid-item {
    background: transparent;
    overflow: hidden;
    display: flex;
    align-items: stretch;
    /* 防止閃爍 */
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  
  /* 優化過渡動畫以實現類似 iOS 的效果 */
  .react-grid-item.cssTransforms:not(.react-draggable-dragging) {
    transition: transform 200ms ease-out;
  }
  
  .react-grid-item.react-draggable-dragging {
    transition: none !important;
    z-index: 100;
    opacity: 0.9;
    cursor: grabbing !important;
    /* 移除拖動時的陰影效果 */
  }
  
  /* 編輯模式下的樣式 */
  .admin-dashboard.edit-mode .react-grid-item {
    cursor: grab;
    will-change: transform;
  }
  
  .admin-dashboard.edit-mode .react-grid-item:not(.react-draggable-dragging) {
    transition: box-shadow 200ms ease;
  }
  
  .admin-dashboard.edit-mode .react-grid-item:hover:not(.react-draggable-dragging) {
    /* 移除 hover shadow 效果 */
    border-radius: 0.75rem;
  }
  
  /* 防止動畫衝突 */
  .react-grid-item.resizing {
    transition: none !important;
  }
  
  /* 優化拖動中的 widget 外觀 */
  .admin-dashboard.edit-mode .react-grid-item.react-draggable-dragging {
    border-radius: 0.75rem;
  }

  .react-grid-item.react-grid-placeholder {
    background: rgba(59, 130, 246, 0.15) !important;
    border: 2px dashed rgba(59, 130, 246, 0.4);
    border-radius: 0.75rem;
    opacity: 1 !important;
    transition: all 200ms ease;
  }

  /* 隱藏所有 resize handle */
  .react-grid-item > .react-resizable-handle {
    display: none;
  }
  
  /* 只顯示右下角的 resize handle */
  .react-grid-item > .react-resizable-handle.react-resizable-handle-se {
    display: block;
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: 0;
    right: 0;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIwLjMwMiI+PHBhdGggZD0iTSA2IDYgTCAwIDYgTCAwIDQuMiBMIDQgNC4yIEwgNC4yIDQuMiBMIDQuMiAwIEwgNiAwIEwgNiA2IEwgNiA2IFoiIGZpbGw9IiMwMDAwMDAiLz48L2c+PC9zdmc+');
    background-position: bottom right;
    padding: 0 3px 3px 0;
    background-repeat: no-repeat;
    background-origin: content-box;
    box-sizing: border-box;
    cursor: se-resize;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 15;
    pointer-events: auto;
  }
  
  /* 確保 widget 內容區域可以正常互動 */
  .react-grid-item .widget-container {
    pointer-events: auto;
    position: relative;
    z-index: 1;
  }
  
  .admin-dashboard.edit-mode .react-grid-item:hover > .react-resizable-handle.react-resizable-handle-se {
    opacity: 1;
  }
  
  .admin-dashboard.edit-mode .widget-container:hover {
    /* 移除 hover 邊框效果 */
  }
`;

// 新增強制正方形的樣式
const squareStyles = `
  /* 強制所有 widget 保持正方形 */
  .admin-dashboard .react-grid-item > .widget-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100% !important;
    height: 100% !important;
  }
`;

// 將樣式注入到文檔中
if (typeof document !== 'undefined') {
  const styleElement = document.getElementById('enhanced-dashboard-styles');
  if (!styleElement) {
    const newStyleElement = document.createElement('style');
    newStyleElement.id = 'enhanced-dashboard-styles';
    newStyleElement.innerHTML = styles + squareStyles;
    document.head.appendChild(newStyleElement);
  }
}