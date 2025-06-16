/**
 * 主儀表板組件
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Save, X, RotateCcw, Maximize2, Square, Minimize2 } from 'lucide-react';
import { 
  DashboardWidget, 
  DashboardConfig,
  DashboardLayoutItem,
  WidgetType,
  WidgetSize 
} from '@/app/types/dashboard';
import { WidgetRegistry } from './WidgetRegistry';
import { dialogStyles } from '@/app/utils/dialogStyles';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

// Import CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  config?: DashboardConfig;
  onSave?: (config: DashboardConfig) => void;
}

export function Dashboard({ config: initialConfig, onSave }: DashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layouts, setLayouts] = useState<any>({});
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  // 初始化配置
  useEffect(() => {
    if (initialConfig) {
      setWidgets(initialConfig.widgets);
      setLayouts(initialConfig.layouts);
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
            refreshInterval: 60000 // 1 分鐘
          }
        },
        {
          id: 'widget-2',
          type: WidgetType.STATS_CARD,
          title: 'Today\'s Transfers',
          config: {
            dataSource: 'today_transfers',
            icon: 'trending-up',
            refreshInterval: 30000 // 30 秒
          }
        },
        {
          id: 'widget-3',
          type: WidgetType.STATS_CARD,
          title: 'Active Products',
          config: {
            dataSource: 'active_products',
            icon: 'package',
            refreshInterval: 300000 // 5 分鐘
          }
        }
      ];
      
      const defaultLayouts = {
        lg: [
          { i: 'widget-1', x: 0, y: 0, w: 4, h: 3 },
          { i: 'widget-2', x: 4, y: 0, w: 4, h: 3 },
          { i: 'widget-3', x: 8, y: 0, w: 4, h: 3 }
        ]
      };
      
      setWidgets(defaultWidgets);
      setLayouts(defaultLayouts);
    }
  }, [initialConfig]);

  // 處理佈局變更
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
  }, []);

  // 添加新小部件
  const addWidget = useCallback((type: WidgetType) => {
    const id = `widget-${uuidv4()}`;
    const registryItem = WidgetRegistry.get(type);
    
    if (!registryItem) return;
    
    const newWidget: DashboardWidget = {
      id,
      type,
      title: registryItem.name,
      config: registryItem.defaultConfig
    };
    
    const newLayoutItem: DashboardLayoutItem = {
      i: id,
      x: 0,
      y: 0,
      ...registryItem.defaultSize
    };
    
    setWidgets([...widgets, newWidget]);
    
    // 為當前斷點添加佈局
    const currentLayouts = layouts[currentBreakpoint] || [];
    setLayouts({
      ...layouts,
      [currentBreakpoint]: [...currentLayouts, newLayoutItem]
    });
  }, [widgets, layouts, currentBreakpoint]);

  // 移除小部件
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    
    // 從所有佈局中移除
    const newLayouts = Object.keys(layouts).reduce((acc, breakpoint) => {
      acc[breakpoint] = layouts[breakpoint].filter((item: Layout) => item.i !== widgetId);
      return acc;
    }, {} as any);
    
    setLayouts(newLayouts);
  }, [widgets, layouts]);

  // 更新小部件配置
  const updateWidget = useCallback((widgetId: string, config: any) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, config } : w
    ));
  }, [widgets]);

  // 保存配置
  const handleSave = useCallback(() => {
    const config: DashboardConfig = {
      name: 'My Dashboard',
      widgets,
      layouts,
      updatedAt: new Date().toISOString()
    };
    
    // 保存到 localStorage
    localStorage.setItem('dashboard_config', JSON.stringify(config));
    
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

      {/* 添加小部件按鈕 */}
      {isEditMode && (
        <div className="mb-4 p-4 border-2 border-dashed border-blue-500/50 rounded-xl bg-slate-900/50 backdrop-blur-sm">
          <p className="text-sm text-slate-400 mb-3">Add Widgets:</p>
          <div className="flex flex-wrap gap-2">
            {/* Original Widgets */}
            <Button
              onClick={() => addWidget(WidgetType.STATS_CARD)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Stats Card
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.RECENT_ACTIVITY)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Recent Activity
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.QUICK_ACTIONS)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Quick Actions
            </Button>
            
            {/* Admin Page Widgets */}
            <Button
              onClick={() => addWidget(WidgetType.OUTPUT_STATS)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Output Stats
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.BOOKED_OUT_STATS)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Booked Out Stats
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.ASK_DATABASE)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Ask Database
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.PRODUCT_MIX_CHART)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Product Mix Chart
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.ACO_ORDER_PROGRESS)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              ACO Order Progress
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.INVENTORY_SEARCH)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Inventory Search
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.FINISHED_PRODUCT)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Finished Product
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.MATERIAL_RECEIVED)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Material Received
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.PALLET_OVERVIEW)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Pallet Overview
            </Button>
            <Button
              onClick={() => addWidget(WidgetType.VOID_STATS)}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Void Statistics
            </Button>
          </div>
        </div>
      )}

      {/* 網格佈局 */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={(breakpoint) => setCurrentBreakpoint(breakpoint)}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="widget-container">
            {isEditMode && (
              <div className="absolute top-1 right-1 z-10 flex gap-1">
                {/* Size selector buttons */}
                <div className="flex bg-slate-800/90 rounded-md border border-slate-600 overflow-hidden">
                  <Button
                    onClick={() => updateWidget(widget.id, { ...widget.config, size: WidgetSize.SMALL })}
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 rounded-none ${widget.config.size === WidgetSize.SMALL ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    title="Small size"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => updateWidget(widget.id, { ...widget.config, size: WidgetSize.MEDIUM })}
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 rounded-none border-x border-slate-600 ${widget.config.size === WidgetSize.MEDIUM ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    title="Medium size"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => updateWidget(widget.id, { ...widget.config, size: WidgetSize.LARGE })}
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 rounded-none ${widget.config.size === WidgetSize.LARGE ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    title="Large size"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
                {/* Remove button */}
                <Button
                  onClick={() => removeWidget(widget.id)}
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
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
        ))}
      </ResponsiveGridLayout>

      {/* 樣式 */}
      <style jsx global>{`
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        .react-grid-item.resizing {
          z-index: 1;
          will-change: width, height;
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
        }
      `}</style>
    </div>
  );
}