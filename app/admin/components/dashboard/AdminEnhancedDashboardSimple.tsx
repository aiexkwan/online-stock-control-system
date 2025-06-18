/**
 * Admin-specific Enhanced Dashboard Component - Simple CSS Grid Version
 * This version uses CSS Grid instead of react-grid-layout to avoid layout errors
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
import '../../styles/dashboard.css';

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

// 預設空佈局
const EMPTY_LAYOUT: DashboardLayout = {
  widgets: []
};

// 驗證並修復 widget
function validateWidget(widget: any): WidgetConfig | null {
  if (!widget) return null;
  
  try {
    return {
      id: widget.id || `widget-${Date.now()}-${Math.random()}`,
      type: widget.type || WidgetType.STATS_CARD,
      gridProps: {
        x: (typeof widget.gridProps?.x === 'number' && !isNaN(widget.gridProps.x) && widget.gridProps.x >= 0) 
          ? Math.floor(widget.gridProps.x) : 0,
        y: (typeof widget.gridProps?.y === 'number' && !isNaN(widget.gridProps.y) && widget.gridProps.y >= 0) 
          ? Math.floor(widget.gridProps.y) : 0,
        w: (typeof widget.gridProps?.w === 'number' && !isNaN(widget.gridProps.w) && widget.gridProps.w > 0) 
          ? Math.floor(widget.gridProps.w) : 3,
        h: (typeof widget.gridProps?.h === 'number' && !isNaN(widget.gridProps.h) && widget.gridProps.h > 0) 
          ? Math.floor(widget.gridProps.h) : 3
      },
      config: {
        size: widget.config?.size || WidgetSize.MEDIUM,
        refreshInterval: widget.config?.refreshInterval || 60000,
        ...(widget.config || {})
      }
    };
  } catch (error) {
    console.error('Failed to validate widget:', error, widget);
    return null;
  }
}

export function AdminEnhancedDashboard({ 
  layout = EMPTY_LAYOUT,
  onLayoutChange,
  onAddWidget,
  onRemoveWidget,
  onUpdateWidget,
  isEditMode,
  maxCols = 20,
  rowHeight = 120
}: AdminDashboardProps) {
  const [showAddWidget, setShowAddWidget] = useState(false);
  
  // 驗證並清理 layout
  const validatedLayout = useMemo(() => {
    if (!layout || !layout.widgets || !Array.isArray(layout.widgets)) {
      console.log('Invalid layout, using empty layout');
      return EMPTY_LAYOUT;
    }
    
    const validWidgets = layout.widgets
      .map(widget => validateWidget(widget))
      .filter((widget): widget is WidgetConfig => widget !== null);
    
    console.log('Validated widgets:', validWidgets);
    return { widgets: validWidgets };
  }, [layout]);
  
  // 處理添加小部件
  const handleAddWidget = useCallback((widgetType: WidgetType, size: WidgetSize = WidgetSize.MEDIUM) => {
    const config = {
      size,
      refreshInterval: 60000
    };
    onAddWidget(widgetType, config);
    setShowAddWidget(false);
  }, [onAddWidget]);
  
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
  
  // 計算 CSS Grid 樣式
  const getWidgetStyle = (widget: WidgetConfig) => {
    const { x, y, w, h } = widget.gridProps;
    return {
      gridColumn: `${x + 1} / span ${w}`,
      gridRow: `${y + 1} / span ${h}`,
      minHeight: `${h * rowHeight}px`,
      width: '100%',
      height: '100%'
    };
  };
  
  // 如果沒有有效的 widgets，顯示空狀態
  if (validatedLayout.widgets.length === 0) {
    return (
      <div className="relative admin-dashboard">
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
        
        <WidgetSelectDialog
          isOpen={showAddWidget}
          onClose={() => setShowAddWidget(false)}
          onSelect={handleAddWidget}
        />
      </div>
    );
  }
  
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
              Simple grid layout (temporarily using CSS Grid instead of react-grid-layout)
            </p>
          </motion.div>
        )}

        {/* CSS Grid 佈局 */}
        <div 
          className="grid gap-5 p-5"
          style={{
            gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
            gridAutoRows: `${rowHeight}px`,
            minHeight: 'calc(100vh - 200px)'
          }}
        >
          {validatedLayout.widgets.map((widget) => (
            <div 
              key={widget.id} 
              className="widget-container relative bg-slate-800/50 rounded-xl border border-slate-700/50 p-4"
              style={getWidgetStyle(widget)}
            >
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
                widget: widget,
                isEditMode
              })}
              
              {/* Debug 資訊 */}
              {isEditMode && (
                <div className="absolute bottom-2 left-2 text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
                  {widget.id} ({widget.gridProps.x},{widget.gridProps.y}) {widget.gridProps.w}x{widget.gridProps.h}
                </div>
              )}
            </div>
          ))}
        </div>
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
  .admin-dashboard .widget-container {
    transition: all 0.2s ease;
  }
  
  .admin-dashboard.edit-mode .widget-container:hover {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    transform: scale(1.02);
  }
  
  .admin-dashboard .widget-container > * {
    height: 100%;
    width: 100%;
  }
`;

// 將樣式注入到文檔中
if (typeof document !== 'undefined') {
  const styleElement = document.getElementById('enhanced-dashboard-styles-simple');
  if (!styleElement) {
    const newStyleElement = document.createElement('style');
    newStyleElement.id = 'enhanced-dashboard-styles-simple';
    newStyleElement.innerHTML = styles;
    document.head.appendChild(newStyleElement);
  }
}