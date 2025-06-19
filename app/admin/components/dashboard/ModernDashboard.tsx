/**
 * Modern Dashboard Component
 * 基於截圖風格但保留深色主題
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon,
  CogIcon,
  ViewColumnsIcon,
  TruckIcon,
  ChartPieIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { GridLayout } from './GridLayout';
import { GridWidget } from './GridWidget';
import { useGridSystem } from '../../hooks/useGridSystem';
import { SidebarNavigation, TabType } from '../navigation/SidebarNavigation';
import { StatCard } from '../ui/StatCard';
import { BaseWidget, WidgetLayouts } from '../widgets/BaseWidget';
import { THEME } from '../../config/theme';
import { ANIMATIONS } from '../../config/animations';

// Import existing widgets that we'll update with new styles
import { WidgetType, WidgetSize } from '@/app/types/dashboard';

// Import Production widgets
import { ProductionReportWidget } from './widgets/ProductionReportWidget';
import { TargetHitReportWidget } from './widgets/TargetHitReportWidget';
import { ProductDoneHistoryWidget } from './widgets/ProductDoneHistoryWidget';

export function ModernDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('production');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { gridConfig, cellSize } = useGridSystem(gridContainerRef);
  
  // Static mockup data for layout design
  const stats = {
    production: {
      totalProduced: 1234,
      machineEfficiency: 84.2,
      targetHitRate: 94.5
    },
    warehouse: {
      totalTransferred: 856,
      bookOutRate: 92.3,
      targetHitRate: 88.7
    }
  };

  // Widget positions (stored in grid coordinates)
  const [widgetPositions, setWidgetPositions] = useState<Record<string, {x: number, y: number}>>({
    // Production tab widgets - 統計卡片橫向排列
    'prod-today': { x: 0, y: 0 },
    'prod-efficiency': { x: 2, y: 0 },
    'prod-target': { x: 4, y: 0 },
    // 圖表 widgets (5x5)
    'prod-chart-today': { x: 0, y: 2 },
    'prod-chart-efficiency': { x: 6, y: 2 },
    'prod-chart-target': { x: 12, y: 2 }
  });

  // Handle widget position changes
  const handleWidgetPositionChange = useCallback((widgetId: string, x: number, y: number) => {
    setWidgetPositions(prev => ({
      ...prev,
      [widgetId]: { x, y }
    }));
  }, []);

  // No data loading - focusing on layout design only


  return (
    <div className="flex h-full min-h-0">
      {/* Left Sidebar Navigation */}
      <SidebarNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Control Bar */}
        <div className="bg-[#18181C] border-b border-[#23232A]/40 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#EAEAEA] capitalize">
              {activeTab} Dashboard
            </h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  "bg-[#22222A] border border-[#23232A]/40",
                  showGrid
                    ? "text-blue-400 border-blue-400/50"
                    : "text-[#8E8EA0] hover:text-[#EAEAEA]"
                )}
              >
                <ViewColumnsIcon className="w-4 h-4 inline-block mr-1" />
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  "bg-[#22222A] border border-[#23232A]/40",
                  isEditMode
                    ? "text-orange-400 border-orange-400/50"
                    : "text-[#8E8EA0] hover:text-[#EAEAEA]"
                )}
              >
                {isEditMode ? 'Exit Edit' : 'Edit Layout'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Grid Layout Area */}
        <div ref={gridContainerRef} className="flex-1 overflow-hidden bg-[#16161A]">
          <GridLayout showGrid={showGrid} className="h-full p-4">
            <AnimatePresence mode="wait">
              {/* Production Tab */}
              {activeTab === 'production' && (
                <motion.div
                  key="production"
                  initial={ANIMATIONS.tabSwitch.initial}
                  animate={ANIMATIONS.tabSwitch.animate}
                  exit={ANIMATIONS.tabSwitch.exit}
                  transition={ANIMATIONS.tabSwitch.transition}
                  className="w-full h-full"
                >
                  {/* Production widgets */}
                  {/* Top row stat cards - 1×1 size */}
                  <GridWidget
                    id="prod-today"
                    x={widgetPositions['prod-today'].x}
                    y={widgetPositions['prod-today'].y}
                    size={WidgetSize.SMALL}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <StatCard
                      title="Total Produced"
                      value={stats.production.totalProduced}
                      subtitle="Today's output"
                      icon={<CubeIcon />}
                      trend={{ value: 20.1, isPositive: true }}
                      compareText="yesterday"
                      theme="production"
                      animationDelay={0.1}
                    />
                  </GridWidget>

                  <GridWidget
                    id="prod-efficiency"
                    x={widgetPositions['prod-efficiency'].x}
                    y={widgetPositions['prod-efficiency'].y}
                    size={WidgetSize.SMALL}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <StatCard
                      title="Machine Efficiency"
                      value={`${stats.production.machineEfficiency}%`}
                      subtitle="Average today"
                      icon={<CogIcon />}
                      trend={{ value: 2.3, isPositive: false }}
                      compareText="yesterday"
                      theme="production"
                      animationDelay={0.2}
                    />
                  </GridWidget>

                  <GridWidget
                    id="prod-target"
                    x={widgetPositions['prod-target'].x}
                    y={widgetPositions['prod-target'].y}
                    size={WidgetSize.SMALL}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <StatCard
                      title="Target Hit Rate"
                      value={`${stats.production.targetHitRate}%`}
                      subtitle="Weekly average"
                      icon={<ChartBarIcon />}
                      trend={{ value: 3.2, isPositive: true }}
                      compareText="yesterday"
                      theme="production"
                      animationDelay={0.3}
                    />
                  </GridWidget>

                  {/* Production charts - 5×5 size */}
                  <GridWidget
                    id="prod-chart-today"
                    x={widgetPositions['prod-chart-today'].x}
                    y={widgetPositions['prod-chart-today'].y}
                    size={WidgetSize.LARGE}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <ProductionReportWidget
                      widget={{
                        id: 'prod-chart-today',
                        type: WidgetType.CUSTOM,
                        gridProps: { x: 0, y: 2, w: 5, h: 5 },
                        config: { size: WidgetSize.LARGE }
                      }}
                      isEditMode={isEditMode}
                    />
                  </GridWidget>

                  <GridWidget
                    id="prod-chart-efficiency"
                    x={widgetPositions['prod-chart-efficiency'].x}
                    y={widgetPositions['prod-chart-efficiency'].y}
                    size={WidgetSize.LARGE}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <TargetHitReportWidget
                      widget={{
                        id: 'prod-chart-efficiency',
                        type: WidgetType.CUSTOM,
                        gridProps: { x: 6, y: 2, w: 5, h: 5 },
                        config: { size: WidgetSize.LARGE }
                      }}
                      isEditMode={isEditMode}
                    />
                  </GridWidget>

                  <GridWidget
                    id="prod-history"
                    x={widgetPositions['prod-chart-target'].x}
                    y={widgetPositions['prod-chart-target'].y}
                    size={WidgetSize.LARGE}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <ProductDoneHistoryWidget
                      widget={{
                        id: 'prod-history',
                        type: WidgetType.CUSTOM,
                        gridProps: { x: 12, y: 2, w: 5, h: 5 },
                        config: { size: WidgetSize.LARGE }
                      }}
                      isEditMode={isEditMode}
                    />
                  </GridWidget>
                </motion.div>
              )}
              
              {/* Warehouse Tab */}
              {activeTab === 'warehouse' && (
                <motion.div
                  key="warehouse"
                  initial={ANIMATIONS.tabSwitch.initial}
                  animate={ANIMATIONS.tabSwitch.animate}
                  exit={ANIMATIONS.tabSwitch.exit}
                  transition={ANIMATIONS.tabSwitch.transition}
                  className="w-full h-full"
                >
                  {/* Warehouse stat cards */}
                  <GridWidget
                    id="warehouse-transferred"
                    x={0}
                    y={0}
                    size={WidgetSize.SMALL}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <StatCard
                      title="Total Transferred"
                      value={stats.warehouse.totalTransferred}
                      subtitle="Today's transfers"
                      icon={<TruckIcon />}
                      trend={{ value: 15.3, isPositive: true }}
                      compareText="yesterday"
                      theme="warehouse"
                      animationDelay={0.1}
                    />
                  </GridWidget>
                  
                  <GridWidget
                    id="warehouse-bookout"
                    x={2}
                    y={0}
                    size={WidgetSize.SMALL}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <StatCard
                      title="Book Out Rate"
                      value={`${stats.warehouse.bookOutRate}%`}
                      subtitle="Success rate"
                      icon={<ChartBarIcon />}
                      trend={{ value: 4.2, isPositive: false }}
                      compareText="yesterday"
                      theme="warehouse"
                      animationDelay={0.2}
                    />
                  </GridWidget>
                  
                  <GridWidget
                    id="warehouse-target"
                    x={4}
                    y={0}
                    size={WidgetSize.SMALL}
                    isEditMode={isEditMode}
                    onPositionChange={handleWidgetPositionChange}
                    gridConfig={{
                      ...gridConfig,
                      cellWidth: cellSize.cellWidth,
                      cellHeight: cellSize.cellHeight
                    }}
                  >
                    <StatCard
                      title="Target Hit Rate"
                      value={`${stats.warehouse.targetHitRate}%`}
                      subtitle="Weekly average"
                      icon={<ChartPieIcon />}
                      trend={{ value: 1.8, isPositive: true }}
                      compareText="yesterday"
                      theme="warehouse"
                      animationDelay={0.3}
                    />
                  </GridWidget>
                </motion.div>
              )}
              
              {/* Other tabs can be implemented similarly */}
            </AnimatePresence>
          </GridLayout>
        </div>
      </div>
    </div>
  );
}